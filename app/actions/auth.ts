"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/app/lib/session";

export type LoginState =
  | { error: string }
  | { success: true }
  | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Completá todos los campos." };
  }

  const validUsername = process.env.AUTH_USERNAME ?? "admin";
  const validPassword = process.env.AUTH_PASSWORD ?? "cyberar2026";

  if (username !== validUsername || password !== validPassword) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await createSession(username);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
