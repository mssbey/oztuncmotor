"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import {
  addMotorcycleImage,
  moveMotorcycleImage,
  removeMotorcycleImage,
  updateMotorcycleImageAlt,
} from "@/app/admin/actions/catalog";
import { uploadImage } from "./ImageField";

type Img = { id: string; url: string; alt: string; width: number; height: number };

/** Ürün fotoğrafları: çoklu yükleme, sıralama, alternatif metin ve silme. */
export function MotorcycleImages({ motorcycleId, images }: { motorcycleId: string; images: Img[] }) {
  const router = useRouter();
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const act = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setError("");
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "İşlem başarısız.");
      }
    });

  async function onFiles(files: FileList) {
    setError("");
    const list = Array.from(files).slice(0, 12);
    for (const [i, file] of list.entries()) {
      setProgress(`${i + 1}/${list.length} yükleniyor…`);
      try {
        const media = await uploadImage(file, "urun");
        await addMotorcycleImage(motorcycleId, media.id);
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : "yüklenemedi"}`);
      }
    }
    setProgress("");
    router.refresh();
  }

  return (
    <section className="card p-5 sm:p-6" aria-busy={pending || Boolean(progress)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">Fotoğraflar</h2>
          <p className="mt-1 text-sm text-muted">
            İlk fotoğraf kartlarda kullanılır. Düz zeminli, motosikletin tamamını gösteren, en az 1600 px genişliğinde fotoğraflar önerilir.
            JPEG, PNG, WebP veya AVIF; en fazla 10 MB.
          </p>
        </div>
        <label htmlFor={inputId} className={`btn btn-primary btn-sm cursor-pointer ${progress ? "pointer-events-none opacity-60" : ""}`}>
          {progress || "Fotoğraf yükle"}
        </label>
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {images.length === 0 ? (
        <p className="mt-4 rounded-lg bg-paper p-6 text-center text-sm text-muted">Henüz fotoğraf yok. Sitede yer tutucu gösterilir.</p>
      ) : (
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.id} className="rounded-lg border border-line p-3">
              <div className="studio-floor relative aspect-[4/3] overflow-hidden rounded">
                <Image src={img.url} alt="" fill sizes="300px" className="object-contain p-2" />
                {i === 0 && <span className="absolute left-2 top-2 rounded bg-ink px-2 py-0.5 text-xs font-bold text-white">Kapak</span>}
              </div>
              <p className="mt-1 text-xs text-muted tabular-nums">
                {img.width}×{img.height} px{img.width < 1200 && " · düşük çözünürlük"}
              </p>
              <label className="sr-only" htmlFor={`alt-${img.id}`}>
                Fotoğraf {i + 1} açıklaması
              </label>
              <input
                id={`alt-${img.id}`}
                defaultValue={img.alt}
                placeholder="Açıklama (ör. kırmızı, sağ yan)"
                className="input mt-2 min-h-9 py-1.5 text-sm"
                onBlur={(e) => {
                  if (e.target.value !== img.alt) act(() => updateMotorcycleImageAlt(img.id, e.target.value));
                }}
              />
              <div className="mt-2 flex gap-1.5">
                <button type="button" className="btn btn-outline btn-sm flex-1" disabled={i === 0 || pending} onClick={() => act(() => moveMotorcycleImage(img.id, -1))} aria-label={`Fotoğraf ${i + 1}: öne al`}>
                  ←
                </button>
                <button type="button" className="btn btn-outline btn-sm flex-1" disabled={i === images.length - 1 || pending} onClick={() => act(() => moveMotorcycleImage(img.id, 1))} aria-label={`Fotoğraf ${i + 1}: geri al`}>
                  →
                </button>
                <button
                  type="button"
                  className="btn btn-sm flex-1 border-[#f3c4c0] text-[#b3261e] hover:bg-[#fdecea]"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm("Fotoğraf silinsin mi?")) act(() => removeMotorcycleImage(img.id));
                  }}
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
