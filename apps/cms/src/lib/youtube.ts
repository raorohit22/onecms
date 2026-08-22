/**
 * Utility functions for parsing and rendering YouTube videos and thumbnails.
 */

/**
 * Extracts the 11-character YouTube video ID from standard YouTube URL patterns.
 * Supports standard watch URLs, short links (youtu.be), embeds, and YouTube shorts.
 *
 * @param url - The input YouTube URL or video identifier
 * @returns The extracted 11-character video ID, or null if invalid
 */
export function getYouTubeVideoId(url?: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  const trimmed = url.trim();
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }
  
  // If the user directly entered an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Returns a privacy-enhanced, responsive embed URL for an input YouTube link.
 *
 * @param url - The input YouTube URL
 * @returns Embeddable URL string or null
 */
export function getYouTubeEmbedUrl(url?: string): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

/**
 * Returns the high-quality thumbnail image URL for an input YouTube link.
 *
 * @param url - The input YouTube URL
 * @returns HQ thumbnail image URL string or null
 */
export function getYouTubeThumbnailUrl(url?: string): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}
