export const NAV_ITEMS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/motosikletler", label: "Motosikletler" },
  { href: "/servis", label: "Servis" },
  { href: "/yedek-parca", label: "Yedek Parça" },
  { href: "/aksesuar", label: "Aksesuar" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
