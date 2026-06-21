import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  version: string;
  bytes: number;
}

/**
 * Uploads a base64 encoded cover image to Cloudinary with retry logic and exponential backoff.
 */
export async function uploadToCloudinary(
  userId: string,
  postId: string,
  base64Data: string
): Promise<CloudinaryUploadResult> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Missing Cloudinary credentials. Image upload cannot proceed.");
  }

  // Prepend data URI prefix if needed
  const dataUri = base64Data.startsWith("data:") ? base64Data : `data:image/png;base64,${base64Data}`;

  // Extract base64 body and validate MIME type and size
  const matches = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid Base64 image format. Missing metadata prefix.");
  }

  const mimeType = matches[1];
  const base64Body = matches[2];

  // Validate MIME type
  if (!mimeType.startsWith("image/")) {
    throw new Error(`Unsupported image MIME type: ${mimeType}`);
  }

  // Check base64 validity
  const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Body.replace(/\s/g, ""));
  if (!isValidBase64) {
    throw new Error("Invalid Base64 payload. Content is corrupted.");
  }

  // Estimate size: every 4 base64 chars represent 3 bytes
  const estimatedSizeBytes = Math.round((base64Body.length * 3) / 4);
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit
  if (estimatedSizeBytes > maxSizeBytes) {
    throw new Error(`Image size is too large (${(estimatedSizeBytes / 1024 / 1024).toFixed(2)}MB). Maximum allowed is 10MB.`);
  }

  const folder = `kontenthub/users/${userId}/covers`;
  const publicId = postId;

  // Retry logic with exponential backoff
  let attempt = 0;
  const maxAttempts = 3;
  let delay = 1000; // start with 1 second delay

  while (attempt < maxAttempts) {
    attempt++;
    try {
      // Create timeout promise
      const uploadPromise = cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Cloudinary upload timed out.")), 15000)
      );

      const uploadResponse = await Promise.race([uploadPromise, timeoutPromise]);

      // Return optimized URL and metadata
      // Auto optimization: dynamic format, auto quality, fill/resize crop to 672x384
      const secure_url = uploadResponse.secure_url.replace(
        "/upload/",
        "/upload/f_auto,q_auto,c_fill,w_672,h_384/"
      );

      return {
        secure_url,
        public_id: uploadResponse.public_id,
        width: uploadResponse.width,
        height: uploadResponse.height,
        version: String(uploadResponse.version),
        bytes: uploadResponse.bytes,
      };
    } catch (error: any) {
      console.warn(`Cloudinary upload attempt ${attempt} failed:`, error.message || error);
      if (attempt >= maxAttempts) {
        throw new Error(error.message || "Failed to upload image after 3 attempts.");
      }
      // Wait for exponential backoff delay
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for next attempt
    }
  }

  throw new Error("Failed to upload image. Unknown error.");
}

/**
 * Deletes a single image from Cloudinary using its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Missing Cloudinary credentials. Image deletion cannot proceed.");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not_found") {
      console.warn(`Cloudinary delete returned unexpected result: ${result.result} for ${publicId}`);
    }
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
    throw error;
  }
}

/**
 * Deletes all Cloudinary assets and folders associated with a user.
 */
export async function deleteUserFolder(userId: string): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Missing Cloudinary credentials. Folder deletion cannot proceed.");
  }

  const prefix = `kontenthub/users/${userId}/`;
  try {
    console.log(`De-registering all assets under prefix ${prefix}...`);
    // Delete resources by prefix
    await cloudinary.api.delete_resources_by_prefix(prefix);

    // Delete folders
    try {
      await cloudinary.api.delete_folder(`kontenthub/users/${userId}/covers`);
    } catch (e: any) {
      console.warn(`Could not delete covers subfolder for user ${userId}:`, e.message || e);
    }

    try {
      await cloudinary.api.delete_folder(`kontenthub/users/${userId}`);
    } catch (e: any) {
      console.warn(`Could not delete root folder for user ${userId}:`, e.message || e);
    }
    console.log(`Successfully deleted user folder and all files for ${userId}`);
  } catch (error) {
    console.error(`Failed to delete Cloudinary user directory:`, error);
    throw error;
  }
}
