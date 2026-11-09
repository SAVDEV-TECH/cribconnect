import { cookies } from "next/headers";
import { prisma } from "./prisma";

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
    return await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID },
      include: {
        agentProfile: true,
      },
    });
  }

  return user;
}
