"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/actions/auth";
import type { AuthContextType, UserProfile } from "@/lib/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: UserProfile | null;
}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await getCurrentUser();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });
    return () => subscription.unsubscribe();
  }, [refreshUser]);

  const value: AuthContextType = {
    user,
    userId: user?.userId ?? null,
    companyId: user?.companyId ?? null,
    officeId: user?.officeId ?? null,
    role: user?.role ?? null,
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
