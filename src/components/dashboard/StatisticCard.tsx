import React from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { useSmoothMotion } from "@/lib/motion";

export interface StatisticCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = "hsl(210 40% 96.1%)",
  iconColor = "hsl(222.2 47.4% 11.2%)",
}) => {
  const { cardHoverProps } = useSmoothMotion();

  return (
    <motion.div {...cardHoverProps}>
      <Card className="flex flex-row items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <h2 className="text-4xl font-bold leading-tight text-foreground">
            {value}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div
            className="p-3 rounded-full"
            style={{ backgroundColor: iconBgColor }}
          >
            <div style={{ color: iconColor }}>{icon}</div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default StatisticCard;
