"use client";

import Image from "next/image";
import { useId, useState } from "react";

export type UploadedMedia = { id: string; url: string; width: number; height: number };

export async function uploadImage(file: File, folder = "img", alt = ""): Promise<UploadedMedia> {
  if (file.size > 10 * 1024 * 1024) throw new Error("Dosya 10 MB sınırını aşıyor.");
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
    throw new Error("Yalnızca JPEG, PNG, WebP veya AVIF yükleyebilirsiniz.");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  fd.append("alt", alt);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Yükleme başarısız.");
  return data as UploadedMedia;
}

/** Tek görsel alanı: yükler ve medya kimliğini gizli alanla forma ekler. */
export function ImageField({
  name,
  label,
  current,
  folder = "img",
  hint,
  minWidth,
  contain = false,
}: {
  name: string;
  label: string;
  current: { id: string; url: string; width: number; height: number } | null;
  folder?: string;
  hint?: string;
  minWidth?: number;
  contain?: boolean;
}) {
  const id = useId();
  const [media, setMedia] = useState(current);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <p className="field-label">{label}</p>
      <input type="hidden" name={name} value={media?.id ?? ""} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line sm:w-48 ${contain ? "studio-floor" : "bg-paper"}`}>
          {media ? (
            <Image src={media.url} alt="" fill sizes="192px" className={contain ? "object-contain p-2" : "object-cover"} />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted">Görsel yok</span>
          )}
        </div>
        <div className="grid gap-2 text-sm">
          <label htmlFor={id} className={`btn btn-outline btn-sm cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {busy ? "Yükleniyor…" : media ? "Değiştir" : "Görsel yükle"}
          </label>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setError("");
              try {
                setMedia(await uploadImage(file, folder));
              } catch (err) {
                setError(err instanceof Error ? err.message : "Yükleme başarısız.");
              } finally {
                setBusy(false);
              }
            }}
          />
          {media && (
            <button type="button" className="text-left text-xs font-bold text-[#b3261e] underline" onClick={() => setMedia(null)}>
              Görseli kaldır
            </button>
          )}
          {media && <p className="text-xs text-muted tabular-nums">{media.width}×{media.height} px</p>}
          {media && minWidth && media.width < minWidth && (
            <p className="text-xs font-semibold text-warning">
              Uyarı: genişlik {minWidth} px altında. Görsel büyütülmez; daha küçük gösterilir. Daha yüksek çözünürlük önerilir.
            </p>
          )}
          {hint && <p className="field-hint mt-0">{hint}</p>}
          {error && <p role="alert" className="field-error mt-0">{error}</p>}
          <p className="text-xs text-muted">Değişiklik “Kaydet” ile yayımlanır.</p>
        </div>
      </div>
    </div>
  );
}
