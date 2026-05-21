export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type TableDefinition<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown> = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      [key: string]: GenericTable;
      tenants: GenericTable;
      tenant_subscriptions: GenericTable;
      tenant_usage_limits: GenericTable;
      tenant_usage_counters: GenericTable;
      subscription_plans: GenericTable;
      organizations: GenericTable;
      branches: GenericTable;
      departments: GenericTable;
      services: GenericTable;
      tenant_settings: GenericTable;
      branding_settings: GenericTable;
      specialty_packs: GenericTable;
      tenant_enabled_packs: GenericTable;
      user_profiles: GenericTable;
      roles: GenericTable;
      permissions: GenericTable;
      role_permissions: GenericTable;
      tenant_memberships: GenericTable;
      membership_roles: GenericTable;
      membership_scopes: GenericTable;
      tenant_invites: GenericTable;
      patients: TableDefinition<{
        id: string;
        tenant_id: string;
        organization_id: string;
        branch_id: string | null;
        service_id: string | null;
        mrn: string;
        first_name: string;
        last_name: string;
        birth_date: string | null;
        sex: string;
        status: string;
        risk_level: string;
        primary_pack_id: string | null;
        active_pack_ids: string[];
        diagnosis_summary: string | null;
        location_label: string | null;
        last_evaluation_at: string | null;
        next_follow_up_at: string | null;
        metadata: Json;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      }, {
        id: string;
        tenant_id: string;
        organization_id: string;
        branch_id: string | null;
        service_id: string | null;
        mrn: string;
        first_name: string;
        last_name: string;
        birth_date: string | null;
        sex: string;
        status: string;
        risk_level: string;
        primary_pack_id: string | null;
        active_pack_ids: string[];
        diagnosis_summary: string | null;
        location_label: string | null;
        last_evaluation_at: string | null;
        next_follow_up_at: string | null;
        metadata: Json;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      }>;
      patient_contacts: GenericTable;
      encounters: GenericTable;
      clinical_notes: GenericTable;
      activity_logs: GenericTable;
      audit_logs: GenericTable;
      measurement_sites: GenericTable;
      measurement_protocols: GenericTable;
      tenant_measurement_protocols: GenericTable;
      formula_library: GenericTable;
      formula_versions: GenericTable;
      tenant_formula_settings: GenericTable;
      anthropometry_sessions: GenericTable;
      anthropometric_measurements: GenericTable;
      derived_anthropometry_results: GenericTable;
      screening_templates: GenericTable;
      tenant_screening_templates: GenericTable;
      screening_results: GenericTable;
      screening_answers: GenericTable;
      clinical_assessments: GenericTable;
      nutrition_diagnoses: GenericTable;
      nutrition_plans: GenericTable;
      evolution_entries: GenericTable;
      clinical_rules: GenericTable;
      report_runs: GenericTable;
      clinical_modules: GenericTable;
      tenant_enabled_modules: GenericTable;
      pediatric_growth_records: TableDefinition<{
        id: string;
        tenant_id: string;
        organization_id: string | null;
        patient_id: string;
        encounter_id: string | null;
        sex: string;
        sex_reference: string | null;
        age_months: number;
        age_days_total: number | null;
        metric: string | null;
        value: number | null;
        weight_kg: number | null;
        length_cm: number | null;
        height_cm: number | null;
        bmi: number | null;
        head_circumference_cm: number | null;
        arm_circumference_cm: number | null;
        triceps_skinfold_mm: number | null;
        subscapular_skinfold_mm: number | null;
        z_score: number | null;
        percentile: number | null;
        standard_ref: string;
        notes: string | null;
        measured_at: string;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      }, {
        id: string;
        tenant_id: string;
        organization_id: string | null;
        patient_id: string;
        encounter_id: string | null;
        sex: string;
        sex_reference: string | null;
        age_months: number;
        age_days_total: number | null;
        metric: string | null;
        value: number | null;
        weight_kg: number | null;
        length_cm: number | null;
        height_cm: number | null;
        bmi: number | null;
        head_circumference_cm: number | null;
        arm_circumference_cm: number | null;
        triceps_skinfold_mm: number | null;
        subscapular_skinfold_mm: number | null;
        z_score: number | null;
        percentile: number | null;
        standard_ref: string;
        notes: string | null;
        measured_at: string;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      }>;
      pediatric_growth_results: GenericTable;
      growth_reference_sets: GenericTable;
      growth_reference_points: GenericTable;
      tenant_growth_reference_policies: GenericTable;
      pregnancy_records: GenericTable;
      enteral_plans: GenericTable;
      enteral_daily_logs: GenericTable;
      sports_profiles: GenericTable;
      sports_bodycomp_snapshots: GenericTable;
      report_templates: GenericTable;
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Relationships: [];
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
      create_tenant_invite: {
        Args: {
          p_tenant_id: string;
          p_email: string | null;
          p_role_code: string;
          p_expires_at: string | null;
        };
        Returns: unknown;
      };
      create_tenant_blueprint: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
      redeem_tenant_invite: {
        Args: {
          p_invite_code: string;
          p_full_name: string;
          p_title: string | null;
        };
        Returns: unknown;
      };
      current_tenant_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      is_platform_superadmin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      has_tenant_permission: {
        Args: {
          p_tenant_id: string;
          p_permission_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: Record<string, unknown>;
    };
  };
}
