import { reactive } from "vue";
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

const readStoredConfig = () => {
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

export const organizationConfig = reactive<OrganizationConfig>(
  readStoredConfig(),
);

export const terms = organizationConfig.terms;

const writeStoredConfig = (config: OrganizationConfig) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

const applyOrganizationConfig = (nextConfig: OrganizationConfig) => {
  organizationConfig.name = nextConfig.name;
  organizationConfig.typeLabel = nextConfig.typeLabel;
  organizationConfig.appTitle = nextConfig.appTitle;
  organizationConfig.faviconUrl = nextConfig.faviconUrl;
  Object.assign(organizationConfig.terms, nextConfig.terms);
  writeStoredConfig(nextConfig);
  applyOrganizationMetadata();
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

  await saveOrganizationConfigToCloud(normalizeConfig(organizationConfig));
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
    organizationConfig.appTitle.trim() || defaultOrganizationConfig.appTitle;

  const faviconUrl =
    organizationConfig.faviconUrl.trim() || defaultOrganizationConfig.faviconUrl;
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
      return terms.studentSingularTitle;
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

export const dashboardMenuItems = [
  {
    key: "payment",
    get label() {
      return terms.paymentLabel;
    },
    get description() {
      return `Tagihan dan pembayaran ${terms.studentSingularLower}`;
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
      return `Saldo, setoran, dan penarikan ${terms.studentSingularLower}`;
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
      return `Catatan perkembangan ${terms.studentSingularLower}`;
    },
    to: "/penilaian",
    icon: ChartEvaluationIcon,
    tone: "amber",
    enabled: true,
  },
];
