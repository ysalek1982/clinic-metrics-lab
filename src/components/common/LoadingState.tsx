import { ModuleState } from "./ModuleState";

export function LoadingState({ title, description, className }: { title?: string; description?: string; className?: string }) {
  return (
    <ModuleState
      tone="loading"
      title={title ?? "Cargando modulo"}
      description={description ?? "Estamos resolviendo datos, permisos y configuracion del tenant activo."}
      className={className}
    />
  );
}
