import { AuthorizationError, requirePermission } from "@/server/auth";
import { MAX_UPLOAD_BYTES, UploadError, storeImage } from "@/server/storage";

// Yönetim paneli görsel yükleme: yetki → boyut → içerik türü (sharp ile gerçek içerik) kontrolü.
export async function POST(req: Request) {
  try {
    await requirePermission("content");
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return Response.json({ error: err.message }, { status: err.reason === "unauthenticated" ? 401 : 403 });
    }
    throw err;
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return Response.json({ error: "Dosya 10 MB sınırını aşıyor." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Geçersiz yükleme isteği." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Dosya seçin." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Dosya 10 MB sınırını aşıyor." }, { status: 413 });

  const folder = String(form.get("folder") ?? "img").replace(/[^a-z-]/g, "") || "img";
  const alt = String(form.get("alt") ?? "").slice(0, 200);

  try {
    const media = await storeImage(Buffer.from(await file.arrayBuffer()), { declaredType: file.type, alt, folder });
    return Response.json(
      { id: media.id, url: media.url, width: media.width, height: media.height },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof UploadError) return Response.json({ error: err.message }, { status: 422 });
    console.error("[yükleme]", err);
    return Response.json({ error: "Görsel kaydedilemedi." }, { status: 500 });
  }
}
