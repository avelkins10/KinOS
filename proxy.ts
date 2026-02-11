import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // Allow webhook routes without authentication
  if (request.nextUrl.pathname.startsWith("/api/webhooks")) {
    return response;
  }

  // Allow login page without authentication
  if (request.nextUrl.pathname.startsWith("/login")) {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
