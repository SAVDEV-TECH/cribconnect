import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Unverified social sign-in has been disabled for security. Please use verified Google Sign-In (/api/auth/google) or Email & Password (/api/auth/login).",
    },
    { status: 410 }
  );
}
