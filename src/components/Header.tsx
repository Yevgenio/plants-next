'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useArtist } from '@/context/ArtistContext';
import { FiMenu, FiX, FiChevronDown, FiUser } from 'react-icons/fi';
import API_URL, { resolveImageUrl } from '@/config/config';

const ARTIST_URLS: Record<string, string> = {
  elena: 'https://elena.boukingolts.art',
  alexey: 'https://alexey.boukingolts.art',
  archive: 'https://archive.boukingolts.art',
  staging: 'https://staging.boukingolts.art',
};

const ARTIST_LABELS: Record<string, string> = {
  elena: 'Elena Boukingolts',
  alexey: 'Alexey Boukingolts',
  archive: 'Archive',
  all: 'Boukingolts',
};

function TestingIcon({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-stone-500">
        <path d="M9 3h6M8.5 3v5.5L4 19h16L15.5 8.5V3" />
        <line x1="6.5" y1="14" x2="17.5" y2="14" />
      </svg>
    </div>
  );
}

function ArchiveIcon({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-stone-500">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    </div>
  );
}

function ArtistAvatar({ url, label, size }: { url?: string; label: string; size: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={label} style={{ width: size, height: size }} className="rounded-full object-cover flex-shrink-0 bg-stone-100" />
    );
  }
  const initials = label.split(' ').map(w => w[0]).join('').slice(0, 2);
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
      <span className="text-stone-600 font-medium" style={{ fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
}

function NavDropdown({
  label,
  href,
  active,
  items,
}: {
  label: string;
  href: string;
  active: boolean;
  items: { label: string; href: string }[];
}) {
  const hasItems = items.length > 0;
  return (
    <div className="relative group">
      <Link
        href={href}
        className={`flex items-center gap-0.5 text-sm tracking-wide transition-colors ${
          active ? 'text-stone-900 font-medium' : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        {label}
        {hasItems && (
          <FiChevronDown className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180 ml-0.5" />
        )}
      </Link>
      {hasItems && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50">
          <div className="bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden min-w-[160px] max-w-[220px]">
            {items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors truncate ${
                  i === 0 ? 'text-stone-500 border-b border-stone-100' : 'text-stone-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const artist = useArtist();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const [galleryCategories, setGalleryCategories] = useState<string[]>([]);
  const [eventCategories, setEventCategories] = useState<string[]>([]);
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  const artistQs = artist !== 'all' ? `?artist=${artist}` : '';

  useEffect(() => {
    fetch(`${API_URL}/products/categories${artistQs}`)
      .then(r => r.ok ? r.json() : []).then(setGalleryCategories).catch(() => {});
    fetch(`${API_URL}/events/categories${artistQs}`)
      .then(r => r.ok ? r.json() : []).then(setEventCategories).catch(() => {});
  }, [artist]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/content/about-boukingolts?artist=elena`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_URL}/content/about-boukingolts?artist=alexey`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([elena, alexey]) => {
      const imgs: Record<string, string> = {};
      if (elena?.images?.[0]) imgs.elena = resolveImageUrl(elena.images[0].url);
      if (alexey?.images?.[0]) imgs.alexey = resolveImageUrl(alexey.images[0].url);
      setArtistImages(imgs);
    });
  }, []);

  useEffect(() => {
    if (mobileOpen) { setOffset(0); return; }
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 0) { setOffset(0); lastScrollY.current = 0; return; }
      const delta = currentY - lastScrollY.current;
      const height = headerRef.current?.offsetHeight ?? 64;
      setOffset(prev => Math.min(0, Math.max(-height, prev - delta)));
      lastScrollY.current = currentY;
    };
    const handleScrollEnd = () => {
      const height = headerRef.current?.offsetHeight ?? 64;
      setSnapping(true);
      if (window.scrollY <= 0) { setOffset(0); }
      else { setOffset(prev => (prev < -height / 2 ? -height : 0)); }
      setTimeout(() => setSnapping(false), 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scrollend', handleScrollEnd, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [mobileOpen]);

  useEffect(() => { setMobileOpen(false); setMobileExpanded(null); }, [pathname]);

  const handleLogout = () => { logout(); router.push('/login'); };

  const brandLabel = ARTIST_LABELS[artist] ?? 'Boukingolts';
  const namedArtists = (['elena', 'alexey'] as const);
  const otherNamedArtists = namedArtists.filter(a => a !== artist);
  const hasDropdown = otherNamedArtists.length > 0 || isAdmin;

  const galleryDropdownItems = [
    { label: 'All works', href: '/gallery' },
    ...galleryCategories.map(cat => ({ label: cat, href: `/gallery?category=${encodeURIComponent(cat)}` })),
  ];
  const eventsDropdownItems = [
    { label: 'All events', href: '/events' },
    ...eventCategories.map(cat => ({ label: cat, href: `/events?category=${encodeURIComponent(cat)}` })),
  ];

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 bg-white border-b border-stone-200 ${snapping ? 'transition-transform duration-300' : ''}`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

        {/* Brand with artist switcher */}
        <div className="relative group flex-shrink-0">
          <Link
            href="/home"
            className="flex items-center gap-1 font-serif text-xl text-stone-900 tracking-tight hover:text-stone-600 transition-colors"
          >
            {brandLabel}
            {hasDropdown && (
              <FiChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 mt-0.5 text-stone-400" />
            )}
          </Link>

          {hasDropdown && (
            <div className="absolute top-full left-0 pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50">
              <div className="bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden min-w-[220px]">

                {/* Current artist (on a named subdomain) */}
                {(artist === 'elena' || artist === 'alexey') && (
                  <div className="flex items-center gap-3 px-3 py-2.5 border-b border-stone-100 bg-stone-50">
                    <ArtistAvatar url={artistImages[artist]} label={ARTIST_LABELS[artist]} size={32} />
                    <span className="flex-1 text-sm font-medium text-stone-900">{ARTIST_LABELS[artist]}</span>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="text-stone-600 flex-shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}

                {/* Other named artists */}
                {otherNamedArtists.map(a => (
                  <a
                    key={a}
                    href={ARTIST_URLS[a]}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors"
                  >
                    <ArtistAvatar url={artistImages[a]} label={ARTIST_LABELS[a]} size={32} />
                    <span className="text-sm text-stone-700">{ARTIST_LABELS[a]}</span>
                  </a>
                ))}

                {/* Admin-only entries */}
                {isAdmin && (
                  <>
                    <a
                      href={ARTIST_URLS.archive}
                      className={`flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors ${otherNamedArtists.length > 0 ? 'border-t border-stone-100' : ''}`}
                    >
                      <ArchiveIcon size={32} />
                      <span className="text-sm text-stone-500">Archive</span>
                    </a>
                    <a
                      href={ARTIST_URLS.staging}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors"
                    >
                      <TestingIcon size={32} />
                      <span className="text-sm text-stone-500">Testing</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop nav — centred */}
        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          <Link
            href="/home"
            className={`text-sm tracking-wide transition-colors ${
              pathname.startsWith('/home') ? 'text-stone-900 font-medium' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Home
          </Link>
          <NavDropdown label="Gallery" href="/gallery" active={pathname.startsWith('/gallery')} items={galleryDropdownItems} />
          <NavDropdown label="Events" href="/events" active={pathname.startsWith('/events')} items={eventsDropdownItems} />
          <Link
            href="/about"
            className={`text-sm tracking-wide transition-colors ${
              pathname.startsWith('/about') ? 'text-stone-900 font-medium' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            About
          </Link>
        </nav>

        {/* Right: admin + account */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">
          {isAdmin && (
            <Link href="/admin" className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors">
              Admin
            </Link>
          )}
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors" aria-label="Account menu">
              <FiUser className="w-4 h-4" />
              <FiChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute right-0 top-full pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50">
              <div className="w-44 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
                {isLoggedIn ? (
                  <>
                    <Link href="/settings" className="block px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors">Profile</Link>
                    <div className="h-px bg-stone-100" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-stone-500 hover:bg-stone-50 transition-colors">Log out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors">Log in</Link>
                    <div className="h-px bg-stone-100" />
                    <Link href="/signup" className="block px-4 py-3 text-sm text-stone-500 hover:bg-stone-50 transition-colors">Sign up</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-stone-600 hover:text-stone-900 transition-colors" onClick={() => setMobileOpen(p => !p)} aria-label="Toggle menu">
          {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">

            {/* Artist switcher for mobile */}
            {hasDropdown && (
              <div className="pb-3 mb-1 border-b border-stone-100">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">Browse</p>
                {otherNamedArtists.map(a => (
                  <a key={a} href={ARTIST_URLS[a]} className="flex items-center gap-2.5 py-2 text-sm text-stone-600 hover:text-stone-900">
                    <ArtistAvatar url={artistImages[a]} label={ARTIST_LABELS[a]} size={28} />
                    {ARTIST_LABELS[a]}
                  </a>
                ))}
                {isAdmin && (
                  <>
                    <a href={ARTIST_URLS.archive} className="flex items-center gap-2.5 py-2 text-sm text-stone-500 hover:text-stone-900">
                      <ArchiveIcon size={28} />
                      Archive
                    </a>
                    <a href={ARTIST_URLS.staging} className="flex items-center gap-2.5 py-2 text-sm text-stone-500 hover:text-stone-900">
                      <TestingIcon size={28} />
                      Testing
                    </a>
                  </>
                )}
              </div>
            )}

            <Link href="/home" className={`block py-3 text-sm border-b border-stone-50 transition-colors ${pathname.startsWith('/home') ? 'text-stone-900 font-medium' : 'text-stone-600'}`}>
              Home
            </Link>

            {/* Gallery accordion */}
            <div>
              <div className="flex items-center justify-between py-3 border-b border-stone-50">
                <Link href="/gallery" className={`text-sm ${pathname.startsWith('/gallery') ? 'text-stone-900 font-medium' : 'text-stone-600'}`}>Gallery</Link>
                {galleryCategories.length > 0 && (
                  <button onClick={() => setMobileExpanded(v => v === 'gallery' ? null : 'gallery')} className="p-1 text-stone-400" aria-label="Expand gallery categories">
                    <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === 'gallery' ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {mobileExpanded === 'gallery' && (
                <div className="pl-4 pb-1 pt-1">
                  {galleryCategories.map(cat => (
                    <Link key={cat} href={`/gallery?category=${encodeURIComponent(cat)}`} className="block py-2 text-xs text-stone-500 hover:text-stone-800 transition-colors">{cat}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Events accordion */}
            <div>
              <div className="flex items-center justify-between py-3 border-b border-stone-50">
                <Link href="/events" className={`text-sm ${pathname.startsWith('/events') ? 'text-stone-900 font-medium' : 'text-stone-600'}`}>Events</Link>
                {eventCategories.length > 0 && (
                  <button onClick={() => setMobileExpanded(v => v === 'events' ? null : 'events')} className="p-1 text-stone-400" aria-label="Expand event categories">
                    <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === 'events' ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {mobileExpanded === 'events' && (
                <div className="pl-4 pb-1 pt-1">
                  {eventCategories.map(cat => (
                    <Link key={cat} href={`/events?category=${encodeURIComponent(cat)}`} className="block py-2 text-xs text-stone-500 hover:text-stone-800 transition-colors">{cat}</Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/about" className={`block py-3 text-sm border-b border-stone-50 transition-colors ${pathname.startsWith('/about') ? 'text-stone-900 font-medium' : 'text-stone-600'}`}>
              About
            </Link>

            <div className="pt-2 space-y-1">
              {isLoggedIn ? (
                <>
                  <Link href="/settings" className="block py-3 text-sm text-stone-600">Profile</Link>
                  <button onClick={handleLogout} className="block py-3 text-sm text-stone-600 w-full text-left">Log out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block py-3 text-sm text-stone-600">Log in</Link>
                  <Link href="/signup" className="block py-3 text-sm text-stone-600">Sign up</Link>
                </>
              )}
              {isAdmin && <Link href="/admin" className="block py-3 text-xs uppercase tracking-widest text-stone-400">Admin</Link>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
