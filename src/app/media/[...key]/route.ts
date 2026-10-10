import { readLocalObject } from "@/server/storage";

// Yerel depolama sürücüsündeki görselleri sunar. Anahtarlar rastgele ve değişmez olduğu için
// uzun süreli önbellek kullanılır. S3 sürücüsünde görseller doğrudan bucket adresinden sunulur.
export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const data = await readLocalObject(key.join("/"));
  if (!data) return new Response("Bulunamadı", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
