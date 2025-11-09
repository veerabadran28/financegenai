import React, { useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { FileAttachment } from '../types';
import { createFileAttachment, validateFile, formatFileSize } from '../utils/fileHandler';
import { supportedFileTypes, maxFileSize } from '../config/appConfig';

interface FileUploadProps {
  onFileUpload: (file: FileAttachment) => void;
  uploadedFiles: FileAttachment[];
  onRemoveFile: (fileId: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  uploadedFiles,
  onRemoveFile
}) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  }, []);

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const error = validateFile(file, supportedFileTypes, maxFileSize);
      if (error) {
        alert(error);
        return;
      }
      const fileAttachment = createFileAttachment(file);
      onFileUpload(fileAttachment);
    });
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-blue-50/50"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-blue-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Upload Documents
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your PDF files here, or click to browse
        </p>
        <p className="text-sm text-gray-400">
          Supported formats: PDF, DOC, DOCX, TXT (Max: {formatFileSize(maxFileSize)})
        </p>
        <input
          id="fileInput"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Uploaded Files:</h4>
          {uploadedFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(file.id)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};