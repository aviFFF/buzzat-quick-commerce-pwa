import * as cloudinaryUploader from '@/lib/cloudinary/upload';
import * as firebaseUploader from '@/lib/firebase/storage';
import { isCloudinaryConfigured } from '@/lib/cloudinary/config';

// Define upload service types
type UploadService = 'cloudinary' | 'firebase';

// Flag to control which service to use as primary
const PRIMARY_UPLOAD_SERVICE: UploadService = 'firebase';

/**
 * Unified interface for uploading product images
 * Will try the primary service first, then fall back to the secondary if it fails
 */
export const uploadProductImage = async (file: File, vendorId: string): Promise<{
  success: boolean;
  url?: string;
  public_id?: string; // For Cloudinary
  path?: string;      // For Firebase
  error?: any;
  errorCode?: string;
  errorMessage?: string;
  provider: UploadService;
}> => {
  console.log(`Attempting to upload using ${PRIMARY_UPLOAD_SERVICE} as primary service`);
  
  try {
    // Try primary service first based on configuration
    const useCloudinaryFirst = PRIMARY_UPLOAD_SERVICE === 'cloudinary' && isCloudinaryConfigured();
    
    if (useCloudinaryFirst) {
      const result = await cloudinaryUploader.uploadProductImage(file, vendorId);
      
      if (result.success) {
        return {
          ...result,
          provider: 'cloudinary'
        };
      }
      
      // If Cloudinary failed, try Firebase
      console.log('Cloudinary upload failed, falling back to Firebase Storage');
    }
    
    // Try Firebase Storage
    const firebaseResult = await firebaseUploader.uploadProductImage(file, vendorId);
    
    if (firebaseResult.success) {
      return {
        ...firebaseResult,
        public_id: firebaseResult.path, // Use path as public_id for compatibility
        provider: 'firebase'
      };
    }
    
    // If Firebase failed (or was primary) and Cloudinary is configured, try it as fallback
    const useCloudinaryFallback = !useCloudinaryFirst && isCloudinaryConfigured();
    
    if (useCloudinaryFallback) {
      console.log('Firebase upload failed, falling back to Cloudinary');
      const cloudinaryResult = await cloudinaryUploader.uploadProductImage(file, vendorId);
      
      if (cloudinaryResult.success) {
        return {
          ...cloudinaryResult,
          provider: 'cloudinary'
        };
      }
    }
    
    // If both failed, return the error from the primary service
    return {
      success: false,
      errorCode: 'upload_failed',
      errorMessage: 'Failed to upload image with both services',
      provider: PRIMARY_UPLOAD_SERVICE
    };
  } catch (error: any) {
    console.error('Error in unified upload service:', error);
    return {
      success: false,
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during upload',
      provider: PRIMARY_UPLOAD_SERVICE
    };
  }
};

/**
 * Unified interface for uploading images from URLs
 * Will try the primary service first, then fall back to the secondary if it fails
 */
export const uploadImageFromUrl = async (imageUrl: string, vendorId: string): Promise<{
  success: boolean;
  url?: string;
  public_id?: string; // For Cloudinary
  path?: string;      // For Firebase
  error?: any;
  errorCode?: string;
  errorMessage?: string;
  provider: UploadService;
}> => {
  console.log(`Attempting to upload from URL using ${PRIMARY_UPLOAD_SERVICE} as primary service`);
  
  try {
    // Try primary service first based on configuration
    const useCloudinaryFirst = PRIMARY_UPLOAD_SERVICE === 'cloudinary' && isCloudinaryConfigured();
    
    if (useCloudinaryFirst) {
      const result = await cloudinaryUploader.uploadImageFromUrl(imageUrl, vendorId);
      
      if (result.success) {
        return {
          ...result,
          provider: 'cloudinary'
        };
      }
      
      // If Cloudinary failed, try Firebase
      console.log('Cloudinary URL upload failed, falling back to Firebase Storage');
    }
    
    // Try Firebase Storage
    const firebaseResult = await firebaseUploader.uploadImageFromUrl(imageUrl, vendorId);
    
    if (firebaseResult.success) {
      return {
        ...firebaseResult,
        public_id: firebaseResult.path, // Use path as public_id for compatibility
        provider: 'firebase'
      };
    }
    
    // If Firebase failed (or was primary) and Cloudinary is configured, try it as fallback
    const useCloudinaryFallback = !useCloudinaryFirst && isCloudinaryConfigured();
    
    if (useCloudinaryFallback) {
      console.log('Firebase URL upload failed, falling back to Cloudinary');
      const cloudinaryResult = await cloudinaryUploader.uploadImageFromUrl(imageUrl, vendorId);
      
      if (cloudinaryResult.success) {
        return {
          ...cloudinaryResult,
          provider: 'cloudinary'
        };
      }
    }
    
    // If both failed, return the error from the primary service
    return {
      success: false,
      errorCode: 'upload_failed',
      errorMessage: 'Failed to upload image from URL with both services',
      provider: PRIMARY_UPLOAD_SERVICE
    };
  } catch (error: any) {
    console.error('Error in unified URL upload service:', error);
    return {
      success: false,
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during URL upload',
      provider: PRIMARY_UPLOAD_SERVICE
    };
  }
};

/**
 * Unified interface for uploading multiple product images
 */
export const uploadMultipleProductImages = async (
  files: File[], 
  vendorId: string,
  onProgress?: (progress: number) => void
) => {
  const results = [];
  let completedUploads = 0;
  
  try {
    // Process each file sequentially
    for (const file of files) {
      const result = await uploadProductImage(file, vendorId);
      results.push(result);
      
      // Update progress
      completedUploads++;
      if (onProgress) {
        onProgress((completedUploads / files.length) * 100);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount > 0,
      totalFiles: files.length,
      successfulUploads: successCount,
      failedUploads: files.length - successCount,
      results,
      provider: PRIMARY_UPLOAD_SERVICE
    };
  } catch (error) {
    console.error("Error in batch upload:", error);
    return {
      success: false,
      totalFiles: files.length,
      successfulUploads: completedUploads,
      failedUploads: files.length - completedUploads,
      results,
      error,
      provider: PRIMARY_UPLOAD_SERVICE
    };
  }
};

/**
 * Unified interface for deleting product images
 */
export const deleteProductImage = async (identifier: string): Promise<{
  success: boolean;
  error?: any;
  errorCode?: string;
  errorMessage?: string;
  provider: UploadService;
}> => {
  // Determine if the identifier is a Cloudinary public_id or Firebase path
  // Cloudinary public_ids typically contain folder paths with "/"
  // Firebase paths always start with "products/"
  const isFirebasePath = identifier.startsWith('products/');
  
  try {
    if (isFirebasePath) {
      const result = await firebaseUploader.deleteProductImage(identifier);
      return {
        ...result,
        provider: 'firebase'
      };
    } else {
      // Assume it's a Cloudinary public_id
      const result = await cloudinaryUploader.deleteProductImage(identifier);
      return {
        ...result,
        provider: 'cloudinary'
      };
    }
  } catch (error: any) {
    console.error('Error in unified delete service:', error);
    return {
      success: false,
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during deletion',
      provider: isFirebasePath ? 'firebase' : 'cloudinary'
    };
  }
};

/**
 * Check if upload services are properly configured
 */
export const checkUploadConfig = async () => {
  const results = {
    cloudinary: { configured: false, error: null as Error | null },
    firebase: { configured: false, error: null as Error | null },
    primaryService: PRIMARY_UPLOAD_SERVICE
  };
  
  try {
    if (isCloudinaryConfigured()) {
      const cloudinaryCheck = await cloudinaryUploader.checkCloudinaryConfig();
      results.cloudinary = {
        configured: cloudinaryCheck.configured,
        error: cloudinaryCheck.error ? new Error(String(cloudinaryCheck.error)) : null
      };
    }
  } catch (error: any) {
    results.cloudinary.error = error instanceof Error ? error : new Error(String(error));
  }
  
  try {
    const firebaseCheck = await firebaseUploader.checkStorageCORS();
    results.firebase = {
      configured: firebaseCheck.corsConfigured,
      error: firebaseCheck.error ? new Error(String(firebaseCheck.error)) : null
    };
  } catch (error: any) {
    results.firebase.error = error instanceof Error ? error : new Error(String(error));
  }
  
  return results;
}; 