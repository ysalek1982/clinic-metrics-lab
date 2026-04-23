import { PageHeader } from "@/components/common/PageHeader";

export default function Generic({ title, meta }: { title: string; meta: string }) {
  return (
    <div>
      <PageHeader meta={meta} title={title} subtitle="Módulo en el plan de implementación. Disponible en próxima fase." />
      <div className="p-6">
        <div className="panel p-12 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Próximamente</div>
          <h3 className="text-xl font-serif italic mt-2 mb-1">{title}</h3>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
            Este módulo está incluido en la hoja de ruta. La arquitectura y los datos demo ya están preparados — la pantalla detallada se desplegará en la siguiente iteración.
          </p>
        </div>
      </div>
    </div>
  );
}
