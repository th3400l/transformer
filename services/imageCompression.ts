export type DownloadQuality = 'high' | 'medium' | 'low';

export async function recompressBlob(
  blob: Blob,
  width: number,
  height: number,
  quality: DownloadQuality
): Promise<Blob> {
  if (quality === 'high') return blob;
  const q = quality === 'medium' ? 0.7 : 0.5;

  const img = await blobToImage(blob);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;
  ctx.drawImage(img, 0, 0, width, height);
  const out = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', q);
    } catch {
      resolve(null);
    }
  });
  return out ?? blob;
}

export async function applyDownloadQuality<T extends { blob: Blob; metadata: { width: number; height: number; format?: string } }>(
  images: T[],
  quality: DownloadQuality
): Promise<T[]> {
  if (quality === 'high') return images;
  const out: T[] = [];
  for (const img of images) {
    const newBlob = await recompressBlob(img.blob, img.metadata.width, img.metadata.height, quality);
    const cloned: any = { ...img, blob: newBlob };
    // keep metadata format as-is; file extension handled by downloader
    out.push(cloned);
  }
  return out;
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

