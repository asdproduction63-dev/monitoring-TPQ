import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session-token";

/** Halaman dan endpoint yang memang diperuntukkan bagi wali murid. */
function areaWali(pathname: string) {
  return (
    pathname === "/raport" ||
    pathname.startsWith("/raport/") ||
    pathname.startsWith("/api/raport/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Wali murid tidak boleh masuk ke aplikasi pencatatan.
  if (user.role === "WALI" && !areaWali(pathname)) {
    return NextResponse.redirect(new URL("/raport", request.url));
  }

  // Admin dan ustadz memakai pratinjau dari halaman murid, bukan halaman wali.
  if (user.role !== "WALI" && (pathname === "/raport" || pathname.startsWith("/raport/"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
