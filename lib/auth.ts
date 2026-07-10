import { getSession } from "@/app/lib/session";

export async function requireAuth() {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("No autorizado");
  }
  return session;
}
