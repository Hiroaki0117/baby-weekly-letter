import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isInvitePage = pathname.startsWith("/invite");
  const isAuthCallback = pathname.startsWith("/auth");
  const isApiRoute = pathname.startsWith("/api");

  // 未認証ユーザー
  if (!user) {
    // 認証ページ・招待ページ・コールバック・API は通す
    if (isAuthPage || isInvitePage || isAuthCallback || isApiRoute) {
      return supabaseResponse;
    }
    // それ以外はログインへ
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーが認証ページにアクセス → ホームへ
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 認証済み: 家族所属チェック（オンボーディング・招待ページ・API以外）
  if (!isOnboarding && !isInvitePage && !isAuthCallback && !isApiRoute) {
    const { data: member } = await supabase
      .from("family_members")
      .select("id")
      .single();

    if (!member) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // 認証済み + 家族所属済み + オンボーディングページ → ホームへ
  if (isOnboarding) {
    const { data: member } = await supabase
      .from("family_members")
      .select("id")
      .single();

    if (member) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
