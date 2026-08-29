import { Bot } from "lucide-react";

type AdminLogoProps = {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

const sizeMap = {
  sm: { box: "h-9 w-9", icon: "h-4 w-4", text: "text-base" },
  md: { box: "h-11 w-11", icon: "h-5 w-5", text: "text-lg" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", text: "text-xl" },
} as const;

export function AdminLogo({ size = "md", showLabel = false }: AdminLogoProps) {
  const styles = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className={`flex ${styles.box} items-center justify-center rounded-xl bg-[var(--covers-blue)] text-white shadow-sm`}
        aria-hidden
      >
        <Bot className={styles.icon} strokeWidth={2.25} />
      </span>
      {showLabel ? (
        <p
          className={`${styles.text} font-semibold tracking-tight text-slate-900`}
        >
          Covers&All Admin
        </p>
      ) : null}
    </div>
  );
}
