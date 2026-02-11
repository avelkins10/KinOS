import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSession();
  if (user) {
    redirect("/");
  }
  return <LoginForm />;
}
