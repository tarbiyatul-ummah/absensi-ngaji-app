import { getCurrentUser } from "./supabase";

const ONBOARDING_VERSION = "account-setup-v1";
const STORAGE_PREFIX = "absensi-ngaji:onboarding";

const getStorageKey = async () => {
  const user = await getCurrentUser();
  const userKey = user?.id ?? "anonymous";

  return `${STORAGE_PREFIX}:${ONBOARDING_VERSION}:${userKey}`;
};

export const hasSeenAccountSetupOnboarding = async () => {
  if (typeof window === "undefined") return true;

  const key = await getStorageKey();

  return window.localStorage.getItem(key) === "seen";
};

export const markAccountSetupOnboardingSeen = async () => {
  if (typeof window === "undefined") return;

  const key = await getStorageKey();

  window.localStorage.setItem(key, "seen");
};
