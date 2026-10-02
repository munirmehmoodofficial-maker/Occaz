import { useRef, useState } from "react";
import { Reorder } from "framer-motion";
import {
  Upload,
  X,
  Star,
  GripVertical,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import { uploadPublicImage } from "../../lib/storage";
import { useToast } from "../../lib/toast";

export interface ImageItem {
  id: string;
  url: string; // final URL — either a remote https:// or a data: URL for unsaved previews
  status: "ready" | "uploading" | "failed";
  file?: File;
  isCover?: boolean;
  error?: string;
}

interface Props {
  images: ImageItem[];
  /** Like React's setState — receives either the next array or an updater
   *  function. Callers can use either shape. */
  onChange: (value: ImageItem[] | ((prev: ImageItem[]) => ImageItem[])) => void;
  max?: number;
  label?: string;
  /** Path prefix in the public bucket, e.g. "events" or "opportunities" */
  storageKind?: "events" | "opportunities" | "organizers" | "misc";
}

type Updater = (prev: ImageItem[]) => ImageItem[];

function applyUpdate(
  onChange: Props["onChange"],
  value: ImageItem[] | Updater,
) {
  onChange(value as any);
}

export function ImageUploader({
  images,
  onChange,
  max = 8,
  label = "Images",
  storageKind = "misc",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { push } = useToast();

  async function uploadOne(file: File, tempId: string, makeCover: boolean) {
    // Optimistic placeholder
    const placeholder: ImageItem = {
      id: tempId,
      url: URL.createObjectURL(file),
      status: "uploading",
      file,
      isCover: makeCover,
    };
    applyUpdate(onChange, [...images, placeholder]);

    // Show inline debug so user can see what's happening
    const dbg = document.getElementById("image-uploader-debug");
    if (dbg) {
      dbg.innerHTML = `<div class="text-amber-300">[ImageUploader] uploading ${file.name} (${file.size} bytes) to bucket=occaz kind=${storageKind}</div>`;
    }

    try {
      const { url } = await uploadPublicImage(file, storageKind);
      if (dbg) {
        dbg.innerHTML += `<div class="text-green-300">[ImageUploader] upload OK -> ${url}</div>`;
      }
      applyUpdate(onChange, (prev) =>
        prev.map((it) =>
          it.id === tempId ? { ...it, url, status: "ready" as const } : it,
        ),
      );
    } catch (e: any) {
      const msg = e?.message ?? "Upload failed";
      if (dbg) {
        dbg.innerHTML += `<div class="text-red-300">[ImageUploader] FAILED: ${msg}</div>`;
      }
      applyUpdate(onChange, (prev) =>
        prev.map((it) =>
          it.id === tempId
            ? { ...it, status: "failed" as const, error: msg }
            : it,
        ),
      );
      push("err", `Upload failed: ${msg}`);
    }
  }

  function addFiles(files: FileList | File[]) {
    const remaining = max - images.length;
    const arr = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    if (arr.length === 0) return;
    const makeCover = images.filter((i) => i.status === "ready").length === 0;
    arr.forEach((file, i) => {
      const id = crypto.randomUUID();
      void uploadOne(file, id, makeCover && i === 0);
    });
  }

  function remove(id: string) {
    applyUpdate(onChange, images.filter((i) => i.id !== id));
  }

  async function retry(id: string) {
    const item = images.find((i) => i.id === id);
    if (!item?.file) return;
    applyUpdate(
      onChange,
      images.map((i) =>
        i.id === id ? { ...i, status: "uploading" as const, error: undefined } : i,
      ),
    );
    try {
      const { url } = await uploadPublicImage(item.file, storageKind);
      applyUpdate(onChange, (prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, url, status: "ready" as const } : it,
        ),
      );
    } catch (e: any) {
      applyUpdate(onChange, (prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: "failed" as const, error: e?.message ?? "Upload failed" }
            : it,
        ),
      );
    }
  }

  function setCover(id: string) {
    applyUpdate(onChange, images.map((i) => ({ ...i, isCover: i.id === id })));
  }

  const readyCount = images.filter((i) => i.status === "ready").length;
  const uploadingCount = images.filter((i) => i.status === "uploading").length;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-tertiary)]">
          {label}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {readyCount} / {max}
          {uploadingCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-accent-400">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              {uploadingCount} uploading
            </span>
          )}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition",
          dragOver
            ? "border-accent-500 bg-accent-500/10"
            : "border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-1.5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-500/15 text-accent-400">
            <Upload className="h-4 w-4" />
          </div>
          <div className="text-sm font-medium text-[var(--text-primary)]">
            Drop images here or click to upload
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            PNG, JPG, WEBP up to 10MB · drag to reorder · first image is the cover
          </div>
        </div>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="mt-4">
          <Reorder.Group
            axis="y"
            values={images}
            onReorder={(next) => {
              const cover = images.find((i) => i.isCover && i.status === "ready");
              const ordered = next.map((i) => ({
                ...i,
                isCover: cover ? i.id === cover.id : i.id === next[0].id,
              }));
              applyUpdate(onChange, ordered);
            }}
            className="space-y-2"
          >
            {images.map((img, idx) => (
              <Reorder.Item
                key={img.id}
                value={img}
                className={clsx(
                  "flex items-center gap-3 rounded-xl p-2 ring-1",
                  img.status === "failed"
                    ? "bg-red-500/10 ring-red-500/30"
                    : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)]",
                )}
              >
                <button
                  type="button"
                  className="grid h-9 w-9 cursor-grab place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] active:cursor-grabbing"
                  aria-label="Drag to reorder"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-card)]">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt=""
                      className={clsx(
                        "h-full w-full object-cover",
                        img.status !== "ready" && "opacity-50",
                      )}
                    />
                  ) : null}
                  {img.status === "uploading" && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  {img.status === "failed" && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40">
                      <AlertCircle className="h-4 w-4 text-red-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm text-[var(--text-primary)]">
                    {img.file?.name || `Image ${idx + 1}`}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                    {img.status === "ready" && img.isCover && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-400 ring-1 ring-amber-500/30">
                        <Star className="h-3 w-3 fill-current" /> Cover
                      </span>
                    )}
                    {img.status === "ready" && !img.isCover && (
                      <button
                        type="button"
                        onClick={() => setCover(img.id)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      >
                        Set as cover
                      </button>
                    )}
                    {img.status === "uploading" && (
                      <span className="text-accent-400">Uploading…</span>
                    )}
                    {img.status === "failed" && (
                      <span className="text-red-400">
                        {img.error || "Upload failed"}{" "}
                        <button
                          type="button"
                          onClick={() => retry(img.id)}
                          className="ml-1 inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-white"
                        >
                          <RefreshCw className="h-3 w-3" /> retry
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  aria-label="Remove"
                  className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-red-500/15 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}
    </div>
  );
}
