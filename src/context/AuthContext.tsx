import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, getCurrentUser } from "../services/supabase";
import { loadOrganizationConfigFromCloud } from "../config/organization";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let organizationConfigLoaded = false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser && !organizationConfigLoaded) {
        try {
          await loadOrganizationConfigFromCloud();
        } catch {
          // Keep proceed, error handled in settings view if needed
        } finally {
          organizationConfigLoaded = true;
        }
      }
    } catch (err) {
      console.error("Auth init error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user && !organizationConfigLoaded) {
        try {
          await loadOrganizationConfigFromCloud();
        } catch {
          // ignore
        } finally {
          organizationConfigLoaded = true;
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initAuth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    const u = await getCurrentUser();
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

