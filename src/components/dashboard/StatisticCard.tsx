import React from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { useSmoothMotion } from "@/lib/motion";

export interface StatisticCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

export const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  className,
}) => {
  const { cardHoverProps } = useSmoothMotion();

  return (
    <motion.div {...cardHoverProps}>
      <Card className={`flex flex-row items-center justify-between p-5 ${className || ""}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div
            className={`p-3 rounded-xl ${iconBgColor ? "" : "bg-muted text-foreground"}`}
            style={iconBgColor ? { backgroundColor: iconBgColor, color: iconColor } : undefined}
          >
            {icon}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default StatisticCard;
