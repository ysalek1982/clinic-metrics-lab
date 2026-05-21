import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { FileDown, Printer } from "lucide-react";
import { ModuleState } from "@/components/common/ModuleState";
import { PageHeader } from "@/components/common/PageHeader";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { PACKS } from "@/data/packs";
import { useAuth } from "@/features/auth/auth-context";
import {
  useTenantAlerts,
  useTenantEncounters,
  useTenantNutritionPlans,
  useTenantPatients,
  useTenantScreenings,
} from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useAuthorization } from "@/hooks/useAuthorization";
import { resolveViewSource } from "@/lib/view-source";
import type { PackId } from "@/types/domain";
import type { ClinicalModuleId } from "@/types/saas";
import { ClinicalCaseboard } from "./pack-modules/ClinicalCaseboard";
import { EnteralCockpit } from "./pack-modules/EnteralCockpit";
import { GinecoFollowUp } from "./pack-modules/GinecoFollowUp";
import { ParenteralBase } from "./pack-modules/ParenteralBase";
import { PackHub } from "./pack-modules/PackHub";
import { SportSomatocarta } from "./pack-modules/SportSomatocarta";

const MODULE_READ_PERMISSIONS: Record<ClinicalModuleId, string[]> = {
  clinical_caseboard: ["patients.read"],
  pediatric_curves: ["pediatric_growth.read"],
  gineco_follow_up: ["patients.read"],
  enteral_cockpit: ["enteral.read"],
  sport_somatocarta: ["sports.manage", "ccorp_level1.read", "patients.read"],
};

export default function PackView() {
  const { packId, moduleSlug } = useParams();
  const pack = PACKS[packId as PackId];
  const { isAuthenticated } = useAuth();
  const { activeTenant, moduleCatalog, setActivePack } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { data: patientResult } = useTenantPatients();
  const { data: alertResult } = useTenantAlerts();
  const { data: screeningResult } = useTenantScreenings();
  const { data: planResult } = useTenantNutritionPlans();
  const { data: encounterResult } = useTenantEncounters();

  useEffect(() => {
    if (pack?.id) {
      setActivePack(pack.id);
    }
  }, [pack?.id, setActivePack]);

  const enabledModulesForPack = useMemo(() => {
    if (!activeTenant || !pack) return [];
    return (activeTenant?.enabledModules ?? [])
      .filter((module) => module.packId === pack.id && module.enabled)
      .map((enabledModule) => {
        const definition = moduleCatalog.find((module) => module.id === enabledModule.moduleId);
        return {
          ...enabledModule,
          name: definition?.name ?? enabledModule.slug,
          description: definition?.description ?? "Módulo habilitado por configuración del tenant.",
        };
      });
  }, [activeTenant, moduleCatalog, pack]);

  if (!pack) {
    return <StatePanel title="Pack no encontrado" body="La ruta solicitada no corresponde a un pack registrado." />;
  }

  if (!activeTenant) {
    return <StatePanel title="Tenant en preparación" body="Estamos resolviendo los módulos habilitados del tenant activo." />;
  }

  const packEnabled = (activeTenant?.enabledPacks ?? []).includes(pack.id);
  if (!packEnabled) {
    return (
      <StatePanel
        title="Pack no habilitado"
        body="Este tenant no tiene activo el pack solicitado. Habilítalo desde Configuración > Packs y módulos."
      />
    );
  }

  const activeModule = moduleSlug ? enabledModulesForPack.find((module) => module.slug === moduleSlug) : null;
  if (moduleSlug && !activeModule) {
    return (
      <StatePanel
        title="Módulo no disponible"
        body="El módulo solicitado no está habilitado para este tenant o pertenece a otro pack."
      />
    );
  }

  if (activeModule) {
    const requiredPermissions = MODULE_READ_PERMISSIONS[activeModule.moduleId] ?? ["patients.read"];
    if (!hasPermission(...requiredPermissions)) {
      return (
        <StatePanel
          title="Sin permisos para este módulo"
          body="Tu rol del tenant no habilita la lectura de este módulo clínico. Solicita acceso institucional o cambia de tenant."
        />
      );
    }
  }

  const patients = patientResult?.data ?? [];
  const alerts = alertResult?.data ?? [];
  const screenings = screeningResult?.data ?? [];
  const plans = planResult?.data ?? [];
  const encounters = encounterResult?.data ?? [];
  const packPatients = patients.filter((patient) => (patient.activePacks ?? []).includes(pack.id));
  const patientIds = new Set(packPatients.map((patient) => patient.id));
  const packAlerts = alerts.filter((alert) => patientIds.has(alert.patientId));
  const packScreenings = screenings.filter((screening) => patientIds.has(screening.patientId));
  const packPlans = plans.filter((plan) => patientIds.has(plan.patientId));
  const packEncounters = encounters.filter((encounter) => patientIds.has(encounter.patientId));

  const baseViewSource = resolveViewSource({
    isAuthenticated,
    sources: [
      patientResult?.source,
      alertResult?.source,
      screeningResult?.source,
      planResult?.source,
      encounterResult?.source,
    ],
  });
  const moduleViewSource = baseViewSource;

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex items-center gap-2">
            <span>{activeModule ? `Pack ${pack.shortName} - ${activeModule.name}` : `Pack ${pack.shortName}`}</span>
            <SourceStateBadge source={activeModule ? moduleViewSource : baseViewSource} />
          </div>
        }
        title={activeModule ? activeModule.name : pack.name}
        subtitle={activeModule ? activeModule.description : pack.description}
        actions={
          <div className="flex items-center gap-2">
            {activeModule?.moduleId === "pediatric_curves" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px]"
                  disabled
                  title="La vista imprimible pediátrica requiere referencias oficiales completas."
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Imprimir Próximamente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px]"
                  disabled
                  title="La exportación pediátrica requiere referencias oficiales completas."
                >
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />
                  PDF Próximamente
                </Button>
              </>
            )}
            <Button size="sm" className="h-8 border-0 text-[12px] text-primary-foreground gradient-primary" asChild>
              <Link to="/app/evaluations/new">Nueva evaluación</Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-6">
        {!activeModule && pack.id !== "parenteral" && (
          <PackHub
            pack={pack}
            patients={packPatients}
            alerts={packAlerts}
            screenings={packScreenings}
            plans={packPlans}
            modules={enabledModulesForPack}
          />
        )}

        {!activeModule && pack.id === "parenteral" && <ParenteralBase patients={patients} />}

        {activeModule?.moduleId === "clinical_caseboard" && (
          <ClinicalCaseboard
            patients={packPatients}
            alerts={packAlerts}
            screenings={packScreenings}
            plans={packPlans}
            encounters={packEncounters}
          />
        )}
        {activeModule?.moduleId === "gineco_follow_up" && <GinecoFollowUp patients={packPatients} alerts={packAlerts} />}
        {activeModule?.moduleId === "enteral_cockpit" && (
          <EnteralCockpit patients={packPatients} alerts={packAlerts} plans={packPlans} />
        )}
        {activeModule?.moduleId === "sport_somatocarta" && <SportSomatocarta patients={patients} plans={plans} />}
      </div>
    </div>
  );
}

function StatePanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6">
      <ModuleState title={title} description={body} />
    </div>
  );
}
