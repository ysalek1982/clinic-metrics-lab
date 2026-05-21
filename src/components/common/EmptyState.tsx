import { ModuleState } from "./ModuleState";

export function EmptyState({ title, description, className }: { title: string; description?: string; className?: string }) {
  return <ModuleState tone="empty" title={title} description={description} className={className} />;
}
