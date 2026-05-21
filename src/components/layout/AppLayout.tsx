import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { Button } from "@/components/ui/button";

interface RouteErrorBoundaryState {
  error: Error | null;
}

class RouteErrorBoundary extends Component<{ children: ReactNode }, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("No se pudo renderizar la vista autenticada", error, errorInfo);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <div className="panel max-w-2xl p-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-risk-high">Error de render</div>
            <h2 className="mt-2 text-lg font-semibold">No se pudo renderizar este módulo</h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              La vista encontró un error de runtime antes de completar la carga. No se ocultó el fallo para evitar una pantalla en blanco.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-md border border-border bg-background/60 p-3 text-[11px] text-muted-foreground">
              {this.state.error.message}
            </pre>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/app">Volver al panel</Link>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar />
        <main className="flex-1 overflow-auto">
          <RouteErrorBoundary key={location.pathname}>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
