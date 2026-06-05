import Link from 'next/link';
import API_URL from '@/config/config';
import ProductPageAdminControls from '@/components/gallery/ProductPageAdminControls';
import ProductImageViewer from '@/components/gallery/ProductImageViewer';
import RelatedProductsRow from '@/components/gallery/RelatedProductsRow';
import { Product } from '@/types/Product';
import { AboutContent } from '@/types/HomeContent';

function formatDims(product: Product): string | null {
  const d = product.dimensions;
  if (!d || d.length < 2) return null;
  const unit = product.dimensionUnit ?? 'cm';
  return d.length >= 3 ? `${d[0]} × ${d[1]} × ${d[2]} ${unit}` : `${d[0]} × ${d[1]} ${unit}`;
}

async function fetchRelated(params: Record<string, string>, limit = 16): Promise<Product[]> {
  const qs = new URLSearchParams({ ...params, limit: String(limit) }).toString();
  try {
    const res = await fetch(`${API_URL}/products/search?${qs}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch { return []; }
}

export default async function GalleryItemPage({ params }: { params: { id: string } }) {
  const [res, aboutRes] = await Promise.all([
    fetch(`${API_URL}/products/id/${params.id}`, { cache: 'no-store' }),
    fetch(`${API_URL}/content/about-boukingolts`, { cache: 'no-store' }),
  ]);

  if (!res.ok) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-stone-400 italic text-lg">Artwork not found.</p>
        <Link href="/gallery" className="text-sm text-stone-500 hover:text-stone-700 underline mt-4 inline-block">
          ← Back to gallery
        </Link>
      </div>
    );
  }

  const product: Product = await res.json();
  const about: AboutContent | null = aboutRes.ok ? await aboutRes.json() : null;
  const dims = formatDims(product);
  const cleanSpecs = product.specs?.filter(s => s.key && s.value) ?? [];

  const [seriesProducts, categoryProducts, recentProducts] = await Promise.all([
    product.series
      ? fetchRelated({ series: product.series, exclude: product._id })
      : Promise.resolve([] as Product[]),
    product.category
      ? fetchRelated({ category: product.category, exclude: product._id })
      : Promise.resolve([] as Product[]),
    fetchRelated({ sort: 'recent', exclude: product._id }, 10),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      <Link href="/gallery" className="text-sm text-stone-400 hover:text-stone-600 hover:underline mb-8 block">
        ← Gallery
      </Link>

      <div className="grid md:grid-cols-2 gap-12 items-start">

        <ProductImageViewer images={product.images ?? []} name={product.name} />

        <div className="flex flex-col gap-5 pt-2">

          <div>
            <h1 className="text-4xl font-serif text-stone-900 leading-tight">{product.name}</h1>
            <div className="h-px bg-stone-200 mt-5" />
          </div>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5">
            {product.category && (
              <Link
                href={`/gallery?category=${encodeURIComponent(product.category)}`}
                className="text-xs text-stone-400 uppercase tracking-widest hover:text-stone-700 transition-colors"
              >
                {product.category}
              </Link>
            )}
            {!!product.year && (
              <span className="text-xs text-stone-400">{product.year}</span>
            )}
            {product.series && (
              <Link
                href={`/gallery?series=${encodeURIComponent(product.series)}`}
                className="text-xs text-stone-500 hover:text-stone-800 transition-colors underline underline-offset-2"
              >
                {product.series}
              </Link>
            )}
            {product.forSale && (
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-stone-800 text-white px-2.5 py-1 rounded-full">
                Available
              </span>
            )}
          </div>

          <ProductPageAdminControls productId={params.id} />

          {(product.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags!.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/gallery?tag=${encodeURIComponent(tag)}`}
                  className="border border-stone-300 text-stone-600 text-xs px-3 py-1 rounded-full hover:border-stone-500 hover:text-stone-900 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {dims && <p className="text-sm text-stone-600 tracking-wide">{dims}</p>}

          {product.description && (
            <div
              className="prose prose-sm prose-stone max-w-none text-stone-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description.replace(/&nbsp;/g, ' ') }}
            />
          )}

          {cleanSpecs.length > 0 && (
            <div className="border-t border-stone-100 pt-4">
              <table className="w-full text-sm">
                <tbody>
                  {cleanSpecs.map((s, i) => (
                    <tr key={i} className="border-b border-stone-100 last:border-0">
                      <td className="py-2 pr-6 text-stone-400 text-xs uppercase tracking-wide w-2/5">{s.key}</td>
                      <td className="py-2 text-stone-700 text-sm">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {product.price != null && product.price > 0 && (
            <div className="pt-2 border-t border-stone-100">
              {product.salePercent ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-medium text-stone-900">
                    ₪{(product.price * (1 - product.salePercent / 100)).toFixed(0)}
                  </span>
                  <span className="text-sm text-stone-400 line-through">₪{product.price}</span>
                  <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    {product.salePercent}% off
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-medium text-stone-900">₪{product.price}</span>
              )}
            </div>
          )}

          {product.forSale && (
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">Interested in this piece?</p>
              <div className="flex flex-wrap gap-2">
                {about?.email && (
                  <a
                    href={`mailto:${about.email}?subject=${encodeURIComponent(`Inquiry about "${product.name}"`)}`}
                    className="inline-flex items-center gap-2 bg-stone-800 text-white text-sm font-medium tracking-wide px-4 py-2.5 rounded-xl hover:bg-stone-700 transition-colors"
                  >
                    Email us
                  </a>
                )}
                {about?.phone && (
                  <a
                    href={`tel:${about.phone}`}
                    className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 text-sm font-medium tracking-wide px-4 py-2.5 rounded-xl hover:border-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Call / WhatsApp
                  </a>
                )}
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors pt-0.5"
                >
                  See it in person at our next event →
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>

      {(seriesProducts.length > 0 || categoryProducts.length > 0 || recentProducts.length > 0) && (
        <div className="mt-20 space-y-14 border-t border-stone-100 pt-14">
          {seriesProducts.length > 0 && (
            <RelatedProductsRow
              title={`More from the ${product.series} collection`}
              products={seriesProducts}
              href={`/gallery?series=${encodeURIComponent(product.series!)}`}
            />
          )}
          {categoryProducts.length > 0 && (
            <RelatedProductsRow
              title={`More ${product.category} artworks`}
              products={categoryProducts}
              href={`/gallery?category=${encodeURIComponent(product.category!)}`}
            />
          )}
          {recentProducts.length > 0 && (
            <RelatedProductsRow
              title="More Art"
              products={recentProducts}
              href="/gallery"
            />
          )}
        </div>
      )}

    </div>
  );
}
