import { ModuleState } from "./ModuleState";

export function ErrorState({ title, description, className }: { title?: string; description?: string; className?: string }) {
  return (
    <ModuleState
      tone="error"
      title={title ?? "No se pudo cargar la informacion"}
      description={description ?? "La vista encontro un error controlado. Intenta recargar o revisa los permisos del tenant activo."}
      className={className}
    />
  );
}
