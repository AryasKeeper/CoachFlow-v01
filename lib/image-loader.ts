/**
 * Custom Image Loader for CDN Integration
 * 
 * This loader is used when CDN_URL is configured in production
 * to serve optimized images from a CDN for better performance.
 */

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const cdnUrl = process.env.CDN_URL;
  
  if (!cdnUrl) {
    // Fallback to default behavior if CDN_URL is not configured
    return src;
  }

  // If src is already a full URL, use it as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // Remove leading slash if present
  const normalizedSrc = src.startsWith('/') ? src.slice(1) : src;
  
  // Build CDN URL with optimization parameters
  const params = new URLSearchParams();
  params.set('w', width.toString());
  
  if (quality) {
    params.set('q', quality.toString());
  }

  // Auto format for best compression
  params.set('f', 'auto');
  
  // Auto quality for best performance/quality balance
  if (!quality) {
    params.set('q', 'auto');
  }

  return `${cdnUrl}/${normalizedSrc}?${params.toString()}`;
}