/**
 * Upload utility functions for car photos, driver licenses, and profile pictures
 */

interface UploadOptions {
  file: File;
  category: 'car' | 'license' | 'profile' | 'inspection' | 'salary_slip';
  identifier: string; // kenteken for cars, uid for users
  proxyUrl: string;
  filename?: string;
  inspectionType?: 'ophalen' | 'inleveren'; // Required when category is 'inspection'
  slipIndex?: 1 | 2 | 3; // Required when category is 'salary_slip'
}

interface UploadResponse {
  success: boolean;
  url?: string;
  fileUrl?: string;
  error?: string;
}

/**
 * Generic upload function with proper folder structure
 * - Cars: vlottr/autos/{kenteken}/
 * - License: vlottr/users/{uid}/rijbewijs/
 * - Profile: vlottr/users/{uid}/profiel/
 *
 * Uses FormData to match PHP proxy expectations:
 * POST with: file, folder (e.g., "vlottr/{userId}"), filename
 */
export async function uploadFile({
  file,
  category,
  identifier,
  proxyUrl,
  filename,
  inspectionType
}: UploadOptions): Promise<UploadResponse> {
  try {
    // Bepaal folder path op basis van category
    // LET OP: GEEN apostrof! PHP proxy sanitized met: preg_replace('/[^a-zA-Z0-9_\-\/]/', '', $folder)
    // PHP strips "vlottr/" prefix en gebruikt $upload_base = __DIR__ . '/uploads/vlottr'
    // Resultaat: /public_html/uploads/vlottr/{cleanFolder}/
    let folder: string;
    switch (category) {
      case 'car':
        folder = `vlottr/autos/${identifier}`;
        break;
      case 'license':
        folder = `vlottr/${identifier}`;
        break;
      case 'profile':
        folder = `vlottr/${identifier}/profiel`;
        break;
      case 'inspection':
        if (!inspectionType) {
          throw new Error('inspectionType is required for inspection category');
        }
        // Structure: vlottr/{inspectionType}/users/{userId}/
        const inspectionTypeCapitalized = inspectionType.charAt(0).toUpperCase() + inspectionType.slice(1);
        folder = `vlottr/${inspectionTypeCapitalized}/users/${identifier}`;
        break;
      case 'salary_slip':
        folder = `vlottr/${identifier}/loonstroken`;
        break;
      default:
        throw new Error('Invalid category');
    }

    // Maak FormData aan (zoals PHP proxy verwacht)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('filename', filename || file.name);

    console.log('[Upload] REQUEST:', {
      proxyUrl,
      folder,
      filename: filename || file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const response = await fetch(proxyUrl, {
      method: 'POST',
      body: formData
      // Geen Content-Type header - browser set dit automatisch met boundary
    });

    console.log('[Upload] RESPONSE STATUS:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();

    console.log('[Upload] PHP PROXY RESPONSE:', data);

    // FIX: Converteer relatieve URLs naar absolute URLs
    // PHP proxy geeft soms `/uploads/...` terug, maar we hebben de volledige URL nodig
    if (data.success && data.url) {
      console.log('[Upload] Original URL from proxy:', data.url);

      // Als URL al volledig is (begint met http), laat hem met rust
      if (!data.url.startsWith('http')) {
        // Parse de proxy URL om het domein te krijgen
        const proxyUrlObj = new URL(proxyUrl);
        const baseUrl = `${proxyUrlObj.protocol}//${proxyUrlObj.host}`;

        // Maak volledige URL: https://internedata.nl + /uploads/...
        data.url = data.url.startsWith('/')
          ? `${baseUrl}${data.url}`
          : `${baseUrl}/${data.url}`;

        console.log('[Upload] Converted relative URL to absolute:', data.url);
      }

      console.log('[Upload] FINAL URL:', data.url);
    } else {
      console.error('[Upload] No success or URL in response:', data);
    }

    return data as UploadResponse;
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload mislukt'
    };
  }
}

/**
 * Upload car photos to vlottr/autos/{kenteken}/
 */
export async function uploadCarPhotos(
  files: File[],
  kenteken: string,
  proxyUrl: string
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];

  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      results.push({
        success: false,
        error: validation.error
      });
      continue;
    }

    const result = await uploadFile({
      file,
      category: 'car',
      identifier: kenteken,
      proxyUrl
    });
    results.push(result);
  }

  return results;
}

/**
 * Upload driver license photos to vlottr/users/{uid}/rijbewijs/
 */
export async function uploadLicensePhotos(
  frontImage: File,
  backImage: File | null,
  userId: string,
  proxyUrl: string
): Promise<{ front: UploadResponse; back?: UploadResponse }> {
  const frontValidation = validateImageFile(frontImage);
  if (!frontValidation.valid) {
    return {
      front: {
        success: false,
        error: frontValidation.error
      }
    };
  }

  const front = await uploadFile({
    file: frontImage,
    category: 'license',
    identifier: userId,
    proxyUrl,
    filename: 'front.jpg'
  });

  let back: UploadResponse | undefined;
  if (backImage) {
    const backValidation = validateImageFile(backImage);
    if (backValidation.valid) {
      back = await uploadFile({
        file: backImage,
        category: 'license',
        identifier: userId,
        proxyUrl,
        filename: 'back.jpg'
      });
    } else {
      back = {
        success: false,
        error: backValidation.error
      };
    }
  }

  return { front, back };
}

/**
 * Upload profile photo to vlottr/users/{uid}/profiel/
 */
export async function uploadProfilePhoto(
  file: File,
  userId: string,
  proxyUrl: string
): Promise<UploadResponse> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  return uploadFile({
    file,
    category: 'profile',
    identifier: userId,
    proxyUrl,
    filename: 'profile.jpg'
  });
}

/**
 * Upload inspection photos (Ophalen/Inleveren)
 * To: vlottr/{Ophalen|Inleveren}/users/{userId}/
 */
export async function uploadInspectionPhoto(
  file: File,
  userId: string,
  inspectionType: 'ophalen' | 'inleveren',
  proxyUrl: string,
  filename?: string
): Promise<UploadResponse> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  return uploadFile({
    file,
    category: 'inspection',
    identifier: userId,
    proxyUrl,
    filename: filename || file.name,
    inspectionType
  });
}

/**
 * Upload multiple inspection photos
 */
export async function uploadInspectionPhotos(
  files: File[],
  userId: string,
  inspectionType: 'ophalen' | 'inleveren',
  proxyUrl: string
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];

  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      results.push({
        success: false,
        error: validation.error
      });
      continue;
    }

    const result = await uploadInspectionPhoto(
      file,
      userId,
      inspectionType,
      proxyUrl
    );
    results.push(result);
  }

  return results;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Alleen JPG, PNG, WebP en HEIC bestanden zijn toegestaan'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Bestand is te groot. Maximaal 10MB toegestaan'
    };
  }

  return { valid: true };
}

/**
 * Validates a document file (PDF or image) for salary slip uploads
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Alleen PDF, JPG, PNG en WebP bestanden zijn toegestaan'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Bestand is te groot. Maximaal 10MB toegestaan'
    };
  }

  return { valid: true };
}

/**
 * Upload a salary slip to vlottr/{userId}/loonstroken/loonstrook_{index}.ext
 */
export async function uploadSalarySlip(
  file: File,
  userId: string,
  slipIndex: 1 | 2 | 3,
  proxyUrl: string
): Promise<UploadResponse> {
  const validation = validateDocumentFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const ext = file.type === 'application/pdf' ? 'pdf' : 'jpg';
  return uploadFile({
    file,
    category: 'salary_slip',
    identifier: userId,
    proxyUrl,
    filename: `loonstrook_${slipIndex}.${ext}`,
    slipIndex,
  });
}
