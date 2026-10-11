import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/PolicyPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "KVKK Aydınlatma Metni",
  description: "6698 sayılı KVKK kapsamında Öztunc Motor web sitesi formlarında işlenen kişisel veriler hakkında aydınlatma metni.",
  path: "/kvkk",
});

export default function Page() {
  return <PolicyPage pageKey="kvkk" />;
}
