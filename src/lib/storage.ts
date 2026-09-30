import { supabase } from "./supabase";

// Bucket name. "public" is reserved by Supabase, so we use "occaz".
// You can change this here once and it applies everywhere.
export const STORAGE_BUCKET = "occaz";

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * The bucket must exist with public read access.
 * Stored under `${kind}/${randomId}.${ext}` so admins / users never
 * collide on filenames.
 */
export async function uploadPublicImage(
  file: File,
  kind: "events" | "opportunities" | "organizers" | "misc",
): Promise<{ url: string; path: string }> {
  const ext = (file.name.split(".").pop() || "png")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const id =
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const path = `${kind}/${id}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/png",
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  return { url: data.publicUrl, path };
}
