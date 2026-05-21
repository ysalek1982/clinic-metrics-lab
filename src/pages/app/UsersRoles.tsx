import { useState } from "react";
import { KeyRound, Plus, ShieldCheck, UserCog, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  useAdminInviteUser,
  useAdminMemberships,
  useRolePermissionCatalog,
  useTenantInvites,
  useTenantTeam,
  useUpdateAdminMembershipStatus,
  useUpsertAdminMembership,
} from "@/hooks/useClinicalData";
import { useTenantCatalog } from "@/hooks/useSaasCatalogs";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { resolveViewSource } from "@/lib/view-source";
import { presentUpperStatus } from "@/lib/presentation";

export default function UsersRoles() {
  const { activeTenant, activeTenantId } = useTenantRuntime();
  const { activationRequired, isAuthenticated } = useAuth();
  const teamQuery = useTenantTeam();
  const roleCatalogQuery = useRolePermissionCatalog();
  const inviteQuery = useTenantInvites();
  const tenantCatalogQuery = useTenantCatalog();
  const { currentMembership, effectivePermissionIds, hasPermission, isPlatformSuperadmin } = useAuthorization();
  const adminInviteUser = useAdminInviteUser();
  const upsertMembership = useUpsertAdminMembership();
  const updateMembershipStatus = useUpdateAdminMembershipStatus();
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteTitle, setInviteTitle] = useState("Usuario QA");
  const [roleCode, setRoleCode] = useState("clinical_nutritionist");
  const [membershipEmail, setMembershipEmail] = useState("");
  const [membershipTitle, setMembershipTitle] = useState("QA Membership F12E");
  const [membershipRoleCode, setMembershipRoleCode] = useState("clinical_nutritionist");
  const [membershipStatus, setMembershipStatus] = useState<"active" | "invited" | "inactive">("active");
  const [selectedTenantId, setSelectedTenantId] = useState(activeTenantId ?? "");
  const teamResult = teamQuery.data ?? { source: "supabase" as const, data: [] };
  const roleCatalog = roleCatalogQuery.data ?? { source: "supabase" as const, data: { roles: [], permissions: [] } };
  const inviteResult = inviteQuery.data ?? { source: "supabase" as const, data: [] };
  const tenantCatalog = tenantCatalogQuery.data ?? { source: "supabase" as const, data: [] };
  const effectiveTenantId = selectedTenantId || activeTenantId;
  const adminMembershipQuery = useAdminMemberships(effectiveTenantId);
  const team = teamResult.data ?? [];
  const roles = roleCatalog.data?.roles ?? [];
  const assignableRoles = roles.filter((role) => isPlatformSuperadmin || role.id !== "platform_superadmin");
  const permissions = roleCatalog.data?.permissions ?? [];
  const invites = inviteResult.data ?? [];
  const tenants = tenantCatalog.data ?? [];
  const adminMemberships = adminMembershipQuery.data ?? [];
  const canInvite = isPlatformSuperadmin || hasPermission("users.manage");
  const canManageMemberships = isPlatformSuperadmin || hasPermission("users.manage", "memberships.manage");
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [teamResult.source, roleCatalog.source, inviteResult.source, tenantCatalog.source],
  });

  async function handleInviteAuthUser() {
    if (!effectiveTenantId || !email.trim() || !roleCode.trim()) return;
    await adminInviteUser.mutateAsync({
      tenantId: effectiveTenantId,
      email: email.trim(),
      fullName: inviteFullName.trim() || null,
      roleCode,
      title: inviteTitle.trim() || null,
      status: "active",
      createMembership: true,
      mode: "invite",
    });
    setEmail("");
    setInviteFullName("");
    setInviteTitle("Usuario QA");
    setShowCreate(false);
  }

  async function handleInviteAuthForMembership() {
    if (!effectiveTenantId || !membershipEmail.trim() || !membershipRoleCode.trim()) return;

    await adminInviteUser.mutateAsync({
      tenantId: effectiveTenantId,
      email: membershipEmail.trim(),
      fullName: membershipEmail.trim(),
      roleCode: membershipRoleCode,
      status: membershipStatus,
      title: membershipTitle.trim() || null,
      createMembership: true,
      mode: "invite",
    });
  }

  async function handleAssignMembership() {
    if (!effectiveTenantId || !membershipEmail.trim() || !membershipRoleCode.trim()) return;

    await upsertMembership.mutateAsync({
      tenantId: effectiveTenantId,
      email: membershipEmail.trim(),
      roleCode: membershipRoleCode,
      status: membershipStatus,
      title: membershipTitle.trim() || null,
    });

    setMembershipEmail("");
    setMembershipTitle("QA Membership F12E");
    setMembershipStatus("active");
  }

  async function handleUpsertExistingMembership(membership: (typeof adminMemberships)[number]) {
    await upsertMembership.mutateAsync({
      tenantId: membership.tenantId,
      email: membership.email,
      roleCode: membershipRoleCode,
      status: membershipStatus,
      title: membershipTitle.trim() || membership.title || null,
    });
  }

  async function handleSetMembershipStatus(membershipId: string, status: "active" | "invited" | "inactive") {
    await updateMembershipStatus.mutateAsync({ membershipId, status });
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{`Identidad y accesos - ${activeTenant?.slug ?? "tenant"}`}</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Usuarios, roles y scopes"
        subtitle="Roles predeterminados, permisos granulares y alcance por sede, servicio, pack o paciente."
        actions={
          <Button
            size="sm"
            className="h-8 border-0 text-primary-foreground gradient-primary"
            onClick={() => setShowCreate((current) => !current)}
            disabled={!canInvite}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Invitar usuario
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {activationRequired && (
          <div className="panel p-5 text-[13px] text-muted-foreground">
            El usuario autenticado aún no tiene tenant activo. Completa el canje de invitación antes de administrar accesos.
          </div>
        )}

        {viewSource === "fallback" && (
          <div className="panel p-5 text-[12px] text-muted-foreground">
            La gestión de accesos mantiene la vista operativa mientras terminan de sincronizarse memberships, roles o invitaciones del tenant.
          </div>
        )}

        {showCreate && canInvite && (
          <div className="panel space-y-4 p-5">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Edge Function segura</div>
              <h3 className="mt-1 text-[15px] font-medium">Invitar usuario Auth</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Usa service role solo del lado servidor y valida users.manage/memberships.manage antes de invitar.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  data-testid="admin-invite-email-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@tenant.health"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  data-testid="admin-invite-name-input"
                  value={inviteFullName}
                  onChange={(event) => setInviteFullName(event.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol base</Label>
                <Select value={roleCode} onValueChange={setRoleCode}>
                  <SelectTrigger data-testid="admin-invite-role-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cargo o nota</Label>
                <Input
                  data-testid="admin-invite-title-input"
                  value={inviteTitle}
                  onChange={(event) => setInviteTitle(event.target.value)}
                  placeholder="Usuario QA"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="admin-invite-auth-button"
                onClick={() => void handleInviteAuthUser()}
                disabled={adminInviteUser.isPending || !email.trim() || !effectiveTenantId}
              >
                {adminInviteUser.isPending ? "Invitando..." : "Invitar usuario Auth"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
            {adminInviteUser.isSuccess && (
              <div className="text-[12px] text-risk-low">Usuario invitado y auditado correctamente.</div>
            )}
            {adminInviteUser.isError && (
              <div className="text-[12px] text-risk-high">
                {adminInviteUser.error instanceof Error ? adminInviteUser.error.message : "No se pudo invitar el usuario Auth."}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel space-y-4 p-5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-[15px] font-medium">Asignar usuario a organizacion</h3>
                <p className="text-[12px] text-muted-foreground">
                  Gestiona memberships de usuarios existentes en Supabase Auth. La app no usa service role en frontend.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Organizacion</Label>
                <Select value={effectiveTenantId ?? ""} onValueChange={setSelectedTenantId} disabled={!canManageMemberships}>
                  <SelectTrigger data-testid="admin-membership-tenant-select"><SelectValue placeholder="Selecciona tenant" /></SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                    ))}
                    {tenants.length === 0 && activeTenantId && (
                      <SelectItem value={activeTenantId}>{activeTenant?.name ?? "Tenant activo"}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email del usuario</Label>
                <Input
                  data-testid="admin-membership-email-input"
                  value={membershipEmail}
                  onChange={(event) => setMembershipEmail(event.target.value)}
                  placeholder="usuario@clinica.com"
                  disabled={!canManageMemberships}
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={membershipRoleCode} onValueChange={setMembershipRoleCode} disabled={!canManageMemberships}>
                  <SelectTrigger data-testid="admin-membership-role-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={membershipStatus} onValueChange={(value) => setMembershipStatus(value as typeof membershipStatus)} disabled={!canManageMemberships}>
                  <SelectTrigger data-testid="admin-membership-status-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="invited">Invitado</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Cargo o nota interna</Label>
                <Input
                  data-testid="admin-membership-title-input"
                  value={membershipTitle}
                  onChange={(event) => setMembershipTitle(event.target.value)}
                  placeholder="Nutricionista clinico QA"
                  disabled={!canManageMemberships}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="admin-membership-submit-button"
                onClick={() => void handleAssignMembership()}
                disabled={!canManageMemberships || upsertMembership.isPending || !membershipEmail.trim()}
              >
                {upsertMembership.isPending ? "Guardando..." : "Asignar o actualizar membership"}
              </Button>
              <Button
                variant="outline"
                data-testid="admin-membership-invite-auth-button"
                onClick={() => void handleInviteAuthForMembership()}
                disabled={!canManageMemberships || adminInviteUser.isPending || !membershipEmail.trim()}
              >
                {adminInviteUser.isPending ? "Invitando..." : "Invitar Auth seguro"}
              </Button>
            </div>
            {upsertMembership.isError && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                {upsertMembership.error instanceof Error ? upsertMembership.error.message : "No se pudo actualizar el membership."}
              </div>
            )}
            {upsertMembership.isSuccess && (
              <div className="rounded-md border border-risk-low/30 bg-risk-low/10 px-3 py-2 text-[12px] text-risk-low">
                Membership actualizado y auditado.
              </div>
            )}
            {adminInviteUser.isError && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                {adminInviteUser.error instanceof Error ? adminInviteUser.error.message : "No se pudo invitar el usuario Auth."}
              </div>
            )}
            {adminInviteUser.isSuccess && (
              <div className="rounded-md border border-risk-low/30 bg-risk-low/10 px-3 py-2 text-[12px] text-risk-low">
                Invitacion Auth procesada por Edge Function y auditoria solicitada.
              </div>
            )}
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-medium">Memberships administrables</h3>
              <p className="text-[12px] text-muted-foreground">
                Usuarios con pertenencia al tenant seleccionado. No se muestran usuarios Auth sin membership hasta que se asignen.
              </p>
            </div>
            <div className="max-h-[360px] divide-y divide-border overflow-auto">
              {adminMembershipQuery.isLoading && (
                <div className="px-5 py-8 text-[13px] text-muted-foreground">Cargando memberships...</div>
              )}
              {!adminMembershipQuery.isLoading && adminMemberships.length === 0 && (
                <div className="px-5 py-8 text-[13px] text-muted-foreground">
                  No hay memberships visibles para este tenant o faltan permisos administrativos.
                </div>
              )}
              {adminMemberships.map((membership) => (
                <div
                  key={membership.membershipId}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]"
                  data-testid={`admin-membership-row-${membership.membershipId}`}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium">{membership.fullName}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{membership.email} - {membership.tenantName}</div>
                    {membership.title && <div className="mt-1 text-[11px] text-muted-foreground">{membership.title}</div>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {membership.roleNames.map((roleName, index) => (
                        <span key={`${membership.membershipId}-${roleName}`} className="rounded-full border border-border px-2 py-1 text-[10px] font-mono text-muted-foreground">
                          {roleName || membership.roleCodes[index]}
                        </span>
                      ))}
                      <Status value={membership.status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canManageMemberships || updateMembershipStatus.isPending || membership.status === "active"}
                      data-testid={`admin-membership-reactivate-${membership.membershipId}`}
                      onClick={() => void handleSetMembershipStatus(membership.membershipId, "active")}
                    >
                      Reactivar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canManageMemberships || updateMembershipStatus.isPending || membership.status === "inactive"}
                      data-testid={`admin-membership-deactivate-${membership.membershipId}`}
                      onClick={() => void handleSetMembershipStatus(membership.membershipId, "inactive")}
                    >
                      Desactivar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canManageMemberships || upsertMembership.isPending || !membership.email}
                      data-testid={`admin-membership-upsert-${membership.membershipId}`}
                      onClick={() => void handleUpsertExistingMembership(membership)}
                    >
                      Actualizar rol
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Preparar usuarios QA</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {[
              { email: "qa-no-membership@nutri.test", expected: "Usuario Auth confirmado, sin membership activo." },
              { email: "qa-hsm-clinical@nutri.test", expected: "Membership activo solo HSM con rol clinico no-superadmin." },
              { email: "qa-tenant-b-clinical@nutri.test", expected: "Membership activo solo tenant B con rol clinico no-superadmin." },
              { email: "qa-e2e-hsm@nutri.test", expected: "Membership activo HSM con permisos suficientes para E2E Enteral." },
            ].map((qaUser) => {
              const memberships = adminMemberships.filter((membership) => membership.email.toLowerCase() === qaUser.email);
              return (
                <div key={qaUser.email} className="rounded-lg border border-border bg-surface-raised/40 p-4">
                  <div className="text-[12px] font-medium">{qaUser.email}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{qaUser.expected}</div>
                  <div className="mt-3 text-[10px] font-mono uppercase text-muted-foreground">
                    {memberships.length > 0 ? "Membership visible" : "Crear en Supabase Auth si no existe"}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-[12px] text-muted-foreground">
            La creacion de usuarios Auth usa la Edge Function segura admin-invite-user si esta desplegada. Si no responde, se debe crear el usuario en Supabase Dashboard y luego asignar membership desde esta pantalla.
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <UserCog className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-[15px] font-medium">Equipo del tenant</h3>
                <p className="text-[12px] text-muted-foreground">{activeTenant?.name ?? "Tenant activo"}</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {team.map((member) => (
                <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-[11px] font-mono font-bold text-primary">
                    {member.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{member.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {member.email} · {member.title}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {member.roleIds.map((roleId) => (
                        <span key={roleId} className="rounded-full border border-border px-2 py-1 text-[10px] font-mono text-muted-foreground">
                          {roles.find((role) => role.id === roleId)?.name ?? roleId}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Status value={member.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="text-[15px] font-medium">Roles base</h3>
                  <p className="text-[12px] text-muted-foreground">Modelo RBAC derivado de Supabase.</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                {roles.map((role) => (
                  <div key={role.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13px] font-medium">{role.name}</div>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">{role.level}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{role.description}</p>
                    <div className="mt-2 text-[10px] font-mono text-primary">{role.permissions.length} permisos</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Contexto actual</div>
              <div className="mt-2 text-[12px] text-muted-foreground">
                Rol activo: {currentMembership?.roleCodes?.join(", ") || "sin rol activo"}
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                Perfil: {isPlatformSuperadmin ? "platform_superadmin" : canInvite ? "gestor tenant" : "lectura/restringido"}
              </div>
            </div>

            <div className="panel p-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Invitaciones recientes</div>
              <div className="mt-3 space-y-2">
                {invites.length === 0 && <div className="text-[12px] text-muted-foreground">Sin invitaciones emitidas en este contexto.</div>}
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded-md bg-surface-raised/50 px-3 py-2">
                    <div className="text-[12px] font-medium">{invite.invite_code}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{invite.role_code} · {invite.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <KeyRound className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-[15px] font-medium">Permisos granulares</h3>
              <p className="text-[12px] text-muted-foreground">Acciones atómicas por recurso y alcance.</p>
            </div>
          </div>
          <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-3">
            {permissions.map((permission) => (
              <div key={permission.id} className="bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-medium">{permission.id}</div>
                  {effectivePermissionIds.includes(permission.id) && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono text-primary">activo</span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{permission.description}</div>
                <div className="mt-3 flex gap-2 text-[10px] font-mono uppercase">
                  <span className="rounded bg-primary/10 px-2 py-1 text-primary">{permission.action}</span>
                  <span className="rounded bg-surface-raised px-2 py-1 text-muted-foreground">{permission.scope}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const color =
    value === "active"
      ? "text-risk-low bg-risk-low/10"
      : value === "invited"
        ? "text-primary bg-primary/10"
        : "text-muted-foreground bg-surface-raised";

  return <span className={`rounded-full px-2 py-1 text-[10px] font-mono uppercase ${color}`}>{presentUpperStatus(value)}</span>;
}
