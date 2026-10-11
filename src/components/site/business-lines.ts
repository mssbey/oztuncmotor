/** İşletmenin dört ana hizmet alanı — ana sayfa, menü ve alt bilgide ortak kullanılır. */
export const BUSINESS_LINES = [
  {
    key: "satis",
    title: "Satış",
    href: "/motosikletler",
    cta: "Modelleri incele",
    text: "Yuki ve Motolux’un scooter, elektrikli, cub, touring, enduro, ATV ve üç tekerlekli modelleri showroom’umuzda.",
  },
  {
    key: "servis",
    title: "Servis",
    href: "/servis",
    cta: "Randevu al",
    text: "Periyodik bakım, arıza tespiti, fren, lastik ve elektrik işlemleri; online randevuyla kabul.",
  },
  {
    key: "yedek-parca",
    title: "Yedek Parça",
    href: "/yedek-parca",
    cta: "Parça talebi oluştur",
    text: "Yuki ve Motolux modelleri için orijinal yedek parça; bakım, fren, aktarma ve elektrik parçaları.",
  },
  {
    key: "aksesuar",
    title: "Aksesuar",
    href: "/aksesuar",
    cta: "Aksesuarları gör",
    text: "Kask, sürüş ekipmanı, çanta ve bagaj, koruma ve güvenlik ürünleri; motosikletinize uygun seçim desteği.",
  },
] as const;

export type BusinessLineKey = (typeof BUSINESS_LINES)[number]["key"];
