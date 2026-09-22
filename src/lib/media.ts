/** URLs we can actually put in an <img> without showing a broken video/permalink. */

const IMAGE_EXT = /\.(?:jpe?g|png|gif|webp|avif|bmp)(?:$|\?)/i;
const IMAGE_CDN =
  /(?:fbcdn\.net|cdninstagram\.com|instagram\.com|scontent|tiktokcdn|muscdn\.com|byteicdn\.com|ibyteimg\.com|byteimg\.com)/i;
const PAGE_OR_VIDEO =
  /(?:facebook|fb)\.com\/(?:reel|watch|video|share)|tiktok\.com\/@|threads\.(?:com|net)\/@/i;
const VIDEO_FILE = /\.mp4(?:$|\?)|\/video\/tos\/|webapp-prime\.tiktok\.com/i;

export function isRenderableImageUrl(url: string | null | undefined): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  if (VIDEO_FILE.test(url)) return false;
  if (IMAGE_EXT.test(url)) return true;
  if (PAGE_OR_VIDEO.test(url) && !IMAGE_CDN.test(url)) return false;
  return IMAGE_CDN.test(url);
}

export function isVideoMediaType(mediaType?: string | number | null): boolean {
  const type = String(mediaType ?? "").toLowerCase();
  return type.includes("video") || type === "2";
}

export function postPreviewUrl(post: {
  media_url?: string | null;
  media_type?: string | number | null;
}): string | null {
  const url = post.media_url;
  if (!url) return null;
  if (isRenderableImageUrl(url)) return url;
  const type = String(post.media_type ?? "").toLowerCase();
  if (type.includes("photo") || type.includes("image") || type === "1" || type === "8") {
    return VIDEO_FILE.test(url) || PAGE_OR_VIDEO.test(url) ? null : url;
  }
  return null;
}
