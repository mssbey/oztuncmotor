import "dotenv/config";
import { stat } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import sharp from "sharp";

// Registers the project asset in the media library so it remains editable in admin.
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const path = "public/images/hero-cinematic.webp";
    const [file, image] = await Promise.all([stat(path), sharp(path).metadata()]);
    const data = {
      url: "/images/hero-cinematic.webp",
      mime: "image/webp",
      size: file.size,
      width: image.width!,
      height: image.height!,
      alt: "Sisli dağlar ve gün batımı önünde siyah motosiklet",
      isDemo: false,
    };
    await db.$transaction(async (tx) => {
      const media = await tx.media.upsert({
        where: { key: "site/hero-cinematic.webp" },
        create: { key: "site/hero-cinematic.webp", ...data },
        update: data,
      });
      await tx.siteSettings.upsert({
        where: { id: 1 },
        create: { id: 1, heroImageId: media.id },
        update: { heroImageId: media.id },
      });
    });
    console.log("Cinematic hero installed: /images/hero-cinematic.webp");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
