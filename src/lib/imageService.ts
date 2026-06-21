import { db } from "@/lib/firebase/server";
import { getUsage } from "@/lib/db/usage";
import { updateGeneratedPost } from "@/lib/db/generated-posts";

/**
 * Gating checks and rate limiting for image generations.
 * Free plan: Blocked with 403.
 * Pro plan: Maximum 30 images/hour, 300/day.
 * Cooldown: 20 seconds between generations.
 */
export async function verifyPlanAndRateLimit(userId: string): Promise<void> {
  // 1. Verify Pro Plan
  const usage = await getUsage(userId);
  if (!usage || usage.plan !== "pro") {
    throw new Error("AI Cover Images are available only for Pro users.");
  }

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Query recent posts of the user (limit 300) and filter in memory
  // This utilizes the existing composite index (user_id ASC, created_at DESC)
  const postsSnapshot = await db
    .collection("generated_posts")
    .where("user_id", "==", userId)
    .orderBy("created_at", "desc")
    .limit(300)
    .get();

  let imagesInLastHour = 0;
  let imagesInLastDay = 0;
  let isCooldownActive = false;

  postsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.image_created_at) {
      const createdAtTime = new Date(data.image_created_at).getTime();
      
      if (createdAtTime >= oneHourAgo) {
        imagesInLastHour++;
      }
      if (createdAtTime >= oneDayAgo) {
        imagesInLastDay++;
      }
    }

    if (data.image_updated_at) {
      const updatedAtTime = new Date(data.image_updated_at).getTime();
      if (now - updatedAtTime < 20000) {
        isCooldownActive = true;
      }
    }
  });

  if (imagesInLastHour >= 30) {
    throw new Error("Rate limit exceeded. Maximum 30 image generations per hour.");
  }

  if (imagesInLastDay >= 300) {
    throw new Error("Rate limit exceeded. Maximum 300 image generations per day.");
  }

  if (isCooldownActive) {
    throw new Error("Cooldown active. Please wait 20 seconds between image generations.");
  }
}

/**
 * Generates an image using NVIDIA FLUX.1-schnell API.
 */
export async function generateFluxImage(prompt: string, size: string = "1024x576"): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY. Image generation cannot proceed.");
  }

  // Combine instructions safely to prevent prompt injection
  const systemPrompt = "LinkedIn banner style, professional business design, minimalist layout, modern gradients, no text on the image, high quality.";
  const finalPrompt = `${systemPrompt} Subject: ${prompt}`.trim();

  // Parse size to supported width and height for NVIDIA FLUX.1-schnell API
  let width = 1024;
  let height = 1024;

  if (size === "1024x576") {
    // Landscape 16:9 banner mapping to nearest supported 1.75 aspect ratio
    width = 1344;
    height = 768;
  } else if (size) {
    const parts = size.split("x");
    if (parts.length === 2) {
      const w = parseInt(parts[0], 10);
      const h = parseInt(parts[1], 10);
      if (!isNaN(w) && !isNaN(h)) {
        width = w;
        height = h;
      }
    }
  }

  const url = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell";

  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json",
    },
    body: JSON.stringify({
      prompt: finalPrompt,
      width: width,
      height: height,
    }),
  });

  // Fallback to square 1024x1024 if first size fails
  if (!response.ok && (width !== 1024 || height !== 1024)) {
    console.warn(`NVIDIA Flux image generation failed with size ${width}x${height}. Falling back to 1024x1024...`);
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        width: 1024,
        height: 1024,
      }),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA Image API error: ${errorText}`);
  }

  const data = await response.json();
  if (data.artifacts && data.artifacts[0] && data.artifacts[0].base64) {
    return data.artifacts[0].base64;
  }

  throw new Error("Invalid response structure from NVIDIA Image API");
}

/**
 * Updates Firestore generated post record with the complete image metadata fields.
 */
export async function updatePostImageMetadata(
  postId: string,
  userId: string,
  metadata: {
    cover_image_url: string | null;
    cloudinary_public_id: string | null;
    image_model: string | null;
    image_prompt: string | null;
    image_width: number | null;
    image_height: number | null;
    image_created_at: string | null;
    image_generation_time_ms?: number | null;
    image_version?: string | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  await updateGeneratedPost(postId, userId, {
    cover_image_url: metadata.cover_image_url,
    image_prompt: metadata.image_prompt,
    image_model: metadata.image_model,
    image_created_at: metadata.image_created_at,
    image_updated_at: now,
    cloudinary_public_id: metadata.cloudinary_public_id,
    image_width: metadata.image_width,
    image_height: metadata.image_height,
    image_generation_time_ms: metadata.image_generation_time_ms ?? null,
    image_version: metadata.image_version ?? null,
  });
}

/**
 * Logs image analytics events into a Firestore collection.
 */
export async function logImageAnalytic(data: {
  userId: string;
  postId: string;
  status: "success" | "failed";
  generationTimeMs?: number;
  uploadTimeMs?: number;
  imageSizeBytes?: number;
  errorMessage?: string;
}) {
  try {
    await db.collection("image_analytics").add({
      ...data,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to write image analytic record:", err);
  }
}
