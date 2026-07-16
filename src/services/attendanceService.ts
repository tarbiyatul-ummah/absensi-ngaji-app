import { getCurrentUserId, supabase } from "./supabase";
import type { Attendance } from "../types";

export type Unsubscribe = () => void;

const TABLE = "attendances";

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const mapAttendance = (row: any): Attendance => ({
  id: row.id,
  date: row.date,
  santriId: row.santri_id,
  jilidId: row.jilid_id,
  guruId: row.guru_id,
  isPresent: row.is_present,
  status: row.status ?? undefined,
});

export const saveAttendance = async (data: Omit<Attendance, "id">) => {
  const userId = await getCurrentUserId();
  const customId = `${data.date}_${data.santriId}`;
  const { error } = await supabase.from(TABLE).upsert(
    {
      id: customId,
      user_id: userId,
      date: data.date,
      santri_id: data.santriId,
      jilid_id: data.jilidId,
      guru_id: data.guruId,
      is_present: data.isPresent,
      status: data.status ?? null,
    },
    { onConflict: "id" },
  );

  throwIfError(error);
};

export const getAttendanceByDate = async (date: string) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,date,santri_id,jilid_id,guru_id,is_present,status")
    .eq("user_id", userId)
    .eq("date", date);

  throwIfError(error);
  return (data ?? []).map(mapAttendance);
};

export const listenAttendanceByDate = async (
  date: string,
  onData: (data: Attendance[]) => void,
  onError: () => void,
): Promise<Unsubscribe> => {
  try {
    const userId = await getCurrentUserId();
    const load = async () => {
      try {
        onData(await getAttendanceByDate(date));
      } catch {
        onError();
      }
    };

    await load();

    const channel = supabase
      .channel(`attendances:${userId}:${date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE,
          filter: `date=eq.${date}`,
        },
        () => {
          void load();
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          onError();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    onError();
    return () => {};
  }
};

export const getAttendanceByDateRange = async (
  startDate: string,
  endDate: string,
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,date,santri_id,jilid_id,guru_id,is_present,status")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  throwIfError(error);
  return (data ?? []).map(mapAttendance);
};
