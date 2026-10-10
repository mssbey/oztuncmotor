import { NextResponse, type NextRequest } from "next/server";

// İyimser kontrol: oturum çerezi yoksa yönetim sayfalarını giriş sayfasına yönlendirir.
// Gerçek yetki kontrolü her sayfada ve her sunucu işleminde veritabanı oturumuyla yapılır.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/giris") return NextResponse.next();
  if (!request.cookies.has("oz_admin_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/giris";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
