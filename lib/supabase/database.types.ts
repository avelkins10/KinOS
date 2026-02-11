export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string;
          contact_id: string | null;
          created_at: string | null;
          deal_id: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          title: string;
          user_id: string | null;
        };
        Insert: {
          activity_type: string;
          contact_id?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          title: string;
          user_id?: string | null;
        };
        Update: {
          activity_type?: string;
          contact_id?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      adder_scope_rules: {
        Row: {
          adder_template_id: string;
          created_at: string | null;
          id: string;
          is_inclusion: boolean | null;
          rule_type: string;
          rule_value: string;
        };
        Insert: {
          adder_template_id: string;
          created_at?: string | null;
          id?: string;
          is_inclusion?: boolean | null;
          rule_type: string;
          rule_value: string;
        };
        Update: {
          adder_template_id?: string;
          created_at?: string | null;
          id?: string;
          is_inclusion?: boolean | null;
          rule_type?: string;
          rule_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "adder_scope_rules_adder_template_id_fkey";
            columns: ["adder_template_id"];
            isOneToOne: false;
            referencedRelation: "adder_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      adder_templates: {
        Row: {
          auto_apply_conditions: Json | null;
          category: string | null;
          company_id: string;
          created_at: string | null;
          default_amount: number | null;
          description: string | null;
          display_order: number | null;
          dynamic_input_definitions: Json | null;
          eligible_for_itc: boolean | null;
          id: string;
          is_active: boolean | null;
          is_customer_facing: boolean | null;
          max_amount: number | null;
          min_amount: number | null;
          name: string;
          pricing_model: Json | null;
          pricing_type: string;
          requires_approval: boolean | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          auto_apply_conditions?: Json | null;
          category?: string | null;
          company_id: string;
          created_at?: string | null;
          default_amount?: number | null;
          description?: string | null;
          display_order?: number | null;
          dynamic_input_definitions?: Json | null;
          eligible_for_itc?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_customer_facing?: boolean | null;
          max_amount?: number | null;
          min_amount?: number | null;
          name: string;
          pricing_model?: Json | null;
          pricing_type: string;
          requires_approval?: boolean | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          auto_apply_conditions?: Json | null;
          category?: string | null;
          company_id?: string;
          created_at?: string | null;
          default_amount?: number | null;
          description?: string | null;
          display_order?: number | null;
          dynamic_input_definitions?: Json | null;
          eligible_for_itc?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_customer_facing?: boolean | null;
          max_amount?: number | null;
          min_amount?: number | null;
          name?: string;
          pricing_model?: Json | null;
          pricing_type?: string;
          requires_approval?: boolean | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "adder_templates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          company_id: string;
          contact_id: string;
          deal_id: string | null;
          repcard_appointment_id: number | null;
          closer_id: string | null;
          setter_id: string | null;
          scheduled_start: string;
          scheduled_end: string | null;
          timezone: string | null;
          duration_minutes: number | null;
          location: string | null;
          status: string;
          outcome: string | null;
          outcome_id: number | null;
          outcome_notes: string | null;
          notes: string | null;
          repcard_attachments: Json | null;
          appointment_type: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          contact_id: string;
          deal_id?: string | null;
          repcard_appointment_id?: number | null;
          closer_id?: string | null;
          setter_id?: string | null;
          scheduled_start: string;
          scheduled_end?: string | null;
          timezone?: string | null;
          duration_minutes?: number | null;
          location?: string | null;
          status?: string;
          outcome?: string | null;
          outcome_id?: number | null;
          outcome_notes?: string | null;
          notes?: string | null;
          repcard_attachments?: Json | null;
          appointment_type?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          contact_id?: string;
          deal_id?: string | null;
          repcard_appointment_id?: number | null;
          closer_id?: string | null;
          setter_id?: string | null;
          scheduled_start?: string;
          scheduled_end?: string | null;
          timezone?: string | null;
          duration_minutes?: number | null;
          location?: string | null;
          status?: string;
          outcome?: string | null;
          outcome_id?: number | null;
          outcome_notes?: string | null;
          notes?: string | null;
          repcard_attachments?: Json | null;
          appointment_type?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_closer_id_fkey";
            columns: ["closer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_setter_id_fkey";
            columns: ["setter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      attachments: {
        Row: {
          category: string | null;
          contact_id: string | null;
          created_at: string | null;
          deal_id: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          enerflo_file_id: string | null;
          file_name: string;
          file_size: number | null;
          file_url: string;
          id: string;
          mime_type: string | null;
          repcard_attachment_id: string | null;
          updated_at: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          category?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          enerflo_file_id?: string | null;
          file_name: string;
          file_size?: number | null;
          file_url: string;
          id?: string;
          mime_type?: string | null;
          repcard_attachment_id?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          category?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          enerflo_file_id?: string | null;
          file_name?: string;
          file_size?: number | null;
          file_url?: string;
          id?: string;
          mime_type?: string | null;
          repcard_attachment_id?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          changed_by: string | null;
          changes: Json;
          created_at: string | null;
          id: string;
          ip_address: unknown;
          record_id: string;
          table_name: string;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          changed_by?: string | null;
          changes?: Json;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          record_id: string;
          table_name: string;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          changed_by?: string | null;
          changes?: Json;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          record_id?: string;
          table_name?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      aurora_pricing_syncs: {
        Row: {
          aurora_project_id: string;
          created_at: string | null;
          deal_id: string;
          error_message: string | null;
          id: string;
          request_data: Json | null;
          response_data: Json | null;
          status: string | null;
          sync_type: string;
        };
        Insert: {
          aurora_project_id: string;
          created_at?: string | null;
          deal_id: string;
          error_message?: string | null;
          id?: string;
          request_data?: Json | null;
          response_data?: Json | null;
          status?: string | null;
          sync_type: string;
        };
        Update: {
          aurora_project_id?: string;
          created_at?: string | null;
          deal_id?: string;
          error_message?: string | null;
          id?: string;
          request_data?: Json | null;
          response_data?: Json | null;
          status?: string | null;
          sync_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "aurora_pricing_syncs_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aurora_pricing_syncs_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aurora_pricing_syncs_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
        ];
      };
      commission_structures: {
        Row: {
          applies_to: string;
          base_rate: number | null;
          company_id: string;
          created_at: string | null;
          effective_date: string;
          end_date: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          structure_type: string;
          tiers: Json | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          applies_to: string;
          base_rate?: number | null;
          company_id: string;
          created_at?: string | null;
          effective_date: string;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          structure_type: string;
          tiers?: Json | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          applies_to?: string;
          base_rate?: number | null;
          company_id?: string;
          created_at?: string | null;
          effective_date?: string;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          structure_type?: string;
          tiers?: Json | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commission_structures_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          created_at: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          settings: Json | null;
          slug: string;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          settings?: Json | null;
          slug: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          settings?: Json | null;
          slug?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      contact_change_history: {
        Row: {
          change_source: string | null;
          changed_by: string | null;
          contact_id: string;
          created_at: string | null;
          field_name: string;
          id: string;
          new_value: string | null;
          old_value: string | null;
        };
        Insert: {
          change_source?: string | null;
          changed_by?: string | null;
          contact_id: string;
          created_at?: string | null;
          field_name: string;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
        };
        Update: {
          change_source?: string | null;
          changed_by?: string | null;
          contact_id?: string;
          created_at?: string | null;
          field_name?: string;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_change_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_change_history_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          address: string | null;
          address2: string | null;
          annual_usage_kwh: number | null;
          building_sqft: number | null;
          city: string | null;
          company_id: string;
          contact_source: string | null;
          contact_type: string | null;
          country_code: string | null;
          created_at: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          email: string | null;
          external_id: string | null;
          first_name: string;
          genability_tariff_id: number | null;
          genability_utility_id: number | null;
          has_hoa: boolean | null;
          hoa_contact: string | null;
          hoa_name: string | null;
          id: string;
          last_name: string;
          latitude: number | null;
          longitude: number | null;
          monthly_electric_bill: number | null;
          monthly_usage_kwh: Json | null;
          owner_id: string | null;
          phone: string | null;
          repcard_customer_id: number | null;
          repcard_status: string | null;
          repcard_status_id: number | null;
          roof_age: number | null;
          roof_type: string | null;
          secondary_email: string | null;
          secondary_phone: string | null;
          state: string | null;
          updated_at: string | null;
          updated_by: string | null;
          utility_account_number: string | null;
          utility_company: string | null;
          utility_rate_kwh: number | null;
          utility_tariff_code: string | null;
          utility_tariff_name: string | null;
          zip: string | null;
        };
        Insert: {
          address?: string | null;
          address2?: string | null;
          annual_usage_kwh?: number | null;
          building_sqft?: number | null;
          city?: string | null;
          company_id: string;
          contact_source?: string | null;
          contact_type?: string | null;
          country_code?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          external_id?: string | null;
          first_name: string;
          genability_tariff_id?: number | null;
          genability_utility_id?: number | null;
          has_hoa?: boolean | null;
          hoa_contact?: string | null;
          hoa_name?: string | null;
          id?: string;
          last_name: string;
          latitude?: number | null;
          longitude?: number | null;
          monthly_electric_bill?: number | null;
          monthly_usage_kwh?: Json | null;
          owner_id?: string | null;
          phone?: string | null;
          repcard_customer_id?: number | null;
          repcard_status?: string | null;
          repcard_status_id?: number | null;
          roof_age?: number | null;
          roof_type?: string | null;
          secondary_email?: string | null;
          secondary_phone?: string | null;
          state?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          utility_account_number?: string | null;
          utility_company?: string | null;
          utility_rate_kwh?: number | null;
          utility_tariff_code?: string | null;
          utility_tariff_name?: string | null;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          address2?: string | null;
          annual_usage_kwh?: number | null;
          building_sqft?: number | null;
          city?: string | null;
          company_id?: string;
          contact_source?: string | null;
          contact_type?: string | null;
          country_code?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          external_id?: string | null;
          first_name?: string;
          genability_tariff_id?: number | null;
          genability_utility_id?: number | null;
          has_hoa?: boolean | null;
          hoa_contact?: string | null;
          hoa_name?: string | null;
          id?: string;
          last_name?: string;
          latitude?: number | null;
          longitude?: number | null;
          monthly_electric_bill?: number | null;
          monthly_usage_kwh?: Json | null;
          owner_id?: string | null;
          phone?: string | null;
          repcard_customer_id?: number | null;
          repcard_status?: string | null;
          repcard_status_id?: number | null;
          roof_age?: number | null;
          roof_type?: string | null;
          secondary_email?: string | null;
          secondary_phone?: string | null;
          state?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          utility_account_number?: string | null;
          utility_company?: string | null;
          utility_rate_kwh?: number | null;
          utility_tariff_code?: string | null;
          utility_tariff_name?: string | null;
          zip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_assignment_history: {
        Row: {
          assignment_type: string;
          changed_by: string | null;
          created_at: string | null;
          deal_id: string;
          from_entity_id: string | null;
          from_user_id: string | null;
          id: string;
          reason: string | null;
          to_entity_id: string | null;
          to_user_id: string | null;
        };
        Insert: {
          assignment_type: string;
          changed_by?: string | null;
          created_at?: string | null;
          deal_id: string;
          from_entity_id?: string | null;
          from_user_id?: string | null;
          id?: string;
          reason?: string | null;
          to_entity_id?: string | null;
          to_user_id?: string | null;
        };
        Update: {
          assignment_type?: string;
          changed_by?: string | null;
          created_at?: string | null;
          deal_id?: string;
          from_entity_id?: string | null;
          from_user_id?: string | null;
          id?: string;
          reason?: string | null;
          to_entity_id?: string | null;
          to_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deal_assignment_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_assignment_history_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_assignment_history_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_assignment_history_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_assignment_history_from_user_id_fkey";
            columns: ["from_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_assignment_history_to_user_id_fkey";
            columns: ["to_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_commissions: {
        Row: {
          adjustments: Json | null;
          approved_at: string | null;
          approved_by: string | null;
          base_amount: number | null;
          commission_structure_id: string | null;
          commission_type: string;
          created_at: string | null;
          deal_id: string;
          final_amount: number;
          id: string;
          notes: string | null;
          paid_at: string | null;
          status: string | null;
          updated_at: string | null;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          adjustments?: Json | null;
          approved_at?: string | null;
          approved_by?: string | null;
          base_amount?: number | null;
          commission_structure_id?: string | null;
          commission_type: string;
          created_at?: string | null;
          deal_id: string;
          final_amount: number;
          id?: string;
          notes?: string | null;
          paid_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          adjustments?: Json | null;
          approved_at?: string | null;
          approved_by?: string | null;
          base_amount?: number | null;
          commission_structure_id?: string | null;
          commission_type?: string;
          created_at?: string | null;
          deal_id?: string;
          final_amount?: number;
          id?: string;
          notes?: string | null;
          paid_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_commissions_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_commissions_commission_structure_id_fkey";
            columns: ["commission_structure_id"];
            isOneToOne: false;
            referencedRelation: "commission_structures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_commissions_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_commissions_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_commissions_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_commissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_snapshots: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          deal_id: string;
          id: string;
          proposal_id: string | null;
          snapshot_data: Json;
          snapshot_type: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          deal_id: string;
          id?: string;
          proposal_id?: string | null;
          snapshot_data: Json;
          snapshot_type: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          deal_id?: string;
          id?: string;
          proposal_id?: string | null;
          snapshot_data?: Json;
          snapshot_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_snapshots_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_snapshots_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_snapshots_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_snapshots_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_snapshots_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_stage_history: {
        Row: {
          changed_by: string | null;
          created_at: string | null;
          deal_id: string;
          from_stage: string | null;
          id: string;
          metadata: Json | null;
          notes: string | null;
          to_stage: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string | null;
          deal_id: string;
          from_stage?: string | null;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          to_stage: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string | null;
          deal_id?: string;
          from_stage?: string | null;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          to_stage?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          active_appointment_id: string | null;
          active_proposal_id: string | null;
          adders_total: number | null;
          annual_production_kwh: number | null;
          annual_usage_kwh: number | null;
          appointment_date: string | null;
          appointment_end: string | null;
          appointment_location: string | null;
          appointment_notes: string | null;
          appointment_outcome: string | null;
          appointment_outcome_id: number | null;
          appointment_timezone: string | null;
          aurora_design_id: string | null;
          aurora_project_id: string | null;
          battery_count: number | null;
          battery_model: string | null;
          both_spouses_present: boolean | null;
          closer_id: string | null;
          commission_base: number | null;
          company_id: string;
          contact_id: string;
          created_at: string | null;
          deal_number: string;
          dealer_fee: number | null;
          dealer_fee_percentage: number | null;
          deleted_at: string | null;
          deleted_by: string | null;
          enerflo_deal_id: string | null;
          enerflo_short_code: string | null;
          financing_application_id: string | null;
          financing_approved_at: string | null;
          financing_status: string | null;
          gross_ppw: number | null;
          gross_price: number | null;
          has_hoa: boolean | null;
          id: string;
          install_address: string | null;
          install_address2: string | null;
          install_agreement_signed_at: string | null;
          install_agreement_status: string | null;
          install_city: string | null;
          install_lat: number | null;
          install_lng: number | null;
          install_state: string | null;
          install_zip: string | null;
          intake_reviewed_at: string | null;
          intake_reviewed_by: string | null;
          interest_rate: number | null;
          inverter_model: string | null;
          is_battery_only: boolean | null;
          is_commercial: boolean | null;
          is_new_construction: boolean | null;
          lender_id: string | null;
          loan_amount: number | null;
          loan_product: string | null;
          loan_term_months: number | null;
          monthly_payment: number | null;
          mounting_type: string | null;
          net_ppw: number | null;
          net_price: number | null;
          office_id: string | null;
          offset_percentage: number | null;
          panel_count: number | null;
          panel_model: string | null;
          quickbase_deal_id: string | null;
          rejection_reason: string | null;
          repcard_appointment_id: number | null;
          setter_id: string | null;
          source: string | null;
          stage: string;
          stage_changed_at: string | null;
          submission_status: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          system_size_kw: number | null;
          team_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          active_appointment_id?: string | null;
          active_proposal_id?: string | null;
          adders_total?: number | null;
          annual_production_kwh?: number | null;
          annual_usage_kwh?: number | null;
          appointment_date?: string | null;
          appointment_end?: string | null;
          appointment_location?: string | null;
          appointment_notes?: string | null;
          appointment_outcome?: string | null;
          appointment_outcome_id?: number | null;
          appointment_timezone?: string | null;
          aurora_design_id?: string | null;
          aurora_project_id?: string | null;
          battery_count?: number | null;
          battery_model?: string | null;
          both_spouses_present?: boolean | null;
          closer_id?: string | null;
          commission_base?: number | null;
          company_id: string;
          contact_id: string;
          created_at?: string | null;
          deal_number: string;
          dealer_fee?: number | null;
          dealer_fee_percentage?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          enerflo_deal_id?: string | null;
          enerflo_short_code?: string | null;
          financing_application_id?: string | null;
          financing_approved_at?: string | null;
          financing_status?: string | null;
          gross_ppw?: number | null;
          gross_price?: number | null;
          has_hoa?: boolean | null;
          id?: string;
          install_address?: string | null;
          install_address2?: string | null;
          install_agreement_signed_at?: string | null;
          install_agreement_status?: string | null;
          install_city?: string | null;
          install_lat?: number | null;
          install_lng?: number | null;
          install_state?: string | null;
          install_zip?: string | null;
          intake_reviewed_at?: string | null;
          intake_reviewed_by?: string | null;
          interest_rate?: number | null;
          inverter_model?: string | null;
          is_battery_only?: boolean | null;
          is_commercial?: boolean | null;
          is_new_construction?: boolean | null;
          lender_id?: string | null;
          loan_amount?: number | null;
          loan_product?: string | null;
          loan_term_months?: number | null;
          monthly_payment?: number | null;
          mounting_type?: string | null;
          net_ppw?: number | null;
          net_price?: number | null;
          office_id?: string | null;
          offset_percentage?: number | null;
          panel_count?: number | null;
          panel_model?: string | null;
          quickbase_deal_id?: string | null;
          rejection_reason?: string | null;
          repcard_appointment_id?: number | null;
          setter_id?: string | null;
          source?: string | null;
          stage?: string;
          stage_changed_at?: string | null;
          submission_status?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          system_size_kw?: number | null;
          team_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          active_appointment_id?: string | null;
          active_proposal_id?: string | null;
          adders_total?: number | null;
          annual_production_kwh?: number | null;
          annual_usage_kwh?: number | null;
          appointment_date?: string | null;
          appointment_end?: string | null;
          appointment_location?: string | null;
          appointment_notes?: string | null;
          appointment_outcome?: string | null;
          appointment_outcome_id?: number | null;
          appointment_timezone?: string | null;
          aurora_design_id?: string | null;
          aurora_project_id?: string | null;
          battery_count?: number | null;
          battery_model?: string | null;
          both_spouses_present?: boolean | null;
          closer_id?: string | null;
          commission_base?: number | null;
          company_id?: string;
          contact_id?: string;
          created_at?: string | null;
          deal_number?: string;
          dealer_fee?: number | null;
          dealer_fee_percentage?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          enerflo_deal_id?: string | null;
          enerflo_short_code?: string | null;
          financing_application_id?: string | null;
          financing_approved_at?: string | null;
          financing_status?: string | null;
          gross_ppw?: number | null;
          gross_price?: number | null;
          has_hoa?: boolean | null;
          id?: string;
          install_address?: string | null;
          install_address2?: string | null;
          install_agreement_signed_at?: string | null;
          install_agreement_status?: string | null;
          install_city?: string | null;
          install_lat?: number | null;
          install_lng?: number | null;
          install_state?: string | null;
          install_zip?: string | null;
          intake_reviewed_at?: string | null;
          intake_reviewed_by?: string | null;
          interest_rate?: number | null;
          inverter_model?: string | null;
          is_battery_only?: boolean | null;
          is_commercial?: boolean | null;
          is_new_construction?: boolean | null;
          lender_id?: string | null;
          loan_amount?: number | null;
          loan_product?: string | null;
          loan_term_months?: number | null;
          monthly_payment?: number | null;
          mounting_type?: string | null;
          net_ppw?: number | null;
          net_price?: number | null;
          office_id?: string | null;
          offset_percentage?: number | null;
          panel_count?: number | null;
          panel_model?: string | null;
          quickbase_deal_id?: string | null;
          rejection_reason?: string | null;
          repcard_appointment_id?: number | null;
          setter_id?: string | null;
          source?: string | null;
          stage?: string;
          stage_changed_at?: string | null;
          submission_status?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          system_size_kw?: number | null;
          team_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deals_closer_id_fkey";
            columns: ["closer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_setter_id_fkey";
            columns: ["setter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_deals_active_proposal";
            columns: ["active_proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_deals_lender";
            columns: ["lender_id"];
            isOneToOne: false;
            referencedRelation: "lenders";
            referencedColumns: ["id"];
          },
        ];
      };
      document_envelopes: {
        Row: {
          created_at: string | null;
          deal_id: string;
          deleted_at: string | null;
          id: string;
          merge_data: Json | null;
          provider: string;
          provider_document_id: string | null;
          provider_envelope_id: string | null;
          sent_at: string | null;
          signed_at: string | null;
          signed_document_url: string | null;
          signers: Json | null;
          status: string;
          status_changed_at: string | null;
          template_id: string | null;
          title: string;
          updated_at: string | null;
          updated_by: string | null;
          viewed_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deal_id: string;
          deleted_at?: string | null;
          id?: string;
          merge_data?: Json | null;
          provider: string;
          provider_document_id?: string | null;
          provider_envelope_id?: string | null;
          sent_at?: string | null;
          signed_at?: string | null;
          signed_document_url?: string | null;
          signers?: Json | null;
          status?: string;
          status_changed_at?: string | null;
          template_id?: string | null;
          title: string;
          updated_at?: string | null;
          updated_by?: string | null;
          viewed_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deal_id?: string;
          deleted_at?: string | null;
          id?: string;
          merge_data?: Json | null;
          provider?: string;
          provider_document_id?: string | null;
          provider_envelope_id?: string | null;
          sent_at?: string | null;
          signed_at?: string | null;
          signed_document_url?: string | null;
          signers?: Json | null;
          status?: string;
          status_changed_at?: string | null;
          template_id?: string | null;
          title?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "document_envelopes_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_envelopes_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_envelopes_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_envelopes_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "document_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      document_templates: {
        Row: {
          company_id: string;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          document_type: string;
          id: string;
          is_active: boolean | null;
          merge_field_mapping: Json | null;
          name: string;
          provider: string | null;
          provider_template_id: string;
          required_for_stages: string[] | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          document_type: string;
          id?: string;
          is_active?: boolean | null;
          merge_field_mapping?: Json | null;
          name: string;
          provider?: string | null;
          provider_template_id: string;
          required_for_stages?: string[] | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          document_type?: string;
          id?: string;
          is_active?: boolean | null;
          merge_field_mapping?: Json | null;
          name?: string;
          provider?: string | null;
          provider_template_id?: string;
          required_for_stages?: string[] | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "document_templates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment: {
        Row: {
          archived_at: string | null;
          aurora_component_id: string | null;
          aurora_component_name: string | null;
          category: string;
          company_id: string;
          cost_per_unit: number | null;
          cost_per_watt: number | null;
          created_at: string | null;
          degradation_rate: number | null;
          efficiency: number | null;
          id: string;
          manufacturer: string;
          model: string;
          msrp: number | null;
          name: string;
          specifications: Json | null;
          status: string | null;
          updated_at: string | null;
          updated_by: string | null;
          wattage: number | null;
        };
        Insert: {
          archived_at?: string | null;
          aurora_component_id?: string | null;
          aurora_component_name?: string | null;
          category: string;
          company_id: string;
          cost_per_unit?: number | null;
          cost_per_watt?: number | null;
          created_at?: string | null;
          degradation_rate?: number | null;
          efficiency?: number | null;
          id?: string;
          manufacturer: string;
          model: string;
          msrp?: number | null;
          name: string;
          specifications?: Json | null;
          status?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          wattage?: number | null;
        };
        Update: {
          archived_at?: string | null;
          aurora_component_id?: string | null;
          aurora_component_name?: string | null;
          category?: string;
          company_id?: string;
          cost_per_unit?: number | null;
          cost_per_watt?: number | null;
          created_at?: string | null;
          degradation_rate?: number | null;
          efficiency?: number | null;
          id?: string;
          manufacturer?: string;
          model?: string;
          msrp?: number | null;
          name?: string;
          specifications?: Json | null;
          status?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          wattage?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_market_availability: {
        Row: {
          created_at: string | null;
          equipment_id: string;
          id: string;
          installer_market_id: string;
          is_available: boolean | null;
          is_default: boolean | null;
          override_cost_per_unit: number | null;
          override_cost_per_watt: number | null;
        };
        Insert: {
          created_at?: string | null;
          equipment_id: string;
          id?: string;
          installer_market_id: string;
          is_available?: boolean | null;
          is_default?: boolean | null;
          override_cost_per_unit?: number | null;
          override_cost_per_watt?: number | null;
        };
        Update: {
          created_at?: string | null;
          equipment_id?: string;
          id?: string;
          installer_market_id?: string;
          is_available?: boolean | null;
          is_default?: boolean | null;
          override_cost_per_unit?: number | null;
          override_cost_per_watt?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_market_availability_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_ema_market";
            columns: ["installer_market_id"];
            isOneToOne: false;
            referencedRelation: "installer_markets";
            referencedColumns: ["id"];
          },
        ];
      };
      financing_applications: {
        Row: {
          application_url: string | null;
          approved_amount: number | null;
          approved_rate: number | null;
          approved_term_months: number | null;
          conditions: string | null;
          created_at: string | null;
          deal_id: string;
          decision_at: string | null;
          deleted_at: string | null;
          denial_reason: string | null;
          external_application_id: string | null;
          id: string;
          lender_id: string;
          lender_product_id: string | null;
          loan_amount: number | null;
          proposal_id: string | null;
          status: string;
          status_changed_at: string | null;
          stips: Json | null;
          submitted_at: string | null;
          submitted_by: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          application_url?: string | null;
          approved_amount?: number | null;
          approved_rate?: number | null;
          approved_term_months?: number | null;
          conditions?: string | null;
          created_at?: string | null;
          deal_id: string;
          decision_at?: string | null;
          deleted_at?: string | null;
          denial_reason?: string | null;
          external_application_id?: string | null;
          id?: string;
          lender_id: string;
          lender_product_id?: string | null;
          loan_amount?: number | null;
          proposal_id?: string | null;
          status?: string;
          status_changed_at?: string | null;
          stips?: Json | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          application_url?: string | null;
          approved_amount?: number | null;
          approved_rate?: number | null;
          approved_term_months?: number | null;
          conditions?: string | null;
          created_at?: string | null;
          deal_id?: string;
          decision_at?: string | null;
          deleted_at?: string | null;
          denial_reason?: string | null;
          external_application_id?: string | null;
          id?: string;
          lender_id?: string;
          lender_product_id?: string | null;
          loan_amount?: number | null;
          proposal_id?: string | null;
          status?: string;
          status_changed_at?: string | null;
          stips?: Json | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "financing_applications_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financing_applications_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financing_applications_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financing_applications_lender_id_fkey";
            columns: ["lender_id"];
            isOneToOne: false;
            referencedRelation: "lenders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financing_applications_lender_product_id_fkey";
            columns: ["lender_product_id"];
            isOneToOne: false;
            referencedRelation: "lender_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financing_applications_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_financing_proposal";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      financing_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string | null;
          financing_application_id: string;
          from_status: string | null;
          id: string;
          metadata: Json | null;
          notes: string | null;
          to_status: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string | null;
          financing_application_id: string;
          from_status?: string | null;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          to_status: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string | null;
          financing_application_id?: string;
          from_status?: string | null;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          to_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financing_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financing_status_history_financing_application_id_fkey";
            columns: ["financing_application_id"];
            isOneToOne: false;
            referencedRelation: "financing_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      gate_completions: {
        Row: {
          approved_by: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string | null;
          deal_id: string;
          gate_definition_id: string;
          id: string;
          is_complete: boolean | null;
          metadata: Json | null;
          notes: string | null;
          updated_at: string | null;
        };
        Insert: {
          approved_by?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          deal_id: string;
          gate_definition_id: string;
          id?: string;
          is_complete?: boolean | null;
          metadata?: Json | null;
          notes?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approved_by?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          deal_id?: string;
          gate_definition_id?: string;
          id?: string;
          is_complete?: boolean | null;
          metadata?: Json | null;
          notes?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gate_completions_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gate_completions_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gate_completions_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gate_completions_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gate_completions_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gate_completions_gate_definition_id_fkey";
            columns: ["gate_definition_id"];
            isOneToOne: false;
            referencedRelation: "gate_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      gate_definitions: {
        Row: {
          company_id: string;
          conditions: Json | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          gate_type: string;
          id: string;
          is_active: boolean | null;
          is_required: boolean | null;
          name: string;
          required_for_stage: string;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          company_id: string;
          conditions?: Json | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          gate_type: string;
          id?: string;
          is_active?: boolean | null;
          is_required?: boolean | null;
          name: string;
          required_for_stage: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          company_id?: string;
          conditions?: Json | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          gate_type?: string;
          id?: string;
          is_active?: boolean | null;
          is_required?: boolean | null;
          name?: string;
          required_for_stage?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gate_definitions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      installer_markets: {
        Row: {
          company_id: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          region: string | null;
          state: string;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          region?: string | null;
          state: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          region?: string | null;
          state?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "installer_markets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_sync_log: {
        Row: {
          action: string;
          created_at: string | null;
          entity_id: string | null;
          entity_type: string | null;
          error_message: string | null;
          id: string;
          request_payload: Json | null;
          response_payload: Json | null;
          retry_count: number | null;
          status: string | null;
          target: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          error_message?: string | null;
          id?: string;
          request_payload?: Json | null;
          response_payload?: Json | null;
          retry_count?: number | null;
          status?: string | null;
          target: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          error_message?: string | null;
          id?: string;
          request_payload?: Json | null;
          response_payload?: Json | null;
          retry_count?: number | null;
          status?: string | null;
          target?: string;
        };
        Relationships: [];
      };
      lender_products: {
        Row: {
          allowed_adder_categories: Json | null;
          apr: number | null;
          available_states: string[] | null;
          created_at: string | null;
          dealer_fee_max: number | null;
          dealer_fee_min: number | null;
          dealer_fee_percent: number | null;
          display_order: number | null;
          equipment_pricing_mode: string | null;
          escalator_percent: number | null;
          id: string;
          interest_rate: number | null;
          is_active: boolean | null;
          kin_margin_percent: number | null;
          lender_id: string;
          max_loan_amount: number | null;
          max_system_size_kw: number | null;
          min_fico: number | null;
          min_loan_amount: number | null;
          min_system_size_kw: number | null;
          name: string;
          product_code: string | null;
          sales_facing_fee_percent: number | null;
          term_months: number | null;
          tpo_available_rates: Json | null;
          tpo_payment_input_mode: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          allowed_adder_categories?: Json | null;
          apr?: number | null;
          available_states?: string[] | null;
          created_at?: string | null;
          dealer_fee_max?: number | null;
          dealer_fee_min?: number | null;
          dealer_fee_percent?: number | null;
          display_order?: number | null;
          equipment_pricing_mode?: string | null;
          escalator_percent?: number | null;
          id?: string;
          interest_rate?: number | null;
          is_active?: boolean | null;
          kin_margin_percent?: number | null;
          lender_id: string;
          max_loan_amount?: number | null;
          max_system_size_kw?: number | null;
          min_fico?: number | null;
          min_loan_amount?: number | null;
          min_system_size_kw?: number | null;
          name: string;
          product_code?: string | null;
          sales_facing_fee_percent?: number | null;
          term_months?: number | null;
          tpo_available_rates?: Json | null;
          tpo_payment_input_mode?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          allowed_adder_categories?: Json | null;
          apr?: number | null;
          available_states?: string[] | null;
          created_at?: string | null;
          dealer_fee_max?: number | null;
          dealer_fee_min?: number | null;
          dealer_fee_percent?: number | null;
          display_order?: number | null;
          equipment_pricing_mode?: string | null;
          escalator_percent?: number | null;
          id?: string;
          interest_rate?: number | null;
          is_active?: boolean | null;
          kin_margin_percent?: number | null;
          lender_id?: string;
          max_loan_amount?: number | null;
          max_system_size_kw?: number | null;
          min_fico?: number | null;
          min_loan_amount?: number | null;
          min_system_size_kw?: number | null;
          name?: string;
          product_code?: string | null;
          sales_facing_fee_percent?: number | null;
          term_months?: number | null;
          tpo_available_rates?: Json | null;
          tpo_payment_input_mode?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lender_products_lender_id_fkey";
            columns: ["lender_id"];
            isOneToOne: false;
            referencedRelation: "lenders";
            referencedColumns: ["id"];
          },
        ];
      };
      lenders: {
        Row: {
          api_credentials: Json | null;
          api_endpoint: string | null;
          company_id: string;
          created_at: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          lender_type: string;
          logo_url: string | null;
          name: string;
          settings: Json | null;
          slug: string;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          api_credentials?: Json | null;
          api_endpoint?: string | null;
          company_id: string;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          lender_type: string;
          logo_url?: string | null;
          name: string;
          settings?: Json | null;
          slug: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          api_credentials?: Json | null;
          api_endpoint?: string | null;
          company_id?: string;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          lender_type?: string;
          logo_url?: string | null;
          name?: string;
          settings?: Json | null;
          slug?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lenders_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      note_edits: {
        Row: {
          created_at: string | null;
          edited_by: string;
          id: string;
          note_id: string;
          previous_content: string;
        };
        Insert: {
          created_at?: string | null;
          edited_by: string;
          id?: string;
          note_id: string;
          previous_content: string;
        };
        Update: {
          created_at?: string | null;
          edited_by?: string;
          id?: string;
          note_id?: string;
          previous_content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_edits_edited_by_fkey";
            columns: ["edited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_edits_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          author_id: string;
          contact_id: string | null;
          content: string;
          created_at: string | null;
          deal_id: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          edit_count: number | null;
          edited_at: string | null;
          id: string;
          is_pinned: boolean | null;
          updated_at: string | null;
          updated_by: string | null;
          visibility: string | null;
        };
        Insert: {
          author_id: string;
          contact_id?: string | null;
          content: string;
          created_at?: string | null;
          deal_id?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          edit_count?: number | null;
          edited_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          updated_at?: string | null;
          updated_by?: string | null;
          visibility?: string | null;
        };
        Update: {
          author_id?: string;
          contact_id?: string | null;
          content?: string;
          created_at?: string | null;
          deal_id?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          edit_count?: number | null;
          edited_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          updated_at?: string | null;
          updated_by?: string | null;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string | null;
          deal_id: string | null;
          id: string;
          is_read: boolean | null;
          message: string | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      offices: {
        Row: {
          company_id: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          office_type: string | null;
          parent_office_id: string | null;
          repcard_office_name: string | null;
          state: string | null;
          timezone: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          office_type?: string | null;
          parent_office_id?: string | null;
          repcard_office_name?: string | null;
          state?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          office_type?: string | null;
          parent_office_id?: string | null;
          repcard_office_name?: string | null;
          state?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offices_parent_office_id_fkey";
            columns: ["parent_office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_configs: {
        Row: {
          allow_cost_override: boolean | null;
          base_ppw: number | null;
          buffer_amount: number | null;
          buffer_ppw: number | null;
          company_id: string;
          created_at: string | null;
          id: string;
          installer_market_id: string | null;
          is_active: boolean | null;
          max_ppw: number | null;
          min_panel_count: number | null;
          min_ppw: number | null;
          name: string;
          override_max_ppw: number | null;
          override_min_ppw: number | null;
          ppw_adjustments: Json | null;
          rounding_mode: string | null;
          rounding_scale: number | null;
          state_tax_rate: number | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          allow_cost_override?: boolean | null;
          base_ppw?: number | null;
          buffer_amount?: number | null;
          buffer_ppw?: number | null;
          company_id: string;
          created_at?: string | null;
          id?: string;
          installer_market_id?: string | null;
          is_active?: boolean | null;
          max_ppw?: number | null;
          min_panel_count?: number | null;
          min_ppw?: number | null;
          name: string;
          override_max_ppw?: number | null;
          override_min_ppw?: number | null;
          ppw_adjustments?: Json | null;
          rounding_mode?: string | null;
          rounding_scale?: number | null;
          state_tax_rate?: number | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          allow_cost_override?: boolean | null;
          base_ppw?: number | null;
          buffer_amount?: number | null;
          buffer_ppw?: number | null;
          company_id?: string;
          created_at?: string | null;
          id?: string;
          installer_market_id?: string | null;
          is_active?: boolean | null;
          max_ppw?: number | null;
          min_panel_count?: number | null;
          min_ppw?: number | null;
          name?: string;
          override_max_ppw?: number | null;
          override_min_ppw?: number | null;
          ppw_adjustments?: Json | null;
          rounding_mode?: string | null;
          rounding_scale?: number | null;
          state_tax_rate?: number | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pricing_configs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pricing_configs_installer_market_id_fkey";
            columns: ["installer_market_id"];
            isOneToOne: false;
            referencedRelation: "installer_markets";
            referencedColumns: ["id"];
          },
        ];
      };
      proposal_adders: {
        Row: {
          adder_template_id: string | null;
          amount: number;
          aurora_adder_id: string | null;
          created_at: string | null;
          dynamic_inputs: Json | null;
          eligible_for_itc: boolean | null;
          id: string;
          is_auto_applied: boolean | null;
          is_customer_facing: boolean | null;
          name: string;
          ppw: number | null;
          pricing_type: string;
          proposal_id: string;
          quantity: number | null;
          total: number;
        };
        Insert: {
          adder_template_id?: string | null;
          amount: number;
          aurora_adder_id?: string | null;
          created_at?: string | null;
          dynamic_inputs?: Json | null;
          eligible_for_itc?: boolean | null;
          id?: string;
          is_auto_applied?: boolean | null;
          is_customer_facing?: boolean | null;
          name: string;
          ppw?: number | null;
          pricing_type: string;
          proposal_id: string;
          quantity?: number | null;
          total: number;
        };
        Update: {
          adder_template_id?: string | null;
          amount?: number;
          aurora_adder_id?: string | null;
          created_at?: string | null;
          dynamic_inputs?: Json | null;
          eligible_for_itc?: boolean | null;
          id?: string;
          is_auto_applied?: boolean | null;
          is_customer_facing?: boolean | null;
          name?: string;
          ppw?: number | null;
          pricing_type?: string;
          proposal_id?: string;
          quantity?: number | null;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_pa_template";
            columns: ["adder_template_id"];
            isOneToOne: false;
            referencedRelation: "adder_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposal_adders_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      proposal_arrays: {
        Row: {
          array_index: number;
          aurora_inverter_id: string | null;
          aurora_module_id: string | null;
          azimuth: number | null;
          created_at: string | null;
          id: string;
          inverter_index: number | null;
          module_count: number;
          module_manufacturer: string | null;
          module_model: string | null;
          module_name: string | null;
          module_wattage: number | null;
          panel_orientation: string | null;
          pitch: number | null;
          proposal_id: string;
          roof_plane_index: number | null;
          solar_access: number | null;
          solar_access_by_month: Json | null;
          tof: number | null;
          tsrf: number | null;
        };
        Insert: {
          array_index: number;
          aurora_inverter_id?: string | null;
          aurora_module_id?: string | null;
          azimuth?: number | null;
          created_at?: string | null;
          id?: string;
          inverter_index?: number | null;
          module_count: number;
          module_manufacturer?: string | null;
          module_model?: string | null;
          module_name?: string | null;
          module_wattage?: number | null;
          panel_orientation?: string | null;
          pitch?: number | null;
          proposal_id: string;
          roof_plane_index?: number | null;
          solar_access?: number | null;
          solar_access_by_month?: Json | null;
          tof?: number | null;
          tsrf?: number | null;
        };
        Update: {
          array_index?: number;
          aurora_inverter_id?: string | null;
          aurora_module_id?: string | null;
          azimuth?: number | null;
          created_at?: string | null;
          id?: string;
          inverter_index?: number | null;
          module_count?: number;
          module_manufacturer?: string | null;
          module_model?: string | null;
          module_name?: string | null;
          module_wattage?: number | null;
          panel_orientation?: string | null;
          pitch?: number | null;
          proposal_id?: string;
          roof_plane_index?: number | null;
          solar_access?: number | null;
          solar_access_by_month?: Json | null;
          tof?: number | null;
          tsrf?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "proposal_arrays_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      proposal_discounts: {
        Row: {
          amount: number;
          created_at: string | null;
          discount_type: string;
          id: string;
          is_customer_facing: boolean | null;
          name: string;
          ppw: number | null;
          proposal_id: string;
          total: number;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          discount_type: string;
          id?: string;
          is_customer_facing?: boolean | null;
          name: string;
          ppw?: number | null;
          proposal_id: string;
          total: number;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          discount_type?: string;
          id?: string;
          is_customer_facing?: boolean | null;
          name?: string;
          ppw?: number | null;
          proposal_id?: string;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "proposal_discounts_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      proposals: {
        Row: {
          adder_ppw: number | null;
          adder_total: number | null;
          annual_consumption_kwh: number | null;
          annual_production_kwh: number | null;
          aurora_design_id: string | null;
          aurora_proposal_id: string | null;
          aurora_web_proposal_url: string | null;
          base_ppw: number | null;
          base_price: number | null;
          base_system_cost: number | null;
          base_system_ppw: number | null;
          commission_base: number | null;
          commission_ppw: number | null;
          created_at: string | null;
          deal_id: string;
          dealer_fee_amount: number | null;
          dealer_fee_ppw: number | null;
          deleted_at: string | null;
          deleted_by: string | null;
          design_name: string | null;
          discount_total: number | null;
          display_order: number | null;
          down_payment: number | null;
          epc_rate: number | null;
          epc_total: number | null;
          equipment_cost: number | null;
          escalator_percent: number | null;
          federal_rebate_amount: number | null;
          federal_rebate_base: number | null;
          finalized_at: string | null;
          finalized_by: string | null;
          finance_cost: number | null;
          financing_method: string | null;
          financing_product_name: string | null;
          gross_cost: number | null;
          gross_ppw: number | null;
          id: string;
          inverter_model: string | null;
          is_cost_override: boolean | null;
          kin_margin_on_fee: number | null;
          lender_actual_dealer_fee: number | null;
          lender_id: string | null;
          lender_product_id: string | null;
          monthly_consumption_kwh: Json | null;
          monthly_payment: number | null;
          mounting_type: string | null;
          name: string;
          net_cost: number | null;
          net_ppw: number | null;
          offset_percentage: number | null;
          original_base_ppw: number | null;
          override_gross_cost: number | null;
          panel_count: number | null;
          panel_model: string | null;
          panel_wattage: number | null;
          post_solar_rate_kwh: number | null;
          rate_per_kwh: number | null;
          rebate_total: number | null;
          rep_lender_verified: boolean | null;
          sales_facing_dealer_fee: number | null;
          status: string;
          system_size_kw: number | null;
          tax_amount: number | null;
          unfinalized_at: string | null;
          unfinalized_by: string | null;
          updated_at: string | null;
          updated_by: string | null;
          utility_name: string | null;
          utility_rate_kwh: number | null;
          weighted_tsrf: number | null;
        };
        Insert: {
          adder_ppw?: number | null;
          adder_total?: number | null;
          annual_consumption_kwh?: number | null;
          annual_production_kwh?: number | null;
          aurora_design_id?: string | null;
          aurora_proposal_id?: string | null;
          aurora_web_proposal_url?: string | null;
          base_ppw?: number | null;
          base_price?: number | null;
          base_system_cost?: number | null;
          base_system_ppw?: number | null;
          commission_base?: number | null;
          commission_ppw?: number | null;
          created_at?: string | null;
          deal_id: string;
          dealer_fee_amount?: number | null;
          dealer_fee_ppw?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          design_name?: string | null;
          discount_total?: number | null;
          display_order?: number | null;
          down_payment?: number | null;
          epc_rate?: number | null;
          epc_total?: number | null;
          equipment_cost?: number | null;
          escalator_percent?: number | null;
          federal_rebate_amount?: number | null;
          federal_rebate_base?: number | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          finance_cost?: number | null;
          financing_method?: string | null;
          financing_product_name?: string | null;
          gross_cost?: number | null;
          gross_ppw?: number | null;
          id?: string;
          inverter_model?: string | null;
          is_cost_override?: boolean | null;
          kin_margin_on_fee?: number | null;
          lender_actual_dealer_fee?: number | null;
          lender_id?: string | null;
          lender_product_id?: string | null;
          monthly_consumption_kwh?: Json | null;
          monthly_payment?: number | null;
          mounting_type?: string | null;
          name: string;
          net_cost?: number | null;
          net_ppw?: number | null;
          offset_percentage?: number | null;
          original_base_ppw?: number | null;
          override_gross_cost?: number | null;
          panel_count?: number | null;
          panel_model?: string | null;
          panel_wattage?: number | null;
          post_solar_rate_kwh?: number | null;
          rate_per_kwh?: number | null;
          rebate_total?: number | null;
          rep_lender_verified?: boolean | null;
          sales_facing_dealer_fee?: number | null;
          status?: string;
          system_size_kw?: number | null;
          tax_amount?: number | null;
          unfinalized_at?: string | null;
          unfinalized_by?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          utility_name?: string | null;
          utility_rate_kwh?: number | null;
          weighted_tsrf?: number | null;
        };
        Update: {
          adder_ppw?: number | null;
          adder_total?: number | null;
          annual_consumption_kwh?: number | null;
          annual_production_kwh?: number | null;
          aurora_design_id?: string | null;
          aurora_proposal_id?: string | null;
          aurora_web_proposal_url?: string | null;
          base_ppw?: number | null;
          base_price?: number | null;
          base_system_cost?: number | null;
          base_system_ppw?: number | null;
          commission_base?: number | null;
          commission_ppw?: number | null;
          created_at?: string | null;
          deal_id?: string;
          dealer_fee_amount?: number | null;
          dealer_fee_ppw?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          design_name?: string | null;
          discount_total?: number | null;
          display_order?: number | null;
          down_payment?: number | null;
          epc_rate?: number | null;
          epc_total?: number | null;
          equipment_cost?: number | null;
          escalator_percent?: number | null;
          federal_rebate_amount?: number | null;
          federal_rebate_base?: number | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          finance_cost?: number | null;
          financing_method?: string | null;
          financing_product_name?: string | null;
          gross_cost?: number | null;
          gross_ppw?: number | null;
          id?: string;
          inverter_model?: string | null;
          is_cost_override?: boolean | null;
          kin_margin_on_fee?: number | null;
          lender_actual_dealer_fee?: number | null;
          lender_id?: string | null;
          lender_product_id?: string | null;
          monthly_consumption_kwh?: Json | null;
          monthly_payment?: number | null;
          mounting_type?: string | null;
          name?: string;
          net_cost?: number | null;
          net_ppw?: number | null;
          offset_percentage?: number | null;
          original_base_ppw?: number | null;
          override_gross_cost?: number | null;
          panel_count?: number | null;
          panel_model?: string | null;
          panel_wattage?: number | null;
          post_solar_rate_kwh?: number | null;
          rate_per_kwh?: number | null;
          rebate_total?: number | null;
          rep_lender_verified?: boolean | null;
          sales_facing_dealer_fee?: number | null;
          status?: string;
          system_size_kw?: number | null;
          tax_amount?: number | null;
          unfinalized_at?: string | null;
          unfinalized_by?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          utility_name?: string | null;
          utility_rate_kwh?: number | null;
          weighted_tsrf?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "proposals_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_finalized_by_fkey";
            columns: ["finalized_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_lender_id_fkey";
            columns: ["lender_id"];
            isOneToOne: false;
            referencedRelation: "lenders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_lender_product_id_fkey";
            columns: ["lender_product_id"];
            isOneToOne: false;
            referencedRelation: "lender_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_unfinalized_by_fkey";
            columns: ["unfinalized_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      repcard_sync_state: {
        Row: {
          company_id: string;
          entity_type: string;
          error_count: number | null;
          id: string;
          last_cursor: string | null;
          last_sync_at: string | null;
          last_sync_status: string | null;
          metadata: Json | null;
        };
        Insert: {
          company_id: string;
          entity_type: string;
          error_count?: number | null;
          id?: string;
          last_cursor?: string | null;
          last_sync_at?: string | null;
          last_sync_status?: string | null;
          metadata?: Json | null;
        };
        Update: {
          company_id?: string;
          entity_type?: string;
          error_count?: number | null;
          id?: string;
          last_cursor?: string | null;
          last_sync_at?: string | null;
          last_sync_status?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "repcard_sync_state_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          category: string;
          company_id: string;
          created_at: string | null;
          display_name: string;
          id: string;
          is_system_role: boolean | null;
          name: string;
          permissions: Json | null;
        };
        Insert: {
          category: string;
          company_id: string;
          created_at?: string | null;
          display_name: string;
          id?: string;
          is_system_role?: boolean | null;
          name: string;
          permissions?: Json | null;
        };
        Update: {
          category?: string;
          company_id?: string;
          created_at?: string | null;
          display_name?: string;
          id?: string;
          is_system_role?: boolean | null;
          name?: string;
          permissions?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          office_id: string;
          repcard_team_name: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          office_id: string;
          repcard_team_name?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          office_id?: string;
          repcard_team_name?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      user_integration_settings: {
        Row: {
          created_at: string | null;
          id: string;
          integration_type: string;
          settings: Json;
          updated_at: string | null;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          integration_type: string;
          settings?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          integration_type?: string;
          settings?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_integration_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_lender_credentials: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          extra_credentials: Json | null;
          id: string;
          is_verified: boolean | null;
          lender_email: string | null;
          lender_id: string;
          lender_rep_id: string | null;
          lender_username: string | null;
          updated_at: string | null;
          updated_by: string | null;
          user_id: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          extra_credentials?: Json | null;
          id?: string;
          is_verified?: boolean | null;
          lender_email?: string | null;
          lender_id: string;
          lender_rep_id?: string | null;
          lender_username?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          extra_credentials?: Json | null;
          id?: string;
          is_verified?: boolean | null;
          lender_email?: string | null;
          lender_id?: string;
          lender_rep_id?: string | null;
          lender_username?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_ulc_lender";
            columns: ["lender_id"];
            isOneToOne: false;
            referencedRelation: "lenders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_lender_credentials_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_lender_credentials_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          activated_at: string | null;
          allow_design_requests: boolean | null;
          allow_manual_installs: boolean | null;
          auth_id: string | null;
          bio: string | null;
          can_create_change_orders: boolean | null;
          can_create_leads: boolean | null;
          can_reassign_leads: boolean | null;
          company_id: string;
          country_code: string | null;
          created_at: string | null;
          deactivated_at: string | null;
          email: string;
          external_id: string | null;
          first_name: string;
          id: string;
          image_url: string | null;
          invited_at: string | null;
          is_view_only: boolean | null;
          last_login_at: string | null;
          last_name: string;
          license_expiry: string | null;
          license_state: string | null;
          office_id: string | null;
          phone: string | null;
          repcard_badge_id: string | null;
          repcard_user_id: number | null;
          role_id: string;
          sales_rep_license_number: string | null;
          status: string | null;
          team_id: string | null;
          timezone: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          activated_at?: string | null;
          allow_design_requests?: boolean | null;
          allow_manual_installs?: boolean | null;
          auth_id?: string | null;
          bio?: string | null;
          can_create_change_orders?: boolean | null;
          can_create_leads?: boolean | null;
          can_reassign_leads?: boolean | null;
          company_id: string;
          country_code?: string | null;
          created_at?: string | null;
          deactivated_at?: string | null;
          email: string;
          external_id?: string | null;
          first_name: string;
          id?: string;
          image_url?: string | null;
          invited_at?: string | null;
          is_view_only?: boolean | null;
          last_login_at?: string | null;
          last_name: string;
          license_expiry?: string | null;
          license_state?: string | null;
          office_id?: string | null;
          phone?: string | null;
          repcard_badge_id?: string | null;
          repcard_user_id?: number | null;
          role_id: string;
          sales_rep_license_number?: string | null;
          status?: string | null;
          team_id?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          activated_at?: string | null;
          allow_design_requests?: boolean | null;
          allow_manual_installs?: boolean | null;
          auth_id?: string | null;
          bio?: string | null;
          can_create_change_orders?: boolean | null;
          can_create_leads?: boolean | null;
          can_reassign_leads?: boolean | null;
          company_id?: string;
          country_code?: string | null;
          created_at?: string | null;
          deactivated_at?: string | null;
          email?: string;
          external_id?: string | null;
          first_name?: string;
          id?: string;
          image_url?: string | null;
          invited_at?: string | null;
          is_view_only?: boolean | null;
          last_login_at?: string | null;
          last_name?: string;
          license_expiry?: string | null;
          license_state?: string | null;
          office_id?: string | null;
          phone?: string | null;
          repcard_badge_id?: string | null;
          repcard_user_id?: number | null;
          role_id?: string;
          sales_rep_license_number?: string | null;
          status?: string | null;
          team_id?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          event_type: string;
          headers: Json | null;
          id: string;
          payload: Json;
          processed_at: string | null;
          related_contact_id: string | null;
          related_deal_id: string | null;
          retry_count: number | null;
          source: string;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          event_type: string;
          headers?: Json | null;
          id?: string;
          payload: Json;
          processed_at?: string | null;
          related_contact_id?: string | null;
          related_deal_id?: string | null;
          retry_count?: number | null;
          source: string;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          event_type?: string;
          headers?: Json | null;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          related_contact_id?: string | null;
          related_deal_id?: string | null;
          retry_count?: number | null;
          source?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_events_related_contact_id_fkey";
            columns: ["related_contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_events_related_deal_id_fkey";
            columns: ["related_deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_events_related_deal_id_fkey";
            columns: ["related_deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_events_related_deal_id_fkey";
            columns: ["related_deal_id"];
            isOneToOne: false;
            referencedRelation: "v_deal_pipeline";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_deal_detail: {
        Row: {
          active_proposal_id: string | null;
          adders_total: number | null;
          annual_production_kwh: number | null;
          annual_usage_kwh: number | null;
          appointment_date: string | null;
          appointment_end: string | null;
          appointment_location: string | null;
          appointment_notes: string | null;
          appointment_outcome: string | null;
          appointment_outcome_id: number | null;
          appointment_timezone: string | null;
          aurora_design_id: string | null;
          aurora_project_id: string | null;
          battery_count: number | null;
          battery_model: string | null;
          both_spouses_present: boolean | null;
          closer_email: string | null;
          closer_id: string | null;
          closer_name: string | null;
          commission_base: number | null;
          company_id: string | null;
          contact_address: string | null;
          contact_annual_usage: number | null;
          contact_city: string | null;
          contact_email: string | null;
          contact_first_name: string | null;
          contact_id: string | null;
          contact_last_name: string | null;
          contact_phone: string | null;
          contact_state: string | null;
          contact_zip: string | null;
          created_at: string | null;
          deal_number: string | null;
          dealer_fee: number | null;
          dealer_fee_percentage: number | null;
          deleted_at: string | null;
          deleted_by: string | null;
          enerflo_deal_id: string | null;
          enerflo_short_code: string | null;
          financing_application_id: string | null;
          financing_approved_at: string | null;
          financing_status: string | null;
          gross_ppw: number | null;
          gross_price: number | null;
          has_hoa: boolean | null;
          id: string | null;
          install_address: string | null;
          install_address2: string | null;
          install_agreement_signed_at: string | null;
          install_agreement_status: string | null;
          install_city: string | null;
          install_lat: number | null;
          install_lng: number | null;
          install_state: string | null;
          install_zip: string | null;
          intake_reviewed_at: string | null;
          intake_reviewed_by: string | null;
          interest_rate: number | null;
          inverter_model: string | null;
          is_battery_only: boolean | null;
          is_commercial: boolean | null;
          is_new_construction: boolean | null;
          lender_id: string | null;
          lender_name: string | null;
          loan_amount: number | null;
          loan_product: string | null;
          loan_term_months: number | null;
          monthly_electric_bill: number | null;
          monthly_payment: number | null;
          mounting_type: string | null;
          net_ppw: number | null;
          net_price: number | null;
          office_id: string | null;
          office_name: string | null;
          offset_percentage: number | null;
          panel_count: number | null;
          panel_model: string | null;
          quickbase_deal_id: string | null;
          rejection_reason: string | null;
          repcard_appointment_id: number | null;
          setter_id: string | null;
          setter_name: string | null;
          source: string | null;
          stage: string | null;
          stage_changed_at: string | null;
          submission_status: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          system_size_kw: number | null;
          team_id: string | null;
          team_name: string | null;
          updated_at: string | null;
          updated_by: string | null;
          utility_company: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deals_closer_id_fkey";
            columns: ["closer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_setter_id_fkey";
            columns: ["setter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_deals_active_proposal";
            columns: ["active_proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_deals_lender";
            columns: ["lender_id"];
            isOneToOne: false;
            referencedRelation: "lenders";
            referencedColumns: ["id"];
          },
        ];
      };
      v_deal_pipeline: {
        Row: {
          closer_name: string | null;
          company_id: string | null;
          contact_city: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          contact_state: string | null;
          created_at: string | null;
          deal_number: string | null;
          gross_price: number | null;
          id: string | null;
          install_city: string | null;
          install_state: string | null;
          mounting_type: string | null;
          net_price: number | null;
          office_name: string | null;
          setter_name: string | null;
          stage: string | null;
          stage_changed_at: string | null;
          system_size_kw: number | null;
          team_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      auth_company_id: { Args: never; Returns: string };
      auth_role_category: { Args: never; Returns: string };
      auth_user_id: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
