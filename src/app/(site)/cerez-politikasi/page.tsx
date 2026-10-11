import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/PolicyPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Çerez Politikası",
  description: "Öztunc Motor web sitesinde kullanılan çerezler ve tarayıcı depolaması hakkında bilgi.",
  path: "/cerez-politikasi",
});

export default function Page() {
  return <PolicyPage pageKey="cerez" />;
}
