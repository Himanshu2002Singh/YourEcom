import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ExternalLink, ImagePlus, LoaderCircle, Plus, Star, Trash2, X } from 'lucide-react';
import { BackLink, PageHeader, adminCard, adminMain, primaryButton, secondaryButton } from '@/components/AdminLayout';
import { Price } from '@/components/StoreShared';
import { TextField } from '@/components/TextField';
import { categories } from '@/data/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, type ApiError } from '@/lib/api';
import { perItemPrice } from '@/lib/pricing';
import type { Product } from '@/types/store';

type Notify = (message: string, options?: { error?: boolean }) => void;
type EditorProps = { products: Product[]; productSaved: (product: Product) => void; notify: Notify };
type Form = {
  name: string;
  category: string;
  family: string;
  variant: string;
  price: string;
  mrp: string;
  stock: string;
  unit: string;
  badge: string;
  description: string;
  photos: string[]; // main photo first
  features: string[];
  specs: [string, string][];
};

// The API's limits (backend/validators/admin.validator.js and utils/uploads.js).
const MAX_PHOTOS = 10;
const PHOTOS_PER_UPLOAD = 8;
const MAX_FEATURES = 8;
const MAX_SPECS = 20;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const LONGEST_EDGE = 1600; // px: plenty for the product page's zoom-free gallery

const blankForm: Form = { name: '', category: '', family: '', variant: '', price: '', mrp: '', stock: '', unit: '', badge: '', description: '', photos: [], features: [''], specs: [] };

const formFrom = (product: Product): Form => ({
  name: product.name,
  category: product.category,
  family: product.family ?? '',
  variant: product.variant ?? '',
  price: String(product.price),
  mrp: product.mrp === null ? '' : String(product.mrp),
  stock: String(product.stock),
  unit: product.unit,
  badge: product.badge ?? '',
  description: product.description,
  photos: [product.image, ...product.gallery],
  features: product.features.length ? product.features : [''],
  specs: product.specs,
});

// Phone photos are often several MB and 4000 px across, far more than the store shows. A photo up to 1600 px and
// 1 MB goes as it is; a bigger one is scaled down and sent as a JPEG (on white, for PNGs with see-through parts).
async function shrinkPhoto(file: File): Promise<{ blob: Blob; name: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONGEST_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1_000_000) {
    bitmap.close();
    return { blob: file, name: file.name };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('encode');
  return { blob, name: `${file.name.replace(/\.[^.]+$/, '')}.jpg` };
}

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white';

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={`${adminCard} p-4 sm:p-6`}>
      <h2 className="text-base font-semibold text-navy">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// The photos: the first is the main one, on cards and at the top of the product page. Drop files on the section or
// choose them; they're uploaded straight away, and saving the product keeps the ones still listed.
function Photos({ photos, setPhotos, notify }: { photos: string[]; setPhotos: (photos: string[]) => void; notify: Notify }) {
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const room = MAX_PHOTOS - photos.length;

  const upload = async (files: File[]): Promise<void> => {
    const chosen = files.filter((file: File) => PHOTO_TYPES.includes(file.type));
    if (chosen.length < files.length) notify('Only JPEG, PNG and WebP photos can be added.', { error: true });
    if (chosen.length > room) notify(`A product can have up to ${MAX_PHOTOS} photos, so only the first ${Math.max(room, 0)} were added.`, { error: true });
    const batch = chosen.slice(0, Math.max(room, 0));
    if (!batch.length) return;
    setUploading(batch.length);
    const added: string[] = [];
    try {
      for (let start = 0; start < batch.length; start += PHOTOS_PER_UPLOAD) {
        const form = new FormData();
        for (const file of batch.slice(start, start + PHOTOS_PER_UPLOAD)) {
          const { blob, name } = await shrinkPhoto(file).catch(() => {
            throw new Error(`${file.name} couldn’t be read. Try saving it as a JPEG.`);
          });
          form.append('photos', blob, name);
        }
        const { urls } = await api<{ urls: string[] }>('/admin/uploads', { method: 'POST', body: form });
        added.push(...urls);
      }
    } catch (error) {
      notify((error as ApiError | Error).message, { error: true });
    }
    if (added.length) setPhotos([...photos, ...added]);
    setUploading(0);
  };

  const choose = (event: ChangeEvent<HTMLInputElement>): void => {
    void upload([...(event.target.files ?? [])]);
    event.target.value = '';
  };

  const drop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    void upload([...event.dataTransfer.files]);
  };

  const move = (index: number): void => setPhotos([photos[index], ...photos.filter((_, other: number) => other !== index)]);
  const remove = (index: number): void => setPhotos(photos.filter((_, other: number) => other !== index));

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
      className={`grid grid-cols-2 gap-3 rounded-xl transition sm:grid-cols-4 lg:grid-cols-5 ${dragging ? 'bg-brand-soft ring-2 ring-brand ring-offset-4' : ''}`}
    >
      {photos.map((photo: string, index: number) => (
        <figure key={photo} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={photo} alt={index === 0 ? 'Main photo' : `Photo ${index + 1}`} className="h-full w-full object-contain p-1" />
          {index === 0 && <span className="absolute left-2 top-2 rounded bg-navy px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Main</span>}
          <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
            {index > 0 && (
              <button
                type="button"
                onClick={() => move(index)}
                aria-label={`Make photo ${index + 1} the main photo`}
                title="Make main photo"
                className="rounded-lg bg-white/95 p-1.5 text-navy shadow ring-1 ring-slate-200 transition hover:text-brand"
              >
                <Star size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Remove photo ${index + 1}`}
              title="Remove"
              className="rounded-lg bg-white/95 p-1.5 text-slate-500 shadow ring-1 ring-slate-200 transition hover:text-rose-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </figure>
      ))}
      {uploading > 0 && (
        <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand bg-brand-soft text-sm font-semibold text-brand">
          <LoaderCircle size={22} className="animate-spin" />
          Uploading {uploading}…
        </div>
      )}
      {room > 0 && uploading === 0 && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 text-center text-sm font-semibold text-slate-500 transition hover:border-brand hover:bg-brand-soft hover:text-brand"
        >
          <ImagePlus size={24} />
          Add photos
          <span className="text-xs font-normal">or drop them here</span>
        </button>
      )}
      <input ref={input} type="file" accept={PHOTO_TYPES.join(',')} multiple hidden onChange={choose} />
    </div>
  );
}

// A list of short lines (highlights) or of label and value pairs (specifications), with add and remove buttons.
function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="shrink-0 rounded-lg p-2.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
      <X size={16} />
    </button>
  );
}

function ProductEditor({ id, products, productSaved, notify }: EditorProps & { id?: string }) {
  const navigate = useNavigate();
  const existing = id ? products.find((product: Product) => String(product.id) === id) : undefined;
  const [form, setForm] = useState<Form>(existing ? formFrom(existing) : blankForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  usePageTitle(existing ? `${existing.name} · Admin` : id ? 'Product not found · Admin' : 'Add a product · Admin');

  if (id && !existing) {
    return (
      <main className={adminMain}>
        <PageHeader back={<BackLink to="/admin/products">Products</BackLink>} title="Product not found" description="It may have been a mistyped address." />
      </main>
    );
  }

  const set = <K extends keyof Form>(field: K, value: Form[K]): void => setForm((current: Form) => ({ ...current, [field]: value }));
  const edit =
    (field: 'name' | 'category' | 'family' | 'variant' | 'price' | 'mrp' | 'stock' | 'unit' | 'badge' | 'description') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void =>
      set(field, event.target.value);

  // Families already in the catalogue, and the specification names it uses, offered as suggestions.
  const families = [...new Set(products.flatMap((product: Product) => (product.family ? [product.family] : [])))].sort();
  const specLabels = [...new Set(products.flatMap((product: Product) => product.specs.map(([label]) => label)))].sort();
  const price = Number(form.price);
  const mrp = form.mrp.trim() ? Number(form.mrp) : null;

  const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, price, mrp, stock: Number(form.stock) };
      const { product } = existing
        ? await api<{ product: Product }>(`/admin/products/${existing.id}`, { method: 'PUT', body })
        : await api<{ product: Product }>('/admin/products', { method: 'POST', body });
      productSaved(product);
      setForm(formFrom(product));
      if (existing) {
        notify(`Saved ${product.name}`);
      } else {
        notify(`${product.name} is now in the store`);
        navigate(`/admin/products/${product.id}`, { replace: true });
      }
    } catch (failed) {
      setError((failed as ApiError).message);
    }
    setSaving(false);
  };

  return (
    <main className={adminMain}>
      <form onSubmit={(event) => void save(event)}>
        <PageHeader
          back={<BackLink to="/admin/products">Products</BackLink>}
          title={existing ? existing.name : 'Add a product'}
          description={existing ? `Product #${existing.id} · ${existing.category}` : 'It goes into the store as soon as you add it.'}
          actions={
            existing && (
              <Link to={`/product/${existing.id}`} target="_blank" className={secondaryButton}>
                <ExternalLink size={16} /> View in store
              </Link>
            )
          }
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Section title="Product">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField name="name" label="Name" required maxLength={200} value={form.name} onChange={edit('name')} wide placeholder="e.g. Disposable Syringe without Needle, 2 ml" />
                <div className="sm:col-span-2">
                  <label htmlFor="category" className="mb-2 block text-sm font-semibold text-navy">
                    Category
                  </label>
                  <select id="category" required value={form.category} onChange={edit('category')} className={fieldClass}>
                    <option value="" disabled>
                      Choose a category
                    </option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="mb-2 flex justify-between text-sm font-semibold text-navy">
                    Description <span className="font-normal text-slate-400">{form.description.length}/1000</span>
                  </label>
                  <textarea id="description" required maxLength={1000} rows={5} value={form.description} onChange={edit('description')} className={`${fieldClass} leading-6`} />
                </div>
              </div>
            </Section>

            <Section title="Photos" description={`The first is the main photo. Up to ${MAX_PHOTOS}; big photos are made smaller before they upload.`}>
              <Photos photos={form.photos} setPhotos={(photos: string[]) => set('photos', photos)} notify={notify} />
            </Section>

            <Section title="Highlights" description="Short selling points, shown beside the photos.">
              <div className="space-y-2">
                {form.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      aria-label={`Highlight ${index + 1}`}
                      value={feature}
                      maxLength={120}
                      placeholder="e.g. Sterile and individually packed"
                      onChange={(event) => set('features', form.features.map((line: string, other: number) => (other === index ? event.target.value : line)))}
                      className={fieldClass}
                    />
                    {form.features.length > 1 && (
                      <RemoveButton label={`Remove highlight ${index + 1}`} onClick={() => set('features', form.features.filter((_, other: number) => other !== index))} />
                    )}
                  </div>
                ))}
              </div>
              {form.features.length < MAX_FEATURES && (
                <button type="button" onClick={() => set('features', [...form.features, ''])} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                  <Plus size={15} /> Add highlight
                </button>
              )}
            </Section>

            <Section title="Specifications" description="The details table on the product page, such as Brand, Material or Sterile.">
              {form.specs.length > 0 && (
                <div className="space-y-2">
                  {form.specs.map(([label, value]: [string, string], index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        aria-label={`Specification ${index + 1} name`}
                        list="spec-labels"
                        value={label}
                        maxLength={60}
                        placeholder="Name"
                        onChange={(event) => set('specs', form.specs.map((row, other: number): [string, string] => (other === index ? [event.target.value, row[1]] : row)))}
                        className={`${fieldClass} sm:w-56 sm:flex-none`}
                      />
                      <input
                        aria-label={`Specification ${index + 1} value`}
                        value={value}
                        maxLength={200}
                        placeholder="Value"
                        onChange={(event) => set('specs', form.specs.map((row, other: number): [string, string] => (other === index ? [row[0], event.target.value] : row)))}
                        className={fieldClass}
                      />
                      <RemoveButton label={`Remove specification ${index + 1}`} onClick={() => set('specs', form.specs.filter((_, other: number) => other !== index))} />
                    </div>
                  ))}
                </div>
              )}
              <datalist id="spec-labels">
                {specLabels.map((label: string) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
              {form.specs.length < MAX_SPECS && (
                <button
                  type="button"
                  onClick={() => set('specs', [...form.specs, ['', '']])}
                  className={`${form.specs.length ? 'mt-3' : ''} inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline`}
                >
                  <Plus size={15} /> Add specification
                </button>
              )}
            </Section>
          </div>

          <div className="space-y-5">
            <Section title="Price and stock">
              <div className="grid grid-cols-2 gap-4">
                <TextField name="price" label="Price (₹)" required type="number" inputMode="numeric" min={1} step={1} value={form.price} onChange={edit('price')} />
                <TextField name="mrp" label="MRP (₹)" type="number" inputMode="numeric" min={1} step={1} value={form.mrp} onChange={edit('mrp')} hint="Empty if none" />
                <TextField
                  name="unit"
                  label="Pack"
                  required
                  maxLength={60}
                  value={form.unit}
                  onChange={edit('unit')}
                  placeholder="Box of 100"
                  hint={(price > 0 && perItemPrice({ price, unit: form.unit })) || undefined}
                />
                <TextField name="stock" label="Stock" required type="number" inputMode="numeric" min={0} step={1} value={form.stock} onChange={edit('stock')} hint="Packs in hand" />
                <div className="col-span-2">
                  <TextField name="badge" label="Badge" maxLength={40} value={form.badge} onChange={edit('badge')} placeholder="e.g. Bestseller" hint="Optional, shown on the photo" />
                </div>
              </div>
              {price > 0 && (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In the store</p>
                  <Price product={{ price, mrp: mrp !== null && mrp > price ? mrp : null }} className="mt-1" />
                </div>
              )}
            </Section>

            <Section title="Sizes" description="For one of several sizes shown together, like a 2 ml and a 5 ml syringe. Leave both empty for a single product.">
              <div className="space-y-4">
                <TextField name="family" label="Size range" list="families" maxLength={120} value={form.family} onChange={edit('family')} placeholder="e.g. Syringe without Needle" />
                <datalist id="families">
                  {families.map((family: string) => (
                    <option key={family} value={family} />
                  ))}
                </datalist>
                <TextField name="variant" label="This size" maxLength={40} value={form.variant} onChange={edit('variant')} placeholder="e.g. 2 ml" />
              </div>
            </Section>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:shadow-lg">
          {error && (
            <p role="alert" className="mb-2 text-sm font-semibold text-rose-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to="/admin/products" className={secondaryButton}>
              Cancel
            </Link>
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {existing ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

// /admin/products/new and /admin/products/:id. A different product starts a fresh form.
export function AdminProductEditor(props: EditorProps) {
  const { id } = useParams();
  return <ProductEditor key={id ?? 'new'} id={id} {...props} />;
}
