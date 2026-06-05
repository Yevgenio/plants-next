'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { Product } from '@/types/Product';
import { resolveImageUrl } from '@/config/config';

const CARD_HEIGHT = 200;

function cardWidth(product: Product): number {
  const img = product.images[0];
  const ratio = (img?.width ?? 1) / (img?.height ?? 1);
  // Min 120px so portrait-heavy cards still have readable title text
  return Math.max(Math.round(CARD_HEIGHT * ratio), 120);
}

export default function RelatedProductsRow({ title, products, href }: { title: string; products: Product[]; href?: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const didDrag = useRef(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    // ── Mouse drag ────────────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const startX = e.clientX;
      const startScroll = el.scrollLeft;
      didDrag.current = false;
      el.style.cursor = 'grabbing';

      const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 2) didDrag.current = true;
        el.scrollLeft = startScroll - dx;
      };
      const onMouseUp = () => {
        el.style.cursor = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (didDrag.current) {
        e.preventDefault();
        e.stopPropagation();
        didDrag.current = false;
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('click', onClickCapture, { capture: true });

    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('click', onClickCapture, { capture: true });
    };
  }, [products]);

  if (!products.length) return null;

  const scroll = (dir: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth : el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div>
      <h3 className="text-xl font-serif text-stone-800 mb-5 truncate">{title}</h3>
      <div className="relative">

        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          style={{ top: CARD_HEIGHT / 2 }}
          className={`absolute left-0 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9
            bg-white border border-stone-200 shadow-md rounded-full
            flex items-center justify-center text-stone-500 hover:text-stone-900
            transition-all duration-200 ${canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto pb-1 items-start cursor-grab select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingRight: '2.5rem' }}
        >
          {products.map(p => {
            const w = cardWidth(p);
            return (
              <Link key={p._id} href={`/gallery/${p._id}`} draggable={false} style={{ width: `min(${w}px, 100%)`, flexShrink: 0 }} className="group">
                <div
                  style={{ width: '100%', height: CARD_HEIGHT }}
                  className="rounded-xl overflow-hidden bg-stone-100 shadow-sm group-hover:shadow-lg transition-shadow duration-300 mb-2.5"
                >
                  <Image
                    src={resolveImageUrl(p.images[0]?.thumbnail ?? 'default.jpg')}
                    alt={p.name}
                    width={p.images[0]?.width || 400}
                    height={p.images[0]?.height || 400}
                    draggable={false}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="text-sm text-stone-800 font-medium leading-snug line-clamp-2 group-hover:text-stone-600 transition-colors">
                  {p.name}
                </p>
                {p.series && (
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{p.series}</p>
                )}
              </Link>
            );
          })}
          {href && (
            <Link
              href={href}
              style={{ width: 120, flexShrink: 0 }}
              className="group flex flex-col items-center justify-center"
            >
              <div
                style={{ width: 120, height: CARD_HEIGHT }}
                className="rounded-xl border border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-2 group-hover:bg-stone-100 group-hover:border-stone-300 transition-colors duration-200 mb-2.5"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="text-stone-400 group-hover:text-stone-700 transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-xs text-stone-400 group-hover:text-stone-700 tracking-wide transition-colors">See all</span>
              </div>
            </Link>
          )}
        </div>

        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          style={{ top: CARD_HEIGHT / 2 }}
          className={`absolute right-0 -translate-y-1/2 translate-x-4 z-10 w-9 h-9
            bg-white border border-stone-200 shadow-md rounded-full
            flex items-center justify-center text-stone-500 hover:text-stone-900
            transition-all duration-200 ${canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

      </div>
    </div>
  );
}
