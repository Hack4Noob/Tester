interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  url: string;
  asset_id: string;
  version: number;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

const CLOUDINARY_CONFIG = {
  cloudName: "Estanislau", // From the provided configuration
  uploadPresets: {
    vimbalambi: "vimbalambi_preset",
    stories: "stories_preset"
  }
};

export const uploadToCloudinary = async (
  file: File,
  preset: "vimbalambi" | "stories" = "vimbalambi"
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPresets[preset]);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file");
  }
};

export const uploadVideoToCloudinary = async (
  file: File,
  preset: "vimbalambi" | "stories" = "stories"
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPresets[preset]);
  formData.append("resource_type", "video");
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Video upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Cloudinary video upload error:", error);
    throw new Error("Failed to upload video");
  }
};

export const generateCloudinaryUrl = (
  publicId: string,
  transformations?: string
): string => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/`;
  if (transformations) {
    return `${baseUrl}${transformations}/${publicId}`;
  }
  return `${baseUrl}${publicId}`;
};

export const optimizeImageUrl = (
  publicId: string,
  width?: number,
  height?: number,
  quality = "auto:good"
): string => {
  let transformations = `q_${quality},f_auto`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  return generateCloudinaryUrl(publicId, transformations);
};
