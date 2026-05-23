import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Gift, KeyRound, ListChecks, Search, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { ActionDialog } from "@/components/common/ActionDialog";
import { KpiCard } from "@/components/common/KpiCard";
import { ModuleState } from "@/components/common/ModuleState";
import { PageHeader } from "@/components/common/PageHeader";
import { PlanLimitNotice } from "@/components/common/PlanLimitNotice";
import { SubscriptionBadge } from "@/components/common/SubscriptionBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTenantCatalog } from "@/hooks/useSaasCatalogs";
import {
  getPendingRequests,
  useAssignRoleToUser,
  useApproveAccessRequest,
  useCreateInviteCode,
  useDeactivateInviteCode,
  useRemoveRoleFromUser,
  useSaasAdminEffectivePermissions,
  useGrantCourtesyMembership,
  useRejectAccessRequest,
  useRevokeCourtesyMembership,
  useSaasAdminCourtesyMemberships,
  useSaasAdminInviteCodes,
  useSaasAdminPlatformUsers,
  useSaasAdminRequests,
  useUpdatePlatformMembershipStatus,
} from "@/hooks/useSaasAdmin";
import {
  useAssignTenantPlan,
  useCancelCourtesySubscription,
  useExtendCourtesySubscription,
  useGrantCourtesySubscription,
  usePlanEntitlements,
  useSubscriptionEvents,
  useSubscriptionPlans,
  useTenantSubscriptions,
} from "@/hooks/useSubscription";
import { explainBillingUnavailable, getBillingProviderStatus } from "@/lib/billingProvider";
import { formatDateTime, formatInteger } from "@/lib/formatters";
import {
  MEMBERSHIP_PLAN_CODES,
  filterPlatformUsers,
  summarizePlatformUsers,
  summarizeSaasAdminKpis,
  validateApprovalInput,
  validateInviteCodeInput,
  type MembershipPlanCode,
} from "@/lib/saasAdmin";
import { getPlanLimit, type SubscriptionStatus } from "@/lib/subscriptionAccess";
import type { AccessRequest, CourtesyMembership, PlatformUser, TenantInviteCode } from "@/services/saasAdminService";
import type { SubscriptionPlanRecord, TenantSubscriptionRecord } from "@/services/subscriptionService";

const DEFAULT_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const DEFAULT_ROLE_CODE = "clinical_nutritionist";
const EMPTY_PLATFORM_USERS: PlatformUser[] = [];
const EMPTY_SUBSCRIPTIONS: TenantSubscriptionRecord[] = [];

export default function SaasAdmin() {
  const { isPlatformSuperadmin, roles } = useAuthorization();
  const tenantsQuery = useTenantCatalog();
  const requestsQuery = useSaasAdminRequests();
  const invitesQuery = useSaasAdminInviteCodes();
  const grantsQuery = useSaasAdminCourtesyMemberships();
  const usersQuery = useSaasAdminPlatformUsers();
  const plansQuery = useSubscriptionPlans();
  const entitlementsQuery = usePlanEntitlements();
  const subscriptionsQuery = useTenantSubscriptions();
  const eventsQuery = useSubscriptionEvents();

  const approveMutation = useApproveAccessRequest();
  const rejectMutation = useRejectAccessRequest();
  const createInviteMutation = useCreateInviteCode();
  const deactivateInviteMutation = useDeactivateInviteCode();
  const grantCourtesyMutation = useGrantCourtesyMembership();
  const revokeCourtesyMutation = useRevokeCourtesyMembership();
  const assignRoleMutation = useAssignRoleToUser();
  const removeRoleMutation = useRemoveRoleFromUser();
  const updateMembershipStatusMutation = useUpdatePlatformMembershipStatus();
  const assignPlanMutation = useAssignTenantPlan();
  const grantTenantCourtesyMutation = useGrantCourtesySubscription();
  const extendCourtesyMutation = useExtendCourtesySubscription();
  const cancelCourtesyMutation = useCancelCourtesySubscription();

  const [approvalRequest, setApprovalRequest] = useState<AccessRequest | null>(null);
  const [rejectRequest, setRejectRequest] = useState<AccessRequest | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [courtesyDialogOpen, setCourtesyDialogOpen] = useState(false);
  const [assignPlanDialogOpen, setAssignPlanDialogOpen] = useState(false);
  const [tenantCourtesyDialogOpen, setTenantCourtesyDialogOpen] = useState(false);
  const [extendSubscription, setExtendSubscription] = useState<TenantSubscriptionRecord | null>(null);
  const [cancelSubscription, setCancelSubscription] = useState<TenantSubscriptionRecord | null>(null);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleCode, setUserRoleCode] = useState(DEFAULT_ROLE_CODE);
  const [userMembershipStatus, setUserMembershipStatus] = useState<PlatformUser["status"]>("active");
  const [approvalTenantId, setApprovalTenantId] = useState(DEFAULT_TENANT_ID);
  const [approvalRoleCode, setApprovalRoleCode] = useState(DEFAULT_ROLE_CODE);
  const [approvalPlanCode, setApprovalPlanCode] = useState<MembershipPlanCode>("courtesy");
  const [approvalEndsAt, setApprovalEndsAt] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [inviteTenantId, setInviteTenantId] = useState(DEFAULT_TENANT_ID);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteRoleCode, setInviteRoleCode] = useState(DEFAULT_ROLE_CODE);
  const [invitePlanCode, setInvitePlanCode] = useState<MembershipPlanCode>("courtesy");
  const [inviteMaxUses, setInviteMaxUses] = useState("1");
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [grantTenantId, setGrantTenantId] = useState(DEFAULT_TENANT_ID);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantRoleCode, setGrantRoleCode] = useState(DEFAULT_ROLE_CODE);
  const [grantPlanCode, setGrantPlanCode] = useState<MembershipPlanCode>("courtesy");
  const [grantEndsAt, setGrantEndsAt] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [assignTenantId, setAssignTenantId] = useState(DEFAULT_TENANT_ID);
  const [assignPlanCode, setAssignPlanCode] = useState<MembershipPlanCode>("free");
  const [assignStatus, setAssignStatus] = useState<SubscriptionStatus>("active");
  const [assignEndsAt, setAssignEndsAt] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [tenantCourtesyTenantId, setTenantCourtesyTenantId] = useState(DEFAULT_TENANT_ID);
  const [tenantCourtesyDays, setTenantCourtesyDays] = useState("30");
  const [tenantCourtesyEndsAt, setTenantCourtesyEndsAt] = useState("");
  const [tenantCourtesyNotes, setTenantCourtesyNotes] = useState("");
  const [extendEndsAt, setExtendEndsAt] = useState("");
  const [subscriptionActionNote, setSubscriptionActionNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const requests = requestsQuery.data ?? [];
  const invites = invitesQuery.data ?? [];
  const grants = grantsQuery.data ?? [];
  const platformUsers = usersQuery.data ?? EMPTY_PLATFORM_USERS;
  const plans = plansQuery.data ?? [];
  const entitlements = entitlementsQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? EMPTY_SUBSCRIPTIONS;
  const subscriptionEvents = eventsQuery.data ?? [];
  const tenants = tenantsQuery.data?.data ?? [];
  const effectivePermissionsQuery = useSaasAdminEffectivePermissions(selectedUser?.userId, selectedUser?.tenantId);
  const billingStatus = getBillingProviderStatus();
  const roleCodes = useMemo(
    () =>
      Array.from(
        new Set(
          roles
            .filter((role) => role.id !== "platform_superadmin")
            .map((role) => role.id)
            .concat([DEFAULT_ROLE_CODE, "tenant_owner", "nutrition_director", "viewer"]),
        ),
      ),
    [roles],
  );
  const kpis = summarizeSaasAdminKpis({
    requests,
    grants,
    invites,
  });
  const pendingRequests = getPendingRequests(requests);
  const filteredPlatformUsers = useMemo(
    () => filterPlatformUsers(platformUsers, userSearch),
    [platformUsers, userSearch],
  );
  const platformUserKpis = useMemo(() => summarizePlatformUsers(platformUsers), [platformUsers]);
  const subscriptionByTenantId = useMemo(() => {
    const index = new Map<string, TenantSubscriptionRecord>();
    for (const subscription of subscriptions) {
      if (!index.has(subscription.tenantId)) {
        index.set(subscription.tenantId, subscription);
      }
    }
    return index;
  }, [subscriptions]);
  const freeSubscriptions = subscriptions.filter((subscription) => subscription.planCode === "free" && subscription.status === "active").length;
  const proSubscriptions = subscriptions.filter((subscription) => subscription.planCode === "pro" && subscription.status === "active").length;
  const clinicHospitalSubscriptions = subscriptions.filter((subscription) => subscription.planCode === "clinic_hospital" && subscription.status === "active").length;
  const activeCourtesySubscriptions = subscriptions.filter((subscription) => subscription.planCode === "courtesy" && subscription.status === "courtesy").length;
  const expiredSubscriptions = subscriptions.filter((subscription) => ["expired", "cancelled", "past_due"].includes(subscription.status)).length;
  const hasMigrationError =
    requestsQuery.isError ||
    invitesQuery.isError ||
    grantsQuery.isError ||
    usersQuery.isError ||
    plansQuery.isError ||
    entitlementsQuery.isError ||
    subscriptionsQuery.isError ||
    eventsQuery.isError;

  if (!isPlatformSuperadmin) {
    return (
      <div>
        <PageHeader
          meta="SaaS Admin"
          title="Administracion de plataforma"
          subtitle="Esta vista requiere rol platform_superadmin."
          actions={null}
        />
        <div className="p-6">
          <ModuleState
            tone="forbidden"
            title="Acceso restringido"
            description="Solo un administrador SaaS puede aprobar usuarios, codigos y membresias de cortesia."
          />
        </div>
      </div>
    );
  }

  async function submitApproval() {
    if (!approvalRequest) return;
    const errors = validateApprovalInput({
      tenantId: approvalTenantId,
      roleCode: approvalRoleCode,
      planCode: approvalPlanCode,
    });
    if (errors.length > 0) {
      setFormError(errors[0]);
      return;
    }
    setFormError(null);
    await approveMutation.mutateAsync({
      requestId: approvalRequest.requestId,
      tenantId: approvalTenantId,
      roleCode: approvalRoleCode,
      planCode: approvalPlanCode,
      endsAt: approvalEndsAt || null,
      reviewNote: approvalNote || null,
    });
    setApprovalRequest(null);
    setApprovalNote("");
  }

  async function submitReject() {
    if (!rejectRequest) return;
    setFormError(null);
    await rejectMutation.mutateAsync({
      requestId: rejectRequest.requestId,
      reviewNote: rejectNote || null,
    });
    setRejectRequest(null);
    setRejectNote("");
  }

  async function submitInvite() {
    const maxUses = inviteMaxUses.trim() ? Number(inviteMaxUses) : null;
    const errors = validateInviteCodeInput({
      tenantId: inviteTenantId,
      code: inviteCode,
      roleCode: inviteRoleCode,
      planCode: invitePlanCode,
      maxUses,
    });
    if (errors.length > 0) {
      setFormError(errors[0]);
      return;
    }
    setFormError(null);
    await createInviteMutation.mutateAsync({
      tenantId: inviteTenantId,
      code: inviteCode,
      roleCode: inviteRoleCode,
      planCode: invitePlanCode,
      maxUses,
      expiresAt: inviteExpiresAt || null,
    });
    setInviteDialogOpen(false);
    setInviteCode("");
  }

  async function submitGrant() {
    if (!grantTenantId.trim() || !grantEmail.trim()) {
      setFormError("Tenant y email son obligatorios.");
      return;
    }
    setFormError(null);
    await grantCourtesyMutation.mutateAsync({
      tenantId: grantTenantId,
      userEmail: grantEmail,
      roleCode: grantRoleCode,
      planCode: grantPlanCode,
      endsAt: grantEndsAt || null,
      grantReason: grantReason || null,
    });
    setCourtesyDialogOpen(false);
    setGrantEmail("");
  }

  async function submitAssignPlan() {
    if (!assignTenantId.trim() || !assignPlanCode.trim()) {
      setFormError("Tenant y plan son obligatorios.");
      return;
    }
    setFormError(null);
    await assignPlanMutation.mutateAsync({
      tenantId: assignTenantId,
      planCode: assignPlanCode,
      status: assignStatus,
      endsAt: assignEndsAt || null,
      notes: assignNotes || null,
    });
    setAssignPlanDialogOpen(false);
    setAssignNotes("");
  }

  function openPlanChangeForUser(user: PlatformUser, planCode: MembershipPlanCode = "pro") {
    setAssignTenantId(user.tenantId);
    setAssignPlanCode(planCode);
    setAssignStatus("active");
    setAssignEndsAt("");
    setAssignNotes(`Cambio manual de plan para ${user.email} desde SaaS Admin.`);
    setFormError(null);
    setAssignPlanDialogOpen(true);
  }

  function openCourtesyForUser(user: PlatformUser) {
    setTenantCourtesyTenantId(user.tenantId);
    setTenantCourtesyDays("30");
    setTenantCourtesyEndsAt("");
    setTenantCourtesyNotes(`Cortesia temporal para ${user.email} desde SaaS Admin.`);
    setFormError(null);
    setTenantCourtesyDialogOpen(true);
  }

  async function submitTenantCourtesy() {
    if (!tenantCourtesyTenantId.trim()) {
      setFormError("Tenant obligatorio.");
      return;
    }
    const calculatedEndsAt = tenantCourtesyEndsAt || calculateFutureDateTime(Number(tenantCourtesyDays));
    if (!calculatedEndsAt) {
      setFormError("Fecha fin de cortesia invalida.");
      return;
    }
    setFormError(null);
    await grantTenantCourtesyMutation.mutateAsync({
      tenantId: tenantCourtesyTenantId,
      endsAt: calculatedEndsAt,
      notes: tenantCourtesyNotes || null,
    });
    setTenantCourtesyDialogOpen(false);
    setTenantCourtesyNotes("");
  }

  async function submitExtendCourtesy() {
    if (!extendSubscription) return;
    if (!extendEndsAt) {
      setFormError("Fecha fin requerida.");
      return;
    }
    setFormError(null);
    await extendCourtesyMutation.mutateAsync({
      subscriptionId: extendSubscription.subscriptionId,
      endsAt: extendEndsAt,
      notes: subscriptionActionNote || null,
    });
    setExtendSubscription(null);
    setSubscriptionActionNote("");
  }

  async function submitCancelCourtesy() {
    if (!cancelSubscription) return;
    setFormError(null);
    await cancelCourtesyMutation.mutateAsync({
      subscriptionId: cancelSubscription.subscriptionId,
      notes: subscriptionActionNote || null,
    });
    setCancelSubscription(null);
    setSubscriptionActionNote("");
  }

  async function submitAssignUserRole() {
    if (!selectedUser || !userRoleCode.trim()) return;
    setFormError(null);
    await assignRoleMutation.mutateAsync({
      membershipId: selectedUser.membershipId,
      roleCode: userRoleCode,
    });
  }

  async function submitRemoveUserRole() {
    if (!selectedUser || !userRoleCode.trim()) return;
    setFormError(null);
    await removeRoleMutation.mutateAsync({
      membershipId: selectedUser.membershipId,
      roleCode: userRoleCode,
    });
  }

  async function submitUpdateUserStatus() {
    if (!selectedUser) return;
    setFormError(null);
    await updateMembershipStatusMutation.mutateAsync({
      membershipId: selectedUser.membershipId,
      status: userMembershipStatus,
    });
  }

  return (
    <div>
      <PageHeader
        meta="SaaS Admin"
        title="Aprobacion de usuarios y cortesias"
        subtitle="Control de solicitudes, codigos, roles y membresias de cortesia. No crea usuarios Auth desde frontend."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setAssignPlanDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Asignar plan
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInviteDialogOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Crear codigo
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTenantCourtesyDialogOpen(true)}>
              <ListChecks className="mr-2 h-4 w-4" />
              Cortesia tenant
            </Button>
            <Button size="sm" className="gradient-primary border-0 text-primary-foreground" onClick={() => setCourtesyDialogOpen(true)}>
              <Gift className="mr-2 h-4 w-4" />
              Dar cortesia
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        {hasMigrationError && (
          <ModuleState
            tone="warning"
            title="Migracion SaaS Admin pendiente de aplicar"
            description="La UI esta lista, pero Supabase debe aplicar la migracion local antes de listar solicitudes, cortesias o codigos en remoto."
          />
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Pendientes" value={formatInteger(kpis.pendingRequests)} unit="" hint="solicitudes por aprobar" accent="--primary" icon={<UserCheck className="h-3 w-3" />} sparkline={null} />
          <KpiCard label="Aprobadas" value={formatInteger(kpis.approvedRequests)} unit="" hint="historial" accent="--risk-low" icon={<CheckCircle2 className="h-3 w-3" />} sparkline={null} />
          <KpiCard label="Rechazadas" value={formatInteger(kpis.rejectedRequests)} unit="" hint="con nota interna" accent="--risk-high" icon={<XCircle className="h-3 w-3" />} sparkline={null} />
          <KpiCard label="Cortesias" value={formatInteger(kpis.activeCourtesy)} unit="" hint="activas" accent="--pack-sport" icon={<Gift className="h-3 w-3" />} sparkline={null} />
          <KpiCard label="Codigos" value={formatInteger(kpis.activeInvites)} unit="" hint="activos" accent="--pack-enteral" icon={<KeyRound className="h-3 w-3" />} sparkline={null} />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-surface-raised/50">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="requests">Solicitudes</TabsTrigger>
            <TabsTrigger value="plans">Planes</TabsTrigger>
            <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
            <TabsTrigger value="courtesy">Cortesias</TabsTrigger>
            <TabsTrigger value="roles">Roles y permisos</TabsTrigger>
            <TabsTrigger value="invites">Invitaciones</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="panel overflow-hidden">
                <TableHeader title="Estado comercial SaaS" subtitle="Planes visibles para administracion de plataforma" />
                <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                  <CommercialMetric label="Free activos" value={freeSubscriptions} />
                  <CommercialMetric label="Pro activos" value={proSubscriptions} />
                  <CommercialMetric label="Clinic/Hospital activos" value={clinicHospitalSubscriptions} />
                  <CommercialMetric label="Cortesias activas" value={activeCourtesySubscriptions} />
                  <CommercialMetric label="Solicitudes pendientes" value={pendingRequests.length} />
                  <CommercialMetric label="Suscripciones con atencion" value={expiredSubscriptions} />
                </div>
              </section>
              <ModuleState
                tone="warning"
                title="Billing real desactivado"
                description="El panel permite administrar planes manuales, free y courtesy. No ejecuta cobros, no guarda tarjetas y no llama proveedores de pago."
              />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-4">
              <ModuleState
                tone="warning"
                title="Crear Auth users sigue siendo server-side"
                description="Esta lista gestiona memberships, roles y permisos de usuarios Auth existentes. Alta de Auth user requiere Supabase Dashboard, Edge Function desplegada o script server-side seguro."
              />
              <div className="grid gap-3 md:grid-cols-4">
                <CommercialMetric label="Usuarios/memberships" value={platformUserKpis.total} />
                <CommercialMetric label="Activos" value={platformUserKpis.active} />
                <CommercialMetric label="Inactivos" value={platformUserKpis.inactive} />
                <CommercialMetric label="Platform admins" value={platformUserKpis.platformAdmins} />
              </div>
              <section className="panel overflow-hidden">
                <div className="border-b border-border p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Usuarios y memberships</div>
                      <h3 className="mt-0.5 text-[15px] font-medium">Directorio SaaS protegido</h3>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        Buscar usuario, revisar tenant, plan, roles y permisos efectivos sin exponer secretos ni crear Auth users desde frontend.
                      </p>
                    </div>
                    <div className="relative w-full md:w-80">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        placeholder="Buscar por email, nombre, tenant o rol..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {usersQuery.isLoading && <LoadingRow text="Cargando usuarios..." />}
                  {!usersQuery.isLoading && filteredPlatformUsers.length === 0 && (
                    <EmptyRow text={userSearch ? "No hay usuarios que coincidan con la busqueda." : "No hay memberships registrados."} />
                  )}
                  {filteredPlatformUsers.map((user) => (
                    <PlatformUserRow
                      key={`${user.membershipId}-${user.tenantId}`}
                      user={user}
                      subscription={subscriptionByTenantId.get(user.tenantId) ?? null}
                      onOpen={() => {
                        setFormError(null);
                        setSelectedUser(user);
                        setUserRoleCode(user.roleCodes[0] && user.roleCodes[0] !== "platform_superadmin" ? user.roleCodes[0] : DEFAULT_ROLE_CODE);
                        setUserMembershipStatus(user.status);
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <section className="panel overflow-hidden">
              <TableHeader title="Solicitudes pendientes" subtitle="Usuarios autenticados sin membership pueden solicitar acceso aqui." />
              <div className="divide-y divide-border">
                {requestsQuery.isLoading && <LoadingRow text="Cargando solicitudes..." />}
                {!requestsQuery.isLoading && pendingRequests.length === 0 && <EmptyRow text="No hay solicitudes pendientes." />}
                {pendingRequests.map((request) => (
                  <RequestRow
                    key={request.requestId}
                    request={request}
                    onApprove={() => {
                      setFormError(null);
                      setApprovalRequest(request);
                      setApprovalTenantId(request.requestedTenantId ?? tenants[0]?.id ?? DEFAULT_TENANT_ID);
                    }}
                    onReject={() => {
                      setFormError(null);
                      setRejectRequest(request);
                    }}
                  />
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="invites">
            <section className="panel overflow-hidden">
              <TableHeader title="Codigos de invitacion" subtitle="Los codigos crean membership solo cuando el usuario autenticado los canjea." />
              <div className="divide-y divide-border">
                {invitesQuery.isLoading && <LoadingRow text="Cargando codigos..." />}
                {!invitesQuery.isLoading && invites.length === 0 && <EmptyRow text="No hay codigos registrados." />}
                {invites.map((invite) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    onDeactivate={() => {
                      if (!isPlatformSuperadmin) return;
                      deactivateInviteMutation.mutate(invite.id);
                    }}
                    busy={deactivateInviteMutation.isPending}
                  />
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="courtesy">
            <section className="panel overflow-hidden">
              <TableHeader title="Membresias de cortesia" subtitle="Concesiones activas, trials internos y cancelaciones." />
              <div className="divide-y divide-border">
                {grantsQuery.isLoading && <LoadingRow text="Cargando cortesias..." />}
                {!grantsQuery.isLoading && grants.length === 0 && <EmptyRow text="No hay cortesias registradas." />}
                {grants.map((grant) => (
                  <GrantRow
                    key={grant.grantId}
                    grant={grant}
                    onRevoke={() => {
                      if (!isPlatformSuperadmin) return;
                      revokeCourtesyMutation.mutate({ grantId: grant.grantId, reason: "Cancelado desde SaaS Admin" });
                    }}
                    busy={revokeCourtesyMutation.isPending}
                  />
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="plans">
            <div className="space-y-4">
              <PlanLimitNotice
                title="Pagos en linea deshabilitados"
                description={explainBillingUnavailable()}
                tone="warning"
              />
              <section className="panel overflow-hidden">
                <TableHeader title="Planes SaaS" subtitle="Catalogo de planes, limites y beneficios. La edicion de precios queda pendiente." />
                <div className="divide-y divide-border">
                  {plansQuery.isLoading && <LoadingRow text="Cargando planes..." />}
                  {!plansQuery.isLoading && plans.length === 0 && <EmptyRow text="No hay planes registrados o la migracion no fue aplicada." />}
                  {plans.map((plan) => (
                    <PlanRow key={plan.code} plan={plan} entitlements={entitlements.filter((item) => item.planCode === plan.code)} />
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="panel p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Proveedor de pagos</div>
                  <div className="mt-1 text-[15px] font-medium">{billingStatus.label}</div>
                  <div className="mt-2 text-[12px] text-muted-foreground">Proveedor: {billingStatus.provider}. No hay cobros activos.</div>
                </div>
                <div className="panel p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Suscripciones</div>
                  <div className="mt-1 text-[24px] font-semibold">{formatInteger(subscriptions.length)}</div>
                  <div className="mt-2 text-[12px] text-muted-foreground">Tenants con estado registrado.</div>
                </div>
                <div className="panel p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Eventos</div>
                  <div className="mt-1 text-[24px] font-semibold">{formatInteger(subscriptionEvents.length)}</div>
                  <div className="mt-2 text-[12px] text-muted-foreground">Historial reciente de cambios.</div>
                </div>
              </div>
              <section className="panel overflow-hidden">
                <TableHeader title="Suscripciones por tenant" subtitle="Asignacion manual de Free, Pro, Clinic/Hospital o cortesia temporal." />
                <div className="divide-y divide-border">
                  {subscriptionsQuery.isLoading && <LoadingRow text="Cargando suscripciones..." />}
                  {!subscriptionsQuery.isLoading && subscriptions.length === 0 && <EmptyRow text="No hay suscripciones registradas o la migracion no fue aplicada." />}
                  {subscriptions.map((subscription) => (
                    <SubscriptionRow
                      key={subscription.subscriptionId}
                      subscription={subscription}
                      onExtend={() => {
                        setFormError(null);
                        setExtendSubscription(subscription);
                        setExtendEndsAt(subscription.courtesyEndsAt ? toDateTimeLocal(subscription.courtesyEndsAt) : "");
                      }}
                      onCancel={() => {
                        setFormError(null);
                        setCancelSubscription(subscription);
                      }}
                      busy={extendCourtesyMutation.isPending || cancelCourtesyMutation.isPending}
                    />
                  ))}
                </div>
              </section>
              <section className="panel overflow-hidden">
                <TableHeader title="Eventos de suscripcion" subtitle="Auditoria operacional para cambios manuales. Pagos reales no estan integrados." />
                <div className="divide-y divide-border">
                  {eventsQuery.isLoading && <LoadingRow text="Cargando eventos..." />}
                  {!eventsQuery.isLoading && subscriptionEvents.length === 0 && <EmptyRow text="No hay eventos de suscripcion registrados." />}
                  {subscriptionEvents.slice(0, 20).map((event) => (
                    <div key={event.eventId} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                      <div>
                        <div className="font-medium">{event.eventType}</div>
                        <div className="mt-1 text-[12px] text-muted-foreground">{event.tenantName}</div>
                      </div>
                      <div className="text-[12px] text-muted-foreground">{event.subscriptionId ?? "Sin suscripcion asociada"}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDateTime(event.createdAt)}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="roles">
            <ModuleState
              title="Roles y permisos protegidos"
              description="ysalek/platform_superadmin administra roles y permisos por RPC/servicios protegidos. Los usuarios normales no pueden autoasignarse roles, planes ni cortesias."
              action={{ label: "Ver usuarios y roles", href: "/app/users" }}
            />
          </TabsContent>

          <TabsContent value="audit">
            <ModuleState
              title="Auditoria centralizada"
              description="Las aprobaciones escriben user.approved, user.rejected, membership.granted, invite.created e invite.revoked en audit_logs."
              action={{ label: "Abrir auditoria", href: "/app/audit" }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ActionDialog
        open={Boolean(selectedUser)}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        title="Detalle de usuario SaaS"
        description="Gestiona roles, estado de membership y permisos efectivos por RPC protegida. No crea usuarios Auth ni toca contrasenas."
        className="max-w-4xl"
        loading={assignRoleMutation.isPending || removeRoleMutation.isPending || updateMembershipStatusMutation.isPending}
        error={
          formError ??
          (assignRoleMutation.error instanceof Error ? assignRoleMutation.error.message : null) ??
          (removeRoleMutation.error instanceof Error ? removeRoleMutation.error.message : null) ??
          (updateMembershipStatusMutation.error instanceof Error ? updateMembershipStatusMutation.error.message : null) ??
          (effectivePermissionsQuery.error instanceof Error ? effectivePermissionsQuery.error.message : null)
        }
        footer={
          <div className="flex justify-end border-t border-border pt-4">
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cerrar
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="Usuario" value={selectedUser.fullName} />
              <ReadOnlyField label="Email" value={selectedUser.email} />
              <ReadOnlyField label="Tenant" value={selectedUser.tenantName} />
              <ReadOnlyField label="Membership" value={selectedUser.membershipId} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Estado</div>
                <div className="mt-2">
                  <StatusBadge value={selectedUser.status} />
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Plan tenant</div>
                <div className="mt-2">
                  <TenantPlanBadge subscription={subscriptionByTenantId.get(selectedUser.tenantId) ?? null} />
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Roles actuales</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedUser.roleCodes.length > 0 ? (
                    selectedUser.roleCodes.map((role) => (
                      <Badge key={role} variant="outline" className="text-[10px]">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[12px] text-muted-foreground">Sin roles asignados.</span>
                  )}
                </div>
              </div>
            </div>

            <section className="rounded-lg border border-border">
              <TableHeader title="Acciones protegidas" subtitle="Cambios reales por RPC, auditables en Supabase" />
              <div className="grid gap-4 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <RoleSelect label="Rol a asignar/quitar" value={userRoleCode} onChange={setUserRoleCode} roleCodes={roleCodes} />
                <MembershipStatusSelect label="Estado membership" value={userMembershipStatus} onChange={setUserMembershipStatus} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void submitAssignUserRole()} disabled={assignRoleMutation.isPending || !userRoleCode}>
                    Asignar rol
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void submitUpdateUserStatus()} disabled={updateMembershipStatusMutation.isPending}>
                    Actualizar estado
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void submitRemoveUserRole()}
                    disabled={removeRoleMutation.isPending || !userRoleCode || userRoleCode === "platform_superadmin"}
                  >
                    Quitar rol
                  </Button>
                </div>
              </div>
              <div className="border-t border-border p-4">
                <div className="mb-3 text-[12px] text-muted-foreground">
                  Plan comercial del tenant/espacio. Estas acciones no ejecutan cobros; solo cambian la suscripcion SaaS y quedan auditadas.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openPlanChangeForUser(selectedUser, "free")}>
                    Bajar a Free
                  </Button>
                  <Button size="sm" onClick={() => openPlanChangeForUser(selectedUser, "pro")}>
                    Subir a Pro
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openPlanChangeForUser(selectedUser, "clinic_hospital")}>
                    Subir a Clinic/Hospital
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openCourtesyForUser(selectedUser)}>
                    Dar cortesia 30 dias
                  </Button>
                </div>
              </div>
              {userRoleCode === "platform_superadmin" && (
                <div className="border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
                  Quitar platform_superadmin desde esta UI esta bloqueado para evitar dejar la plataforma sin administrador.
                </div>
              )}
            </section>

            <section className="rounded-lg border border-border">
              <TableHeader title="Permisos efectivos" subtitle="Lectura protegida por admin_list_effective_permissions" />
              <div className="p-4">
                {effectivePermissionsQuery.isLoading && <div className="text-[12px] text-muted-foreground">Cargando permisos efectivos...</div>}
                {!effectivePermissionsQuery.isLoading && (effectivePermissionsQuery.data ?? []).length === 0 && (
                  <div className="text-[12px] text-muted-foreground">No hay permisos efectivos para este usuario/tenant.</div>
                )}
                <div className="flex flex-wrap gap-1">
                  {(effectivePermissionsQuery.data ?? []).map((permission) => (
                    <Badge key={`${permission.roleCode}-${permission.permissionId}`} variant="outline" className="text-[10px]">
                      {permission.permissionId}
                    </Badge>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </ActionDialog>

      <ActionDialog
        open={Boolean(approvalRequest)}
        onOpenChange={(open) => !open && setApprovalRequest(null)}
        title="Aprobar solicitud"
        description="Selecciona tenant, rol y tipo de membresia. La operacion se ejecuta por RPC con validacion de platform_admin."
        loading={approveMutation.isPending}
        error={formError ?? (approveMutation.error instanceof Error ? approveMutation.error.message : null)}
        submitLabel="Aprobar"
        onSubmit={submitApproval}
      >
        <div className="grid gap-4">
          <ReadOnlyField label="Usuario" value={approvalRequest?.email ?? "No registrado"} />
          <TenantSelect label="Tenant" value={approvalTenantId} onChange={setApprovalTenantId} tenants={tenants} />
          <RoleSelect label="Rol" value={approvalRoleCode} onChange={setApprovalRoleCode} roleCodes={roleCodes} />
          <PlanSelect label="Membresia" value={approvalPlanCode} onChange={setApprovalPlanCode} />
          <div className="space-y-2">
            <Label htmlFor="approvalEndsAt">Fecha fin opcional</Label>
            <Input id="approvalEndsAt" type="datetime-local" value={approvalEndsAt} onChange={(event) => setApprovalEndsAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="approvalNote">Nota interna</Label>
            <Textarea id="approvalNote" value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} rows={3} />
          </div>
        </div>
      </ActionDialog>

      <ActionDialog
        open={Boolean(rejectRequest)}
        onOpenChange={(open) => !open && setRejectRequest(null)}
        title="Rechazar solicitud"
        description="Registra una nota interna. No se borra el usuario Auth."
        destructive
        loading={rejectMutation.isPending}
        error={formError ?? (rejectMutation.error instanceof Error ? rejectMutation.error.message : null)}
        submitLabel="Rechazar"
        onSubmit={submitReject}
      >
        <div className="space-y-2">
          <Label htmlFor="rejectNote">Nota interna</Label>
          <Textarea id="rejectNote" value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} rows={4} />
        </div>
      </ActionDialog>

      <ActionDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        title="Crear codigo de invitacion"
        description="El codigo se guarda en tenant_invites y se canjea desde /activate."
        loading={createInviteMutation.isPending}
        error={formError ?? (createInviteMutation.error instanceof Error ? createInviteMutation.error.message : null)}
        submitLabel="Crear codigo"
        onSubmit={submitInvite}
      >
        <div className="grid gap-4">
          <TenantSelect label="Tenant" value={inviteTenantId} onChange={setInviteTenantId} tenants={tenants} />
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Codigo</Label>
            <Input id="inviteCode" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="HSM-CORTESIA-2026" />
          </div>
          <RoleSelect label="Rol" value={inviteRoleCode} onChange={setInviteRoleCode} roleCodes={roleCodes} />
          <PlanSelect label="Plan" value={invitePlanCode} onChange={setInvitePlanCode} />
          <div className="space-y-2">
            <Label htmlFor="inviteMaxUses">Usos maximos</Label>
            <Input id="inviteMaxUses" type="number" min={1} value={inviteMaxUses} onChange={(event) => setInviteMaxUses(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteExpiresAt">Expira en</Label>
            <Input id="inviteExpiresAt" type="datetime-local" value={inviteExpiresAt} onChange={(event) => setInviteExpiresAt(event.target.value)} />
          </div>
        </div>
      </ActionDialog>

      <ActionDialog
        open={courtesyDialogOpen}
        onOpenChange={setCourtesyDialogOpen}
        title="Dar membresia de cortesia"
        description="Requiere que el usuario exista previamente en Supabase Auth. No se crean contrasenas desde frontend."
        loading={grantCourtesyMutation.isPending}
        error={formError ?? (grantCourtesyMutation.error instanceof Error ? grantCourtesyMutation.error.message : null)}
        submitLabel="Dar cortesia"
        onSubmit={submitGrant}
      >
        <div className="grid gap-4">
          <TenantSelect label="Tenant" value={grantTenantId} onChange={setGrantTenantId} tenants={tenants} />
          <div className="space-y-2">
            <Label htmlFor="grantEmail">Email Auth existente</Label>
            <Input id="grantEmail" type="email" value={grantEmail} onChange={(event) => setGrantEmail(event.target.value)} />
          </div>
          <RoleSelect label="Rol" value={grantRoleCode} onChange={setGrantRoleCode} roleCodes={roleCodes} />
          <PlanSelect label="Plan" value={grantPlanCode} onChange={setGrantPlanCode} />
          <div className="space-y-2">
            <Label htmlFor="grantEndsAt">Fecha fin opcional</Label>
            <Input id="grantEndsAt" type="datetime-local" value={grantEndsAt} onChange={(event) => setGrantEndsAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grantReason">Motivo</Label>
            <Textarea id="grantReason" value={grantReason} onChange={(event) => setGrantReason(event.target.value)} rows={3} />
          </div>
        </div>
      </ActionDialog>

      <ActionDialog
        open={assignPlanDialogOpen}
        onOpenChange={setAssignPlanDialogOpen}
        title="Asignar plan al tenant"
        description="Operacion manual protegida por platform_superadmin. No ejecuta cobros ni integra proveedor de pagos."
        loading={assignPlanMutation.isPending}
        error={formError ?? (assignPlanMutation.error instanceof Error ? assignPlanMutation.error.message : null)}
        submitLabel="Asignar plan"
        onSubmit={submitAssignPlan}
      >
        <div className="grid gap-4">
          <TenantSelect label="Tenant" value={assignTenantId} onChange={setAssignTenantId} tenants={tenants} />
          <PlanSelect label="Plan" value={assignPlanCode} onChange={setAssignPlanCode} />
          <SubscriptionStatusSelect label="Estado" value={assignStatus} onChange={setAssignStatus} />
          <div className="space-y-2">
            <Label htmlFor="assignEndsAt">Fecha fin opcional</Label>
            <Input id="assignEndsAt" type="datetime-local" value={assignEndsAt} onChange={(event) => setAssignEndsAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignNotes">Nota interna</Label>
            <Textarea id="assignNotes" value={assignNotes} onChange={(event) => setAssignNotes(event.target.value)} rows={3} />
          </div>
        </div>
      </ActionDialog>

      <ActionDialog
        open={tenantCourtesyDialogOpen}
        onOpenChange={setTenantCourtesyDialogOpen}
        title="Dar cortesia al tenant"
        description="Asigna plan courtesy con vencimiento. Al vencer, los modulos premium deben quedar bloqueados y se conserva acceso basico."
        loading={grantTenantCourtesyMutation.isPending}
        error={formError ?? (grantTenantCourtesyMutation.error instanceof Error ? grantTenantCourtesyMutation.error.message : null)}
        submitLabel="Dar cortesia"
        onSubmit={submitTenantCourtesy}
      >
        <div className="grid gap-4">
          <TenantSelect label="Tenant" value={tenantCourtesyTenantId} onChange={setTenantCourtesyTenantId} tenants={tenants} />
          <div className="space-y-2">
            <Label>Duracion rapida</Label>
            <Select value={tenantCourtesyDays} onValueChange={setTenantCourtesyDays}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar duracion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantCourtesyEndsAt">Fecha personalizada opcional</Label>
            <Input id="tenantCourtesyEndsAt" type="datetime-local" value={tenantCourtesyEndsAt} onChange={(event) => setTenantCourtesyEndsAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantCourtesyNotes">Nota interna</Label>
            <Textarea id="tenantCourtesyNotes" value={tenantCourtesyNotes} onChange={(event) => setTenantCourtesyNotes(event.target.value)} rows={3} />
          </div>
        </div>
      </ActionDialog>

      <ActionDialog
        open={Boolean(extendSubscription)}
        onOpenChange={(open) => !open && setExtendSubscription(null)}
        title="Extender cortesia"
        description="Actualiza fecha de vencimiento del plan courtesy para el tenant."
        loading={extendCourtesyMutation.isPending}
        error={formError ?? (extendCourtesyMutation.error instanceof Error ? extendCourtesyMutation.error.message : null)}
        submitLabel="Extender"
        onSubmit={submitExtendCourtesy}
      >
        <div className="grid gap-4">
          <ReadOnlyField label="Tenant" value={extendSubscription?.tenantName ?? "Tenant"} />
          <div className="space-y-2">
            <Label htmlFor="extendEndsAt">Nueva fecha fin</Label>
            <Input id="extendEndsAt" type="datetime-local" value={extendEndsAt} onChange={(event) => setExtendEndsAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extendNote">Nota interna</Label>
            <Textarea id="extendNote" value={subscriptionActionNote} onChange={(event) => setSubscriptionActionNote(event.target.value)} rows={3} />
          </div>
        </div>
      </ActionDialog>

      <ActionDialog
        open={Boolean(cancelSubscription)}
        onOpenChange={(open) => !open && setCancelSubscription(null)}
        title="Cancelar cortesia"
        description="La suscripcion vuelve a plan free. No elimina datos ni usuarios."
        destructive
        loading={cancelCourtesyMutation.isPending}
        error={formError ?? (cancelCourtesyMutation.error instanceof Error ? cancelCourtesyMutation.error.message : null)}
        submitLabel="Cancelar cortesia"
        onSubmit={submitCancelCourtesy}
      >
        <div className="grid gap-4">
          <ReadOnlyField label="Tenant" value={cancelSubscription?.tenantName ?? "Tenant"} />
          <div className="space-y-2">
            <Label htmlFor="cancelNote">Nota interna</Label>
            <Textarea id="cancelNote" value={subscriptionActionNote} onChange={(event) => setSubscriptionActionNote(event.target.value)} rows={3} />
          </div>
        </div>
      </ActionDialog>
    </div>
  );
}

function TableHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-border px-5 py-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{subtitle}</div>
      <h3 className="mt-0.5 text-[15px] font-medium">{title}</h3>
    </div>
  );
}

function CommercialMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised/40 p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{formatInteger(value)}</div>
    </div>
  );
}

function LoadingRow({ text }: { text: string }) {
  return <div className="px-5 py-4 text-[12px] text-muted-foreground">{text}</div>;
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-5 py-6 text-[12px] text-muted-foreground">{text}</div>;
}

function PlatformUserRow({
  user,
  subscription,
  onOpen,
}: {
  user: PlatformUser;
  subscription: TenantSubscriptionRecord | null;
  onOpen: () => void;
}) {
  return (
    <div className="grid gap-3 px-5 py-4 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{user.fullName}</span>
          <StatusBadge value={user.status} />
          {user.roleCodes.includes("platform_superadmin") && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Platform admin
            </Badge>
          )}
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">{user.email}</div>
      </div>
      <div className="text-[12px] text-muted-foreground">
        <div>{user.tenantName}</div>
        <div className="mt-1 text-[11px]">Actualizado: {formatDateTime(user.updatedAt)}</div>
      </div>
      <div className="space-y-2">
        <TenantPlanBadge subscription={subscription} />
        <div className="flex flex-wrap gap-1">
          {user.roleCodes.slice(0, 3).map((role) => (
            <Badge key={role} variant="outline" className="text-[10px]">
              {role}
            </Badge>
          ))}
          {user.roleCodes.length > 3 && (
            <Badge variant="outline" className="text-[10px]">
              +{formatInteger(user.roleCodes.length - 3)}
            </Badge>
          )}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onOpen}>
        Ver detalle
      </Button>
    </div>
  );
}

function RequestRow({
  request,
  onApprove,
  onReject,
}: {
  request: AccessRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{request.fullName ?? request.email}</span>
          <StatusBadge value={request.status} />
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">
          {request.email} {request.jobTitle ? `- ${request.jobTitle}` : ""}
        </div>
        {request.message && <div className="mt-2 text-[12px] text-muted-foreground">{request.message}</div>}
      </div>
      <div className="text-[11px] text-muted-foreground">
        <div>Tenant solicitado: {request.requestedTenantName ?? "Por definir"}</div>
        <div>Codigo: {request.requestedInviteCode ?? "No registrado"}</div>
        <div>Creada: {formatDateTime(request.createdAt)}</div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onApprove}>
          Aprobar
        </Button>
        <Button size="sm" variant="outline" onClick={onReject}>
          Rechazar
        </Button>
      </div>
    </div>
  );
}

function InviteRow({ invite, onDeactivate, busy }: { invite: TenantInviteCode; onDeactivate: () => void; busy: boolean }) {
  return (
    <div className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] font-semibold">{invite.inviteCode}</span>
          <StatusBadge value={invite.status} />
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">
          Rol {invite.roleCode} - plan {invite.planCode}
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground">
        <div>Usos: {formatInteger(invite.usedCount)} / {invite.maxUses ?? "sin limite"}</div>
        <div>Expira: {formatDateTime(invite.expiresAt)}</div>
      </div>
      <Button size="sm" variant="outline" onClick={onDeactivate} disabled={busy || invite.status !== "active"}>
        Desactivar
      </Button>
    </div>
  );
}

function GrantRow({ grant, onRevoke, busy }: { grant: CourtesyMembership; onRevoke: () => void; busy: boolean }) {
  return (
    <div className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{grant.fullName}</span>
          <StatusBadge value={grant.status} />
          <Badge variant="outline">{grant.planCode}</Badge>
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">{grant.email}</div>
      </div>
      <div className="text-[11px] text-muted-foreground">
        <div>{grant.tenantName}</div>
        <div>Inicio: {formatDateTime(grant.startsAt)}</div>
        <div>Fin: {formatDateTime(grant.endsAt)}</div>
      </div>
      <Button size="sm" variant="outline" onClick={onRevoke} disabled={busy || grant.status !== "active"}>
        Cancelar
      </Button>
    </div>
  );
}

function getUniqueEnabledFeatures(
  entitlements: Array<{ featureKey: string; enabled: boolean; limitValue?: number | null }>,
) {
  const featuresByKey = new Map<string, { featureKey: string; enabled: boolean; limitValue?: number | null }>();

  for (const entitlement of entitlements) {
    if (!entitlement.enabled || featuresByKey.has(entitlement.featureKey)) continue;
    featuresByKey.set(entitlement.featureKey, entitlement);
  }

  return Array.from(featuresByKey.values());
}

function PlanRow({
  plan,
  entitlements,
}: {
  plan: SubscriptionPlanRecord;
  entitlements: Array<{ featureKey: string; enabled: boolean; limitValue?: number | null }>;
}) {
  const enabledFeatures = getUniqueEnabledFeatures(entitlements);
  return (
    <div className="grid gap-3 px-5 py-4 xl:grid-cols-[1.1fr_1fr_1fr] xl:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{plan.name}</span>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {plan.code}
          </Badge>
          <Badge variant={plan.isPaid ? "default" : "outline"}>{plan.isPaid ? "Pago futuro" : "Sin cobro"}</Badge>
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">{plan.description ?? "Sin descripcion registrada."}</div>
      </div>
      <div className="text-[12px] text-muted-foreground">
        <div>Usuarios: {plan.maxUsers ?? "sin limite"}</div>
        <div>Pacientes: {plan.maxPatients ?? "sin limite"}</div>
        <div>Storage: {plan.maxStorageMb ? `${formatInteger(plan.maxStorageMb)} MB` : "sin limite"}</div>
      </div>
      <div className="flex flex-wrap gap-1">
        {enabledFeatures.slice(0, 8).map((feature) => (
          <Badge key={feature.featureKey} variant="outline" className="text-[10px]">
            {feature.featureKey}
            {getPlanLimit({ planCode: plan.code, status: "active", entitlements }, feature.featureKey) != null
              ? `:${getPlanLimit({ planCode: plan.code, status: "active", entitlements }, feature.featureKey)}`
              : ""}
          </Badge>
        ))}
        {enabledFeatures.length === 0 && <span className="text-[12px] text-muted-foreground">Entitlements pendientes.</span>}
      </div>
    </div>
  );
}

function SubscriptionRow({
  subscription,
  onExtend,
  onCancel,
  busy,
}: {
  subscription: TenantSubscriptionRecord;
  onExtend: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const snapshot = {
    planCode: subscription.planCode,
    status: subscription.status,
    endsAt: subscription.endsAt,
    trialEndsAt: subscription.trialEndsAt,
    courtesyEndsAt: subscription.courtesyEndsAt,
  };
  const isCourtesy = subscription.planCode === "courtesy" || subscription.status === "courtesy";
  return (
    <div className="grid gap-3 px-5 py-4 xl:grid-cols-[1.2fr_1fr_auto] xl:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{subscription.tenantName}</span>
          <SubscriptionBadge subscription={snapshot} />
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">
          {subscription.planName} - proveedor {subscription.paymentProvider ?? "none"}
        </div>
        {subscription.notes && <div className="mt-2 text-[12px] text-muted-foreground">{subscription.notes}</div>}
      </div>
      <div className="text-[11px] text-muted-foreground">
        <div>Inicio: {formatDateTime(subscription.startsAt)}</div>
        <div>Fin: {formatDateTime(subscription.endsAt ?? subscription.courtesyEndsAt ?? subscription.trialEndsAt)}</div>
        <div>Actualizado: {formatDateTime(subscription.updatedAt)}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onExtend} disabled={busy || !isCourtesy}>
          Extender
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={busy || !isCourtesy}>
          Cancelar cortesia
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const className =
    value === "approved" || value === "active"
      ? "border-risk-low/30 bg-risk-low/10 text-risk-low"
      : value === "pending"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-risk-high/30 bg-risk-high/10 text-risk-high";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${className}`}>{value}</span>;
}

function TenantPlanBadge({ subscription }: { subscription: TenantSubscriptionRecord | null }) {
  if (!subscription) {
    return <Badge variant="outline">Sin plan registrado</Badge>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <SubscriptionBadge
        subscription={{
          planCode: subscription.planCode,
          status: subscription.status,
          endsAt: subscription.endsAt,
          trialEndsAt: subscription.trialEndsAt,
          courtesyEndsAt: subscription.courtesyEndsAt,
        }}
      />
      <span className="text-[11px] text-muted-foreground">{subscription.planName}</span>
    </span>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-[13px]">{value}</div>
    </div>
  );
}

function MembershipStatusSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PlatformUser["status"];
  onChange: (value: PlatformUser["status"]) => void;
}) {
  const statuses: PlatformUser["status"][] = ["active", "invited", "inactive"];
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as PlatformUser["status"])}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar estado" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TenantSelect({
  label,
  value,
  onChange,
  tenants,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tenants: Array<{ id: string; name?: string | null }>;
}) {
  const items = tenants.length > 0 ? tenants : [{ id: DEFAULT_TENANT_ID, name: "HSM / tenant base" }];
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar tenant" />
        </SelectTrigger>
        <SelectContent>
          {items.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.name ?? tenant.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RoleSelect({
  label,
  value,
  onChange,
  roleCodes,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  roleCodes: string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar rol" />
        </SelectTrigger>
        <SelectContent>
          {roleCodes.map((roleCode) => (
            <SelectItem key={roleCode} value={roleCode}>
              {roleCode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PlanSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MembershipPlanCode;
  onChange: (value: MembershipPlanCode) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as MembershipPlanCode)}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar plan" />
        </SelectTrigger>
        <SelectContent>
          {MEMBERSHIP_PLAN_CODES.map((planCode) => (
            <SelectItem key={planCode} value={planCode}>
              {presentMembershipPlanCode(planCode)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SubscriptionStatusSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SubscriptionStatus;
  onChange: (value: SubscriptionStatus) => void;
}) {
  const statuses: SubscriptionStatus[] = ["active", "trialing", "courtesy", "past_due", "cancelled", "expired"];
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as SubscriptionStatus)}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar estado" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function presentMembershipPlanCode(planCode: MembershipPlanCode) {
  if (planCode === "free") return "Free";
  if (planCode === "pro") return "Pro";
  if (planCode === "clinic_hospital") return "Clinic/Hospital";
  return "Courtesy";
}

function calculateFutureDateTime(days: number) {
  if (!Number.isFinite(days) || days <= 0) return "";
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateTimeLocal(date.toISOString());
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
