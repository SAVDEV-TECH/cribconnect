import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const redirectParam = req.nextUrl.searchParams.get("redirect") || "/agent/dashboard";

  const safeRedirect =
    redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/agent/dashboard";

  const payload = verifySessionToken(token);
  if (!payload || !payload.userId) {
    return NextResponse.redirect(new URL("/auth/login?error=session_expired", req.url));
  }

  const savedUser = {
    id: payload.userId,
    name: payload.name || "CribConnect Member",
    email: payload.email || "",
    phone: payload.phone || "",
    whatsapp: payload.whatsapp || "",
    role: payload.role || "AGENT",
    avatar: payload.avatar || "",
    agencyName: payload.agencyName || "",
  };

  // Return lightweight HTML that saves the 365-day mobile device token in localStorage AND sets the cookie
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Signing into CribConnect...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #FAF9F6; color: #1E293B; }
    .box { text-align: center; padding: 24px; }
    .dot { width: 36px; height: 36px; border: 3px solid #E2E8F0; border-top-color: #0F766E; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="box">
    <div class="dot"></div>
    <p style="font-size:14px;font-weight:600;margin:0;">Completing Google Sign-In...</p>
  </div>
  <script>
    try {
      var token = ${JSON.stringify(token)};
      var user = ${JSON.stringify(savedUser)};
      localStorage.setItem("cribconnect_device_token", token);
      localStorage.setItem("cribconnect_saved_user", JSON.stringify(user));
      localStorage.setItem("cribconnect_quick_profile", JSON.stringify({
        name: user.name,
        email: user.email,
        phone: user.phone || user.whatsapp || "",
        role: user.role || "AGENT",
        avatar: user.avatar || ""
      }));
    } catch (e) {}
    window.location.replace(${JSON.stringify(safeRedirect)});
  </script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

  response.cookies.set("cribconnect_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 365 days permanent mobile sign-in
  });

  return response;
}
