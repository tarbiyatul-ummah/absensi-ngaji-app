import React from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  staggerContainerVariants,
  staggerItemVariants,
  useSmoothMotion,
} from "@/lib/motion";

export interface StatItem {
  nama: string;
  count: number;
}

export interface StatisticListCardProps {
  title: string;
  items: StatItem[];
  badgeColor?: string; // e.g. 'green' or 'red'
  unit?: string;
}

export const StatisticListCard: React.FC<StatisticListCardProps> = ({
  title,
  items,
  badgeColor,
  unit,
}) => {
  const { shouldReduceMotion } = useSmoothMotion();

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="border-b py-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <motion.div
        className="divide-y divide-border"
        variants={shouldReduceMotion ? undefined : staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {items.map((stat) => (
          <motion.div
            key={stat.nama}
            variants={shouldReduceMotion ? undefined : staggerItemVariants}
            className="flex items-center justify-between px-4 py-3 hover:bg-accent/70 transition-colors"
          >
            <span className="text-sm text-foreground font-medium">{stat.nama}</span>
            <Badge
              variant="outline"
              className={`text-sm font-bold ${
                badgeColor === "green"
                  ? "bg-[hsl(142_76%_94%)] text-[hsl(142_72%_29%)] border-[hsl(142_42%_82%)]"
                  : badgeColor === "red"
                    ? "bg-[hsl(0_86%_97%)] text-destructive border-[hsl(0_75%_88%)]"
                    : "bg-secondary text-secondary-foreground"
              }`}
            >
              {stat.count}{" "}
              <span
                className={`text-[12px] font-normal ml-1 ${
                  badgeColor === "green"
                    ? "text-[hsl(142_72%_29%)]"
                    : badgeColor === "red"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {unit || "Anak"}
              </span>
            </Badge>
          </motion.div>
        ))}
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Tidak ada data
          </div>
        )}
      </motion.div>
    </Card>
  );
};

export default StatisticListCard;
