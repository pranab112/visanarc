
import { StoredFile } from '../types';
import { getCurrentUser } from './authService';

export const uploadFile = async (
  file: File,
  folder: string,
  uploadedBy: string
): Promise<StoredFile> => {
  // Client-side Validation
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
    throw new Error("Invalid file format. Only PDF, JPG, and PNG are allowed.");
  }
  if (file.size > 10 * 1024 * 1024) { 
    throw new Error("File size exceeds 10MB limit.");
  }

  const user = getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Local Storage Strategy (Blob URL) for H4
  return {
    key: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    filename: file.name,
    url: URL.createObjectURL(file),
    size: file.size,
    mimeType: file.type,
    uploadedAt: Date.now(),
    uploadedBy
  };
};

export const getSignedUrl = async (fileKey: string): Promise<string> => {
    return ''; // Not needed for local blob URLs
};

export const deleteFile = async (fileKey: string): Promise<void> => {
    // In local mode, blobs expire with session/refresh.
    console.log(`Reference to ${fileKey} removed from registry.`);
};
