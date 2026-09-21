// Utility for handling Announcement attachments, file uploads (PDF, Word, Excel, etc.)
// and Google Drive / external URL downloads and previews.

export interface ParsedGoogleDrive {
  isGoogleDrive: boolean;
  fileId?: string;
  directDownloadUrl?: string;
  previewUrl?: string;
  driveType?: 'doc' | 'sheet' | 'slide' | 'drive_file' | 'folder';
}

/**
 * Parse a URL to see if it's a Google Drive or Google Docs/Sheets/Slides link.
 * If so, extracts the file ID and constructs a direct download link.
 */
export function parseGoogleDriveLink(url: string): ParsedGoogleDrive {
  if (!url || typeof url !== 'string') {
    return { isGoogleDrive: false };
  }

  const cleanUrl = url.trim();

  // Pattern 1: drive.google.com/file/d/{FILE_ID}/...
  const driveFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  const matchFile = cleanUrl.match(driveFileRegex);
  if (matchFile && matchFile[1]) {
    const fileId = matchFile[1];
    return {
      isGoogleDrive: true,
      fileId,
      directDownloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      previewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      driveType: 'drive_file',
    };
  }

  // Pattern 2: drive.google.com/open?id={FILE_ID} or drive.google.com/uc?id={FILE_ID}
  const driveQueryRegex = /drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i;
  const matchQuery = cleanUrl.match(driveQueryRegex);
  if (matchQuery && matchQuery[1]) {
    const fileId = matchQuery[1];
    return {
      isGoogleDrive: true,
      fileId,
      directDownloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      previewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      driveType: 'drive_file',
    };
  }

  // Pattern 3: docs.google.com/document/d/{DOC_ID}
  const docsRegex = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i;
  const matchDocs = cleanUrl.match(docsRegex);
  if (matchDocs && matchDocs[1]) {
    const fileId = matchDocs[1];
    return {
      isGoogleDrive: true,
      fileId,
      directDownloadUrl: `https://docs.google.com/document/d/${fileId}/export?format=docx`,
      previewUrl: `https://docs.google.com/document/d/${fileId}/edit`,
      driveType: 'doc',
    };
  }

  // Pattern 4: docs.google.com/spreadsheets/d/{SHEET_ID}
  const sheetsRegex = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i;
  const matchSheets = cleanUrl.match(sheetsRegex);
  if (matchSheets && matchSheets[1]) {
    const fileId = matchSheets[1];
    return {
      isGoogleDrive: true,
      fileId,
      directDownloadUrl: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`,
      previewUrl: `https://docs.google.com/spreadsheets/d/${fileId}/edit`,
      driveType: 'sheet',
    };
  }

  // Pattern 5: docs.google.com/presentation/d/{PRES_ID}
  const slidesRegex = /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i;
  const matchSlides = cleanUrl.match(slidesRegex);
  if (matchSlides && matchSlides[1]) {
    const fileId = matchSlides[1];
    return {
      isGoogleDrive: true,
      fileId,
      directDownloadUrl: `https://docs.google.com/presentation/d/${fileId}/export/pptx`,
      previewUrl: `https://docs.google.com/presentation/d/${fileId}/edit`,
      driveType: 'slide',
    };
  }

  // Pattern 6: drive.google.com/drive/folders/{FOLDER_ID}
  const folderRegex = /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/i;
  const matchFolder = cleanUrl.match(folderRegex);
  if (matchFolder && matchFolder[1]) {
    const fileId = matchFolder[1];
    return {
      isGoogleDrive: true,
      fileId,
      previewUrl: cleanUrl,
      driveType: 'folder',
    };
  }

  return { isGoogleDrive: false };
}

/**
 * Detect file category based on filename extension or mime type
 */
export function detectFileCategory(
  filenameOrUrl: string,
  mimeType?: string
): 'pdf' | 'excel' | 'word' | 'powerpoint' | 'image' | 'archive' | 'text' | 'link' {
  const str = (filenameOrUrl || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (str.endsWith('.pdf') || mime.includes('pdf')) return 'pdf';
  if (
    str.endsWith('.xlsx') ||
    str.endsWith('.xls') ||
    str.endsWith('.csv') ||
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime.includes('csv')
  ) {
    return 'excel';
  }
  if (
    str.endsWith('.docx') ||
    str.endsWith('.doc') ||
    str.endsWith('.rtf') ||
    mime.includes('word') ||
    mime.includes('msword') ||
    mime.includes('wordprocessingml')
  ) {
    return 'word';
  }
  if (
    str.endsWith('.pptx') ||
    str.endsWith('.ppt') ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return 'powerpoint';
  }
  if (
    str.endsWith('.jpg') ||
    str.endsWith('.jpeg') ||
    str.endsWith('.png') ||
    str.endsWith('.webp') ||
    str.endsWith('.gif') ||
    mime.startsWith('image/')
  ) {
    return 'image';
  }
  if (str.endsWith('.zip') || str.endsWith('.rar') || str.endsWith('.7z') || mime.includes('zip')) {
    return 'archive';
  }
  if (str.endsWith('.txt') || mime.includes('text/plain')) {
    return 'text';
  }
  return 'link';
}

/**
 * Format bytes to readable string (e.g. 520 KB, 1.4 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Reads a browser File object as a Base64 data URL
 */
export function readFileAsDataUrl(file: File): Promise<{
  dataUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  rawSize: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileType = detectFileCategory(file.name, file.type);
      resolve({
        dataUrl,
        fileName: file.name,
        fileSize: formatBytes(file.size),
        fileType,
        rawSize: file.size,
      });
    };
    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas yang diunggah.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Triggers a real browser download for a base64 Data URI, Google Drive link, or direct URL.
 */
export function downloadAttachment(options: {
  fileData?: string;
  fileName?: string;
  linkUrl?: string;
}) {
  const { fileData, fileName, linkUrl } = options;

  // Case 1: Base64 Data URI uploaded directly
  if (fileData) {
    try {
      // If it's a data URI, convert to blob to support large files without URL length limit
      if (fileData.startsWith('data:')) {
        const parts = fileData.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName || 'berkas_pengumuman';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 10000);
        return;
      }

      // Direct download link
      const a = document.createElement('a');
      a.href = fileData;
      a.download = fileName || 'berkas_pengumuman';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    } catch (err) {
      console.error('Base64 download error, fallback to window.open:', err);
      window.open(fileData, '_blank');
      return;
    }
  }

  // Case 2: Link URL (Google Drive or direct web link)
  if (linkUrl) {
    const gDrive = parseGoogleDriveLink(linkUrl);
    if (gDrive.isGoogleDrive && gDrive.directDownloadUrl) {
      // Open Google Drive direct download URL in a new window/tab
      const a = document.createElement('a');
      a.href = gDrive.directDownloadUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Standard URL
    const a = document.createElement('a');
    a.href = linkUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    if (fileName) a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Extracts URLs from body text
 */
export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}
