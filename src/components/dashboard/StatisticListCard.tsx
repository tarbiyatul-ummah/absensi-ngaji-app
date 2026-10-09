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
              variant={badgeColor === "green" ? "success" : badgeColor === "red" ? "danger" : "neutral"}
              className="text-xs font-semibold px-2.5 py-0.5"
            >
              {stat.count}
              <span className="opacity-80 ml-1 font-normal">
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
