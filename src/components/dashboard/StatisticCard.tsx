import React from "react";
import { Card } from "@/components/ui/card";

export interface StatisticCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  className?: string;
}

export const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconClassName,
  className,
}) => {
  return (
    <Card className={`flex flex-row items-center justify-between p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs transition-shadow duration-200 hover:shadow-sm ${className || ""}`}>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {title}
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
          {value}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {icon && (
        <div
          className={`size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0 ml-3 ${
            iconClassName || "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>
      )}
    </Card>
  );
};

export default StatisticCard;
