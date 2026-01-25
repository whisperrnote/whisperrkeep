import { getProfilePicturePreview } from '@/lib/appwrite';

const previewCache = new Map<string, string | null>();

export async function fetchProfilePreview(fileId?: string | null, width: number = 64, height: number = 64): Promise<string | null> {
  if (!fileId) return null;
  if (previewCache.has(fileId)) return previewCache.get(fileId) ?? null;
  try {
    const url = await getProfilePicturePreview(fileId, width, height);
    const str = url as unknown as string | null;
    previewCache.set(fileId, str);
    return str;
  } catch (err) {
    previewCache.set(fileId, null);
    return null;
  }
}

export function getCachedProfilePreview(fileId?: string | null): string | null | undefined {
  if (!fileId) return null;
  return previewCache.get(fileId);
}
