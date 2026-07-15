export type AcademicPeriodType = "academicYear" | "semester" | "month" | "custom";
export type AcademicSemester = "ganjil" | "genap";

export interface AcademicYearOption {
  startYear: number;
  label: string;
}

export interface AcademicMonthOption {
  value: string;
  label: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getCurrentAcademicYearStart = (date = new Date()) => {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
};

export const getCurrentSemester = (date = new Date()): AcademicSemester => {
  return date.getMonth() >= 6 && date.getMonth() <= 11 ? "ganjil" : "genap";
};

export const getCurrentAcademicMonth = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const getAcademicYearOptions = (
  currentStartYear = getCurrentAcademicYearStart(),
) => {
  return Array.from({ length: 4 }, (_, index): AcademicYearOption => {
    const startYear = currentStartYear - index;
    return {
      startYear,
      label: `${startYear}/${startYear + 1}`,
    };
  });
};

export const getAcademicMonthOptions = (academicYearStart: number) => {
  return Array.from({ length: 12 }, (_, index): AcademicMonthOption => {
    const monthIndex = (6 + index) % 12;
    const year = index < 6 ? academicYearStart : academicYearStart + 1;
    const date = new Date(year, monthIndex, 1);
    const value = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    return {
      value,
      label: date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      }),
    };
  });
};

export const getAcademicYearRange = (academicYearStart: number): DateRange => ({
  start: `${academicYearStart}-07-01`,
  end: `${academicYearStart + 1}-06-30`,
});

export const getSemesterRange = (
  academicYearStart: number,
  semester: AcademicSemester,
): DateRange => {
  if (semester === "ganjil") {
    return {
      start: `${academicYearStart}-07-01`,
      end: `${academicYearStart}-12-31`,
    };
  }

  return {
    start: `${academicYearStart + 1}-01-01`,
    end: `${academicYearStart + 1}-06-30`,
  };
};

export const getMonthRange = (monthValue: string): DateRange => {
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const endDate = new Date(year, month, 0);

  return {
    start: `${yearText}-${monthText}-01`,
    end: formatDateInput(endDate),
  };
};

export const getAcademicPeriodRange = (
  periodType: AcademicPeriodType,
  academicYearStart: number,
  semester: AcademicSemester,
  monthValue: string,
): DateRange => {
  if (periodType === "academicYear") {
    return getAcademicYearRange(academicYearStart);
  }

  if (periodType === "semester") {
    return getSemesterRange(academicYearStart, semester);
  }

  if (periodType === "month") {
    return getMonthRange(monthValue);
  }

  return getMonthRange(monthValue);
};

export const formatDateLong = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const getAcademicYearLabel = (academicYearStart: number) =>
  `${academicYearStart}/${academicYearStart + 1}`;

export const getPeriodLabel = (
  periodType: AcademicPeriodType,
  academicYearStart: number,
  semester: AcademicSemester,
  monthValue: string,
  startDate: string,
  endDate: string,
) => {
  if (periodType === "academicYear") {
    return `Tahun Ajaran ${getAcademicYearLabel(academicYearStart)}`;
  }

  if (periodType === "semester") {
    return `Semester ${semester === "ganjil" ? "Ganjil" : "Genap"} ${getAcademicYearLabel(academicYearStart)}`;
  }

  if (periodType === "month") {
    const month = getAcademicMonthOptions(academicYearStart).find(
      (item) => item.value === monthValue,
    );
    return month?.label ?? `${formatDateLong(startDate)} - ${formatDateLong(endDate)}`;
  }

  return `${formatDateLong(startDate)} - ${formatDateLong(endDate)}`;
};
