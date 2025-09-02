'use client';

import { useState } from 'react';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

/**
 * File upload component
 * Provides file selection and upload UI, supports Excel files
 */
export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/csv' // .csv
      ];
      
      if (allowedTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setUploadStatus('idle');
        setStatusMessage('');
      } else {
        setSelectedFile(null);
        setUploadStatus('error');
        setStatusMessage('Please select an Excel (.xlsx, .xls) or CSV file');
      }
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('error');
      setStatusMessage('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call upload API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setStatusMessage(`File "${selectedFile.name}" uploaded successfully! Created ${data.productsCount} products with ${data.recordsCount} records.`);
        setSelectedFile(null);
        
        // Reset input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }

        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setUploadStatus('error');
        setStatusMessage(data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setStatusMessage('Upload failed, please try again later');
    } finally {
      setIsUploading(false);
    }
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setStatusMessage('');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* File select area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <div className="space-y-4">
          <div className="text-4xl text-gray-400">📁</div>
          <div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Click to select file
              </span>
              <span className="text-gray-500"> or drag and drop here</span>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </div>
          <p className="text-sm text-gray-500">
            Supports Excel (.xlsx, .xls) and CSV files, max size 10MB
          </p>
        </div>
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📄</div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              className="text-red-600 hover:text-red-700 p-1"
              disabled={isUploading}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="flex space-x-4">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload file'}
        </button>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={`p-4 rounded-lg ${
          uploadStatus === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : uploadStatus === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
        </div>
      )}
    </div>
  );
}
