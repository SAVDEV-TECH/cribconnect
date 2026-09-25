import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { DEMO_PERSONAS } from "./types";

export const DEFAULT_USER_ID = "student-chidi";

export async function getCurrentUser() {
  const cookieStore = cookies();
  const userId = cookieStore.get("cribconnect_user_id")?.value || DEFAULT_USER_ID;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      agentProfile: true,
    },
  });

  if (!user) {
    // Fallback to default persona if user not found in DB
    return await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID },
      include: {
        agentProfile: true,
      },
    });
  }

  return user;
}
