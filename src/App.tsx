import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Patients from "./pages/app/Patients";
import PatientDetail from "./pages/app/PatientDetail";
import Anthropometry from "./pages/app/Anthropometry";
import Screening from "./pages/app/Screening";
import Plans from "./pages/app/Plans";
import Alerts from "./pages/app/Alerts";
import Reports from "./pages/app/Reports";
import Formulas from "./pages/app/Formulas";
import Organization from "./pages/app/Organization";
import PackView from "./pages/app/PackView";
import Generic from "./pages/app/Generic";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="anthropometry" element={<Anthropometry />} />
            <Route path="screening" element={<Screening />} />
            <Route path="plans" element={<Plans />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="formulas" element={<Formulas />} />
            <Route path="organization" element={<Organization />} />
            <Route path="pack/:packId" element={<PackView />} />
            <Route path="users" element={<Generic title="Equipo & permisos" meta="Roles granulares por módulo" />} />
            <Route path="settings" element={<Generic title="Configuración institucional" meta="Preferencias avanzadas" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
