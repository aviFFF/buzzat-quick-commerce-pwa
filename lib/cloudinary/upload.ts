import { cloudinaryConfig, isCloudinaryConfigured } from './config';

// Maximum number of retries for upload operations
const MAX_RETRIES = 3;
// Delay between retries (in milliseconds)
const RETRY_DELAY = 1000;

/**
 * Uploads a single product image to Cloudinary with retry capability
 * @param file The file to upload
 * @param vendorId The vendor ID to associate with the file
 * @param attempt Current retry attempt (internal use)
 * @returns Object with success status, URL, and public_id
 */
export const uploadProductImage = async (file: File, vendorId: string, attempt = 1): Promise<{
  success: boolean;
  url?: string;
  public_id?: string;
  error?: any;
  errorCode?: string;
  errorMessage?: string;
}> => {
  try {
    if (!isCloudinaryConfigured()) {
      throw new Error('Cloudinary is not properly configured. Please check your environment variables.');
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const fileName = `${timestamp}_${safeFileName}`;
    
    console.log(`Uploading image to Cloudinary (attempt ${attempt}/${MAX_RETRIES}): ${fileName}`);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', `${cloudinaryConfig.folder}/${vendorId}`);
    formData.append('public_id', fileName);
    
    // Add metadata
    formData.append('context', `vendorId=${vendorId}|originalName=${file.name}`);
    
    // Upload to Cloudinary using their upload API
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
    }
    
    const data = await response.json();
    
    return { 
      success: true, 
      url: data.secure_url,
      public_id: data.public_id 
    };
  } catch (error: any) {
    console.error(`Error uploading product image (attempt ${attempt}/${MAX_RETRIES}):`, error);
    
    // Retry if not exceeded max attempts
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying upload after ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return uploadProductImage(file, vendorId, attempt + 1);
    }
    
    return { 
      success: false, 
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during upload'
    };
  }
};

/**
 * Uploads multiple product images with progress tracking
 * @param files Array of files to upload
 * @param vendorId The vendor ID to associate with the files
 * @param onProgress Optional callback for progress updates
 * @returns Array of upload results for each file
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
      
      // If one upload fails, continue with the others but log error
      if (!result.success) {
        console.error('Error uploading file:', file.name, result.errorMessage);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount > 0,
      totalFiles: files.length,
      successfulUploads: successCount,
      failedUploads: files.length - successCount,
      results
    };
  } catch (error) {
    console.error("Error in batch upload:", error);
    return {
      success: false,
      totalFiles: files.length,
      successfulUploads: completedUploads,
      failedUploads: files.length - completedUploads,
      results,
      error
    };
  }
};

/**
 * Deletes a product image from Cloudinary with retry capability
 * @param public_id The public_id of the image to delete
 * @param attempt Current retry attempt (internal use)
 * @returns Object with success status
 */
export const deleteProductImage = async (public_id: string, attempt = 1): Promise<{
  success: boolean;
  error?: any;
  errorCode?: string;
  errorMessage?: string;
}> => {
  try {
    if (!isCloudinaryConfigured()) {
      throw new Error('Cloudinary is not properly configured. Please check your environment variables.');
    }
    
    // Create signature for secure deletion
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // For deletion, we need to use the backend to securely sign the request
    // This assumes you have a backend API endpoint to handle secure deletion
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_id,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete from Cloudinary');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting product image (attempt ${attempt}/${MAX_RETRIES}):`, error);
    
    // Retry if not exceeded max attempts
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying delete after ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return deleteProductImage(public_id, attempt + 1);
    }
    
    return { 
      success: false, 
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during deletion'
    };
  }
};

/**
 * Utility function to check Cloudinary configuration
 * @returns Whether Cloudinary is properly configured
 */
export const checkCloudinaryConfig = async () => {
  try {
    if (!isCloudinaryConfigured()) {
      return { configured: false, error: 'Missing Cloudinary configuration' };
    }
    
    // Create a small test file
    const testBlob = new Blob(['Config Test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'config-test.txt', { type: 'text/plain' });
    
    // Try to upload it
    const result = await uploadProductImage(testFile, 'config-test');
    
    // If successful, we can consider the configuration working
    return { configured: result.success };
  } catch (error) {
    console.error("Cloudinary configuration check failed:", error);
    return { configured: false, error };
  }
}; 