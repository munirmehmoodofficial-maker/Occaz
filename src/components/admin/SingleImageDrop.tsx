import { useRef, useState } from "react";
import { Upload, X, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import clsx from "clsx";
import { uploadPublicImage } from "../../lib/storage";
import { useToast } from "../../lib/toast";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  /** Path prefix in the public bucket, e.g. "organizers" */
  storageKind?: "events" | "opportunities" | "organizers" | "misc";
  /** Recommended aspect: e.g. "1:1" for logos, "16:9" for covers */
  aspect?: "1:1" | "16:9" | "free";
  /** Whether this image is required (shows a red asterisk) */
  required?: boolean;
  /** Optional helper text under the field */
  hint?: string;
}

export function SingleImageDrop({
  value,
  onChange,
  label,
  storageKind = "organizers",
  aspect = "free",
  required,
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large (max 10MB).");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadPublicImage(file, storageKind);
      onChange(url);
      push({ tone: "green", title: "Uploaded", message: `${label} saved.` });
    } catch (e: any) {
      const msg = e?.message ?? "Upload failed";
      setError(msg);
      push({ tone: "red", title: "Upload failed", message: msg });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {label} {required && <span className="text-red-400">*</span>}
        </span>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setError(null);
            }}
            className="text-[10px] text-[var(--text-tertiary)] hover:text-red-400"
          >
            remove
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "relative cursor-pointer overflow-hidden rounded-lg ring-1 transition",
          aspect === "1:1" ? "aspect-square" : aspect === "16:9" ? "aspect-video" : "min-h-[80px]",
          dragOver
            ? "ring-accent-500 bg-accent-500/10"
            : value
              ? "ring-[var(--border-subtle)] bg-[var(--bg-elevated)]"
              : "ring-dashed ring-[var(--border-default)] bg-[var(--bg-elevated)] hover:ring-[var(--border-strong)]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />

        {uploading ? (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <div className="flex flex-col items-center gap-1.5 text-xs text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading…
            </div>
          </div>
        ) : value ? (
          <div className="absolute inset-0">
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition hover:bg-black/40 hover:opacity-100">
              <div className="flex flex-col items-center gap-1 text-xs text-white">
                <Upload className="h-4 w-4" />
                Replace
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-accent-500/15 text-accent-400">
              <ImageIcon className="h-3.5 w-3.5" />
            </div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)]">
              Drop or click
            </div>
            <div className="text-[9px] text-[var(--text-tertiary)]">PNG/JPG/WEBP · 10MB</div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-red-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
      {hint && !error && (
        <div className="mt-1.5 text-[10px] text-[var(--text-tertiary)]">{hint}</div>
      )}
    </div>
  );
}
