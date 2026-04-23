import { PACKS } from "@/data/packs";
import { cn } from "@/lib/utils";
import type { PackId } from "@/types/domain";

export function PackPill({ pack, size = "sm" }: { pack: PackId; size?: "xs" | "sm" }) {
  const p = PACKS[pack];
  if (!p) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
      )}
      style={{
        background: `hsl(var(${p.cssVar}) / 0.1)`,
        color: `hsl(var(${p.cssVar}))`,
        borderColor: `hsl(var(${p.cssVar}) / 0.3)`,
      }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: `hsl(var(${p.cssVar}))` }} />
      {p.shortName}
    </span>
  );
}
