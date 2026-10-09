import { describe, it, expect } from 'vitest';
import {
  validateUploadFile,
  sanitizeFilename,
  getComplaintStoragePath,
  getProjectMilestoneStoragePath,
  getContractorSubmissionStoragePath,
  uploadFile,
  MAX_FILE_SIZE_BYTES,
} from '../api/storageService';

describe('Phase 14: Firebase Storage & Cloud Architecture Unit Tests', () => {
  describe('1. File Type and Size Validation', () => {
    it('accepts valid JPEG, PNG, WEBP, and PDF files within 10MB', () => {
      const validFiles = [
        { type: 'image/jpeg', size: 2 * 1024 * 1024, name: 'site_photo.jpg' },
        { type: 'image/png', size: 5 * 1024 * 1024, name: 'blueprint.png' },
        { type: 'image/webp', size: 1024 * 1024, name: 'inspection.webp' },
        { type: 'application/pdf', size: 8 * 1024 * 1024, name: 'audit_report.pdf' },
      ];

      for (const file of validFiles) {
        const result = validateUploadFile(file);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('rejects disallowed file types such as executables or unknown scripts', () => {
      const invalidFiles = [
        { type: 'application/x-msdownload', size: 1024, name: 'malware.exe' },
        { type: 'text/javascript', size: 2048, name: 'script.js' },
        { type: 'application/x-sh', size: 512, name: 'deploy.sh' },
      ];

      for (const file of invalidFiles) {
        const result = validateUploadFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Unsupported file format');
      }
    });

    it('rejects files larger than 10MB maximum limit', () => {
      const oversizedFile = {
        type: 'image/jpeg',
        size: MAX_FILE_SIZE_BYTES + 1024, // 10MB + 1KB
        name: 'huge_panorama.jpg',
      };

      const result = validateUploadFile(oversizedFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed threshold of 10 MB');
    });
  });

  describe('2. Structured Storage Paths & Path Sanitization', () => {
    it('sanitizes dangerous characters and directory traversal patterns in filenames', () => {
      const unsafe = '../../etc/passwd.jpg';
      const sanitized = sanitizeFilename(unsafe);
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
      expect(sanitized).toMatch(/^[0-9]+_.*passwd\.jpg$/);
    });

    it('constructs structured complaint attachment path', () => {
      const path = getComplaintStoragePath('cmp-101', 'leak.jpg');
      expect(path.startsWith('complaints/cmp-101/')).toBe(true);
      expect(path).toContain('leak.jpg');
    });

    it('constructs structured milestone verification proof path', () => {
      const path = getProjectMilestoneStoragePath('prj-202', 'ms-01', 'compaction.png');
      expect(path.startsWith('projects/prj-202/milestones/ms-01/')).toBe(true);
      expect(path).toContain('compaction.png');
    });

    it('constructs structured contractor submission evidence path', () => {
      const path = getContractorSubmissionStoragePath('sub-303', 'progress.pdf');
      expect(path.startsWith('contractor_submissions/sub-303/')).toBe(true);
      expect(path).toContain('progress.pdf');
    });
  });

  describe('3. Resilient Upload Handler (Offline & Fallback Safety)', () => {
    it('generates a reliable file URI / Data URL in mock or fallback mode', async () => {
      const mockBlob = new Blob(['mock binary image content'], { type: 'image/jpeg' });
      const storagePath = getComplaintStoragePath('cmp-demo', 'photo.jpg');

      const url = await uploadFile(mockBlob, storagePath);
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
    });

    it('rejects invalid uploads before initiating network transfers', async () => {
      const invalidBlob = new Blob(['malicious payload'], { type: 'application/x-sh' });
      await expect(uploadFile(invalidBlob, 'dangerous/path.sh')).rejects.toThrow(
        /Unsupported file format/
      );
    });
  });
});
