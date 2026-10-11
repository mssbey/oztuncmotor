import type { Metadata } from "next";
import { Battery, Bike, Bolt, Chain, Disc, Drop } from "@/components/icons";
import { SupplyPage } from "@/components/site/SupplyPage";
import { buildMetadata } from "@/lib/seo";
import { getBrandLineup, getCatalogStats, getShowcase } from "@/server/catalog";
import { getPublicHours, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("parts");
  return buildMetadata({
    title: seo?.title || "Motosiklet Yedek Parça Düzce | Yuki ve Motolux",
    description:
      seo?.description ||
      "Öztunc Motor’da Yuki ve Motolux motosiklet, scooter ve elektrikli araçlar için orijinal yedek parça. Parça talebinizi online iletin, uygunluk ve fiyatı bildirelim.",
    path: "/yedek-parca",
  });
}

const GROUPS = [
  { icon: Drop, title: "Periyodik bakım", items: ["Motor ve şanzıman yağı", "Yağ, hava ve yakıt filtreleri", "Buji ve ateşleme parçaları", "Varyatör kayışı ve rulolar"] },
  { icon: Disc, title: "Fren sistemi", items: ["Ön ve arka balata", "Fren diski ve kampana", "Fren hidroliği ve hortumları", "Fren merkezi ve kaliper parçaları"] },
  { icon: Chain, title: "Aktarma ve motor", items: ["Zincir ve dişli seti", "Debriyaj balatası ve yayları", "Conta ve keçe setleri", "Karbüratör / enjeksiyon parçaları"] },
  { icon: Bolt, title: "Elektrik ve aydınlatma", items: ["Akü", "Şarj regülatörü ve marş motoru", "Far, stop ve sinyal lambaları", "Kontak, sigorta ve kablo grupları"] },
  { icon: Battery, title: "Elektrikli araç", items: ["Akü / batarya grupları", "Şarj aleti", "Kontrol ünitesi (beyin)", "Hub motor ve gaz kolu"] },
  { icon: Bike, title: "Gövde ve şasi", items: ["Kaporta ve plastik parçalar", "Ayna, sele ve grenaj", "Lastik, jant ve iç lastik", "Amortisör ve süspansiyon"] },
];

const STEPS = [
  { title: "Bilgileri iletin", text: "Marka, model, (varsa) şasi numarası ve ihtiyacınız olan parçayı formdan veya telefonla bildirin." },
  { title: "Uygunluk ve fiyat", text: "Parçanın stok ya da sipariş durumunu ve fiyatını size bildiriyoruz." },
  { title: "Tedarik", text: "Stokta olmayan orijinal parçalar üretici/distribütör üzerinden sipariş edilir." },
  { title: "Teslim veya montaj", text: "Parçayı showroom’dan teslim alabilir ya da servisimizde randevuyla taktırabilirsiniz." },
];

export default async function SparePartsPage() {
  const [settings, hours, showcase, lineup, stats] = await Promise.all([
    getSiteSettings(),
    getPublicHours(),
    getShowcase(["yuki-victor", "yuki-cyber", "yuki-taro-gp2"]),
    getBrandLineup(["yuki", "motolux"]),
    getCatalogStats(),
  ]);
  const lineupCount = lineup.brands.reduce((n, b) => n + b.count, 0);
  return (
    <SupplyPage
      crumb="Yedek Parça"
      word="Parça"
      title={
        <>
          Orijinal
          <br />
          <span className="text-accent">yedek parça</span>
        </>
      }
      lead="Yuki ve Motolux motosiklet, scooter, ATV ve elektrikli araçlarınız için orijinal yedek parça. Doğru parçayı model ve şasi numarasına göre birlikte belirleyelim."
      showcase={showcase}
      highlights={[
        { value: "Orijinal", label: "Yuki & Motolux parça" },
        { value: lineupCount || stats.models, label: "Uyumlu model" },
        { value: GROUPS.length, label: "Parça grubu" },
        { value: "Montaj", label: "Servisimizde" },
      ]}
      lineup={lineup}
      groupsTitle={
        <>
          İhtiyacınız olan <span className="text-accent">her parça</span>
        </>
      }
      groupsText="Aşağıdaki gruplarda parça talebi oluşturabilirsiniz. Listede olmayan bir parça için formda kısaca açıklamanız yeterli."
      groups={GROUPS}
      note="Parça uygunluğu model ve üretim dönemine göre değişir; talebinizi aldıktan sonra stok ve fiyat bilgisini size iletiriz. Diğer markalar için de talep bırakabilirsiniz."
      steps={STEPS}
      formTitle="Parça talebi"
      formText="Formu doldurun, parçanın uygunluk ve fiyat bilgisiyle size dönüş yapalım."
      formMessage={"Yedek parça talebi\nMarka / model:\nŞasi no (varsa):\nİstenen parça:"}
      whatsappText="Merhaba, yedek parça hakkında bilgi almak istiyorum."
      cta={{ title: "Parçayı biz takalım", text: "Aldığınız parçanın montajını servisimizde randevuyla yapalım." }}
      settings={settings}
      hours={hours}
    />
  );
}
