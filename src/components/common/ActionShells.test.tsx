import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionDialog } from "./ActionDialog";
import { ActionDrawer } from "./ActionDrawer";
import { AsyncActionFooter } from "./AsyncActionFooter";

describe("Action shells", () => {
  it("AsyncActionFooter evita doble submit cuando esta cargando", () => {
    const onSubmit = vi.fn();
    render(<AsyncActionFooter loading onSubmit={onSubmit} submitLabel="Guardar" loadingLabel="Guardando..." />);

    const button = screen.getByRole("button", { name: /guardando/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("ActionDialog renderiza error, success y acciones internas", () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ActionDialog
        open
        onOpenChange={onOpenChange}
        title="Resolver alerta"
        description="Confirmacion interna."
        error="Falta motivo."
        success="Listo para guardar."
        submitLabel="Resolver"
        onSubmit={onSubmit}
      >
        <div>Contenido interno</div>
      </ActionDialog>,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("Resolver alerta");
    expect(screen.getByRole("alert")).toHaveTextContent("Falta motivo.");
    expect(screen.getByRole("status")).toHaveTextContent("Listo para guardar.");
    fireEvent.click(screen.getByRole("button", { name: "Resolver" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("ActionDrawer muestra contenido sin navegacion externa", () => {
    render(
      <ActionDrawer open onOpenChange={() => undefined} title="Editar paciente" description="Drawer interno.">
        <label>
          Nombre
          <input defaultValue="Paciente" />
        </label>
      </ActionDrawer>,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("Editar paciente");
    expect(screen.getByLabelText("Nombre")).toHaveValue("Paciente");
  });
});
