import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSmoothMotion, springDefault } from "@/lib/motion";

export interface MasterDataItem {
  id: string;
  nama: string;
  urutan?: number;
}

export interface MasterDataCardProps {
  title: string;
  placeholder: string;
  items: MasterDataItem[];
  isSortable?: boolean;
  onAdd: (nama: string) => void;
  onEdit: (item: MasterDataItem) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

export const MasterDataCard: React.FC<MasterDataCardProps> = ({
  title,
  placeholder,
  items,
  isSortable = false,
  onAdd,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const { shouldReduceMotion } = useSmoothMotion();
  const [inputNama, setInputNama] = useState("");

  const handleAdd = () => {
    const trimmed = inputNama.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInputNama("");
  };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <div className="border-b bg-background p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="flex gap-2"
        >
          <Input
            value={inputNama}
            onChange={(e) => setInputNama(e.target.value)}
            type="text"
            placeholder={placeholder}
          />
          <Button type="submit" className="whitespace-nowrap">
            Tambah
          </Button>
        </form>
      </div>

      <div className="divide-y">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={springDefault}
              className="flex items-center justify-between p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                {isSortable && (
                  <div className="flex flex-col rounded border bg-muted">
                    {index > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Naikkan urutan ${item.nama}`}
                        onClick={() => onMoveUp?.(index)}
                        className="h-6 w-6 p-0 rounded-b-none text-muted-foreground"
                      >
                        <HugeiconsIcon
                          icon={ArrowUp01Icon}
                          size={14}
                          color="currentColor"
                          strokeWidth={2.5}
                        />
                      </Button>
                    ) : (
                      <div className="h-6 w-6" />
                    )}

                    {index < items.length - 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Turunkan urutan ${item.nama}`}
                        onClick={() => onMoveDown?.(index)}
                        className="h-6 w-6 p-0 rounded-t-none text-muted-foreground"
                      >
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={14}
                          color="currentColor"
                          strokeWidth={2.5}
                        />
                      </Button>
                    ) : (
                      <div className="h-6 w-6" />
                    )}
                  </div>
                )}

                <span className="text-sm font-medium text-foreground">
                  {item.nama}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="text-[13px]"
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="text-[13px] text-destructive hover:bg-red-50 hover:text-destructive"
                >
                  Hapus
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada data.
          </div>
        )}
      </div>
    </Card>
  );
};

export default MasterDataCard;

