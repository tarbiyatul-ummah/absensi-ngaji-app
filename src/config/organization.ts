import { useSyncExternalStore } from "react";
import {
  AccountSetting02Icon,
  AddMoneyCircleIcon,
  CheckListIcon,
  ChartEvaluationIcon,
  DashboardSquare01Icon,
  DatabaseIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { getCurrentUserId, supabase } from "../services/supabase";

export interface OrganizationTerms {
  studentSingularLower: string;
  studentSingularTitle: string;
  mentorSingularLower: string;
  mentorSingularTitle: string;
  levelSingularLower: string;
  levelSingularTitle: string;
  paymentLabel: string;
}

export interface OrganizationConfig {
  name: string;
  typeLabel: string;
  appTitle: string;
  faviconUrl: string;
  terms: OrganizationTerms;
}

const STORAGE_KEY = "absensi-ngaji:organization-config";
const SETTINGS_TABLE = "organization_settings";
export const DEFAULT_FAVICON_URL = "/app-favicon-placeholder.svg";

export const defaultOrganizationConfig: OrganizationConfig = {
  name: "LPQ Tarbiyatul Ummah",
  typeLabel: "LPQ",
  appTitle: "Sistem Absensi",
  faviconUrl: DEFAULT_FAVICON_URL,
  terms: {
    studentSingularLower: "siswa",
    studentSingularTitle: "Siswa",
    mentorSingularLower: "guru",
    mentorSingularTitle: "Guru",
    levelSingularLower: "kelas",
    levelSingularTitle: "Kelas",
    paymentLabel: "SPP",
  },
};

const cloneConfig = (config: OrganizationConfig): OrganizationConfig =>
  JSON.parse(JSON.stringify(config)) as OrganizationConfig;

const normalizeConfig = (
  config: Partial<OrganizationConfig> | null | undefined,
): OrganizationConfig => {
  const parsedTerms = (config?.terms ?? {}) as Partial<OrganizationTerms>;

  return {
    name: config?.name ?? defaultOrganizationConfig.name,
    typeLabel: config?.typeLabel ?? defaultOrganizationConfig.typeLabel,
    appTitle: config?.appTitle ?? defaultOrganizationConfig.appTitle,
    faviconUrl: config?.faviconUrl ?? defaultOrganizationConfig.faviconUrl,
    terms: {
      studentSingularLower:
        parsedTerms.studentSingularLower ??
        defaultOrganizationConfig.terms.studentSingularLower,
      studentSingularTitle:
        parsedTerms.studentSingularTitle ??
        defaultOrganizationConfig.terms.studentSingularTitle,
      mentorSingularLower:
        parsedTerms.mentorSingularLower ??
        defaultOrganizationConfig.terms.mentorSingularLower,
      mentorSingularTitle:
        parsedTerms.mentorSingularTitle ??
        defaultOrganizationConfig.terms.mentorSingularTitle,
      levelSingularLower:
        parsedTerms.levelSingularLower ??
        defaultOrganizationConfig.terms.levelSingularLower,
      levelSingularTitle:
        parsedTerms.levelSingularTitle ??
        defaultOrganizationConfig.terms.levelSingularTitle,
      paymentLabel:
        parsedTerms.paymentLabel ?? defaultOrganizationConfig.terms.paymentLabel,
    },
  };
};

const readStoredConfig = (): OrganizationConfig => {
  if (typeof window === "undefined") return cloneConfig(defaultOrganizationConfig);

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return cloneConfig(defaultOrganizationConfig);

  try {
    const parsed = JSON.parse(stored) as Partial<OrganizationConfig>;
    return normalizeConfig(parsed);
  } catch {
    return cloneConfig(defaultOrganizationConfig);
  }
};

let currentConfig: OrganizationConfig = readStoredConfig();
const listeners = new Set<() => void>();

export const getOrganizationConfig = (): OrganizationConfig => currentConfig;

export const subscribeOrganizationConfig = (callback: () => void): (() => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const useOrganizationConfig = (): OrganizationConfig => {
  return useSyncExternalStore(subscribeOrganizationConfig, getOrganizationConfig, () => defaultOrganizationConfig);
};

export const useTerms = (): OrganizationTerms => {
  const config = useOrganizationConfig();
  return config.terms;
};

export const organizationConfig = {
  get name() {
    return currentConfig.name;
  },
  get typeLabel() {
    return currentConfig.typeLabel;
  },
  get appTitle() {
    return currentConfig.appTitle;
  },
  get faviconUrl() {
    return currentConfig.faviconUrl;
  },
  get terms() {
    return currentConfig.terms;
  },
};

export const terms = {
  get studentSingularLower() {
    return currentConfig.terms.studentSingularLower;
  },
  get studentSingularTitle() {
    return currentConfig.terms.studentSingularTitle;
  },
  get mentorSingularLower() {
    return currentConfig.terms.mentorSingularLower;
  },
  get mentorSingularTitle() {
    return currentConfig.terms.mentorSingularTitle;
  },
  get levelSingularLower() {
    return currentConfig.terms.levelSingularLower;
  },
  get levelSingularTitle() {
    return currentConfig.terms.levelSingularTitle;
  },
  get paymentLabel() {
    return currentConfig.terms.paymentLabel;
  },
};

const writeStoredConfig = (config: OrganizationConfig) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

const applyOrganizationConfig = (nextConfig: OrganizationConfig) => {
  currentConfig = nextConfig;
  writeStoredConfig(nextConfig);
  applyOrganizationMetadata();
  listeners.forEach((listener) => listener());
};

const saveOrganizationConfigToCloud = async (nextConfig: OrganizationConfig) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from(SETTINGS_TABLE).upsert(
    {
      user_id: userId,
      config: nextConfig,
      updated_at: Date.now(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const loadOrganizationConfigFromCloud = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select("config")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.config) {
    applyOrganizationConfig(
      normalizeConfig(data.config as Partial<OrganizationConfig>),
    );
    return;
  }

  await saveOrganizationConfigToCloud(normalizeConfig(currentConfig));
};

export const saveOrganizationConfig = async (nextConfig: OrganizationConfig) => {
  const normalizedConfig = normalizeConfig(nextConfig);
  await saveOrganizationConfigToCloud(normalizedConfig);
  applyOrganizationConfig(normalizedConfig);
};

export const resetOrganizationConfig = () => {
  return saveOrganizationConfig(cloneConfig(defaultOrganizationConfig));
};

export const applyOrganizationMetadata = () => {
  if (typeof document === "undefined") return;

  document.title =
    currentConfig.appTitle.trim() || defaultOrganizationConfig.appTitle;

  const faviconUrl =
    currentConfig.faviconUrl.trim() || defaultOrganizationConfig.faviconUrl;
  const iconType = faviconUrl.startsWith("data:image/png")
    ? "image/png"
    : faviconUrl.startsWith("data:image/jpeg")
      ? "image/jpeg"
      : faviconUrl.startsWith("data:image/x-icon") ||
          faviconUrl.startsWith("data:image/vnd.microsoft.icon") ||
          faviconUrl.endsWith(".ico")
        ? "image/x-icon"
        : "image/svg+xml";
  let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.type = iconType;
  favicon.href = faviconUrl;
};

export const getMainNavigationItems = (t: OrganizationTerms = currentConfig.terms) => [
  {
    key: "attendance",
    label: "Absensi",
    to: "/",
    icon: CheckListIcon,
    enabled: true,
  },
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: DashboardSquare01Icon,
    enabled: true,
  },
  {
    key: "student",
    label: t.studentSingularTitle,
    to: "/master",
    icon: DatabaseIcon,
    enabled: true,
  },
  {
    key: "account",
    label: "Akun",
    to: "/akun",
    icon: AccountSetting02Icon,
    enabled: true,
  },
];

export const mainNavigationItems = [
  {
    key: "attendance",
    label: "Absensi",
    to: "/",
    icon: CheckListIcon,
    enabled: true,
  },
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: DashboardSquare01Icon,
    enabled: true,
  },
  {
    key: "student",
    get label() {
      return currentConfig.terms.studentSingularTitle;
    },
    to: "/master",
    icon: DatabaseIcon,
    enabled: true,
  },
  {
    key: "account",
    label: "Akun",
    to: "/akun",
    icon: AccountSetting02Icon,
    enabled: true,
  },
];

export const getDashboardMenuItems = (t: OrganizationTerms = currentConfig.terms) => [
  {
    key: "payment",
    label: t.paymentLabel,
    description: `Tagihan dan pembayaran ${t.studentSingularLower}`,
    to: "/keuangan",
    icon: Wallet01Icon,
    tone: "green",
    enabled: true,
  },
  {
    key: "savings",
    label: "Tabungan",
    description: `Saldo, setoran, dan penarikan ${t.studentSingularLower}`,
    to: "/tabungan",
    icon: AddMoneyCircleIcon,
    tone: "blue",
    enabled: true,
  },
  {
    key: "assessment",
    label: "Penilaian",
    description: `Catatan perkembangan ${t.studentSingularLower}`,
    to: "/penilaian",
    icon: ChartEvaluationIcon,
    tone: "amber",
    enabled: true,
  },
];

export const dashboardMenuItems = [
  {
    key: "payment",
    get label() {
      return currentConfig.terms.paymentLabel;
    },
    get description() {
      return `Tagihan dan pembayaran ${currentConfig.terms.studentSingularLower}`;
    },
    to: "/keuangan",
    icon: Wallet01Icon,
    tone: "green",
    enabled: true,
  },
  {
    key: "savings",
    label: "Tabungan",
    get description() {
      return `Saldo, setoran, dan penarikan ${currentConfig.terms.studentSingularLower}`;
    },
    to: "/tabungan",
    icon: AddMoneyCircleIcon,
    tone: "blue",
    enabled: true,
  },
  {
    key: "assessment",
    label: "Penilaian",
    get description() {
      return `Catatan perkembangan ${currentConfig.terms.studentSingularLower}`;
    },
    to: "/penilaian",
    icon: ChartEvaluationIcon,
    tone: "amber",
    enabled: true,
  },
];
