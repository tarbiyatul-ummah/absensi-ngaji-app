import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "Supabase env belum diset. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabasePublishableKey ?? "",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;

  return data.user;
};

export const getCurrentUserId = async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User belum login.");
  }

  return user.id;
};
