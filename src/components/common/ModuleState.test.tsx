import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModuleState } from "./ModuleState";

describe("ModuleState", () => {
  it("renderiza estados de carga como status visible", () => {
    render(<ModuleState tone="loading" title="Cargando modulo" description="Preparando datos reales." />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando modulo");
    expect(screen.getByText("Preparando datos reales.")).toBeInTheDocument();
  });

  it("renderiza errores como alerta y conserva accion visible", () => {
    render(
      <ModuleState
        tone="error"
        title="No se pudo cargar"
        description="Error controlado."
        action={{ label: "Reintentar", onClick: () => undefined }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
  });

  it("renderiza empty y forbidden como estados visibles sin alerta", () => {
    const { rerender } = render(<ModuleState tone="empty" title="Sin registros" description="No hay datos reales." />);

    expect(screen.getByRole("status")).toHaveTextContent("Sin registros");
    expect(screen.getByText("No hay datos reales.")).toBeInTheDocument();

    rerender(<ModuleState tone="forbidden" title="Sin permiso" description="No tienes acceso." />);

    expect(screen.getByRole("status")).toHaveTextContent("Sin permiso");
    expect(screen.getByText("No tienes acceso.")).toBeInTheDocument();
  });
});
