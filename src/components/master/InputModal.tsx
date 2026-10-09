import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface InputModalProps {
  isOpen: boolean;
  title: string;
  label: string;
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  title,
  label,
  initialValue,
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="input-modal-field">{label}</Label>
            <Input
              id="input-modal-field"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              type="text"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={!inputValue.trim()}>
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InputModal;

