import { useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Quick storage debug page. Hit it at /__storage-debug
 * to see the actual error from Supabase when uploading.
 */
export function StorageDebugPage() {
  const [log, setLog] = useState<string[]>([]);
  const append = (s: string) => setLog((l) => [...l, s]);

  async function listBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    append(`listBuckets error: ${error?.message ?? "none"}`);
    append(`buckets: ${JSON.stringify(data, null, 2)}`);
  }

  async function tryUpload(file: File) {
    append(`uploading ${file.name} (${file.size} bytes)...`);
    const path = `debug/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("occaz")
      .upload(path, file, { upsert: true });
    append(`upload error: ${error?.message ?? "none"}`);
    append(`upload data: ${JSON.stringify(data, null, 2)}`);
    if (!error) {
      const { data: pub } = supabase.storage
        .from("occaz")
        .getPublicUrl(path);
      append(`public URL: ${pub.publicUrl}`);
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold">Storage Debug</h1>
      <div className="mt-4 flex gap-2">
        <button onClick={listBuckets} className="rounded-lg bg-accent-500 px-4 py-2 text-white">
          List buckets
        </button>
        <label className="rounded-lg bg-emerald-500 px-4 py-2 text-white cursor-pointer">
          Try upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && tryUpload(e.target.files[0])}
          />
        </label>
      </div>
      <pre className="mt-6 rounded-lg bg-black/40 p-4 text-xs whitespace-pre-wrap">
        {log.join("\n\n")}
      </pre>
    </div>
  );
}
