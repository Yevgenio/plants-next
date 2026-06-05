'use client';

import { useEffect, useRef } from 'react';
import { resolveImageUrl } from '@/config/config';
import Image from 'next/image';
import { Product } from '@/types/Product';
import Link from 'next/link';

interface Props {
  products: Product[];
}

const BASE_SPEED      = 0.04;
const MAX_BOOST       = 2.5;
const SCROLL_GAIN     = 0.025;
const MAX_DELTA       = 30;
const TARGET_DECAY    = 0.90;
const LERP_RATE       = 0.10;
const CARD_HEIGHT     = 220;
const REFERENCE_WIDTH = 1200;

function cardWidth(product: Product): number {
  const img = product.images[0];
  const ratio = (img?.width ?? 1) / (img?.height ?? 1);
  return Math.round(CARD_HEIGHT * ratio);
}

export default function ProductMarquee({ products }: Props) {
  const trackRef     = useRef<HTMLDivElement>(null);
  const outerRef     = useRef<HTMLDivElement>(null);
  const offsetRef    = useRef(0);
  const boostRef     = useRef(0);
  const targetRef    = useRef(0);
  const lastScrollY  = useRef(0);
  const speedScale   = useRef(1);
  const isDragging   = useRef(false);
  const dragLastX    = useRef(0);
  const dragLastTime = useRef(0);
  const dragVelocity = useRef(0);
  const didDrag      = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const outer = outerRef.current;
    if (!track || !outer) return;

    const updateScale = () => {
      speedScale.current = Math.min(window.innerWidth / REFERENCE_WIDTH, 1);
    };
    updateScale();
    window.addEventListener('resize', updateScale);

    const handleScroll = () => {
      if (isDragging.current) return;
      const dy = window.scrollY - lastScrollY.current;
      lastScrollY.current = window.scrollY;
      const scale = speedScale.current;
      const clamped = Math.sign(dy) * Math.min(Math.abs(dy), MAX_DELTA);
      const maxBoost = MAX_BOOST * scale;
      targetRef.current = Math.max(-maxBoost, Math.min(targetRef.current + clamped * SCROLL_GAIN * scale, maxBoost));
    };

    const half = (track.firstElementChild as HTMLElement)?.offsetWidth ?? track.scrollWidth / 2;

    let rafId: number;
    let lastTs = performance.now();

    const animate = (ts: number) => {
      const delta = Math.min(ts - lastTs, 50);
      lastTs = ts;
      const t = delta / 16.67;
      targetRef.current *= Math.pow(TARGET_DECAY, t);
      boostRef.current += (targetRef.current - boostRef.current) * (1 - Math.pow(1 - LERP_RATE, t));

      if (!isDragging.current) {
        offsetRef.current += (BASE_SPEED * speedScale.current + boostRef.current) * delta;
      }
      if (offsetRef.current >= half) offsetRef.current -= half;
      if (offsetRef.current < 0) offsetRef.current += half;

      track.style.transform = `translateX(-${offsetRef.current}px)`;
      rafId = requestAnimationFrame(animate);
    };

    // ── Shared drag helpers ───────────────────────────────────────────────
    const startDrag = (x: number) => {
      isDragging.current = true;
      didDrag.current = false;
      dragLastX.current = x;
      dragLastTime.current = performance.now();
      dragVelocity.current = 0;
      targetRef.current = 0;
      boostRef.current = 0;
    };

    const moveDrag = (x: number) => {
      const dx = x - dragLastX.current;
      const now = performance.now();
      const dt = now - dragLastTime.current;
      if (dt > 0) dragVelocity.current = -dx / dt; // positive = forward (left)
      if (Math.abs(dx) > 2) didDrag.current = true;
      offsetRef.current -= dx;
      if (offsetRef.current >= half) offsetRef.current -= half;
      if (offsetRef.current < 0) offsetRef.current += half;
      dragLastX.current = x;
      dragLastTime.current = now;
    };

    const endDrag = () => {
      isDragging.current = false;
      lastScrollY.current = window.scrollY; // prevent stale-delta spike on next scroll
      const maxBoost = MAX_BOOST * speedScale.current;
      targetRef.current = Math.max(-maxBoost, Math.min(dragVelocity.current, maxBoost));
    };

    // ── Touch ─────────────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) startDrag(e.touches[0].clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current && e.touches.length === 1) moveDrag(e.touches[0].clientX);
    };
    const onTouchEnd = () => endDrag();

    // ── Mouse ─────────────────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      startDrag(e.clientX);
      outer.style.cursor = 'grabbing';

      const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX);
      const onMouseUp = () => {
        endDrag();
        outer.style.cursor = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    // Block Link navigation after a mouse drag
    const onClickCapture = (e: MouseEvent) => {
      if (didDrag.current) {
        e.preventDefault();
        e.stopPropagation();
        didDrag.current = false;
      }
    };

    outer.addEventListener('touchstart', onTouchStart, { passive: true });
    outer.addEventListener('touchmove',  onTouchMove,  { passive: true });
    outer.addEventListener('touchend',   onTouchEnd);
    outer.addEventListener('mousedown',  onMouseDown);
    outer.addEventListener('click',      onClickCapture, { capture: true });
    window.addEventListener('scroll',    handleScroll, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll',  handleScroll);
      window.removeEventListener('resize',  updateScale);
      cancelAnimationFrame(rafId);
      outer.removeEventListener('touchstart', onTouchStart);
      outer.removeEventListener('touchmove',  onTouchMove);
      outer.removeEventListener('touchend',   onTouchEnd);
      outer.removeEventListener('mousedown',  onMouseDown);
      outer.removeEventListener('click',      onClickCapture, { capture: true });
    };
  }, [products]);

  if (!products.length) return null;

  const applyBoost = (dir: 'left' | 'right') => {
    const maxBoost = MAX_BOOST * speedScale.current;
    targetRef.current = dir === 'right' ? maxBoost : -maxBoost;
  };

  return (
    <section className="w-full py-14">
      <div className="text-center mb-8 px-6">
        <h2 className="text-3xl font-serif text-stone-800">Our Collection</h2>
        <div className="h-px bg-stone-200 mt-4 max-w-[80px] mx-auto" />
      </div>
      <div ref={outerRef} className="relative overflow-hidden py-6 cursor-grab select-none">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 md:w-16 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-10 md:w-16 z-10 bg-gradient-to-l from-white to-transparent" />

        <button
          onClick={() => applyBoost('left')}
          aria-label="Scroll left"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9
            bg-white/90 border border-stone-200 shadow-md rounded-full
            flex items-center justify-center text-stone-500 hover:text-stone-900
            transition-colors duration-200"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div ref={trackRef} className="flex will-change-transform">
          {[0, 1].map(copy => (
            <div key={copy} className="flex gap-5 pr-5 flex-shrink-0 items-end">
              {products.map((product, idx) => {
                const w = cardWidth(product);
                return (
                  <Link
                    key={idx}
                    href={`/gallery/${product._id}`}
                    draggable={false}
                    style={{ width: `min(${w}px, calc(100vw - 6rem))`, height: CARD_HEIGHT, flexShrink: 0 }}
                    className="group transition-[transform,margin] duration-500 hover:scale-[1.12] hover:mx-5 hover:z-10 relative"
                  >
                    <div
                      style={{ width: '100%', height: CARD_HEIGHT }}
                      className="rounded-lg overflow-hidden bg-stone-100 shadow-sm group-hover:shadow-xl transition-shadow duration-500"
                    >
                      <Image
                        src={resolveImageUrl(product.images[0]?.thumbnail ?? 'default.jpg')}
                        alt={product.name}
                        width={product.images[0]?.width || 400}
                        height={product.images[0]?.height || 400}
                        draggable={false}
                        className="w-full h-full object-cover group-hover:brightness-110 transition-[filter] duration-500"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <button
          onClick={() => applyBoost('right')}
          aria-label="Scroll right"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9
            bg-white/90 border border-stone-200 shadow-md rounded-full
            flex items-center justify-center text-stone-500 hover:text-stone-900
            transition-colors duration-200"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

      </div>
    </section>
  );
}
