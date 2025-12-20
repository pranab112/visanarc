
import { StoredFile } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getCurrentUser } from './authService';

export const uploadFile = async (
  file: File,
  folder: string,
  uploadedBy: string
): Promise<StoredFile> => {
  // 1. Client-side Validation
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
    throw new Error("Invalid file format. Only PDF, JPG, and PNG are allowed.");
  }
  if (file.size > 5 * 1024 * 1024) { 
    throw new Error("File size exceeds 5MB limit.");
  }

  const user = getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Local Fallback (Mock Mode)
  if (!isSupabaseConfigured) {
      console.log("Supabase storage not configured, falling back to Blob URL");
      return {
        key: `local_${Date.now()}_${Math.random()}`,
        filename: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        mimeType: file.type,
        uploadedAt: Date.now(),
        uploadedBy
      };
  }

  // 3. Upload Logic (Cloud)
  try {
    const fileExtension = file.name.split('.').pop();
    // Path: agency_id/student_id/timestamp_filename
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExtension}`;
    const cleanFolder = folder.replace(/^\/+|\/+$/g, ''); // Trim slashes
    const fullPath = `${user.agencyId}/${cleanFolder}/${uniqueName}`;

    // Supabase Upload
    const { data, error } = await supabase.storage
        .from('documents')
        .upload(fullPath, file);

    if (error) throw error;

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fullPath);

    return {
        key: fullPath,
        filename: file.name,
        url: publicUrl,
        size: file.size,
        mimeType: file.type,
        uploadedAt: Date.now(),
        uploadedBy: uploadedBy
    };
  } catch (error: any) {
      console.error("Upload failed:", error);
      // Last resort fallback
      return {
        key: `local_${Date.now()}`,
        filename: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        mimeType: file.type,
        uploadedAt: Date.now(),
        uploadedBy
      };
  }
};

export const getSignedUrl = async (fileKey: string): Promise<string> => {
    // Check if it's a Supabase path or local blob
    if (fileKey.startsWith('local_')) return '';
    if (!isSupabaseConfigured) return '';

    const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileKey, 60 * 60); // 1 hour
    
    return data?.signedUrl || '';
};

export const deleteFile = async (fileKey: string): Promise<void> => {
    if (fileKey.startsWith('local_')) return;
    if (!isSupabaseConfigured) return;

    await supabase.storage
        .from('documents')
        .remove([fileKey]);
};
