// Cloudinary configuration file
// This file contains the configuration for Cloudinary image upload service

// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: 'quick-commerce', // Default preset
  folder: 'quick-commerce/products'
};

// Check if Cloudinary is properly configured
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    cloudinaryConfig.cloudName && 
    cloudinaryConfig.apiKey &&
    cloudinaryConfig.apiSecret
  );
}; 