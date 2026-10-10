import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { randomToken } from "./security";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MIN_DIMENSION = 400;
const MAX_DIMENSION = 2560;

export class UploadError extends Error {}

type Driver = "local" | "s3";

function driver(): Driver {
  const d = (process.env.STORAGE_DRIVER ?? "local") as Driver;
  if (d === "local" && process.env.NODE_ENV === "production" && process.env.VERCEL) {
    // Sunucusuz ortamda dosya sistemi kalıcı değildir.
    throw new UploadError("Üretimde kalıcı depolama için STORAGE_DRIVER=s3 ayarlayın.");
  }
  return d === "s3" ? "s3" : "local";
}

export function uploadDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads");
}

let s3: S3Client | null = null;
function s3Client(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return s3;
}

/** Yüklenen görseli doğrular, EXIF yönünü düzeltir, büyütmeden küçültür ve WebP'ye çevirir. */
export async function processImage(input: Buffer, declaredType?: string) {
  if (input.byteLength === 0) throw new UploadError("Dosya boş.");
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("Dosya 10 MB sınırını aşıyor.");
  if (declaredType && !ALLOWED_MIME.has(declaredType)) {
    throw new UploadError("Yalnızca JPEG, PNG, WebP veya AVIF görseller yüklenebilir.");
  }
  let meta: SharpMetadata;
  try {
    meta = await sharp(input).metadata(); // dosya uzantısına değil, gerçek içeriğe bakılır
  } catch {
    throw new UploadError("Dosya okunabilir bir görsel değil.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new UploadError("Yalnızca JPEG, PNG, WebP veya AVIF görseller yüklenebilir.");
  }
  const w = meta.autoOrient?.width ?? meta.width ?? 0;
  const h = meta.autoOrient?.height ?? meta.height ?? 0;
  if (Math.min(w, h) < MIN_DIMENSION) {
    throw new UploadError(`Görsel çok küçük (${w}×${h}). En az ${MIN_DIMENSION} px olmalı.`);
  }
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height, mime: "image/webp" };
}

async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  if (driver() === "s3") {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${(process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "")}/${key}`;
  }
  const file = path.join(uploadDir(), key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return `/media/${key}`;
}

async function deleteObject(key: string) {
  if (driver() === "s3") {
    await s3Client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return;
  }
  await unlink(path.join(uploadDir(), key)).catch(() => {});
}

/** Yerel sürücü için dosya okuma (yalnızca /media rotası kullanır). */
export async function readLocalObject(key: string): Promise<Buffer | null> {
  if (!/^[a-z0-9/_-]+\.webp$/i.test(key) || key.includes("..")) return null;
  try {
    return await readFile(path.join(uploadDir(), key));
  } catch {
    return null;
  }
}

export async function storeImage(
  input: Buffer,
  opts: { declaredType?: string; alt?: string; isDemo?: boolean; folder?: string } = {},
) {
  const image = await processImage(input, opts.declaredType);
  const month = new Date().toISOString().slice(0, 7).replace("-", "/");
  const key = `${opts.folder ?? "img"}/${month}/${randomToken(12).toLowerCase().replace(/[^a-z0-9]/g, "")}.webp`;
  const url = await putObject(key, image.buffer, image.mime);
  return db.media.create({
    data: {
      key,
      url,
      mime: image.mime,
      size: image.buffer.byteLength,
      width: image.width,
      height: image.height,
      alt: opts.alt ?? "",
      isDemo: opts.isDemo ?? false,
    },
  });
}

export async function deleteMedia(id: string) {
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return;
  await db.media.delete({ where: { id } });
  await deleteObject(media.key);
}
