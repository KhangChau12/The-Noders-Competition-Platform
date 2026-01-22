'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  FileText,
  Image,
  CheckCircle2,
  Copy,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface Competition {
  id: string;
  title: string;
}

interface Props {
  competitions: Competition[];
  prefixMap: Record<string, string>;
  selectedCompetitionId: string | null;
  userId: string;
}

// Generate random alphanumeric code
function generateCode(length: number = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0,O,1,I)
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function UploadCertificateForm({
  competitions,
  prefixMap,
  selectedCompetitionId,
  userId,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [competitionId, setCompetitionId] = useState(selectedCompetitionId || '');
  const [prefix, setPrefix] = useState(selectedCompetitionId ? (prefixMap[selectedCompetitionId] || '') : '');
  const [suffix, setSuffix] = useState(generateCode(4));
  const [recipientName, setRecipientName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string; url: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Update prefix when competition changes
  const handleCompetitionChange = (compId: string) => {
    setCompetitionId(compId);
    if (prefixMap[compId]) {
      setPrefix(prefixMap[compId]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a PDF or image file (PNG, JPG)');
        return;
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!competitionId || !prefix || !suffix || !recipientName || !file) {
      setError('Please fill in all fields');
      return;
    }

    setUploading(true);

    try {
      // Generate verification code
      const code = `${prefix}-${suffix}`;

      // Get file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = fileExt === 'pdf' ? 'pdf' : fileExt;

      // Upload file to storage
      const filePath = `${competitionId}/${code}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Save prefix if it's new
      if (!prefixMap[competitionId]) {
        await supabase
          .from('certificate_prefixes')
          .upsert({
            competition_id: competitionId,
            prefix: prefix,
          } as any);
      }

      // Create certificate record
      const { error: dbError } = await supabase
        .from('certificates')
        .insert({
          verification_code: code,
          competition_id: competitionId,
          recipient_name: recipientName,
          file_path: filePath,
          file_type: fileType,
          issued_by: userId,
        } as any);

      if (dbError) {
        // Clean up uploaded file
        await supabase.storage.from('certificates').remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);

      setSuccess({
        code,
        url: urlData.publicUrl,
      });

      // Reset form for next upload
      setRecipientName('');
      setSuffix(generateCode(4));
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload certificate');
    } finally {
      setUploading(false);
    }
  };

  const copyCode = async () => {
    if (success?.code) {
      await navigator.clipboard.writeText(success.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleUploadAnother = () => {
    setSuccess(null);
    setCopiedCode(false);
  };

  // Success state
  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-bold mb-2">Certificate Uploaded!</h3>
        <p className="text-text-secondary mb-6">
          Share this verification code with the recipient
        </p>

        <div className="bg-bg-elevated border border-border-default rounded-lg p-4 mb-6">
          <div className="text-sm text-text-tertiary mb-2">Verification Code</div>
          <div className="flex items-center justify-center gap-3">
            <code className="text-2xl font-mono font-bold text-accent-cyan">
              {success.code}
            </code>
            <button
              onClick={copyCode}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              title="Copy code"
            >
              {copiedCode ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-text-tertiary" />
              )}
            </button>
          </div>
        </div>

        <div className="text-sm text-text-tertiary mb-6">
          Verify link: <code className="text-accent-cyan">/verify/{success.code}</code>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleUploadAnother}>
            Upload Another
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push(`/admin/certificates/${competitionId}`)}
          >
            View All Certificates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Competition Select */}
      <div>
        <label className="block text-sm font-medium mb-2">Competition</label>
        <select
          value={competitionId}
          onChange={(e) => handleCompetitionChange(e.target.value)}
          className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:border-primary-blue"
          required
        >
          <option value="">Select a competition</option>
          {competitions.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.title}
            </option>
          ))}
        </select>
      </div>

      {/* Prefix Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Certificate Prefix
          <span className="text-text-tertiary font-normal ml-2">
            (e.g., PAIC-2026, NAIC-2025)
          </span>
        </label>
        <input
          type="text"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value.toUpperCase())}
          placeholder="PAIC-2026"
          className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:border-primary-blue font-mono uppercase"
          maxLength={20}
          required
        />
        {prefixMap[competitionId] && (
          <p className="text-xs text-text-tertiary mt-1">
            Using saved prefix for this competition
          </p>
        )}
      </div>

      {/* Suffix Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Certificate Code Suffix
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value.toUpperCase())}
            placeholder="XXXX"
            className="flex-1 px-4 py-3 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:border-primary-blue font-mono uppercase"
            maxLength={10}
            required
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setSuffix(generateCode(4))}
            title="Generate Random Suffix"
          >
            Random
          </Button>
        </div>
      </div>

      {/* Recipient Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Recipient Name</label>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Enter recipient's full name"
          className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:border-primary-blue"
          required
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Certificate File</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${file
              ? 'border-success bg-success/5'
              : 'border-border-default hover:border-primary-blue hover:bg-primary-blue/5'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              {file.type === 'application/pdf' ? (
                <FileText className="w-8 h-8 text-red-400" />
              ) : (
                <Image className="w-8 h-8 text-blue-400" />
              )}
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-text-tertiary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 hover:bg-bg-elevated rounded"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-text-tertiary">
                PDF, PNG, or JPG (max 10MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-error/10 border border-error/20 rounded-lg text-error">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Preview Code */}
      {prefix && suffix && (
        <div className="p-4 bg-bg-tertiary rounded-lg">
          <div className="text-sm text-text-tertiary mb-1">Preview verification code:</div>
          <code className="font-mono text-accent-cyan">{prefix}-{suffix}</code>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={uploading || !competitionId || !prefix || !suffix || !recipientName || !file}
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Upload Certificate
          </>
        )}
      </Button>
    </form>
  );
}
