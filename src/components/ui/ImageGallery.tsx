import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import clsx from "clsx";

interface Props {
  images: string[];
  coverIndex?: number;
  title?: string;
}

export function ImageGallery({ images, coverIndex = 0, title = "" }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [cover, setCover] = useState(coverIndex);

  if (!images.length) return null;

  // Cover image first, others follow
  const ordered = [
    images[cover],
    ...images.filter((_, i) => i !== cover),
  ];

  const open = (i: number) => setLightbox(i);
  const close = () => setLightbox(null);
  const next = () =>
    setLightbox((i) => (i === null ? null : (i + 1) % ordered.length));
  const prev = () =>
    setLightbox((i) =>
      i === null ? null : (i - 1 + ordered.length) % ordered.length,
    );

  return (
    <div>
      {/* Hero cover */}
      <motion.div
        key={cover}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative aspect-[16/9] cursor-pointer overflow-hidden rounded-2xl ring-1 ring-[var(--border-subtle)]"
        onClick={() => open(0)}
      >
        <img
          src={ordered[0]}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
        />
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          Cover
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur">
            +{images.length - 1} more
          </div>
        )}
      </motion.div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === 0) {
                  open(0);
                } else {
                  setCover(i);
                }
              }}
              className={clsx(
                "relative aspect-[4/3] shrink-0 overflow-hidden rounded-xl ring-2 transition sm:aspect-[16/9]",
                i === cover
                  ? "ring-accent-500"
                  : "ring-[var(--border-subtle)] hover:ring-[var(--border-default)]",
              )}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
              {i === cover && (
                <div className="absolute right-1.5 top-1.5 rounded-full bg-accent-500 p-0.5">
                  <Star className="h-2.5 w-2.5 fill-white text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur"
            onClick={close}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={ordered[lightbox]}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur">
              {lightbox + 1} / {ordered.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
