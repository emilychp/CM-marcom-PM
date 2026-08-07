"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: (formData.get("callbackUrl") as string) || "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "帳號或密碼錯誤"
        default:
          return "登入時發生錯誤，請稍後再試"
      }
    }
    throw error
  }
}
