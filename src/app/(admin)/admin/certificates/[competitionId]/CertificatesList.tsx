'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import {
  Award,
  Copy,
  ExternalLink,
  Trash2,
  FileText,
  Image,
  CheckCircle2,
  Search,
} from 'lucide-react';

interface Certificate {
  id: string;
  verification_code: string;
  recipient_name: string;
  file_path: string;
  file_type: string;
  issued_at: string;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  };
}

interface Props {
  certificates: Certificate[];
  competitionId: string;
}

export default function CertificatesList({ certificates: initialCertificates, competitionId }: Props) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const supabase = createClient();

  const filteredCertificates = certificates.filter(cert =>
    cert.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.verification_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (certId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    setDeleting(certId);

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('certificates')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certId);

      if (dbError) throw dbError;

      // Update local state
      setCertificates(certs => certs.filter(c => c.id !== certId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete certificate');
    } finally {
      setDeleting(null);
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('certificates').getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border-default bg-bg-tertiary">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-elevated border border-border-default rounded-lg text-sm focus:outline-none focus:border-primary-blue"
            />
          </div>
          <div className="text-sm text-text-tertiary">
            {filteredCertificates.length} of {certificates.length} certificates
          </div>
        </div>
      </div>

      {filteredCertificates.length > 0 ? (
        <div className="divide-y divide-border-default">
          {filteredCertificates.map((cert) => (
            <div key={cert.id} className="p-4 hover:bg-bg-tertiary/50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* File type icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    cert.file_type === 'pdf' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    {cert.file_type === 'pdf' ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : (
                      <Image className="w-5 h-5 text-blue-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{cert.recipient_name}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {cert.file_type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <button
                        onClick={() => copyToClipboard(cert.verification_code)}
                        className="flex items-center gap-1 text-accent-cyan hover:text-accent-cyan/80 font-mono"
                      >
                        {copiedCode === cert.verification_code ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            {cert.verification_code}
                          </>
                        )}
                      </button>
                      <span className="text-text-tertiary">
                        Issued: {new Date(cert.issued_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={getFileUrl(cert.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(cert.id, cert.file_path)}
                    disabled={deleting === cert.id}
                    className="text-error hover:bg-error/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-text-tertiary">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
          {searchTerm ? (
            <>
              <p className="text-lg mb-2">No certificates found</p>
              <p className="text-sm">Try a different search term</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">No certificates yet</p>
              <p className="text-sm">Upload certificates for this competition</p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
