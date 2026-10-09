import React from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  BookOpenCheckIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganizationConfig } from "@/config/organization";

export interface FeaturePlaceholderViewProps {
  title: string;
  description: string;
}

export const FeaturePlaceholderView: React.FC<FeaturePlaceholderViewProps> = ({
  title,
  description,
}) => {
  const orgConfig = useOrganizationConfig();

  return (
    <div className="app-page">
      <div className="app-container space-y-4">
        <Button asChild variant="ghost" size="sm" className="w-fit px-2">
          <Link to="/dashboard">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.7}
            />
            Dashboard
          </Link>
        </Button>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <HugeiconsIcon
                icon={BookOpenCheckIcon}
                size={26}
                color="currentColor"
                strokeWidth={1.7}
              />
            </div>

            <h1 className="app-title">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>

            <div className="mt-5 rounded-lg border border-dashed border-border bg-muted p-4">
              <p className="text-[13px] font-medium text-foreground">
                Fitur ini sudah masuk konfigurasi menu.
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Detail alur, data, dan hak akses bisa dikembangkan sesuai
                kebutuhan tiap {orgConfig.typeLabel}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeaturePlaceholderView;

