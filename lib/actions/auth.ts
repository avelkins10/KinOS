"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { UserProfile } from "@/lib/types";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const authUser = signInData.user;
  if (authUser) {
    const { data: row } = await supabase
      .from("users")
      .select("id, company_id, office_id, roles(category)")
      .eq("auth_id", authUser.id)
      .single();

    if (row) {
      const roles = row.roles as { category: string } | null;
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        app_metadata: {
          user_id: row.id,
          company_id: row.company_id,
          office_id: row.office_id ?? null,
          role_category: roles?.category ?? "",
        },
      });
      await supabase.auth.refreshSession();
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: row, error } = await supabase
    .from("users")
    .select(
      "id, company_id, office_id, first_name, last_name, email, offices(name), companies(name), roles(category)",
    )
    .eq("auth_id", authUser.id)
    .single();

  if (error || !row) {
    return null;
  }

  const offices = row.offices as { name: string } | null;
  const companies = row.companies as { name: string } | null;
  const roles = row.roles as { category: string } | null;

  return {
    userId: row.id,
    authId: authUser.id,
    companyId: row.company_id,
    officeId: row.office_id ?? null,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: roles?.category ?? "",
    officeName: offices?.name ?? null,
    companyName: companies?.name ?? "",
  };
}
