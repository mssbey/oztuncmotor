"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { SPEC_FIELDS } from "@/lib/specs";
import {
  ActionError,
  bool,
  optDecimal,
  optInt,
  optStr,
  run,
  slugify,
  str,
  type ActionState,
} from "@/server/admin-action";
import { requirePermission } from "@/server/auth";
import { deleteMedia } from "@/server/storage";

function uniqueError(err: unknown, field: string, message: string): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new ActionError(message, { [field]: message });
  }
  throw err;
}

// ─── Markalar ────────────────────────────────────────────────────────

export async function saveBrand(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    const id = str(fd, "id");
    const name = str(fd, "name");
    if (name.length < 2) throw new ActionError("Marka adı gerekli.", { name: "Marka adını girin." });
    const data = {
      name,
      slug: slugify(str(fd, "slug") || name),
      sortOrder: optInt(fd, "sortOrder", "Sıra", 0, 9999) ?? 0,
      authorizedDealer: bool(fd, "authorizedDealer"),
      authorizedService: bool(fd, "authorizedService"),
    };
    try {
      if (id) await db.brand.update({ where: { id }, data });
      else await db.brand.create({ data });
    } catch (err) {
      uniqueError(err, "name", "Bu marka adı veya kısa adı zaten var.");
    }
    return id ? "Marka güncellendi." : "Marka eklendi.";
  });
}

export async function deleteBrand(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    const id = str(fd, "id");
    const count = await db.motorcycle.count({ where: { brandId: id } });
    if (count > 0) throw new ActionError(`Bu markaya bağlı ${count} motosiklet var; önce onları silin veya taşıyın.`);
    await db.brand.delete({ where: { id } });
    return "Marka silindi.";
  });
}

// ─── Kategoriler ─────────────────────────────────────────────────────

export async function saveCategory(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    const id = str(fd, "id");
    const name = str(fd, "name");
    if (name.length < 2) throw new ActionError("Kategori adı gerekli.", { name: "Kategori adını girin." });
    const data = {
      name,
      slug: slugify(str(fd, "slug") || name),
      description: str(fd, "description").slice(0, 300),
      sortOrder: optInt(fd, "sortOrder", "Sıra", 0, 9999) ?? 0,
      published: bool(fd, "published"),
      imageId: optStr(fd, "imageId"),
      isDemo: false,
    };
    try {
      if (id) await db.category.update({ where: { id }, data });
      else await db.category.create({ data });
    } catch (err) {
      uniqueError(err, "name", "Bu kategori adı veya kısa adı zaten var.");
    }
    return id ? "Kategori güncellendi." : "Kategori eklendi.";
  });
}

export async function deleteCategory(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    await db.category.delete({ where: { id: str(fd, "id") } }); // ürünlerin kategorisi boşa düşer
    return "Kategori silindi.";
  });
}

// ─── Servis hizmetleri ───────────────────────────────────────────────

export async function saveService(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    const id = str(fd, "id");
    const title = str(fd, "title");
    if (title.length < 2) throw new ActionError("Hizmet adı gerekli.", { title: "Hizmet adını girin." });
    const data = {
      title,
      slug: slugify(str(fd, "slug") || title),
      description: str(fd, "description").slice(0, 400),
      sortOrder: optInt(fd, "sortOrder", "Sıra", 0, 9999) ?? 0,
      published: bool(fd, "published"),
      bookable: bool(fd, "bookable"),
      isDemo: false,
    };
    try {
      if (id) await db.serviceItem.update({ where: { id }, data });
      else await db.serviceItem.create({ data });
    } catch (err) {
      uniqueError(err, "title", "Bu hizmet zaten var.");
    }
    return id ? "Hizmet güncellendi." : "Hizmet eklendi.";
  });
}

export async function deleteService(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    await db.serviceItem.delete({ where: { id: str(fd, "id") } }); // geçmiş randevularda ad kopyası korunur
    return "Hizmet silindi.";
  });
}

// ─── Motosikletler ───────────────────────────────────────────────────

function parseExtraSpecs(fd: FormData) {
  const labels = fd.getAll("extraLabel").map(String);
  const values = fd.getAll("extraValue").map(String);
  return labels
    .map((label, i) => ({ label: label.trim().slice(0, 60), value: (values[i] ?? "").trim().slice(0, 120) }))
    .filter((s) => s.label && s.value)
    .slice(0, 30);
}

function parseColors(fd: FormData) {
  const names = fd.getAll("colorName").map(String);
  const hexes = fd.getAll("colorHex").map(String);
  return names
    .map((name, i) => ({ name: name.trim().slice(0, 40), hex: (hexes[i] ?? "").trim(), sortOrder: i }))
    .filter((c) => c.name)
    .map((c) => {
      if (!/^#[0-9a-fA-F]{6}$/.test(c.hex)) throw new ActionError(`“${c.name}” rengi için #RRGGBB biçiminde kod girin.`);
      return c;
    });
}

export async function saveMotorcycle(_p: ActionState, fd: FormData): Promise<ActionState> {
  let newId: string | null = null;
  const result = await run("content", async () => {
    const id = str(fd, "id");
    const model = str(fd, "model");
    const brandId = str(fd, "brandId");
    const errors: Record<string, string> = {};
    if (!model) errors.model = "Model adını girin.";
    if (!brandId) errors.brandId = "Marka seçin.";
    if (Object.keys(errors).length) throw new ActionError("Lütfen işaretli alanları kontrol edin.", errors);

    const brand = await db.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new ActionError("Marka bulunamadı.", { brandId: "Marka seçin." });
    const powertrain = str(fd, "powertrain") === "ELECTRIC" ? "ELECTRIC" : "ICE";
    const stock = str(fd, "stockStatus");

    const specs: Record<string, unknown> = {};
    for (const f of SPEC_FIELDS) {
      // Güç aktarımına uymayan alanlar temizlenir (ör. elektrikli modelde motor hacmi)
      if (f.only && f.only !== powertrain) {
        specs[f.key] = null;
        continue;
      }
      specs[f.key] =
        f.kind === "int"
          ? optInt(fd, f.key, f.label, 0, 100_000)
          : f.kind === "decimal"
            ? optDecimal(fd, f.key, f.label)
            : optStr(fd, f.key)?.slice(0, 120) ?? null;
    }

    const data = {
      model: model.slice(0, 80),
      brandId,
      categoryId: optStr(fd, "categoryId"),
      modelYear: optInt(fd, "modelYear", "Model yılı", 1950, 2100),
      powertrain: powertrain as "ICE" | "ELECTRIC",
      priceTL: optInt(fd, "priceTL", "Fiyat", 0, 100_000_000),
      stockStatus: (["IN_STOCK", "ON_ORDER", "SOLD_OUT"].includes(stock) ? stock : "ON_ORDER") as "IN_STOCK" | "ON_ORDER" | "SOLD_OUT",
      summary: str(fd, "summary").slice(0, 220),
      description: str(fd, "description").slice(0, 6000),
      featured: bool(fd, "featured"),
      published: bool(fd, "published"),
      sortOrder: optInt(fd, "sortOrder", "Sıra", 0, 9999) ?? 0,
      seoTitle: optStr(fd, "seoTitle")?.slice(0, 70) ?? null,
      seoDescription: optStr(fd, "seoDescription")?.slice(0, 170) ?? null,
      extraSpecs: parseExtraSpecs(fd),
      ...specs,
    };
    const colors = parseColors(fd);
    const slug = slugify(str(fd, "slug") || `${brand.name.replace(/\(demo\)/i, "")} ${model}`);
    if (!slug) throw new ActionError("Geçerli bir bağlantı adı girin.", { slug: "Geçerli bir kısa ad girin." });

    try {
      if (id) {
        await db.$transaction([
          db.motorcycle.update({ where: { id }, data: { ...data, slug } }),
          db.motorcycleColor.deleteMany({ where: { motorcycleId: id } }),
          db.motorcycleColor.createMany({ data: colors.map((c) => ({ ...c, motorcycleId: id })) }),
        ]);
        return "Motosiklet kaydedildi.";
      }
      const created = await db.motorcycle.create({ data: { ...data, slug, colors: { create: colors } } });
      newId = created.id;
    } catch (err) {
      uniqueError(err, "slug", "Bu bağlantı adı başka bir modelde kullanılıyor.");
    }
  });
  if (result.ok && newId) redirect(`/admin/motosikletler/${newId}?yeni=1`);
  return result;
}

export async function deleteMotorcycle(_p: ActionState, fd: FormData): Promise<ActionState> {
  const result = await run("content", async () => {
    const id = str(fd, "id");
    const images = await db.motorcycleImage.findMany({ where: { motorcycleId: id }, select: { mediaId: true } });
    await db.motorcycle.delete({ where: { id } });
    for (const img of images) await deleteMedia(img.mediaId).catch(() => {});
    return "Motosiklet silindi.";
  });
  if (result.ok && str(fd, "redirect")) redirect("/admin/motosikletler");
  return result;
}

export async function toggleMotorcycleFlag(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    const id = str(fd, "id");
    const flag = str(fd, "flag");
    if (flag !== "published" && flag !== "featured") throw new ActionError("Geçersiz işlem.");
    const m = await db.motorcycle.findUniqueOrThrow({ where: { id } });
    await db.motorcycle.update({ where: { id }, data: { [flag]: !m[flag] } });
  });
}

// ─── Ürün görselleri ─────────────────────────────────────────────────

export async function addMotorcycleImage(motorcycleId: string, mediaId: string) {
  await requirePermission("content");
  const last = await db.motorcycleImage.findFirst({ where: { motorcycleId }, orderBy: { sortOrder: "desc" } });
  await db.motorcycleImage.create({ data: { motorcycleId, mediaId, sortOrder: (last?.sortOrder ?? -1) + 1 } });
}

export async function moveMotorcycleImage(imageId: string, direction: -1 | 1) {
  await requirePermission("content");
  const img = await db.motorcycleImage.findUniqueOrThrow({ where: { id: imageId } });
  const all = await db.motorcycleImage.findMany({ where: { motorcycleId: img.motorcycleId }, orderBy: { sortOrder: "asc" } });
  const index = all.findIndex((i) => i.id === imageId);
  const target = index + direction;
  if (target < 0 || target >= all.length) return;
  [all[index], all[target]] = [all[target], all[index]];
  await db.$transaction(all.map((i, n) => db.motorcycleImage.update({ where: { id: i.id }, data: { sortOrder: n } })));
}

export async function updateMotorcycleImageAlt(imageId: string, alt: string) {
  await requirePermission("content");
  await db.motorcycleImage.update({ where: { id: imageId }, data: { alt: alt.trim().slice(0, 200) } });
}

export async function removeMotorcycleImage(imageId: string) {
  await requirePermission("content");
  const img = await db.motorcycleImage.findUniqueOrThrow({ where: { id: imageId } });
  await db.motorcycleImage.delete({ where: { id: imageId } });
  const stillUsed = await db.motorcycleImage.count({ where: { mediaId: img.mediaId } });
  if (!stillUsed) await deleteMedia(img.mediaId).catch(() => {});
}

export async function deleteAllDemoContent(_p: ActionState, _fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    const media = await db.media.findMany({ where: { isDemo: true }, select: { id: true } });
    await db.motorcycle.deleteMany({ where: { isDemo: true } });
    await db.category.deleteMany({ where: { isDemo: true, motorcycles: { none: {} } } });
    await db.brand.deleteMany({ where: { isDemo: true, motorcycles: { none: {} } } });
    await db.serviceItem.updateMany({ where: { isDemo: true }, data: { isDemo: false, published: false } });
    for (const m of media) await deleteMedia(m.id).catch(() => {});
    return "Demo içerik silindi. Hizmetler taslağa alındı; gerçekte verilenleri yeniden yayımlayın.";
  });
}
