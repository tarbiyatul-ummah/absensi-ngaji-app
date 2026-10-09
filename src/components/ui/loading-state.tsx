import React from "react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/ui/text-shimmer";

export interface LoadingStateProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "fullscreen";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  text = "Memuat Data",
  className,
  size = "md",
}) => {
  const containerClasses = {
    sm: "flex items-center justify-center py-3",
    md: "flex items-center justify-center py-8",
    lg: "flex h-64 w-full items-center justify-center",
    fullscreen: "flex h-screen w-full items-center justify-center",
  }[size];

  const textClasses = {
    sm: "text-xs font-medium text-muted-foreground",
    md: "text-sm font-medium text-muted-foreground",
    lg: "text-sm font-medium text-muted-foreground",
    fullscreen: "text-sm sm:text-base font-medium text-muted-foreground",
  }[size];

  return (
    <div
      className={cn(containerClasses, className)}
      role="status"
      aria-label={text}
    >
      <TextShimmer className={textClasses}>{text}</TextShimmer>
    </div>
  );
};

export default LoadingState;

