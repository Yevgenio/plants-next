'use client';

import Image from 'next/image';
import { resolveImageUrl } from '@/config/config';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Image as ImageType } from '@/types/Image';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Props {
  images: ImageType[];
  name: string;
}

const ZOOM = 2.5;
const SWIPE_THRESHOLD = 40;

export default function ProductImageViewer({ images, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const lightboxSwipeRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  // ── Desktop: hover zoom ──────────────────────────────────────────────────
  const applyTransform = useCallback((scale: number, tx = 0, ty = 0, animated = false) => {
    if (!lensRef.current) return;
    lensRef.current.style.transition = animated ? 'transform 0.2s ease-out' : 'none';
    lensRef.current.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
  }, []);

  // Reset zoom when switching images
  useEffect(() => {
    applyTransform(1, 0, 0, false);
  }, [activeIndex, applyTransform]);

  const handleMouseEnter = useCallback(() => applyTransform(ZOOM, 0, 0, true), [applyTransform]);
  const handleMouseLeave = useCallback(() => applyTransform(1, 0, 0, true), [applyTransform]);
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    applyTransform(ZOOM, (0.5 - x) * 100, (0.5 - y) * 100, false);
  }, [applyTransform]);

  // ── Mobile: swipe to navigate, tap to open lightbox ─────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1)
      swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    else
      swipeRef.current = null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeRef.current) return;
    const dx = e.changedTouches[0].clientX - swipeRef.current.x;
    const dy = e.changedTouches[0].clientY - swipeRef.current.y;
    swipeRef.current = null;

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      setActiveIndex(i => dx < 0
        ? Math.min(i + 1, images.length - 1)
        : Math.max(i - 1, 0));
    } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      e.preventDefault();
      setLightboxOpen(true);
    }
  };

  // ── Lightbox: swipe to navigate (pinch-zoom handled natively by browser) ─
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1)
      lightboxSwipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    else
      lightboxSwipeRef.current = null; // pinch — disable swipe detection
  };

  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    if (!lightboxSwipeRef.current) return;
    const dx = e.changedTouches[0].clientX - lightboxSwipeRef.current.x;
    const dy = e.changedTouches[0].clientY - lightboxSwipeRef.current.y;
    lightboxSwipeRef.current = null;

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      setActiveIndex(i => dx < 0
        ? Math.min(i + 1, images.length - 1)
        : Math.max(i - 1, 0));
    }
  };

  const prev = () => setActiveIndex(i => Math.max(i - 1, 0));
  const next = () => setActiveIndex(i => Math.min(i + 1, images.length - 1));

  if (!images.length) {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-stone-100 shadow-sm relative" style={{ aspectRatio: '1 / 1' }}>
        <Image src={resolveImageUrl('default.jpg')} alt={name} fill className="object-contain" />
      </div>
    );
  }

  const activeImg = images[activeIndex];
  const aspectRatio = activeImg?.width && activeImg?.height
    ? `${activeImg.width} / ${activeImg.height}`
    : '1 / 1';

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image — height tracks image aspect ratio so wide images don't overflow */}
        <div
          ref={containerRef}
          style={{ aspectRatio }}
          className="w-full rounded-xl overflow-hidden relative bg-stone-100 shadow-sm cursor-crosshair"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div ref={lensRef} className="absolute inset-0" style={{ willChange: 'transform' }}>
            <Image
              src={resolveImageUrl(images[activeIndex].url)}
              alt={name}
              fill
              className="object-contain"
            />
          </div>

          {/* Dot indicators — mobile only */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-white shadow-sm' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-1">
            {images.map((img, index) => (
              <button
                key={img._id}
                onClick={() => setActiveIndex(index)}
                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                  index === activeIndex
                    ? 'ring-2 ring-stone-800'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <Image
                  src={resolveImageUrl(img.thumbnail)}
                  alt={`View ${index + 1}`}
                  width={72}
                  height={72}
                  className="w-16 h-16 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-10 text-white/50 text-sm tabular-nums">
              {activeIndex + 1} / {images.length}
            </div>
          )}

          {/* Image — touch-action: pinch-zoom lets browser handle native pinch */}
          <div className="absolute inset-0" style={{ touchAction: 'pinch-zoom' }}>
            <Image
              src={resolveImageUrl(images[activeIndex].url)}
              alt={name}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {/* Prev */}
          {activeIndex > 0 && (
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous image"
            >
              <FiChevronLeft size={22} />
            </button>
          )}

          {/* Next */}
          {activeIndex < images.length - 1 && (
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next image"
            >
              <FiChevronRight size={22} />
            </button>
          )}

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
