"use client";
import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const typeStyles: Record<string, string> = {
  SUCCESS: "border-green-500/40 bg-green-500/10",
  ERROR: "border-red-500/40 bg-red-500/10",
  WARNING: "border-yellow-500/40 bg-yellow-500/10",
  INFO: "border-blue-500/40 bg-blue-500/10",
};

const typeIcons: Record<string, React.ReactElement> = {
  SUCCESS: <CheckCircle className="w-4 h-4 text-green-400" />,
  ERROR: <AlertCircle className="w-4 h-4 text-red-400" />,
  WARNING: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  INFO: <Info className="w-4 h-4 text-blue-400" />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 w-80 p-4 rounded-xl border backdrop-blur-xl shadow-lg
        text-white animate-in slide-in-from-right-5 duration-300 ${typeStyles[toast.type] ?? typeStyles.INFO}`}
    >
      <div className="flex-shrink-0 mt-0.5">{typeIcons[toast.type] ?? typeIcons.INFO}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="text-xs text-white/60 mt-0.5">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}