import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { springDefault, useSmoothMotion } from "@/lib/motion";

export interface ToastProps {
  show: boolean;
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  show,
  message,
  type = "success",
  duration = 3000,
  onClose,
}) => {
  const { shouldReduceMotion } = useSmoothMotion();

  useEffect(() => {
    if (!show) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 14, scale: 0.96 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 10, scale: 0.96 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.15 }
              : springDefault
          }
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90vw] pointer-events-none"
        >
          <div className="bg-[#202223] text-white text-[13px] px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 pointer-events-auto">
            {type !== "error" ? (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={16}
                color="#008060"
                strokeWidth={2}
              />
            ) : (
              <HugeiconsIcon
                icon={CancelCircleIcon}
                size={16}
                color="#D72C0D"
                strokeWidth={2}
              />
            )}
            <span className="truncate font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
