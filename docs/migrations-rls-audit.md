# Auditoria local de migraciones y RLS

Generado: 2026-05-13T06:10:49.002Z

- Artifact: `artifacts/security/migrations-rls-2026-05-13T06-10-48-993Z.json`
- Alcance: analisis estatico. No modifica migraciones aplicadas.

## Tablas detectadas

| Tabla | Migracion | tenant_id | RLS en archivo | Politica en archivo |
|---|---|---:|---:|---:|
| `subscription_plans` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `tenants` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `tenant_subscriptions` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `tenant_usage_limits` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `tenant_usage_counters` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `organizations` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `branches` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `departments` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `services` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `tenant_settings` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `branding_settings` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `specialty_packs` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `tenant_enabled_packs` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `user_profiles` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `roles` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `permissions` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `role_permissions` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `tenant_memberships` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `membership_roles` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `membership_scopes` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `patients` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `patient_contacts` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `encounters` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `clinical_notes` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `activity_logs` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `audit_logs` | `supabase/migrations/20260423152000_saas_foundation.sql` | Si | Si | Si |
| `measurement_sites` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `measurement_protocols` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `tenant_measurement_protocols` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `formula_library` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `formula_versions` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `tenant_formula_settings` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `anthropometry_sessions` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `anthropometric_measurements` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `derived_anthropometry_results` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `screening_templates` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `tenant_screening_templates` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `screening_results` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `screening_answers` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `clinical_assessments` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `nutrition_diagnoses` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `nutrition_plans` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `evolution_entries` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `clinical_rules` | `supabase/migrations/20260423165000_clinical_core.sql` | Si | Si | Si |
| `tenant_invites` | `supabase/migrations/20260423172000_seed_roles_and_invites.sql` | Si | Si | Si |
| `report_runs` | `supabase/migrations/20260423181500_report_runs_and_plan_seed.sql` | Si | Si | Si |
| `clinical_modules` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `tenant_enabled_modules` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `pediatric_growth_records` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `pregnancy_records` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `enteral_plans` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `enteral_daily_logs` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `sports_profiles` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `sports_bodycomp_snapshots` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `report_templates` | `supabase/migrations/20260424110000_pack_module_system.sql` | Si | Si | Si |
| `pediatric_growth_results` | `supabase/migrations/20260424143000_pediatric_growth_foundation.sql` | Si | Si | Si |
| `growth_reference_sets` | `supabase/migrations/20260424143000_pediatric_growth_foundation.sql` | Si | Si | Si |
| `growth_reference_points` | `supabase/migrations/20260424143000_pediatric_growth_foundation.sql` | Si | Si | Si |
| `tenant_growth_reference_policies` | `supabase/migrations/20260424143000_pediatric_growth_foundation.sql` | Si | Si | Si |
| `ccorp_level1_assessments` | `supabase/migrations/20260424210000_ccorp_level1_module.sql` | Si | Si | Si |
| `ccorp_level1_measurements` | `supabase/migrations/20260424210000_ccorp_level1_module.sql` | Si | Si | Si |
| `ccorp_level1_results` | `supabase/migrations/20260424210000_ccorp_level1_module.sql` | Si | Si | Si |
| `ccorp_level1_ideal_weight_targets` | `supabase/migrations/20260424210000_ccorp_level1_module.sql` | Si | Si | Si |
| `ccorp_level1_report_snapshots` | `supabase/migrations/20260424210000_ccorp_level1_module.sql` | Si | Si | Si |
| `alert_acknowledgements` | `supabase/migrations/20260425120000_alert_acknowledgements.sql` | Si | Si | Si |
| `lab_markers` | `supabase/migrations/20260425170000_labs_foundation.sql` | Si | Si | Si |
| `lab_marker_reference_ranges` | `supabase/migrations/20260425170000_labs_foundation.sql` | Si | Si | Si |
| `lab_interpretations` | `supabase/migrations/20260425170000_labs_foundation.sql` | Si | Si | Si |
| `lab_orders` | `supabase/migrations/20260425170000_labs_foundation.sql` | Si | Si | Si |
| `lab_results` | `supabase/migrations/20260425170000_labs_foundation.sql` | Si | Si | Si |
| `appointments` | `supabase/migrations/20260505130000_appointments_foundation.sql` | Si | Si | Si |
| `message_threads` | `supabase/migrations/20260510130000_messages_foundation.sql` | Si | Si | Si |
| `messages` | `supabase/migrations/20260510130000_messages_foundation.sql` | Si | Si | Si |
| `message_read_receipts` | `supabase/migrations/20260510130000_messages_foundation.sql` | Si | Si | Si |
| `food_groups` | `supabase/migrations/20260510150000_operational_nutrition.sql` | Si | Si | Si |
| `food_items` | `supabase/migrations/20260510150000_operational_nutrition.sql` | Si | Si | Si |
| `recipes` | `supabase/migrations/20260510150000_operational_nutrition.sql` | Si | Si | Si |
| `recipe_ingredients` | `supabase/migrations/20260510150000_operational_nutrition.sql` | Si | Si | Si |
| `weekly_menus` | `supabase/migrations/20260510150000_operational_nutrition.sql` | Si | Si | Si |
| `weekly_menu_items` | `supabase/migrations/20260510150000_operational_nutrition.sql` | Si | Si | Si |
| `parenteral_plans` | `supabase/migrations/20260510193000_hospital_nutrition_support.sql` | Si | Si | Si |
| `parenteral_monitoring_logs` | `supabase/migrations/20260510193000_hospital_nutrition_support.sql` | Si | Si | Si |

## Hallazgos

| Archivo | Tabla | Riesgo | Accion |
|---|---|---|---|
| `supabase/migrations/20260423152000_saas_foundation.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423152000_saas_foundation.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423165000_clinical_core.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423172000_seed_roles_and_invites.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423172000_seed_roles_and_invites.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423173500_identity_clinical_demo_baseline.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423173500_identity_clinical_demo_baseline.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423175500_debug_seeded_auth_user.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423181500_report_runs_and_plan_seed.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423183000_create_tenant_blueprint.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423183000_create_tenant_blueprint.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423183500_fix_create_tenant_blueprint_ambiguity.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423183500_fix_create_tenant_blueprint_ambiguity.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423184000_fix_create_tenant_blueprint_membership_conflict.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260423184000_fix_create_tenant_blueprint_membership_conflict.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260424110000_pack_module_system.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260424110000_pack_module_system.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260424143000_pediatric_growth_foundation.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260424143000_pediatric_growth_foundation.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260424170000_harden_core_clinical_rls.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260424170000_harden_core_clinical_rls.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260424190000_harden_specialty_module_rls.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260425170000_labs_foundation.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260510130000_messages_foundation.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260510193000_hospital_nutrition_support.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260510210000_sports_rls_hardening.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260511120000_admin_memberships_management.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260511120000_admin_memberships_management.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
| `supabase/migrations/20260511123000_admin_memberships_upsert_patch.sql` | -- | security_definer_review | Revisar manualmente antes de produccion |
| `supabase/migrations/20260511123000_admin_memberships_upsert_patch.sql` | -- | auth_context_used | Revisar manualmente antes de produccion |
