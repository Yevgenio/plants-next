import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import API_URL from '@/config/config';
import { AboutContent } from '@/types/HomeContent';
import AboutPage from '@/components/home/AboutPage';

export const metadata: Metadata = {
  title: 'About the Artist',
  description: 'Learn about the artist, their background, and how to get in touch.',
  openGraph: { title: 'About the Artist' },
};

export default async function Page() {
  const h = await headers();
  const artist = h.get('x-artist') || 'all';
  const contentArtist = artist === 'all' ? 'alexey' : artist;

  let about: AboutContent | null = null;
  try {
    const res = await fetch(`${API_URL}/content/about-boukingolts?artist=${contentArtist}`, { cache: 'no-store' });
    if (res.ok) about = await res.json();
  } catch { /* fallthrough */ }

  if (!about) notFound();

  return (
    <main>
      <AboutPage content={about} />
    </main>
  );
}
