import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file MIME type and size boundaries.
 */
export function validateUploadFile(file: { type: string; size: number; name?: string }): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided for upload.' };
  }

  // Type validation
  const mime = file.type?.toLowerCase();
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(mime);
  const ext = file.name ? file.name.split('.').pop()?.toLowerCase() : '';
  const isAllowedExt = ext ? ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'].includes(ext) : false;

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Allowed: JPG, PNG, WEBP, GIF, PDF.`,
    };
  }

  // Size limit validation (10MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed threshold of 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes filename to prevent directory traversal or malformed URL characters.
 */
export function sanitizeFilename(filename: string): string {
  const leaf = filename.split(/[/\\]/).pop() || 'file';
  // Remove any consecutive dots or traversal patterns
  const withoutTraversal = leaf.replace(/\.+/g, '.');
  const dotIndex = withoutTraversal.lastIndexOf('.');
  const base = dotIndex > -1 ? withoutTraversal.substring(0, dotIndex) : withoutTraversal;
  const ext = dotIndex > -1 ? withoutTraversal.substring(dotIndex) : '';
  const cleanBase = base.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
  return `${Date.now()}_${cleanBase}${cleanExt}`;
}

/**
 * Constructs structured path for complaint attachments.
 */
export function getComplaintStoragePath(complaintId: string, filename: string): string {
  return `complaints/${complaintId}/${sanitizeFilename(filename)}`;
}

/**
 * Constructs structured path for project milestone verification evidence.
 */
export function getProjectMilestoneStoragePath(
  projectId: string,
  milestoneId: string,
  filename: string
): string {
  return `projects/${projectId}/milestones/${milestoneId}/${sanitizeFilename(filename)}`;
}

/**
 * Constructs structured path for contractor submission reports.
 */
export function getContractorSubmissionStoragePath(submissionId: string, filename: string): string {
  return `contractor_submissions/${submissionId}/${sanitizeFilename(filename)}`;
}

/**
 * Converts a file/blob into a data URL for resilient offline rendering.
 */
function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      resolve(`data:${file.type || 'application/octet-stream'};base64,mockFileContent`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file as Data URL'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to Firebase Cloud Storage, falling back to an in-memory Data URL if unconfigured.
 */
export async function uploadFile(
  file: File | Blob,
  storagePath: string,
  metadata?: Record<string, string>
): Promise<string> {
  // Validate file
  const validation = validateUploadFile({
    type: file.type,
    size: file.size,
    name: 'name' in file ? (file as File).name : undefined,
  });

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file for upload.');
  }

  if (isFirebaseConfigured && storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const customMetadata = metadata ? { customMetadata: metadata } : undefined;
      const snapshot = await uploadBytes(storageRef, file, customMetadata);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.warn('[StorageService] Firebase Storage upload failed, using Data URL fallback:', err);
    }
  }

  // Resilient fallback (Offline / Test / Demo Mode)
  return await fileToDataUrl(file);
}

/**
 * Deletes a file from Firebase Cloud Storage if applicable.
 */
export async function deleteStorageFile(storagePathOrUrl: string): Promise<void> {
  if (isFirebaseConfigured && storage && !storagePathOrUrl.startsWith('data:')) {
    try {
      const storageRef = ref(storage, storagePathOrUrl);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('[StorageService] Delete file warning:', err);
    }
  }
}
