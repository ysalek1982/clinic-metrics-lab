import { Badge } from "@/components/ui/badge";
import { getSubscriptionBadge, type SubscriptionSnapshot } from "@/lib/subscriptionAccess";
import { cn } from "@/lib/utils";

type SubscriptionBadgeProps = {
  subscription?: SubscriptionSnapshot | null;
  className?: string;
};

export function SubscriptionBadge({ subscription, className }: SubscriptionBadgeProps) {
  const label = getSubscriptionBadge(subscription);
  const tone =
    label.includes("vencida") || label.includes("vencido")
      ? "border-risk-high/35 bg-risk-high/10 text-risk-high"
      : label.includes("Cortesia")
        ? "border-pack-sport/35 bg-pack-sport/10 text-pack-sport"
        : label.includes("Prueba")
          ? "border-primary/35 bg-primary/10 text-primary"
          : label === "Free"
            ? "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
            : "border-risk-low/35 bg-risk-low/10 text-risk-low";

  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] uppercase", tone, className)}>
      {label}
    </Badge>
  );
}
