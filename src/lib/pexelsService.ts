/**
 * Pexels Image Search Service
 * Used to find royalty-free images for LinkedIn posts.
 * Free plan: internet image search only (no AI generation).
 * Pro plan: AI generation (NVIDIA FLUX) takes priority, Pexels is a fallback.
 */

export interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographerUrl: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsSearchResult {
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
  alt: string;
}

/**
 * Searches Pexels for a royalty-free image matching the given query.
 * Returns the best landscape photo (suitable for LinkedIn banners).
 */
export async function searchPexelsImage(
  query: string,
  orientation: "landscape" | "portrait" | "square" = "landscape"
): Promise<PexelsSearchResult | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn("PEXELS_API_KEY is not set. Skipping image search.");
    return null;
  }

  // Clean and limit query to avoid rate-limit issues
  const cleanQuery = query
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 100);

  if (!cleanQuery) return null;

  try {
    const params = new URLSearchParams({
      query: cleanQuery,
      orientation,
      size: "large",
      per_page: "5",
      page: "1",
    });

    const response = await fetch(
      `https://api.pexels.com/v1/search?${params.toString()}`,
      {
        headers: {
          Authorization: apiKey,
        },
        // 10s timeout
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(
        `Pexels API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      // Fallback: try a simpler one-word query
      const simpleWords = cleanQuery.split(" ").filter((w: string) => w.length > 3);
      if (simpleWords.length > 0) {
        return searchPexelsImage(simpleWords[0], orientation);
      }
      return null;
    }

    // Pick the first photo (already sorted by relevance by Pexels)
    const photo: PexelsPhoto = data.photos[0];

    return {
      imageUrl: photo.src.large2x || photo.src.large || photo.src.original,
      photographer: photo.photographer,
      photographerUrl: photo.photographerUrl || "https://www.pexels.com",
      pexelsUrl: photo.url,
      alt: photo.alt || cleanQuery,
    };
  } catch (error) {
    console.error("Failed to search Pexels:", error);
    return null;
  }
}

/**
 * Builds an optimal Pexels search query from post metadata.
 * Uses the title and topic to form a specific, visual query.
 */
export function buildImageQuery(
  title: string,
  topic: string,
  industry?: string | null
): string {
  // Prefer topic > title > industry as the primary query
  const parts: string[] = [];

  if (topic) {
    // Take first 5 words of the topic
    const topicWords = topic.trim().split(/\s+/).slice(0, 5).join(" ");
    parts.push(topicWords);
  } else if (title) {
    const titleWords = title.trim().split(/\s+/).slice(0, 5).join(" ");
    parts.push(titleWords);
  }

  // Append industry keyword for context
  if (industry && !parts.join(" ").toLowerCase().includes(industry.toLowerCase())) {
    parts.push(industry.split(/[\s,]+/)[0]); // First word of industry
  }

  // Append "professional" to bias toward business-appropriate images
  if (!parts.join(" ").toLowerCase().includes("professional")) {
    parts.push("professional");
  }

  return parts.join(" ").trim() || "professional business";
}
