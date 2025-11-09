import { FileAttachment } from '../types';

export const createFileAttachment = (file: File): FileAttachment => {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file)
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFile = (file: File, supportedTypes: string[], maxSize: number): string | null => {
  if (!supportedTypes.includes(file.type)) {
    return `File type ${file.type} is not supported`;
  }
  if (file.size > maxSize) {
    return `File size exceeds maximum limit of ${formatFileSize(maxSize)}`;
  }
  return null;
};