'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.csv',
  maxSizeMB = 10,
  disabled = false,
  className = '',
  label = 'Upload File',
  helperText,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file extension
    if (accept && !accept.split(',').some(ext => file.name.toLowerCase().endsWith(ext.trim()))) {
      return `Invalid file type. Please upload a ${accept} file.`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `File size exceeds ${maxSizeMB}MB limit. Current size: ${fileSizeMB.toFixed(2)}MB`;
    }

    return null;
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {label}
        </label>
      )}

      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200 ease-out
          ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-bg-surface'
              : isDragging
              ? 'border-accent-cyan bg-accent-cyan/10'
              : selectedFile
              ? 'border-primary-blue bg-primary-blue/5'
              : 'border-border-default hover:border-primary-blue hover:bg-primary-blue/5'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        aria-label="Upload file"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          aria-label="File input"
        />

        {selectedFile ? (
          <div className="space-y-3">
            <div className="text-5xl">✓</div>
            <div>
              <p className="text-lg font-semibold text-text-primary">
                {selectedFile.name}
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleClear}
              className="text-sm text-primary-blue hover:text-accent-cyan font-semibold transition-colors"
            >
              Change File
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl text-text-tertiary">📁</div>
            <div>
              <p className="text-lg font-semibold text-text-primary">
                Drag & drop {accept} file here
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-text-tertiary">
              Maximum file size: {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-2 text-sm text-text-tertiary">{helperText}</p>
      )}
    </div>
  );
};

export default FileUpload;
