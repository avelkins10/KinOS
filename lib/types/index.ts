import type { Database } from "@/lib/supabase/database.types";

export type { Database };

export interface UserProfile {
  userId: string;
  authId: string;
  companyId: string;
  officeId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  officeName: string | null;
  companyName: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  userId: string | null;
  companyId: string | null;
  officeId: string | null;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  isLoading: boolean;
}
