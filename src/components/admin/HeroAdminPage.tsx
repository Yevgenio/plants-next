'use client';
import { useEffect, useState, useRef } from 'react';
import API_URL from '@/config/config';
import { useAuth } from '@/context/AuthContext';
import { HeroContent } from '@/types/HomeContent';
import { Image } from '@/types/Image';
import ImageUploadList, { ImageItem } from '@/components/common/ImageUploadList';
import RichTextEditor from '@/components/common/RichTextEditor';
import { useRouter } from 'next/navigation';
import HeroSection from '@/components/home/HeroSection';

const REAL_W = 900;

const INPUT = 'border border-stone-300 rounded-lg w-full px-3 py-2.5 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-stone-200 text-stone-800';
const LABEL = 'block text-sm font-medium text-stone-700';

function parseTint(tint: string): { color: string; opacity: number } {
  if (!tint) return { color: '#000000', opacity: 0 };
  const match = tint.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    const hex = '#' + [match[1], match[2], match[3]]
      .map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    return { color: hex, opacity: Math.round((parseFloat(match[4] ?? '1')) * 100) };
  }
  if (tint.startsWith('#')) return { color: tint, opacity: 100 };
  return { color: '#000000', opacity: 40 };
}

function buildTint(color: string, opacity: number): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}

function getTintStyle(tint: string): React.CSSProperties {
  if (!tint) return {};
  if (tint.startsWith('#') || tint.startsWith('rgb')) return { backgroundColor: tint };
  return {};
}



export default function HeroAdminPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<HeroContent | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(450);
  const [previewImages, setPreviewImages] = useState<Image[]>([]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPreviewW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const blobUrls: string[] = [];
    const next: Image[] = images.map((img, i) => {
      const url = img.isNew && img.file ? (blobUrls.push(URL.createObjectURL(img.file)), blobUrls[blobUrls.length - 1]) : (img.url ?? '');
      return { _id: `preview-${i}`, url, thumbnail: url };
    });
    setPreviewImages(next);
    return () => { blobUrls.forEach(u => URL.revokeObjectURL(u)); };
  }, [images]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`${API_URL}/content/home-hero`)
      .then(res => res.json())
      .then(data => {
        setForm(data);
        if (Array.isArray(data.images))
          setImages(data.images.map((img: Image) => ({ url: img.url, id: img._id, isNew: false })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAdmin]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('enabled', String(form.enabled));
    formData.append('order', String(form.order));
    formData.append('title', form.title);
    formData.append('paragraph', form.paragraph);
    formData.append('tint', form.tint);
    if (images.length) {
      formData.append('sortedImages', JSON.stringify(
        images.map(img => img.isNew && img.file ? { new: true, filename: img.file.name } : { new: false, id: img.id })
      ));
      images.filter(img => img.isNew && img.file).forEach(img => formData.append('images', img.file as File));
    }
    try {
      const res = await fetch(`${API_URL}/content/home-hero`, { method: 'PUT', credentials: 'include', body: formData });
      if (res.ok) showToast('Hero section saved!', true);
      else showToast('Failed to save', false);
    } catch { showToast('Failed to save', false); }
    finally { setSaving(false); }
  };

  if (!isAdmin) return <div className="p-4">Unauthorized</div>;
  if (loading || !form) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/admin')} className="text-sm text-stone-400 hover:text-stone-600 hover:underline mb-4 block">← Back to Admin</button>
        <h1 className="text-2xl font-serif text-stone-800 mb-1">Edit Hero Section</h1>
        <div className="h-px bg-stone-200 mb-6" />


        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="accent-stone-800 w-4 h-4" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
              <span className="text-sm font-medium text-stone-700">Section enabled</span>
            </label>

            <div>
              <label className={LABEL}>Background images</label>
              <p className="text-xs text-stone-400 mt-0.5 mb-2">Multiple images will cycle automatically every 5 seconds.</p>
              <ImageUploadList images={images} setImages={setImages} />
            </div>

            <div>
              <label className={LABEL}>Title</label>
              <p className="text-xs text-stone-400 mt-0.5 mb-2">Supports bold, italic, colour, and other formatting.</p>
              <div className="[&_.ql-editor]:min-h-[72px]">
                <RichTextEditor value={form.title} onChange={v => setForm({ ...form, title: v })} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Paragraph</label>
              <p className="text-xs text-stone-400 mt-0.5 mb-2">Supports bold, italic, colour, and other formatting.</p>
              <RichTextEditor value={form.paragraph} onChange={v => setForm({ ...form, paragraph: v })} />
            </div>

            <div>
              <label className={LABEL}>Image overlay</label>
              <p className="text-xs text-stone-400 mt-0.5 mb-3">Darken the image so the text is easier to read.</p>
              {(() => {
                const { color, opacity } = parseTint(form.tint);
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                return (
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-stone-400">Colour</span>
                      <input
                        type="color"
                        value={color}
                        onChange={e => setForm({ ...form, tint: buildTint(e.target.value, opacity) })}
                        className="w-11 h-9 rounded cursor-pointer border border-stone-200 p-0.5 bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                        <span>Darkness</span>
                        <span>{opacity}%</span>
                      </div>
                      <div className="relative flex items-center">
                        <div
                          className="absolute inset-0 rounded-full h-2 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ background: `linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},0.9))` }}
                        />
                        <input
                          type="range"
                          min={0}
                          max={90}
                          value={opacity}
                          onChange={e => setForm({ ...form, tint: buildTint(color, parseInt(e.target.value)) })}
                          className="w-full relative"
                          style={{ accentColor: color }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-stone-300 mt-1">
                        <span>None</span>
                        <span>Very dark</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className={LABEL}>Display order</label>
              <p className="text-xs text-stone-400 mt-0.5">Lower numbers appear higher on the home page.</p>
              <input type="number" className={INPUT} value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) })} />
            </div>

            <button className="bg-stone-800 hover:bg-stone-700 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {toast && (
              <p className={`text-sm text-center ${toast.ok ? 'text-green-700' : 'text-red-600'}`}>{toast.msg}</p>
            )}
          </div>

          {/* Preview */}
          <div ref={previewRef} className="lg:sticky lg:top-4">
            <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3">Live Preview — {Math.round(previewW / REAL_W * 100)}% scale</p>
            <div className="rounded-xl overflow-hidden border border-stone-200" style={{ height: 320 }}>
              <div style={{ width: REAL_W, transformOrigin: 'top left', transform: `scale(${previewW / REAL_W})`, pointerEvents: 'none' }}>
                <HeroSection content={{ ...form, images: previewImages }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
