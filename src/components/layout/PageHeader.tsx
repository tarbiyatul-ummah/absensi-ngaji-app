import React from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  backTo?: string;
  onBack?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  backTo,
  onBack,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {backTo && (
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl">
            <Link to={backTo}>
              <HugeiconsIcon icon={ArrowLeft02Icon} size={20} strokeWidth={2} />
            </Link>
          </Button>
        )}
        {onBack && !backTo && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 shrink-0 rounded-xl"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={20} strokeWidth={2} />
          </Button>
        )}
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <div className="text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
