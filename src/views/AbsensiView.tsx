import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSantri, getJilid } from "@/services/masterService";
import {
  saveAttendance,
  listenAttendanceByDate,
  type Unsubscribe,
} from "@/services/attendanceService";
import { hasSeenAccountSetupOnboarding } from "@/services/onboardingService";
import type { Attendance, AttendanceStatus, Jilid, Santri } from "@/types";
import AbsensiFilter from "@/components/absensi/AbsensiFilter";
import AbsensiList from "@/components/absensi/AbsensiList";
import DailyRecapButton from "@/components/absensi/DailyRecapButton";
import Toast from "@/components/master/Toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const AbsensiView: React.FC = () => {
  const navigate = useNavigate();

  const [todayDate] = useState(() => getLocalDateString());
  const [currentDate, setCurrentDate] = useState(() => getLocalDateString());

  const [selectedJilid, setSelectedJilid] = useState("Semua");
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [jilidList, setJilidList] = useState<Jilid[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [savingSantriIds, setSavingSantriIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSetupOnboardingOpen, setIsSetupOnboardingOpen] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const triggerToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ show: true, message, type });
    },
    [],
  );

  const attendanceDataRef = useRef<Attendance[]>(attendanceData);
  attendanceDataRef.current = attendanceData;

  // Handle visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setCurrentDate(getLocalDateString());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Load initial master data
  useEffect(() => {
    let isMounted = true;
    const loadMaster = async () => {
      try {
        const [santriRes, jilidRes, hasSeenOnboarding] = await Promise.all([
          getSantri(),
          getJilid(),
          hasSeenAccountSetupOnboarding(),
        ]);
        if (!isMounted) return;
        setSantriList(santriRes);
        setJilidList(jilidRes);
        setIsSetupOnboardingOpen(!hasSeenOnboarding);
      } catch {
        if (isMounted) {
          triggerToast("Koneksi bermasalah. Data belum bisa dimuat.", "error");
        }
      }
    };

    void loadMaster();
    return () => {
      isMounted = false;
    };
  }, [triggerToast]);

  // Subscribe to attendance by date
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    let isCancelled = false;

    if (currentDate > todayDate) {
      setCurrentDate(todayDate);
      triggerToast("Tanggal tidak boleh melebihi hari ini.", "error");
      return;
    }

    const startListener = async () => {
      try {
        const unsub = await listenAttendanceByDate(
          currentDate,
          (data) => {
            if (!isCancelled) {
              setAttendanceData(data);
            }
          },
          () => {
            if (!isCancelled) {
              triggerToast(
                "Koneksi bermasalah. Absensi gagal dimuat.",
                "error",
              );
            }
          },
        );
        if (isCancelled) {
          unsub();
        } else {
          unsubscribe = unsub;
        }
      } catch {
        if (!isCancelled) {
          triggerToast("Koneksi bermasalah. Absensi gagal dimuat.", "error");
        }
      }
    };

    void startListener();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentDate, todayDate, triggerToast]);

  const formattedDate = useMemo(() => {
    const date = new Date(currentDate + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [currentDate]);

  const filteredSantri = useMemo(() => {
    let list = santriList.filter((s) => s.isActive);
    if (selectedJilid !== "Semua") {
      list = list.filter((s) => s.jilidId === selectedJilid);
    }
    return list.slice().sort((a, b) => a.nama.localeCompare(b.nama));
  }, [santriList, selectedJilid]);

  const attendanceSummary = useMemo(() => {
    const total = filteredSantri.length;
    let present = 0;
    let permission = 0;

    const map = new Map(attendanceData.map((a) => [a.santriId, a]));

    filteredSantri.forEach((santri) => {
      const record = map.get(santri.id);
      if (!record) return;
      const status =
        record.status ?? (record.isPresent ? "present" : "absent");
      if (status === "present") present += 1;
      if (status === "permission") permission += 1;
    });

    return {
      total,
      present,
      permission,
      unmarked: total - present - permission,
    };
  }, [filteredSantri, attendanceData]);

  const handleStatusChange = useCallback(
    async (santri: Santri, status: AttendanceStatus) => {
      const previousData = attendanceDataRef.current.map((item) => ({
        ...item,
      }));
      const existingRecord = attendanceDataRef.current.find(
        (a) => a.santriId === santri.id,
      );

      const currentStatus =
        existingRecord?.status ??
        (existingRecord?.isPresent ? "present" : "absent");
      const nextStatus: AttendanceStatus =
        currentStatus === status ? "absent" : status;
      const isPresent = nextStatus === "present";

      // Optimistic update
      setAttendanceData((prev) => {
        const found = prev.find((a) => a.santriId === santri.id);
        if (found) {
          return prev.map((item) =>
            item.santriId === santri.id
              ? { ...item, isPresent, status: nextStatus }
              : item,
          );
        } else {
          return [
            ...prev,
            {
              id: "",
              date: currentDate,
              santriId: santri.id,
              jilidId: santri.jilidId,
              guruId: santri.guruId,
              isPresent,
              status: nextStatus,
            },
          ];
        }
      });

      setSavingSantriIds((prev) => new Set(prev).add(santri.id));

      try {
        await saveAttendance({
          date: currentDate,
          santriId: santri.id,
          jilidId: santri.jilidId,
          guruId: santri.guruId,
          isPresent,
          status: nextStatus,
        });
      } catch {
        setAttendanceData(previousData);
        triggerToast("Koneksi bermasalah. Absensi gagal disimpan.", "error");
      } finally {
        setSavingSantriIds((prev) => {
          const next = new Set(prev);
          next.delete(santri.id);
          return next;
        });
      }
    },
    [currentDate, triggerToast],
  );

  const goToAccountSetup = () => {
    setIsSetupOnboardingOpen(false);
    navigate({
      pathname: "/akun",
      search: "?onboarding=setup",
    });
  };

  return (
    <div className="app-page">
      <header className="app-container app-header pb-4">
        <div>
          <h1 className="app-title">Absensi Harian</h1>
          <p className="app-subtitle">{formattedDate}</p>
        </div>
        <Input
          type="date"
          value={currentDate}
          max={todayDate}
          autoComplete="off"
          onChange={(e) => setCurrentDate(e.target.value)}
          className="w-auto cursor-pointer font-medium"
        />
      </header>

      <div className="app-container space-y-5">
        <div className="space-y-3">
          <AbsensiFilter
            jilidList={jilidList}
            selectedJilid={selectedJilid}
            onSelectJilid={setSelectedJilid}
          />

          <DailyRecapButton
            filteredSantri={filteredSantri}
            attendanceData={attendanceData}
            onSuccess={(msg) => triggerToast(msg, "success")}
            onError={(msg) => triggerToast(msg, "error")}
          />
        </div>

        <div
          className="grid grid-cols-3 gap-2 sm:gap-3"
          aria-label="Ringkasan absensi"
        >
          <div className="rounded-lg border border-[hsl(142_42%_82%)] bg-[hsl(142_76%_97%)] p-2.5 sm:p-3">
            <p className="text-xs text-[hsl(142_72%_29%)]">Hadir</p>
            <p className="text-xl font-bold text-[hsl(142_72%_29%)]">
              {attendanceSummary.present}
            </p>
          </div>
          <div className="rounded-lg border border-[hsl(48_76%_78%)] bg-[hsl(48_96%_97%)] p-2.5 sm:p-3">
            <p className="text-xs text-[hsl(32_95%_35%)]">Izin</p>
            <p className="text-xl font-bold text-[hsl(32_95%_35%)]">
              {attendanceSummary.permission}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted p-2.5 sm:p-3">
            <p className="text-xs text-muted-foreground">Belum diabsen</p>
            <p className="text-xl font-bold text-foreground">
              {attendanceSummary.unmarked}
            </p>
          </div>
        </div>

        <AbsensiList
          filteredSantri={filteredSantri}
          jilidList={jilidList}
          attendanceData={attendanceData}
          savingSantriIds={savingSantriIds}
          onStatusChange={handleStatusChange}
        />
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <Dialog open={isSetupOnboardingOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Selamat Datang</DialogTitle>
            <DialogDescription>
              Silakan lengkapi pengaturan aplikasi di halaman akun sebelum
              mulai mengelola data.
            </DialogDescription>
          </DialogHeader>

          <Button type="button" className="w-full" onClick={goToAccountSetup}>
            Buka Pengaturan Akun
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbsensiView;

