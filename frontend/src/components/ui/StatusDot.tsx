import { HealthStatus } from "@/lib/types";

interface StatusDotProps {
  status: HealthStatus | "excellent" | "warning" | "critical" | "unknown";
  size?: "sm" | "md" | "lg";
}

const STATUS_COLORS = {
  success: "bg-emerald-500",
  excellent: "bg-emerald-500",
  warning: "bg-amber-400",
  failed: "bg-red-500",
  critical: "bg-red-500",
  unknown: "bg-gray-300",
};

const SIZE_CLASSES = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3.5 h-3.5",
};

export function StatusDot({ status, size = "md" }: StatusDotProps) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-300";
  return (
    <span
      className={`inline-block rounded-full ${color} ${SIZE_CLASSES[size]} flex-shrink-0`}
      aria-label={status}
    />
  );
}

export function StatusEmoji({ status }: { status: HealthStatus | string }) {
  if (status === "success" || status === "excellent") return <span>🟢</span>;
  if (status === "warning") return <span>🟡</span>;
  if (status === "failed" || status === "critical") return <span>🔴</span>;
  return <span>⚪</span>;
}
