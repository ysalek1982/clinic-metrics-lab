import { ModuleState } from "./ModuleState";

export function ForbiddenState({ title, description, className }: { title?: string; description?: string; className?: string }) {
  return (
    <ModuleState
      tone="forbidden"
      title={title ?? "No tienes permiso para acceder a este modulo"}
      description={description ?? "Tu rol actual no habilita esta accion o vista para la organizacion seleccionada."}
      className={className}
    />
  );
}
