"use server";

import { signIn, signOut, getLogtoContext } from "@logto/next/server-actions";

import { getLogtoConfig } from "./logto";

export async function handleSignIn() {
  const config = getLogtoConfig();
  await signIn(config);
}

export async function handleSignOut() {
  const config = getLogtoConfig();
  await signOut(config);
}

export async function getUser() {
  const config = getLogtoConfig();
  const context = await getLogtoContext(config);
  return context;
}
