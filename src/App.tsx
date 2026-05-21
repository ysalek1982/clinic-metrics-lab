import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { RequireAuthenticatedAccess, RequirePlatformAdmin, RequireTenantAccess, RequireTenantPermission } from "@/features/auth/RouteGuards";
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const ActivateInvite = lazy(() => import("./pages/ActivateInvite"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Copilot = lazy(() => import("./pages/app/Copilot"));
const ModulesCenter = lazy(() => import("./pages/app/ModulesCenter"));
const ModuleSettings = lazy(() => import("./pages/app/ModuleSettings"));
const PlatformAdmin = lazy(() => import("./pages/app/PlatformAdmin"));
const TenantSelector = lazy(() => import("./pages/app/TenantSelector"));
const Patients = lazy(() => import("./pages/app/Patients"));
const PatientDetail = lazy(() => import("./pages/app/PatientDetail"));
const Encounters = lazy(() => import("./pages/app/Encounters"));
const NewEvaluation = lazy(() => import("./pages/app/NewEvaluation"));
const Anthropometry = lazy(() => import("./pages/app/Anthropometry"));
const Screening = lazy(() => import("./pages/app/Screening"));
const Plans = lazy(() => import("./pages/app/Plans"));
const Alerts = lazy(() => import("./pages/app/Alerts"));
const Reports = lazy(() => import("./pages/app/Reports"));
const Agenda = lazy(() => import("./pages/app/Agenda"));
const Messages = lazy(() => import("./pages/app/Messages"));
const Foods = lazy(() => import("./pages/app/Foods"));
const Recipes = lazy(() => import("./pages/app/Recipes"));
const WeeklyMenu = lazy(() => import("./pages/app/WeeklyMenu"));
const Labs = lazy(() => import("./pages/app/Labs"));
const Formulas = lazy(() => import("./pages/app/Formulas"));
const Organization = lazy(() => import("./pages/app/Organization"));
const Subscription = lazy(() => import("./pages/app/Subscription"));
const UsersRoles = lazy(() => import("./pages/app/UsersRoles"));
const InstitutionSettings = lazy(() => import("./pages/app/InstitutionSettings"));
const Audit = lazy(() => import("./pages/app/Audit"));
const PackView = lazy(() => import("./pages/app/PackView"));
const Comparator = lazy(() => import("./pages/app/Comparator"));
const PediatricCurves = lazy(() => import("./pages/app/PediatricCurves"));
const CcorpLevel1List = lazy(() => import("./pages/app/CcorpLevel1List"));
const CcorpLevel1New = lazy(() => import("./pages/app/CcorpLevel1New"));
const CcorpLevel1Detail = lazy(() => import("./pages/app/CcorpLevel1Detail"));

function RouteLoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Nutri</div>
        <div className="mt-2 text-[13px] text-muted-foreground">Cargando módulo...</div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteLoadingState />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/activate" element={<ActivateInvite />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/app" element={<AppLayout />}>
                <Route element={<RequirePlatformAdmin />}>
                  <Route path="platform" element={<PlatformAdmin />} />
                </Route>
                <Route element={<RequireAuthenticatedAccess />}>
                  <Route path="tenants" element={<TenantSelector />} />
                </Route>
                <Route element={<RequireTenantPermission permission="billing.manage" />}>
                  <Route path="subscription" element={<Subscription />} />
                  <Route path="billing" element={<Subscription />} />
                </Route>
                <Route element={<RequireTenantAccess />}>
                  <Route index element={<Dashboard />} />
                  <Route path="modules" element={<ModulesCenter />} />
                  <Route element={<RequireTenantPermission permission="ai.assist" />}>
                    <Route path="copilot" element={<Copilot />} />
                  </Route>
                  <Route path="patients" element={<Patients />} />
                  <Route path="patients/:id" element={<PatientDetail />} />
                  <Route path="comparator" element={<Comparator />} />
                  <Route element={<RequireTenantPermission permission="encounters.manage" />}>
                    <Route path="encounters" element={<Encounters />} />
                    <Route path="evaluations/new" element={<NewEvaluation />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="anthropometry.create" />}>
                    <Route path="anthropometry" element={<Anthropometry />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="ccorp_level1.read" />}>
                    <Route path="ccorp-level-1" element={<CcorpLevel1List />} />
                    <Route path="ccorp-level-1/:id" element={<CcorpLevel1Detail />} />
                    <Route path="pack/sport/ccorp-level-1" element={<CcorpLevel1List />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="ccorp_level1.create" />}>
                    <Route path="ccorp-level-1/new" element={<CcorpLevel1New />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="screening.create" />}>
                    <Route path="screening" element={<Screening />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="nutrition_plans.approve" />}>
                    <Route path="plans" element={<Plans />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="alerts.read" />}>
                    <Route path="alerts" element={<Alerts />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="appointments.read" />}>
                    <Route path="agenda" element={<Agenda />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="messages.read" />}>
                    <Route path="messages" element={<Messages />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="foods.read" />}>
                    <Route path="foods" element={<Foods />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="recipes.read" />}>
                    <Route path="recipes" element={<Recipes />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="weekly_menus.read" />}>
                    <Route path="weekly-menu" element={<WeeklyMenu />} />
                  </Route>
                  <Route path="labs" element={<Labs />} />
                  <Route element={<RequireTenantPermission permission="pediatric_growth.read" />}>
                    <Route path="pediatric-curves" element={<PediatricCurves />} />
                    <Route path="pack/pediatric/curves" element={<PediatricCurves />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="reports.export" />}>
                    <Route path="reports" element={<Reports />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="settings.manage" />}>
                    <Route path="formulas" element={<Formulas />} />
                    <Route path="organization" element={<Organization />} />
                    <Route path="settings" element={<InstitutionSettings />} />
                    <Route path="module-settings" element={<ModuleSettings />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="users.manage" />}>
                    <Route path="users" element={<UsersRoles />} />
                  </Route>
                  <Route element={<RequireTenantPermission permission="audit.read" />}>
                    <Route path="audit" element={<Audit />} />
                  </Route>
                  <Route path="somatocarta" element={<Navigate to="/app/pack/sport/somatocarta" replace />} />
                  <Route path="sports" element={<Navigate to="/app/pack/sport/somatocarta" replace />} />
                  <Route path="pack/:packId" element={<PackView />} />
                  <Route path="pack/:packId/:moduleSlug" element={<PackView />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
