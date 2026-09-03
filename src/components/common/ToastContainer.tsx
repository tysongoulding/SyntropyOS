import { useToastStore } from "../../store/toastStore";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon =
          toast.type === "success"
            ? CheckCircle2
            : toast.type === "error"
            ? AlertCircle
            : toast.type === "warning"
            ? AlertTriangle
            : Info;

        const borderClass =
          toast.type === "success"
            ? "border-green-800/40 text-green-300 bg-[#0d1f14]"
            : toast.type === "error"
            ? "border-red-800/40 text-red-300 bg-[#220e10]"
            : toast.type === "warning"
            ? "border-amber-800/40 text-amber-300 bg-[#241a0b]"
            : "border-[#30363d] text-white bg-[#161b22]";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3 rounded-xl border shadow-2xl text-xs font-sans max-w-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="leading-snug">{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 p-0.5 rounded text-[#8b949e] hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
