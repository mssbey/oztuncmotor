import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/PolicyPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Gizlilik Politikası",
  description: "Öztunç Motor web sitesinde bilgilerinizin nasıl kullanıldığını açıklayan gizlilik politikası.",
  path: "/gizlilik",
});

export default function Page() {
  return <PolicyPage pageKey="gizlilik" />;
}
