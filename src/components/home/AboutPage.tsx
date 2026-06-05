import Image from 'next/image';
import Link from 'next/link';
import { resolveImageUrl } from '@/config/config';
import { LocationIcon, CallIcon, EmailIcon, WhatsappIcon, InstagramIcon } from '@/components/icons';
import { AboutContent } from '@/types/HomeContent';

export default function AboutPage({ content }: { content: AboutContent }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex flex-col md:flex-row gap-14 items-start">

        {content.images?.[0] && (
          <div className="flex-shrink-0 w-full md:w-72">
            <Image
              src={resolveImageUrl(content.images[0].url)}
              alt={content.name}
              width={576}
              height={576}
              className="rounded-2xl w-full object-cover shadow-md"
            />
          </div>
        )}

        <div className="flex-1 space-y-6 pt-1">
          <div>
            <h1 className="text-4xl font-serif text-stone-900">{content.name}</h1>
            {content.address && (
              <p className="flex items-center gap-2 text-stone-400 text-sm mt-2">
                <LocationIcon className="w-4 h-4 flex-shrink-0" />
                {content.address}
              </p>
            )}
          </div>

          {content.comment && (
            <div
              className="prose prose-stone max-w-none text-stone-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content.comment.replace(/&nbsp;/g, ' ') }}
            />
          )}

          <div className="border-t border-stone-100 pt-6">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">Get in touch</p>
            <div className="flex flex-wrap gap-3">
              {content.phone && (
                <a
                  href={`tel:${content.phone}`}
                  className="inline-flex items-center gap-3 bg-stone-900 text-white px-5 py-3 rounded-xl hover:bg-stone-700 transition-colors"
                >
                  <CallIcon className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 leading-none mb-0.5">Call</p>
                    <p className="text-sm font-medium tracking-wide">{content.phone}</p>
                  </div>
                </a>
              )}
              {content.whatsapp && (
                <a
                  href={`https://wa.me/${content.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 px-5 py-3 rounded-xl hover:border-stone-500 hover:text-stone-900 transition-colors text-sm font-medium"
                >
                  <WhatsappIcon className="w-5 h-5" />
                  WhatsApp
                </a>
              )}
              {content.email && (
                <a
                  href={`mailto:${content.email}`}
                  className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 px-5 py-3 rounded-xl hover:border-stone-500 hover:text-stone-900 transition-colors text-sm font-medium"
                >
                  <EmailIcon className="w-5 h-5" />
                  Email
                </a>
              )}
              {content.instagram && (
                <a
                  href={content.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 px-5 py-3 rounded-xl hover:border-stone-500 hover:text-stone-900 transition-colors text-sm font-medium"
                >
                  <InstagramIcon className="w-5 h-5" />
                  Instagram
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-6 pt-2 border-t border-stone-100">
            <Link href="/gallery" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
              View Gallery →
            </Link>
            <Link href="/events" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
              Upcoming Events →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
