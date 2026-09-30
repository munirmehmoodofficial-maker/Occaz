/**
 * Fast blob: URL resolver — for legacy rows saved with
 * `URL.createObjectURL(file)` URLs (which die on reload).
 *
 * Strategy: extract the UUID from each blob URL, then look
 * up just that one file in Supabase Storage. Cached so we
 * only hit the network once per unique URL.
 */
import { supabase } from "./supabase";

const cache = new Map<string, string | null>();

function uuidFromBlob(url: string): string | null {
  const m = url.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  return m ? m[0] : null;
}

async function findFileByUuid(uuid: string): Promise<string | null> {
  // Search every top-level folder for a file whose name contains the UUID.
  // Each list call is O(few hundred ms) at most.
  const { data: folders } = await supabase.storage
    .from("occaz")
    .list("", { limit: 50 });
  if (!folders) return null;
  for (const folder of folders) {
    if (!folder.name || folder.name.startsWith(".")) continue;
    const { data: files } = await supabase.storage
      .from("occaz")
      .list(folder.name, { limit: 100 });
    if (!files) continue;
    const match = files.find((f) => f.name.includes(uuid));
    if (match) {
      return `${folder.name}/${match.name}`;
    }
  }
  return null;
}

export async function resolveBlobUrl(
  url: string | null | undefined,
): Promise<string | null | undefined> {
  if (!url) return url;
  if (!url.startsWith("blob:")) return url;
  if (cache.has(url)) return cache.get(url)!;

  const uuid = uuidFromBlob(url);
  if (!uuid) {
    cache.set(url, null);
    return url;
  }

  const path = await findFileByUuid(uuid);
  if (!path) {
    cache.set(url, null);
    return url;
  }

  const { data: pub } = supabase.storage
    .from("occaz")
    .getPublicUrl(path);
  cache.set(url, pub.publicUrl);
  return pub.publicUrl;
}

export async function resolveBlobUrls(urls: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const u of urls) {
    out.push((await resolveBlobUrl(u)) ?? u);
  }
  return out;
}
