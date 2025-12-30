export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_branches: {
        Row: {
          admin_id: string
          branch_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          branch_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          branch_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          accounting_authority_rate: boolean
          accounting_client_rate: boolean
          accounting_expense: boolean
          accounting_extra_time: boolean
          accounting_gross_payslip: boolean
          accounting_invoices: boolean
          accounting_rate_management: boolean
          accounting_staff_bank_detail: boolean
          accounting_staff_rate: boolean
          accounting_travel: boolean
          accounting_travel_management: boolean
          admin_id: string
          agreements: boolean | null
          attendance: boolean | null
          bookings: boolean | null
          branch_id: string
          care_plan: boolean | null
          carers: boolean | null
          clients: boolean | null
          communication: boolean | null
          confirmed_care_plan: boolean
          created_at: string
          dashboard: boolean | null
          documents: boolean | null
          events_logs: boolean | null
          finance: boolean
          form_builder: boolean | null
          id: string
          key_parameters: boolean | null
          library: boolean | null
          medication: boolean | null
          notifications: boolean | null
          report_accounting: boolean
          report_client: boolean
          report_service: boolean
          report_staff: boolean
          report_total_working_hours: boolean
          reports: boolean | null
          reviews: boolean
          system: boolean
          third_party: boolean
          under_review_care_plan: boolean
          workflow: boolean | null
        }
        Insert: {
          accounting_authority_rate?: boolean
          accounting_client_rate?: boolean
          accounting_expense?: boolean
          accounting_extra_time?: boolean
          accounting_gross_payslip?: boolean
          accounting_invoices?: boolean
          accounting_rate_management?: boolean
          accounting_staff_bank_detail?: boolean
          accounting_staff_rate?: boolean
          accounting_travel?: boolean
          accounting_travel_management?: boolean
          admin_id: string
          agreements?: boolean | null
          attendance?: boolean | null
          bookings?: boolean | null
          branch_id: string
          care_plan?: boolean | null
          carers?: boolean | null
          clients?: boolean | null
          communication?: boolean | null
          confirmed_care_plan?: boolean
          created_at?: string
          dashboard?: boolean | null
          documents?: boolean | null
          events_logs?: boolean | null
          finance?: boolean
          form_builder?: boolean | null
          id?: string
          key_parameters?: boolean | null
          library?: boolean | null
          medication?: boolean | null
          notifications?: boolean | null
          report_accounting?: boolean
          report_client?: boolean
          report_service?: boolean
          report_staff?: boolean
          report_total_working_hours?: boolean
          reports?: boolean | null
          reviews?: boolean
          system?: boolean
          third_party?: boolean
          under_review_care_plan?: boolean
          workflow?: boolean | null
        }
        Update: {
          accounting_authority_rate?: boolean
          accounting_client_rate?: boolean
          accounting_expense?: boolean
          accounting_extra_time?: boolean
          accounting_gross_payslip?: boolean
          accounting_invoices?: boolean
          accounting_rate_management?: boolean
          accounting_staff_bank_detail?: boolean
          accounting_staff_rate?: boolean
          accounting_travel?: boolean
          accounting_travel_management?: boolean
          admin_id?: string
          agreements?: boolean | null
          attendance?: boolean | null
          bookings?: boolean | null
          branch_id?: string
          care_plan?: boolean | null
          carers?: boolean | null
          clients?: boolean | null
          communication?: boolean | null
          confirmed_care_plan?: boolean
          created_at?: string
          dashboard?: boolean | null
          documents?: boolean | null
          events_logs?: boolean | null
          finance?: boolean
          form_builder?: boolean | null
          id?: string
          key_parameters?: boolean | null
          library?: boolean | null
          medication?: boolean | null
          notifications?: boolean | null
          report_accounting?: boolean
          report_client?: boolean
          report_service?: boolean
          report_staff?: boolean
          report_total_working_hours?: boolean
          reports?: boolean | null
          reviews?: boolean
          system?: boolean
          third_party?: boolean
          under_review_care_plan?: boolean
          workflow?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_expiry_notifications: {
        Row: {
          agreement_id: string
          created_at: string | null
          days_before_expiry: number
          id: string
          notification_sent_at: string | null
        }
        Insert: {
          agreement_id: string
          created_at?: string | null
          days_before_expiry: number
          id?: string
          notification_sent_at?: string | null
        }
        Update: {
          agreement_id?: string
          created_at?: string | null
          days_before_expiry?: number
          id?: string
          notification_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreement_expiry_notifications_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_files: {
        Row: {
          agreement_id: string | null
          created_at: string
          file_category: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          scheduled_agreement_id: string | null
          storage_path: string
          template_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          agreement_id?: string | null
          created_at?: string
          file_category?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          scheduled_agreement_id?: string | null
          storage_path: string
          template_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          agreement_id?: string | null
          created_at?: string
          file_category?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          scheduled_agreement_id?: string | null
          storage_path?: string
          template_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreement_files_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_files_scheduled_agreement_id_fkey"
            columns: ["scheduled_agreement_id"]
            isOneToOne: false
            referencedRelation: "scheduled_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_files_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_shares: {
        Row: {
          agreement_id: string | null
          created_at: string | null
          id: string
          share_method: string | null
          share_note: string | null
          shared_by: string | null
          shared_with: string[] | null
          viewed_at: string[] | null
          viewed_by: string[] | null
        }
        Insert: {
          agreement_id?: string | null
          created_at?: string | null
          id?: string
          share_method?: string | null
          share_note?: string | null
          shared_by?: string | null
          shared_with?: string[] | null
          viewed_at?: string[] | null
          viewed_by?: string[] | null
        }
        Update: {
          agreement_id?: string | null
          created_at?: string | null
          id?: string
          share_method?: string | null
          share_note?: string | null
          shared_by?: string | null
          shared_with?: string[] | null
          viewed_at?: string[] | null
          viewed_by?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "agreement_shares_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_signers: {
        Row: {
          admin_approved: boolean | null
          agreement_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          signature_file_id: string | null
          signed_at: string | null
          signer_auth_user_id: string | null
          signer_id: string | null
          signer_name: string
          signer_type: string
          signing_status: string | null
          updated_at: string
        }
        Insert: {
          admin_approved?: boolean | null
          agreement_id: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          signature_file_id?: string | null
          signed_at?: string | null
          signer_auth_user_id?: string | null
          signer_id?: string | null
          signer_name: string
          signer_type: string
          signing_status?: string | null
          updated_at?: string
        }
        Update: {
          admin_approved?: boolean | null
          agreement_id?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          signature_file_id?: string | null
          signed_at?: string | null
          signer_auth_user_id?: string | null
          signer_id?: string | null
          signer_name?: string
          signer_type?: string
          signing_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_signers_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_signers_signature_file_id_fkey"
            columns: ["signature_file_id"]
            isOneToOne: false
            referencedRelation: "agreement_files"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_templates: {
        Row: {
          branch_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          template_file_id: string | null
          title: string
          type_id: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          branch_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_file_id?: string | null
          title: string
          type_id?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          branch_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_file_id?: string | null
          title?: string
          type_id?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "agreement_templates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_templates_template_file_id_fkey"
            columns: ["template_file_id"]
            isOneToOne: false
            referencedRelation: "agreement_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_templates_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "agreement_types"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agreements: {
        Row: {
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          archived_by: string | null
          branch_id: string | null
          content: string | null
          created_at: string
          digital_signature: string | null
          expiry_date: string | null
          id: string
          primary_document_id: string | null
          rejection_reason: string | null
          renewal_date: string | null
          signature_file_id: string | null
          signed_at: string | null
          signed_by_client_id: string | null
          signed_by_name: string | null
          signed_by_staff_id: string | null
          signing_party: Database["public"]["Enums"]["agreement_party"] | null
          status: Database["public"]["Enums"]["agreement_status"]
          template_id: string | null
          title: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          branch_id?: string | null
          content?: string | null
          created_at?: string
          digital_signature?: string | null
          expiry_date?: string | null
          id?: string
          primary_document_id?: string | null
          rejection_reason?: string | null
          renewal_date?: string | null
          signature_file_id?: string | null
          signed_at?: string | null
          signed_by_client_id?: string | null
          signed_by_name?: string | null
          signed_by_staff_id?: string | null
          signing_party?: Database["public"]["Enums"]["agreement_party"] | null
          status?: Database["public"]["Enums"]["agreement_status"]
          template_id?: string | null
          title: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          branch_id?: string | null
          content?: string | null
          created_at?: string
          digital_signature?: string | null
          expiry_date?: string | null
          id?: string
          primary_document_id?: string | null
          rejection_reason?: string | null
          renewal_date?: string | null
          signature_file_id?: string | null
          signed_at?: string | null
          signed_by_client_id?: string | null
          signed_by_name?: string | null
          signed_by_staff_id?: string | null
          signing_party?: Database["public"]["Enums"]["agreement_party"] | null
          status?: Database["public"]["Enums"]["agreement_status"]
          template_id?: string | null
          title?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_primary_document_id_fkey"
            columns: ["primary_document_id"]
            isOneToOne: false
            referencedRelation: "agreement_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_signature_file_id_fkey"
            columns: ["signature_file_id"]
            isOneToOne: false
            referencedRelation: "agreement_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_signed_by_client_id_fkey"
            columns: ["signed_by_client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_signed_by_staff_id_fkey"
            columns: ["signed_by_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "agreement_types"
            referencedColumns: ["id"]
          },
        ]
      }
      annual_leave_calendar: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          end_time: string | null
          id: string
          is_company_wide: boolean
          is_recurring: boolean
          leave_date: string
          leave_name: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          end_time?: string | null
          id?: string
          is_company_wide?: boolean
          is_recurring?: boolean
          leave_date: string
          leave_name: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          end_time?: string | null
          id?: string
          is_company_wide?: boolean
          is_recurring?: boolean
          leave_date?: string
          leave_name?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "annual_leave_calendar_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      app_admin_organizations: {
        Row: {
          app_admin_id: string
          created_at: string
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          app_admin_id: string
          created_at?: string
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          app_admin_id?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_admin_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_date: string
          branch_id: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          created_by: string | null
          hours_worked: number | null
          id: string
          notes: string | null
          person_id: string
          person_type: string
          status: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          branch_id: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          created_by?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          person_id: string
          person_type: string
          status: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          branch_id?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          created_by?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          person_id?: string
          person_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      authorities: {
        Row: {
          address: string | null
          billing_address: string | null
          branch_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          email: string | null
          id: string
          invoice_email: string | null
          invoice_name_display: string | null
          invoice_setting: string | null
          needs_cm2000: boolean | null
          organization_id: string | null
          organization_name: string
          status: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          branch_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          invoice_email?: string | null
          invoice_name_display?: string | null
          invoice_setting?: string | null
          needs_cm2000?: boolean | null
          organization_id?: string | null
          organization_name: string
          status?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          branch_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          invoice_email?: string | null
          invoice_name_display?: string | null
          invoice_setting?: string | null
          needs_cm2000?: boolean | null
          organization_id?: string | null
          organization_name?: string
          status?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorities_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_holidays: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          registered_by: string
          registered_on: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          registered_by: string
          registered_on: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          registered_by?: string
          registered_on?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_holidays_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      body_map_points: {
        Row: {
          color: string
          created_at: string
          id: string
          letter: string
          organization_id: string | null
          source_system_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          letter: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          letter?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_map_points_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_map_points_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "system_body_map_points"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_alert_settings: {
        Row: {
          branch_id: string | null
          created_at: string | null
          enable_late_start_alerts: boolean
          enable_missed_booking_alerts: boolean
          first_alert_delay_minutes: number
          id: string
          missed_booking_threshold_minutes: number
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          enable_late_start_alerts?: boolean
          enable_missed_booking_alerts?: boolean
          first_alert_delay_minutes?: number
          id?: string
          missed_booking_threshold_minutes?: number
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          enable_late_start_alerts?: boolean
          enable_missed_booking_alerts?: boolean
          first_alert_delay_minutes?: number
          id?: string
          missed_booking_threshold_minutes?: number
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_alert_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_alert_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_change_requests: {
        Row: {
          admin_notes: string | null
          booking_id: string
          branch_id: string | null
          client_id: string
          created_at: string | null
          id: string
          new_date: string | null
          new_time: string | null
          notes: string | null
          organization_id: string | null
          reason: string
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          booking_id: string
          branch_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          new_date?: string | null
          new_time?: string | null
          notes?: string | null
          organization_id?: string | null
          reason: string
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string
          branch_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          new_date?: string | null
          new_time?: string | null
          notes?: string | null
          organization_id?: string | null
          reason?: string
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_change_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_change_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_change_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_change_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          service_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          service_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_unavailability_requests: {
        Row: {
          admin_notes: string | null
          booking_id: string
          branch_id: string
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string | null
          reason: string
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          staff_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          booking_id: string
          branch_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          reason: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string
          branch_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          reason?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_unavailability_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_unavailability_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_unavailability_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_unavailability_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          branch_id: string | null
          cancellation_reason: string | null
          cancellation_request_status: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string | null
          created_at: string | null
          end_time: string
          id: string
          included_in_invoice_id: string | null
          is_invoiced: boolean | null
          is_late_start: boolean | null
          is_missed: boolean | null
          late_start_minutes: number | null
          late_start_notified_at: string | null
          location_address: string | null
          missed_notified_at: string | null
          notes: string | null
          organization_id: string | null
          reschedule_request_status: string | null
          revenue: number | null
          service_id: string | null
          staff_id: string | null
          staff_payment_amount: number | null
          staff_payment_type: string | null
          start_time: string
          status: string | null
          suspension_honor_staff_payment: boolean | null
        }
        Insert: {
          branch_id?: string | null
          cancellation_reason?: string | null
          cancellation_request_status?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          included_in_invoice_id?: string | null
          is_invoiced?: boolean | null
          is_late_start?: boolean | null
          is_missed?: boolean | null
          late_start_minutes?: number | null
          late_start_notified_at?: string | null
          location_address?: string | null
          missed_notified_at?: string | null
          notes?: string | null
          organization_id?: string | null
          reschedule_request_status?: string | null
          revenue?: number | null
          service_id?: string | null
          staff_id?: string | null
          staff_payment_amount?: number | null
          staff_payment_type?: string | null
          start_time: string
          status?: string | null
          suspension_honor_staff_payment?: boolean | null
        }
        Update: {
          branch_id?: string | null
          cancellation_reason?: string | null
          cancellation_request_status?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          included_in_invoice_id?: string | null
          is_invoiced?: boolean | null
          is_late_start?: boolean | null
          is_missed?: boolean | null
          late_start_minutes?: number | null
          late_start_notified_at?: string | null
          location_address?: string | null
          missed_notified_at?: string | null
          notes?: string | null
          organization_id?: string | null
          reschedule_request_status?: string | null
          revenue?: number | null
          service_id?: string | null
          staff_id?: string | null
          staff_payment_amount?: number | null
          staff_payment_type?: string | null
          start_time?: string
          status?: string | null
          suspension_honor_staff_payment?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_included_in_invoice_id_fkey"
            columns: ["included_in_invoice_id"]
            isOneToOne: false
            referencedRelation: "client_billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          branch_type: string
          country: string
          created_at: string
          created_by: string | null
          currency: string
          email: string | null
          established_date: string | null
          id: string
          name: string
          operating_hours: string | null
          organization_id: string | null
          phone: string | null
          regulatory: string
          status: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          branch_type: string
          country: string
          created_at?: string
          created_by?: string | null
          currency: string
          email?: string | null
          established_date?: string | null
          id?: string
          name: string
          operating_hours?: string | null
          organization_id?: string | null
          phone?: string | null
          regulatory: string
          status: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          branch_type?: string
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          established_date?: string | null
          id?: string
          name?: string
          operating_hours?: string | null
          organization_id?: string | null
          phone?: string | null
          regulatory?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_forms: {
        Row: {
          assigned_at: string
          assigned_by: string
          care_plan_id: string
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string
          due_date: string | null
          form_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          care_plan_id: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          due_date?: string | null
          form_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          care_plan_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          due_date?: string | null
          form_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_forms_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_forms_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_staff_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          care_plan_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          care_plan_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          care_plan_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_staff_assignments_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_status_history: {
        Row: {
          care_plan_id: string
          changed_by: string | null
          changed_by_type: string
          client_comments: string | null
          created_at: string
          id: string
          new_status: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          care_plan_id: string
          changed_by?: string | null
          changed_by_type: string
          client_comments?: string | null
          created_at?: string
          id?: string
          new_status: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          care_plan_id?: string
          changed_by?: string | null
          changed_by_type?: string
          client_comments?: string | null
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_status_history_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_wizard_steps: {
        Row: {
          care_plan_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          step_data: Json | null
          step_name: string
          step_number: number
          updated_at: string
        }
        Insert: {
          care_plan_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          step_data?: Json | null
          step_name: string
          step_number: number
          updated_at?: string
        }
        Update: {
          care_plan_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          step_data?: Json | null
          step_name?: string
          step_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_wizard_steps_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      carer_invitations: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          invitation_token: string
          staff_id: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          invitation_token: string
          staff_id?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          staff_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carer_invitations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_accounting_settings: {
        Row: {
          agreement_type: string | null
          authority_category: string | null
          billing_address: string | null
          billing_address_same_as_personal: boolean | null
          branch_id: string | null
          care_lead_id: string | null
          client_id: string
          created_at: string | null
          enable_geo_fencing: boolean | null
          expiry_date: string | null
          id: string
          invoice_display_type: string | null
          invoice_method: string | null
          mileage_rule_no_payment: boolean | null
          organization_id: string | null
          pay_method: string | null
          rate_type: string | null
          service_payer: string | null
          show_in_form_matrix: boolean | null
          show_in_task_matrix: boolean | null
          updated_at: string | null
        }
        Insert: {
          agreement_type?: string | null
          authority_category?: string | null
          billing_address?: string | null
          billing_address_same_as_personal?: boolean | null
          branch_id?: string | null
          care_lead_id?: string | null
          client_id: string
          created_at?: string | null
          enable_geo_fencing?: boolean | null
          expiry_date?: string | null
          id?: string
          invoice_display_type?: string | null
          invoice_method?: string | null
          mileage_rule_no_payment?: boolean | null
          organization_id?: string | null
          pay_method?: string | null
          rate_type?: string | null
          service_payer?: string | null
          show_in_form_matrix?: boolean | null
          show_in_task_matrix?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agreement_type?: string | null
          authority_category?: string | null
          billing_address?: string | null
          billing_address_same_as_personal?: boolean | null
          branch_id?: string | null
          care_lead_id?: string | null
          client_id?: string
          created_at?: string | null
          enable_geo_fencing?: boolean | null
          expiry_date?: string | null
          id?: string
          invoice_display_type?: string | null
          invoice_method?: string | null
          mileage_rule_no_payment?: boolean | null
          organization_id?: string | null
          pay_method?: string | null
          rate_type?: string | null
          service_payer?: string | null
          show_in_form_matrix?: boolean | null
          show_in_task_matrix?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_accounting_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounting_settings_care_lead_id_fkey"
            columns: ["care_lead_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounting_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounting_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activities: {
        Row: {
          care_plan_id: string
          created_at: string
          description: string | null
          frequency: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          care_plan_id: string
          created_at?: string
          description?: string | null
          frequency: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          care_plan_id?: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activities_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      client_addresses: {
        Row: {
          address_label: string | null
          address_line_1: string
          address_line_2: string | null
          city: string
          client_id: string
          country: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          postcode: string
          state_county: string | null
          updated_at: string | null
        }
        Insert: {
          address_label?: string | null
          address_line_1: string
          address_line_2?: string | null
          city: string
          client_id: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          postcode: string
          state_county?: string | null
          updated_at?: string | null
        }
        Update: {
          address_label?: string | null
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          client_id?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          postcode?: string
          state_county?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_addresses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_addresses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          branch_id: string | null
          client_id: string | null
          created_at: string
          id: string
          location: string
          notes: string | null
          organization_id: string | null
          provider_name: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          branch_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          location: string
          notes?: string | null
          organization_id?: string | null
          provider_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          branch_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          location?: string
          notes?: string | null
          organization_id?: string | null
          provider_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assessments: {
        Row: {
          assessment_date: string
          assessment_name: string
          assessment_type: string
          care_plan_id: string | null
          client_id: string
          created_at: string
          id: string
          next_review_date: string | null
          performed_by: string
          performed_by_id: string | null
          recommendations: string | null
          results: string | null
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          assessment_date: string
          assessment_name: string
          assessment_type: string
          care_plan_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          next_review_date?: string | null
          performed_by: string
          performed_by_id?: string | null
          recommendations?: string | null
          results?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          assessment_date?: string
          assessment_name?: string
          assessment_type?: string
          care_plan_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          next_review_date?: string | null
          performed_by?: string
          performed_by_id?: string | null
          recommendations?: string | null
          results?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assessments_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assessments_performed_by_id_fkey"
            columns: ["performed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_authority_accounting: {
        Row: {
          authority_id: string
          branch_id: string | null
          charge_based_on: string | null
          client_contribution_required: boolean | null
          client_id: string
          created_at: string | null
          extra_time_calculation: boolean | null
          id: string
          organization_id: string | null
          reference_number: string | null
          travel_rate_id: string | null
          updated_at: string | null
        }
        Insert: {
          authority_id: string
          branch_id?: string | null
          charge_based_on?: string | null
          client_contribution_required?: boolean | null
          client_id: string
          created_at?: string | null
          extra_time_calculation?: boolean | null
          id?: string
          organization_id?: string | null
          reference_number?: string | null
          travel_rate_id?: string | null
          updated_at?: string | null
        }
        Update: {
          authority_id?: string
          branch_id?: string | null
          charge_based_on?: string | null
          client_contribution_required?: boolean | null
          client_id?: string
          created_at?: string | null
          extra_time_calculation?: boolean | null
          id?: string
          organization_id?: string | null
          reference_number?: string | null
          travel_rate_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_authority_accounting_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "authorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_authority_accounting_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_authority_accounting_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_authority_accounting_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_authority_accounting_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_authority_accounting_travel_rate_id_fkey"
            columns: ["travel_rate_id"]
            isOneToOne: false
            referencedRelation: "travel_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_behavior_support: {
        Row: {
          behavior_triggers: string | null
          challenging_behaviors: string | null
          client_id: string
          created_at: string
          created_by: string | null
          crisis_management_plan: string | null
          early_warning_signs: string | null
          id: string
          post_incident_protocol: string | null
          preventative_strategies: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          behavior_triggers?: string | null
          challenging_behaviors?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          crisis_management_plan?: string | null
          early_warning_signs?: string | null
          id?: string
          post_incident_protocol?: string | null
          preventative_strategies?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          behavior_triggers?: string | null
          challenging_behaviors?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          crisis_management_plan?: string | null
          early_warning_signs?: string | null
          id?: string
          post_incident_protocol?: string | null
          preventative_strategies?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_behavior_support_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_behavior_support_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_billing: {
        Row: {
          actual_time_minutes: number | null
          amount: number
          authority_id: string | null
          authority_type: string | null
          bill_to_address: Json | null
          bill_to_type: string | null
          booked_time_minutes: number | null
          booking_id: string | null
          client_group_id: string | null
          client_id: string
          consolidation_type: string | null
          created_at: string
          currency: string | null
          description: string
          due_date: string
          end_date: string | null
          generated_from_booking: boolean | null
          id: string
          invoice_date: string
          invoice_method: string | null
          invoice_number: string
          invoice_type: string | null
          is_former_client: boolean | null
          is_ledger_locked: boolean | null
          is_locked: boolean | null
          is_ready_to_send: boolean | null
          locked_at: string | null
          locked_by: string | null
          net_amount: number | null
          notes: string | null
          organization_id: string
          overdue_date: string | null
          paid_date: string | null
          pay_method: string | null
          payment_terms: string | null
          sent_date: string | null
          service_provided_date: string | null
          service_to_address: Json | null
          start_date: string | null
          status: string
          tax_amount: number | null
          total_amount: number | null
          total_invoiced_hours_minutes: number | null
          updated_at: string
          vat_amount: number | null
        }
        Insert: {
          actual_time_minutes?: number | null
          amount: number
          authority_id?: string | null
          authority_type?: string | null
          bill_to_address?: Json | null
          bill_to_type?: string | null
          booked_time_minutes?: number | null
          booking_id?: string | null
          client_group_id?: string | null
          client_id: string
          consolidation_type?: string | null
          created_at?: string
          currency?: string | null
          description: string
          due_date: string
          end_date?: string | null
          generated_from_booking?: boolean | null
          id?: string
          invoice_date: string
          invoice_method?: string | null
          invoice_number: string
          invoice_type?: string | null
          is_former_client?: boolean | null
          is_ledger_locked?: boolean | null
          is_locked?: boolean | null
          is_ready_to_send?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          net_amount?: number | null
          notes?: string | null
          organization_id: string
          overdue_date?: string | null
          paid_date?: string | null
          pay_method?: string | null
          payment_terms?: string | null
          sent_date?: string | null
          service_provided_date?: string | null
          service_to_address?: Json | null
          start_date?: string | null
          status?: string
          tax_amount?: number | null
          total_amount?: number | null
          total_invoiced_hours_minutes?: number | null
          updated_at?: string
          vat_amount?: number | null
        }
        Update: {
          actual_time_minutes?: number | null
          amount?: number
          authority_id?: string | null
          authority_type?: string | null
          bill_to_address?: Json | null
          bill_to_type?: string | null
          booked_time_minutes?: number | null
          booking_id?: string | null
          client_group_id?: string | null
          client_id?: string
          consolidation_type?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          due_date?: string
          end_date?: string | null
          generated_from_booking?: boolean | null
          id?: string
          invoice_date?: string
          invoice_method?: string | null
          invoice_number?: string
          invoice_type?: string | null
          is_former_client?: boolean | null
          is_ledger_locked?: boolean | null
          is_locked?: boolean | null
          is_ready_to_send?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          net_amount?: number | null
          notes?: string | null
          organization_id?: string
          overdue_date?: string | null
          paid_date?: string | null
          pay_method?: string | null
          payment_terms?: string | null
          sent_date?: string | null
          service_provided_date?: string | null
          service_to_address?: Json | null
          start_date?: string | null
          status?: string
          tax_amount?: number | null
          total_amount?: number | null
          total_invoiced_hours_minutes?: number | null
          updated_at?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_billing_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "authorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_billing_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_care_plan_approvals: {
        Row: {
          action: string
          care_plan_id: string
          comments: string | null
          created_at: string
          id: string
          new_status: string | null
          performed_at: string
          performed_by: string
          previous_status: string | null
        }
        Insert: {
          action: string
          care_plan_id: string
          comments?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          performed_at?: string
          performed_by: string
          previous_status?: string | null
        }
        Update: {
          action?: string
          care_plan_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          performed_at?: string
          performed_by?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_care_plan_approvals_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_care_plan_approvals_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_care_plan_goals: {
        Row: {
          care_plan_id: string
          created_at: string
          description: string
          id: string
          notes: string | null
          progress: number | null
          status: string
          updated_at: string
        }
        Insert: {
          care_plan_id: string
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          progress?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          care_plan_id?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          progress?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_care_plan_goals_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      client_care_plans: {
        Row: {
          acknowledgment_method: string | null
          approved_at: string | null
          approved_by: string | null
          auto_save_data: Json | null
          care_plan_type: string | null
          change_request_comments: string | null
          changes_requested_at: string | null
          changes_requested_by: string | null
          client_acknowledged_at: string | null
          client_acknowledgment_ip: unknown
          client_comments: string | null
          client_id: string
          client_signature_data: string | null
          completion_percentage: number | null
          created_at: string
          created_by_staff_id: string | null
          display_id: string
          end_date: string | null
          finalized_at: string | null
          finalized_by: string | null
          goals_progress: number | null
          id: string
          last_step_completed: number | null
          news2_monitoring_enabled: boolean | null
          news2_monitoring_frequency: string | null
          news2_monitoring_notes: string | null
          notes: string | null
          priority: string | null
          provider_name: string
          rejection_reason: string | null
          review_date: string | null
          staff_id: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledgment_method?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_save_data?: Json | null
          care_plan_type?: string | null
          change_request_comments?: string | null
          changes_requested_at?: string | null
          changes_requested_by?: string | null
          client_acknowledged_at?: string | null
          client_acknowledgment_ip?: unknown
          client_comments?: string | null
          client_id: string
          client_signature_data?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by_staff_id?: string | null
          display_id: string
          end_date?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          goals_progress?: number | null
          id?: string
          last_step_completed?: number | null
          news2_monitoring_enabled?: boolean | null
          news2_monitoring_frequency?: string | null
          news2_monitoring_notes?: string | null
          notes?: string | null
          priority?: string | null
          provider_name: string
          rejection_reason?: string | null
          review_date?: string | null
          staff_id?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledgment_method?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_save_data?: Json | null
          care_plan_type?: string | null
          change_request_comments?: string | null
          changes_requested_at?: string | null
          changes_requested_by?: string | null
          client_acknowledged_at?: string | null
          client_acknowledgment_ip?: unknown
          client_comments?: string | null
          client_id?: string
          client_signature_data?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by_staff_id?: string | null
          display_id?: string
          end_date?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          goals_progress?: number | null
          id?: string
          last_step_completed?: number | null
          news2_monitoring_enabled?: boolean | null
          news2_monitoring_frequency?: string | null
          news2_monitoring_notes?: string | null
          notes?: string | null
          priority?: string | null
          provider_name?: string
          rejection_reason?: string | null
          review_date?: string | null
          staff_id?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_care_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_care_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_care_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_care_plans_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_care_plans_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_child_info: {
        Row: {
          calming_techniques: string | null
          client_id: string
          communication_triggers: string | null
          created_at: string
          daily_learning_goals: string | null
          dressing_support: string | null
          eating_drinking_support: string | null
          education_placement: string | null
          ehcp_targets_linked: boolean | null
          hygiene_routines: string | null
          id: string
          independence_level: string | null
          independence_skills: string | null
          key_words_phrases: string | null
          legal_status: string | null
          legal_status_other: string | null
          preferred_communication_approach: string | null
          primary_communication: string | null
          primary_communication_other: string | null
          social_skills_development: string | null
          social_worker_contact: string | null
          social_worker_email: string | null
          social_worker_name: string | null
          toileting_needs: string | null
          updated_at: string
        }
        Insert: {
          calming_techniques?: string | null
          client_id: string
          communication_triggers?: string | null
          created_at?: string
          daily_learning_goals?: string | null
          dressing_support?: string | null
          eating_drinking_support?: string | null
          education_placement?: string | null
          ehcp_targets_linked?: boolean | null
          hygiene_routines?: string | null
          id?: string
          independence_level?: string | null
          independence_skills?: string | null
          key_words_phrases?: string | null
          legal_status?: string | null
          legal_status_other?: string | null
          preferred_communication_approach?: string | null
          primary_communication?: string | null
          primary_communication_other?: string | null
          social_skills_development?: string | null
          social_worker_contact?: string | null
          social_worker_email?: string | null
          social_worker_name?: string | null
          toileting_needs?: string | null
          updated_at?: string
        }
        Update: {
          calming_techniques?: string | null
          client_id?: string
          communication_triggers?: string | null
          created_at?: string
          daily_learning_goals?: string | null
          dressing_support?: string | null
          eating_drinking_support?: string | null
          education_placement?: string | null
          ehcp_targets_linked?: boolean | null
          hygiene_routines?: string | null
          id?: string
          independence_level?: string | null
          independence_skills?: string | null
          key_words_phrases?: string | null
          legal_status?: string | null
          legal_status_other?: string | null
          preferred_communication_approach?: string | null
          primary_communication?: string | null
          primary_communication_other?: string | null
          social_skills_development?: string | null
          social_worker_contact?: string | null
          social_worker_email?: string | null
          social_worker_name?: string | null
          toileting_needs?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_child_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_child_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_dietary_requirements: {
        Row: {
          client_id: string
          created_at: string
          dietary_restrictions: string[] | null
          feeding_assistance_required: boolean | null
          fluid_restrictions: string | null
          food_allergies: string[] | null
          food_preferences: string[] | null
          id: string
          meal_schedule: Json | null
          nutritional_needs: string | null
          special_equipment_needed: string | null
          supplements: string[] | null
          texture_modifications: string | null
          updated_at: string
          weight_monitoring: boolean | null
        }
        Insert: {
          client_id: string
          created_at?: string
          dietary_restrictions?: string[] | null
          feeding_assistance_required?: boolean | null
          fluid_restrictions?: string | null
          food_allergies?: string[] | null
          food_preferences?: string[] | null
          id?: string
          meal_schedule?: Json | null
          nutritional_needs?: string | null
          special_equipment_needed?: string | null
          supplements?: string[] | null
          texture_modifications?: string | null
          updated_at?: string
          weight_monitoring?: boolean | null
        }
        Update: {
          client_id?: string
          created_at?: string
          dietary_restrictions?: string[] | null
          feeding_assistance_required?: boolean | null
          fluid_restrictions?: string | null
          food_allergies?: string[] | null
          food_preferences?: string[] | null
          id?: string
          meal_schedule?: Json | null
          nutritional_needs?: string | null
          special_equipment_needed?: string | null
          supplements?: string[] | null
          texture_modifications?: string | null
          updated_at?: string
          weight_monitoring?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_dietary_requirements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_dietary_requirements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          file_path: string | null
          file_size: string | null
          id: string
          name: string
          type: string
          updated_at: string
          upload_date: string
          uploaded_by: string
        }
        Insert: {
          client_id: string
          created_at?: string
          file_path?: string | null
          file_size?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
          upload_date?: string
          uploaded_by: string
        }
        Update: {
          client_id?: string
          created_at?: string
          file_path?: string | null
          file_size?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_email_settings: {
        Row: {
          cc_emails: string[] | null
          client_id: string
          created_at: string | null
          email_on_due_date_reminder: boolean | null
          email_on_generation: boolean | null
          id: string
          invoice_email: string | null
          reminder_days_before: number | null
          send_invoice_emails: boolean | null
          updated_at: string | null
        }
        Insert: {
          cc_emails?: string[] | null
          client_id: string
          created_at?: string | null
          email_on_due_date_reminder?: boolean | null
          email_on_generation?: boolean | null
          id?: string
          invoice_email?: string | null
          reminder_days_before?: number | null
          send_invoice_emails?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cc_emails?: string[] | null
          client_id?: string
          created_at?: string | null
          email_on_due_date_reminder?: boolean | null
          email_on_generation?: boolean | null
          id?: string
          invoice_email?: string | null
          reminder_days_before?: number | null
          send_invoice_emails?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_email_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_email_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_equipment: {
        Row: {
          client_id: string
          created_at: string
          equipment_name: string
          equipment_type: string
          id: string
          installation_date: string | null
          last_maintenance_date: string | null
          location: string | null
          maintenance_schedule: string | null
          manufacturer: string | null
          model_number: string | null
          next_maintenance_date: string | null
          notes: string | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          equipment_name: string
          equipment_type: string
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_schedule?: string | null
          manufacturer?: string | null
          model_number?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          equipment_name?: string
          equipment_type?: string
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_schedule?: string | null
          manufacturer?: string | null
          model_number?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_equipment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_equipment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_events_logs: {
        Row: {
          action_required: boolean | null
          attachments: Json | null
          body_map_back_image_url: string | null
          body_map_front_image_url: string | null
          body_map_points: Json | null
          branch_id: string | null
          category: string | null
          client_id: string
          contributing_factors: string[] | null
          created_at: string
          description: string | null
          environmental_factors: string | null
          event_date: string | null
          event_time: string | null
          event_type: string
          expected_resolution_date: string | null
          external_reporting_details: string | null
          external_reporting_required: boolean | null
          family_notification_date: string | null
          family_notification_method: string | null
          family_notified: boolean | null
          follow_up_assigned_to: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          gp_notification_date: string | null
          gp_notified: boolean | null
          id: string
          immediate_actions_taken: string | null
          insurance_notification_date: string | null
          insurance_notified: boolean | null
          investigation_assigned_to: string | null
          investigation_required: boolean | null
          lessons_learned: string | null
          location: string | null
          notification_notes: string | null
          other_people_present: Json | null
          preventable: boolean | null
          recorded_by_staff_id: string | null
          reporter: string
          risk_level: string | null
          severity: string
          similar_incidents: string | null
          staff_aware: string[] | null
          staff_present: string[] | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          action_required?: boolean | null
          attachments?: Json | null
          body_map_back_image_url?: string | null
          body_map_front_image_url?: string | null
          body_map_points?: Json | null
          branch_id?: string | null
          category?: string | null
          client_id: string
          contributing_factors?: string[] | null
          created_at?: string
          description?: string | null
          environmental_factors?: string | null
          event_date?: string | null
          event_time?: string | null
          event_type: string
          expected_resolution_date?: string | null
          external_reporting_details?: string | null
          external_reporting_required?: boolean | null
          family_notification_date?: string | null
          family_notification_method?: string | null
          family_notified?: boolean | null
          follow_up_assigned_to?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          gp_notification_date?: string | null
          gp_notified?: boolean | null
          id?: string
          immediate_actions_taken?: string | null
          insurance_notification_date?: string | null
          insurance_notified?: boolean | null
          investigation_assigned_to?: string | null
          investigation_required?: boolean | null
          lessons_learned?: string | null
          location?: string | null
          notification_notes?: string | null
          other_people_present?: Json | null
          preventable?: boolean | null
          recorded_by_staff_id?: string | null
          reporter: string
          risk_level?: string | null
          severity?: string
          similar_incidents?: string | null
          staff_aware?: string[] | null
          staff_present?: string[] | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_required?: boolean | null
          attachments?: Json | null
          body_map_back_image_url?: string | null
          body_map_front_image_url?: string | null
          body_map_points?: Json | null
          branch_id?: string | null
          category?: string | null
          client_id?: string
          contributing_factors?: string[] | null
          created_at?: string
          description?: string | null
          environmental_factors?: string | null
          event_date?: string | null
          event_time?: string | null
          event_type?: string
          expected_resolution_date?: string | null
          external_reporting_details?: string | null
          external_reporting_required?: boolean | null
          family_notification_date?: string | null
          family_notification_method?: string | null
          family_notified?: boolean | null
          follow_up_assigned_to?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          gp_notification_date?: string | null
          gp_notified?: boolean | null
          id?: string
          immediate_actions_taken?: string | null
          insurance_notification_date?: string | null
          insurance_notified?: boolean | null
          investigation_assigned_to?: string | null
          investigation_required?: boolean | null
          lessons_learned?: string | null
          location?: string | null
          notification_notes?: string | null
          other_people_present?: Json | null
          preventable?: boolean | null
          recorded_by_staff_id?: string | null
          reporter?: string
          risk_level?: string | null
          severity?: string
          similar_incidents?: string | null
          staff_aware?: string[] | null
          staff_present?: string[] | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_events_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_events_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_events_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_events_logs_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_funding_periods: {
        Row: {
          authority_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          funding_type: string
          id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          authority_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          funding_type: string
          id?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          authority_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          funding_type?: string
          id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_funding_periods_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_funding_periods_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_funding_periods_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_groups: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_hobbies: {
        Row: {
          client_id: string
          created_at: string
          hobby_id: string
          id: string
          interest_level: string | null
          notes: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          hobby_id: string
          id?: string
          interest_level?: string | null
          notes?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          hobby_id?: string
          id?: string
          interest_level?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_hobbies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_hobbies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_hobbies_hobby_id_fkey"
            columns: ["hobby_id"]
            isOneToOne: false
            referencedRelation: "hobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_medical_info: {
        Row: {
          allergies: string[] | null
          client_id: string
          cognitive_status: string | null
          communication_needs: string | null
          created_at: string
          current_medications: string[] | null
          id: string
          medical_conditions: string[] | null
          medical_history: string | null
          mental_health_conditions: string[] | null
          mental_health_status: string | null
          mobility_status: string | null
          physical_health_conditions: string[] | null
          sensory_impairments: string[] | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          client_id: string
          cognitive_status?: string | null
          communication_needs?: string | null
          created_at?: string
          current_medications?: string[] | null
          id?: string
          medical_conditions?: string[] | null
          medical_history?: string | null
          mental_health_conditions?: string[] | null
          mental_health_status?: string | null
          mobility_status?: string | null
          physical_health_conditions?: string[] | null
          sensory_impairments?: string[] | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          client_id?: string
          cognitive_status?: string | null
          communication_needs?: string | null
          created_at?: string
          current_medications?: string[] | null
          id?: string
          medical_conditions?: string[] | null
          medical_history?: string | null
          mental_health_conditions?: string[] | null
          mental_health_status?: string | null
          mobility_status?: string | null
          physical_health_conditions?: string[] | null
          sensory_impairments?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_medical_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_medical_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_medications: {
        Row: {
          care_plan_id: string
          created_at: string
          created_by: string | null
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          instruction: string | null
          level: string | null
          name: string
          notes: string | null
          route: string | null
          shape: string | null
          side_effect: string | null
          start_date: string
          status: string
          time_of_day: string[] | null
          updated_at: string
          warning: string | null
          who_administers: string | null
        }
        Insert: {
          care_plan_id: string
          created_at?: string
          created_by?: string | null
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          instruction?: string | null
          level?: string | null
          name: string
          notes?: string | null
          route?: string | null
          shape?: string | null
          side_effect?: string | null
          start_date: string
          status?: string
          time_of_day?: string[] | null
          updated_at?: string
          warning?: string | null
          who_administers?: string | null
        }
        Update: {
          care_plan_id?: string
          created_at?: string
          created_by?: string | null
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          instruction?: string | null
          level?: string | null
          name?: string
          notes?: string | null
          route?: string | null
          shape?: string | null
          side_effect?: string | null
          start_date?: string
          status?: string
          time_of_day?: string[] | null
          updated_at?: string
          warning?: string | null
          who_administers?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_medications_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          author: string
          client_id: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          client_id: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payment_methods: {
        Row: {
          cardholder_name: string
          client_id: string
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last_four: string
          type: string
          updated_at: string
        }
        Insert: {
          cardholder_name: string
          client_id: string
          created_at?: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean
          last_four: string
          type?: string
          updated_at?: string
        }
        Update: {
          cardholder_name?: string
          client_id?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last_four?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_payment_methods_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payment_methods_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_personal_care: {
        Row: {
          assist_getting_out_of_bed: boolean | null
          assist_going_to_bed: boolean | null
          assist_turn_to_sleep_position: boolean | null
          bathing_frequency: string | null
          bathing_preferences: string | null
          bathroom_safety_concerns: string | null
          behavioral_notes: string | null
          client_id: string
          comfort_measures: string | null
          continence_status: string | null
          created_at: string
          dressing_assistance_level: string | null
          dry_self_independently: boolean | null
          get_in_out_bath_shower_independently: boolean | null
          has_podiatrist: boolean | null
          id: string
          incontinence_products_required: boolean | null
          mobility_aids_for_bathing: string | null
          oral_care_assist_cleaning_dentures: boolean | null
          oral_care_assist_cleaning_teeth: boolean | null
          oral_care_summary: string | null
          pain_management: string | null
          panic_button_in_bed: boolean | null
          personal_care_risks_explanation: string | null
          personal_hygiene_needs: string | null
          prefer_bath_or_shower: string | null
          skin_care_needs: string | null
          skin_condition_considerations: string | null
          sleep_get_out_of_bed_time: string | null
          sleep_go_to_bed_time: string | null
          sleep_patterns: string | null
          sleep_prepare_duration: string | null
          sleep_wake_up_time: string | null
          specific_washing_requirements: string | null
          toileting_assistance_level: string | null
          updated_at: string
          wash_body_independently: boolean | null
          wash_hands_face_independently: boolean | null
          washing_showering_bathing_assistance_level: string | null
          washing_showering_bathing_notes: string | null
        }
        Insert: {
          assist_getting_out_of_bed?: boolean | null
          assist_going_to_bed?: boolean | null
          assist_turn_to_sleep_position?: boolean | null
          bathing_frequency?: string | null
          bathing_preferences?: string | null
          bathroom_safety_concerns?: string | null
          behavioral_notes?: string | null
          client_id: string
          comfort_measures?: string | null
          continence_status?: string | null
          created_at?: string
          dressing_assistance_level?: string | null
          dry_self_independently?: boolean | null
          get_in_out_bath_shower_independently?: boolean | null
          has_podiatrist?: boolean | null
          id?: string
          incontinence_products_required?: boolean | null
          mobility_aids_for_bathing?: string | null
          oral_care_assist_cleaning_dentures?: boolean | null
          oral_care_assist_cleaning_teeth?: boolean | null
          oral_care_summary?: string | null
          pain_management?: string | null
          panic_button_in_bed?: boolean | null
          personal_care_risks_explanation?: string | null
          personal_hygiene_needs?: string | null
          prefer_bath_or_shower?: string | null
          skin_care_needs?: string | null
          skin_condition_considerations?: string | null
          sleep_get_out_of_bed_time?: string | null
          sleep_go_to_bed_time?: string | null
          sleep_patterns?: string | null
          sleep_prepare_duration?: string | null
          sleep_wake_up_time?: string | null
          specific_washing_requirements?: string | null
          toileting_assistance_level?: string | null
          updated_at?: string
          wash_body_independently?: boolean | null
          wash_hands_face_independently?: boolean | null
          washing_showering_bathing_assistance_level?: string | null
          washing_showering_bathing_notes?: string | null
        }
        Update: {
          assist_getting_out_of_bed?: boolean | null
          assist_going_to_bed?: boolean | null
          assist_turn_to_sleep_position?: boolean | null
          bathing_frequency?: string | null
          bathing_preferences?: string | null
          bathroom_safety_concerns?: string | null
          behavioral_notes?: string | null
          client_id?: string
          comfort_measures?: string | null
          continence_status?: string | null
          created_at?: string
          dressing_assistance_level?: string | null
          dry_self_independently?: boolean | null
          get_in_out_bath_shower_independently?: boolean | null
          has_podiatrist?: boolean | null
          id?: string
          incontinence_products_required?: boolean | null
          mobility_aids_for_bathing?: string | null
          oral_care_assist_cleaning_dentures?: boolean | null
          oral_care_assist_cleaning_teeth?: boolean | null
          oral_care_summary?: string | null
          pain_management?: string | null
          panic_button_in_bed?: boolean | null
          personal_care_risks_explanation?: string | null
          personal_hygiene_needs?: string | null
          prefer_bath_or_shower?: string | null
          skin_care_needs?: string | null
          skin_condition_considerations?: string | null
          sleep_get_out_of_bed_time?: string | null
          sleep_go_to_bed_time?: string | null
          sleep_patterns?: string | null
          sleep_prepare_duration?: string | null
          sleep_wake_up_time?: string | null
          specific_washing_requirements?: string | null
          toileting_assistance_level?: string | null
          updated_at?: string
          wash_body_independently?: boolean | null
          wash_hands_face_independently?: boolean | null
          washing_showering_bathing_assistance_level?: string | null
          washing_showering_bathing_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_personal_care_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_personal_care_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_personal_info: {
        Row: {
          arrange_assistance_device: boolean | null
          bereavement_past_two_years: boolean | null
          client_id: string
          cognitive_impairment: boolean | null
          communication_aids: string | null
          communication_style: string | null
          created_at: string
          cultural_preferences: string | null
          desired_outcomes: string | null
          dislikes_restrictions: string | null
          donts: string | null
          dos: string | null
          emergency_access: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          ethnicity: string | null
          fallen_past_six_months: boolean | null
          gender_identity: string | null
          gp_name: string | null
          gp_phone: string | null
          gp_practice: string | null
          gp_surgery_address: string | null
          gp_surgery_name: string | null
          gp_surgery_ods_code: string | null
          gp_surgery_phone: string | null
          has_assistance_device: boolean | null
          has_dnr: boolean | null
          has_dols: boolean | null
          has_key_safe: boolean | null
          has_lpa: boolean | null
          has_respect: boolean | null
          hearing_description: string | null
          hearing_difficulties: boolean | null
          home_accessibility: string | null
          how_i_communicate: string | null
          how_to_communicate_with_me: string | null
          id: string
          important_occasions: Json | null
          instructions: string[] | null
          interpreter_required: boolean | null
          key_safe_location: string | null
          language_preferences: string | null
          life_history: string | null
          likes_preferences: string | null
          living_arrangement: string | null
          lpa_holder_email: string | null
          lpa_holder_name: string | null
          lpa_holder_phone: string | null
          lpa_type: string | null
          main_reasons_for_care: string | null
          marital_status: string | null
          mobility_aids: string | null
          nationality: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relationship: string | null
          parking_availability: string | null
          personal_goals: string | null
          personality_traits: string | null
          pets: string | null
          pharmacy_address: string | null
          pharmacy_name: string | null
          pharmacy_ods_code: string | null
          pharmacy_phone: string | null
          preferred_communication: string | null
          preferred_communication_method: string | null
          preferred_interpreter_language: string | null
          primary_language: string | null
          priority_areas: string | null
          property_type: string | null
          religion: string | null
          sensory_impairment: string | null
          sexual_orientation: string | null
          speech_difficulties: boolean | null
          success_measures: string | null
          updated_at: string
          used_other_care_providers: boolean | null
          vision_description: string | null
          vision_difficulties: boolean | null
          warnings: string[] | null
        }
        Insert: {
          arrange_assistance_device?: boolean | null
          bereavement_past_two_years?: boolean | null
          client_id: string
          cognitive_impairment?: boolean | null
          communication_aids?: string | null
          communication_style?: string | null
          created_at?: string
          cultural_preferences?: string | null
          desired_outcomes?: string | null
          dislikes_restrictions?: string | null
          donts?: string | null
          dos?: string | null
          emergency_access?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          ethnicity?: string | null
          fallen_past_six_months?: boolean | null
          gender_identity?: string | null
          gp_name?: string | null
          gp_phone?: string | null
          gp_practice?: string | null
          gp_surgery_address?: string | null
          gp_surgery_name?: string | null
          gp_surgery_ods_code?: string | null
          gp_surgery_phone?: string | null
          has_assistance_device?: boolean | null
          has_dnr?: boolean | null
          has_dols?: boolean | null
          has_key_safe?: boolean | null
          has_lpa?: boolean | null
          has_respect?: boolean | null
          hearing_description?: string | null
          hearing_difficulties?: boolean | null
          home_accessibility?: string | null
          how_i_communicate?: string | null
          how_to_communicate_with_me?: string | null
          id?: string
          important_occasions?: Json | null
          instructions?: string[] | null
          interpreter_required?: boolean | null
          key_safe_location?: string | null
          language_preferences?: string | null
          life_history?: string | null
          likes_preferences?: string | null
          living_arrangement?: string | null
          lpa_holder_email?: string | null
          lpa_holder_name?: string | null
          lpa_holder_phone?: string | null
          lpa_type?: string | null
          main_reasons_for_care?: string | null
          marital_status?: string | null
          mobility_aids?: string | null
          nationality?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          parking_availability?: string | null
          personal_goals?: string | null
          personality_traits?: string | null
          pets?: string | null
          pharmacy_address?: string | null
          pharmacy_name?: string | null
          pharmacy_ods_code?: string | null
          pharmacy_phone?: string | null
          preferred_communication?: string | null
          preferred_communication_method?: string | null
          preferred_interpreter_language?: string | null
          primary_language?: string | null
          priority_areas?: string | null
          property_type?: string | null
          religion?: string | null
          sensory_impairment?: string | null
          sexual_orientation?: string | null
          speech_difficulties?: boolean | null
          success_measures?: string | null
          updated_at?: string
          used_other_care_providers?: boolean | null
          vision_description?: string | null
          vision_difficulties?: boolean | null
          warnings?: string[] | null
        }
        Update: {
          arrange_assistance_device?: boolean | null
          bereavement_past_two_years?: boolean | null
          client_id?: string
          cognitive_impairment?: boolean | null
          communication_aids?: string | null
          communication_style?: string | null
          created_at?: string
          cultural_preferences?: string | null
          desired_outcomes?: string | null
          dislikes_restrictions?: string | null
          donts?: string | null
          dos?: string | null
          emergency_access?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          ethnicity?: string | null
          fallen_past_six_months?: boolean | null
          gender_identity?: string | null
          gp_name?: string | null
          gp_phone?: string | null
          gp_practice?: string | null
          gp_surgery_address?: string | null
          gp_surgery_name?: string | null
          gp_surgery_ods_code?: string | null
          gp_surgery_phone?: string | null
          has_assistance_device?: boolean | null
          has_dnr?: boolean | null
          has_dols?: boolean | null
          has_key_safe?: boolean | null
          has_lpa?: boolean | null
          has_respect?: boolean | null
          hearing_description?: string | null
          hearing_difficulties?: boolean | null
          home_accessibility?: string | null
          how_i_communicate?: string | null
          how_to_communicate_with_me?: string | null
          id?: string
          important_occasions?: Json | null
          instructions?: string[] | null
          interpreter_required?: boolean | null
          key_safe_location?: string | null
          language_preferences?: string | null
          life_history?: string | null
          likes_preferences?: string | null
          living_arrangement?: string | null
          lpa_holder_email?: string | null
          lpa_holder_name?: string | null
          lpa_holder_phone?: string | null
          lpa_type?: string | null
          main_reasons_for_care?: string | null
          marital_status?: string | null
          mobility_aids?: string | null
          nationality?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          parking_availability?: string | null
          personal_goals?: string | null
          personality_traits?: string | null
          pets?: string | null
          pharmacy_address?: string | null
          pharmacy_name?: string | null
          pharmacy_ods_code?: string | null
          pharmacy_phone?: string | null
          preferred_communication?: string | null
          preferred_communication_method?: string | null
          preferred_interpreter_language?: string | null
          primary_language?: string | null
          priority_areas?: string | null
          property_type?: string | null
          religion?: string | null
          sensory_impairment?: string | null
          sexual_orientation?: string | null
          speech_difficulties?: boolean | null
          success_measures?: string | null
          updated_at?: string
          used_other_care_providers?: boolean | null
          vision_description?: string | null
          vision_difficulties?: boolean | null
          warnings?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_personal_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_personal_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_private_accounting: {
        Row: {
          branch_id: string | null
          charge_based_on: string | null
          client_id: string
          created_at: string | null
          credit_period_days: number | null
          extra_time_calculation: boolean | null
          id: string
          organization_id: string | null
          private_invoice_config: string | null
          travel_rate_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          charge_based_on?: string | null
          client_id: string
          created_at?: string | null
          credit_period_days?: number | null
          extra_time_calculation?: boolean | null
          id?: string
          organization_id?: string | null
          private_invoice_config?: string | null
          travel_rate_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          charge_based_on?: string | null
          client_id?: string
          created_at?: string | null
          credit_period_days?: number | null
          extra_time_calculation?: boolean | null
          id?: string
          organization_id?: string | null
          private_invoice_config?: string | null
          travel_rate_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_private_accounting_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_private_accounting_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_private_accounting_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_private_accounting_travel_rate_id_fkey"
            columns: ["travel_rate_id"]
            isOneToOne: false
            referencedRelation: "travel_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_rate_assignments: {
        Row: {
          authority_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          service_rate_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          authority_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          service_rate_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          authority_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          service_rate_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_rate_assignments_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "authorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_rate_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_rate_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_rate_assignments_service_rate_id_fkey"
            columns: ["service_rate_id"]
            isOneToOne: false
            referencedRelation: "service_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_rate_schedules: {
        Row: {
          authority_type: string
          bank_holiday_multiplier: number | null
          base_rate: number
          branch_id: string | null
          charge_type: string | null
          client_id: string
          consecutive_hours_rate: number | null
          created_at: string | null
          created_by: string | null
          days_covered: string[]
          end_date: string | null
          id: string
          is_active: boolean | null
          is_vatable: boolean
          organization_id: string | null
          pay_based_on: string | null
          rate_15_minutes: number | null
          rate_30_minutes: number | null
          rate_45_minutes: number | null
          rate_60_minutes: number | null
          rate_category: string | null
          service_type_codes: string[] | null
          start_date: string
          time_from: string
          time_until: string
          updated_at: string | null
          vat_rate: number | null
        }
        Insert: {
          authority_type: string
          bank_holiday_multiplier?: number | null
          base_rate: number
          branch_id?: string | null
          charge_type?: string | null
          client_id: string
          consecutive_hours_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          days_covered?: string[]
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_vatable?: boolean
          organization_id?: string | null
          pay_based_on?: string | null
          rate_15_minutes?: number | null
          rate_30_minutes?: number | null
          rate_45_minutes?: number | null
          rate_60_minutes?: number | null
          rate_category?: string | null
          service_type_codes?: string[] | null
          start_date: string
          time_from: string
          time_until: string
          updated_at?: string | null
          vat_rate?: number | null
        }
        Update: {
          authority_type?: string
          bank_holiday_multiplier?: number | null
          base_rate?: number
          branch_id?: string | null
          charge_type?: string | null
          client_id?: string
          consecutive_hours_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          days_covered?: string[]
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_vatable?: boolean
          organization_id?: string | null
          pay_based_on?: string | null
          rate_15_minutes?: number | null
          rate_30_minutes?: number | null
          rate_45_minutes?: number | null
          rate_60_minutes?: number | null
          rate_category?: string | null
          service_type_codes?: string[] | null
          start_date?: string
          time_from?: string
          time_until?: string
          updated_at?: string | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_rate_schedules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_rate_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_rate_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_risk_assessments: {
        Row: {
          adverse_weather_plan: string | null
          arrange_assistance_device: boolean | null
          assessed_by: string
          assessment_date: string
          can_call_for_assistance: boolean | null
          cared_in_bed: boolean | null
          client_id: string
          communication_needs: string | null
          created_at: string
          fall_risk: string | null
          fallen_past_six_months: boolean | null
          has_assistance_device: boolean | null
          has_pets: boolean | null
          id: string
          lives_alone: boolean | null
          mitigation_strategies: string[] | null
          rag_status: string | null
          review_date: string | null
          risk_factors: string[] | null
          risk_level: string
          risk_to_staff: string[]
          risk_type: string
          rural_area: boolean | null
          smoker: boolean | null
          social_support: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adverse_weather_plan?: string | null
          arrange_assistance_device?: boolean | null
          assessed_by: string
          assessment_date: string
          can_call_for_assistance?: boolean | null
          cared_in_bed?: boolean | null
          client_id: string
          communication_needs?: string | null
          created_at?: string
          fall_risk?: string | null
          fallen_past_six_months?: boolean | null
          has_assistance_device?: boolean | null
          has_pets?: boolean | null
          id?: string
          lives_alone?: boolean | null
          mitigation_strategies?: string[] | null
          rag_status?: string | null
          review_date?: string | null
          risk_factors?: string[] | null
          risk_level: string
          risk_to_staff?: string[]
          risk_type: string
          rural_area?: boolean | null
          smoker?: boolean | null
          social_support?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adverse_weather_plan?: string | null
          arrange_assistance_device?: boolean | null
          assessed_by?: string
          assessment_date?: string
          can_call_for_assistance?: boolean | null
          cared_in_bed?: boolean | null
          client_id?: string
          communication_needs?: string | null
          created_at?: string
          fall_risk?: string | null
          fallen_past_six_months?: boolean | null
          has_assistance_device?: boolean | null
          has_pets?: boolean | null
          id?: string
          lives_alone?: boolean | null
          mitigation_strategies?: string[] | null
          rag_status?: string | null
          review_date?: string | null
          risk_factors?: string[] | null
          risk_level?: string
          risk_to_staff?: string[]
          risk_type?: string
          rural_area?: boolean | null
          smoker?: boolean | null
          social_support?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_risk_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_risk_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_safeguarding: {
        Row: {
          absconding_plan: string | null
          absconding_risk: string | null
          client_id: string
          created_at: string
          created_by: string | null
          environmental_risks: string | null
          id: string
          safeguarding_notes: string | null
          safeguarding_restrictions: string | null
          self_harm_plan: string | null
          self_harm_risk: string | null
          updated_at: string
          updated_by: string | null
          violence_aggression_risk: string | null
          violence_plan: string | null
        }
        Insert: {
          absconding_plan?: string | null
          absconding_risk?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          environmental_risks?: string | null
          id?: string
          safeguarding_notes?: string | null
          safeguarding_restrictions?: string | null
          self_harm_plan?: string | null
          self_harm_risk?: string | null
          updated_at?: string
          updated_by?: string | null
          violence_aggression_risk?: string | null
          violence_plan?: string | null
        }
        Update: {
          absconding_plan?: string | null
          absconding_risk?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          environmental_risks?: string | null
          id?: string
          safeguarding_notes?: string | null
          safeguarding_restrictions?: string | null
          self_harm_plan?: string | null
          self_harm_risk?: string | null
          updated_at?: string
          updated_by?: string | null
          violence_aggression_risk?: string | null
          violence_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_safeguarding_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_safeguarding_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_service_actions: {
        Row: {
          care_plan_id: string | null
          client_id: string
          created_at: string
          duration: string
          end_date: string | null
          frequency: string
          goals: string[] | null
          id: string
          last_completed_date: string | null
          next_scheduled_date: string | null
          notes: string | null
          progress_status: string
          provider_name: string
          schedule_details: string | null
          service_category: string
          service_name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          care_plan_id?: string | null
          client_id: string
          created_at?: string
          duration: string
          end_date?: string | null
          frequency: string
          goals?: string[] | null
          id?: string
          last_completed_date?: string | null
          next_scheduled_date?: string | null
          notes?: string | null
          progress_status?: string
          provider_name: string
          schedule_details?: string | null
          service_category: string
          service_name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          care_plan_id?: string | null
          client_id?: string
          created_at?: string
          duration?: string
          end_date?: string | null
          frequency?: string
          goals?: string[] | null
          id?: string
          last_completed_date?: string | null
          next_scheduled_date?: string | null
          notes?: string | null
          progress_status?: string
          provider_name?: string
          schedule_details?: string | null
          service_category?: string
          service_name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_service_actions_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_service_reports: {
        Row: {
          activities_undertaken: string | null
          booking_id: string | null
          branch_id: string
          carer_observations: string | null
          client_engagement: string | null
          client_feedback: string | null
          client_id: string
          client_mood: string | null
          client_viewed_at: string | null
          created_at: string | null
          created_by: string
          id: string
          incident_details: string | null
          incident_occurred: boolean | null
          last_modified_by: string | null
          medication_administered: boolean | null
          medication_notes: string | null
          next_visit_preparations: string | null
          organization_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision_requested_at: string | null
          service_date: string
          service_duration_minutes: number | null
          services_provided: string[]
          staff_id: string
          status: string
          submitted_at: string | null
          tasks_completed: string[] | null
          updated_at: string | null
          visible_to_client: boolean | null
          visit_record_id: string | null
        }
        Insert: {
          activities_undertaken?: string | null
          booking_id?: string | null
          branch_id: string
          carer_observations?: string | null
          client_engagement?: string | null
          client_feedback?: string | null
          client_id: string
          client_mood?: string | null
          client_viewed_at?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          incident_details?: string | null
          incident_occurred?: boolean | null
          last_modified_by?: string | null
          medication_administered?: boolean | null
          medication_notes?: string | null
          next_visit_preparations?: string | null
          organization_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_requested_at?: string | null
          service_date: string
          service_duration_minutes?: number | null
          services_provided?: string[]
          staff_id: string
          status?: string
          submitted_at?: string | null
          tasks_completed?: string[] | null
          updated_at?: string | null
          visible_to_client?: boolean | null
          visit_record_id?: string | null
        }
        Update: {
          activities_undertaken?: string | null
          booking_id?: string | null
          branch_id?: string
          carer_observations?: string | null
          client_engagement?: string | null
          client_feedback?: string | null
          client_id?: string
          client_mood?: string | null
          client_viewed_at?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          incident_details?: string | null
          incident_occurred?: boolean | null
          last_modified_by?: string | null
          medication_administered?: boolean | null
          medication_notes?: string | null
          next_visit_preparations?: string | null
          organization_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_requested_at?: string | null
          service_date?: string
          service_duration_minutes?: number | null
          services_provided?: string[]
          staff_id?: string
          status?: string
          submitted_at?: string | null
          tasks_completed?: string[] | null
          updated_at?: string | null
          visible_to_client?: boolean | null
          visit_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_service_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_reports_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_service_reports_branch_id"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_service_reports_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_service_reports_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_service_reports_staff_id"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_status_history: {
        Row: {
          action: string
          apply_to: Json
          attachments: Json
          client_id: string
          created_at: string
          created_by: string | null
          details: string | null
          effective_from: string
          effective_until: string | null
          from_status: string | null
          id: string
          notify: Json
          reason: string | null
          suspension_type: string | null
          to_status: string | null
          updated_at: string
        }
        Insert: {
          action: string
          apply_to?: Json
          attachments?: Json
          client_id: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          effective_from?: string
          effective_until?: string | null
          from_status?: string | null
          id?: string
          notify?: Json
          reason?: string | null
          suspension_type?: string | null
          to_status?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          apply_to?: Json
          attachments?: Json
          client_id?: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          effective_from?: string
          effective_until?: string | null
          from_status?: string | null
          id?: string
          notify?: Json
          reason?: string | null
          suspension_type?: string | null
          to_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_status_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_status_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      client_vaccinations: {
        Row: {
          branch_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          file_path: string | null
          id: string
          interval_months: number | null
          next_due_date: string | null
          notes: string | null
          organization_id: string | null
          updated_at: string
          vaccination_date: string
          vaccination_name: string
        }
        Insert: {
          branch_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          interval_months?: number | null
          next_due_date?: string | null
          notes?: string | null
          organization_id?: string | null
          updated_at?: string
          vaccination_date: string
          vaccination_name: string
        }
        Update: {
          branch_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          interval_months?: number | null
          next_due_date?: string | null
          notes?: string | null
          organization_id?: string | null
          updated_at?: string
          vaccination_date?: string
          vaccination_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_vaccinations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_vaccinations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_vaccinations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_vaccinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          additional_information: string | null
          address: string | null
          age_group: Database["public"]["Enums"]["age_group"]
          agreement_id: string | null
          auth_user_id: string | null
          authority_id: string | null
          auto_generate_invoices: boolean | null
          avatar_initials: string | null
          billing_frequency: string | null
          branch_id: string | null
          client_id: string | null
          communication_preferences: string | null
          core_lead_id: string | null
          country_code: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          enable_geo_fencing: boolean | null
          expiry_date: string | null
          first_name: string
          funding_type: string | null
          gender: string | null
          gp_details: string | null
          id: string
          invitation_sent_at: string | null
          last_invoice_generated_at: string | null
          last_name: string
          middle_name: string | null
          mobile_number: string | null
          mobility_status: string | null
          organization_id: string | null
          other_identifier: string | null
          password_set_by: string | null
          phone: string | null
          pin_code: string | null
          preferred_name: string | null
          profile_photo_url: string | null
          pronouns: string | null
          referral_route: string | null
          region: string | null
          registered_on: string | null
          show_in_form_matrix: boolean | null
          show_in_task_matrix: boolean | null
          status: string | null
          telephone_number: string | null
          temporary_password: string | null
          title: string | null
          uninvoiced_bookings_count: number | null
        }
        Insert: {
          additional_information?: string | null
          address?: string | null
          age_group?: Database["public"]["Enums"]["age_group"]
          agreement_id?: string | null
          auth_user_id?: string | null
          authority_id?: string | null
          auto_generate_invoices?: boolean | null
          avatar_initials?: string | null
          billing_frequency?: string | null
          branch_id?: string | null
          client_id?: string | null
          communication_preferences?: string | null
          core_lead_id?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          enable_geo_fencing?: boolean | null
          expiry_date?: string | null
          first_name: string
          funding_type?: string | null
          gender?: string | null
          gp_details?: string | null
          id?: string
          invitation_sent_at?: string | null
          last_invoice_generated_at?: string | null
          last_name: string
          middle_name?: string | null
          mobile_number?: string | null
          mobility_status?: string | null
          organization_id?: string | null
          other_identifier?: string | null
          password_set_by?: string | null
          phone?: string | null
          pin_code?: string | null
          preferred_name?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          referral_route?: string | null
          region?: string | null
          registered_on?: string | null
          show_in_form_matrix?: boolean | null
          show_in_task_matrix?: boolean | null
          status?: string | null
          telephone_number?: string | null
          temporary_password?: string | null
          title?: string | null
          uninvoiced_bookings_count?: number | null
        }
        Update: {
          additional_information?: string | null
          address?: string | null
          age_group?: Database["public"]["Enums"]["age_group"]
          agreement_id?: string | null
          auth_user_id?: string | null
          authority_id?: string | null
          auto_generate_invoices?: boolean | null
          avatar_initials?: string | null
          billing_frequency?: string | null
          branch_id?: string | null
          client_id?: string | null
          communication_preferences?: string | null
          core_lead_id?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          enable_geo_fencing?: boolean | null
          expiry_date?: string | null
          first_name?: string
          funding_type?: string | null
          gender?: string | null
          gp_details?: string | null
          id?: string
          invitation_sent_at?: string | null
          last_invoice_generated_at?: string | null
          last_name?: string
          middle_name?: string | null
          mobile_number?: string | null
          mobility_status?: string | null
          organization_id?: string | null
          other_identifier?: string | null
          password_set_by?: string | null
          phone?: string | null
          pin_code?: string | null
          preferred_name?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          referral_route?: string | null
          region?: string | null
          registered_on?: string | null
          show_in_form_matrix?: boolean | null
          show_in_task_matrix?: boolean | null
          status?: string | null
          telephone_number?: string | null
          temporary_password?: string | null
          title?: string | null
          uninvoiced_bookings_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_core_lead_id_fkey"
            columns: ["core_lead_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_types: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          company_name: string | null
          country: string | null
          created_at: string
          director: string | null
          email: string | null
          id: string
          mobile_number: string | null
          registration_number: string | null
          singleton_enforcer: boolean
          telephone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          director?: string | null
          email?: string | null
          id?: string
          mobile_number?: string | null
          registration_number?: string | null
          singleton_enforcer?: boolean
          telephone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          director?: string | null
          email?: string | null
          id?: string
          mobile_number?: string | null
          registration_number?: string | null
          singleton_enforcer?: boolean
          telephone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          contacted_at: string | null
          contacted_by: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          notes: string | null
          organization_name: string | null
          phone_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          notes?: string | null
          organization_name?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          notes?: string | null
          organization_name?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          access_level: string
          agreement_id: string | null
          branch_id: string | null
          care_plan_id: string | null
          category: string
          client_id: string | null
          created_at: string
          description: string | null
          expiry_date: string | null
          file_path: string | null
          file_size: string | null
          file_type: string | null
          form_id: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string | null
          staff_id: string | null
          status: string
          storage_bucket: string | null
          tags: string[] | null
          type: string
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          access_level?: string
          agreement_id?: string | null
          branch_id?: string | null
          care_plan_id?: string | null
          category?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_path?: string | null
          file_size?: string | null
          file_type?: string | null
          form_id?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id?: string | null
          staff_id?: string | null
          status?: string
          storage_bucket?: string | null
          tags?: string[] | null
          type: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          access_level?: string
          agreement_id?: string | null
          branch_id?: string | null
          care_plan_id?: string | null
          category?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_path?: string | null
          file_size?: string | null
          file_type?: string | null
          form_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          staff_id?: string | null
          status?: string
          storage_bucket?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "client_care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_messages: {
        Row: {
          action_required: boolean | null
          admin_eyes_only: boolean | null
          attachments: Json | null
          auto_saved: boolean | null
          branch_id: string | null
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          notification_methods: string[] | null
          organization_id: string | null
          other_email_address: string | null
          priority: string | null
          recipient_ids: string[]
          recipient_names: string[]
          recipient_types: string[]
          sender_id: string
          subject: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_required?: boolean | null
          admin_eyes_only?: boolean | null
          attachments?: Json | null
          auto_saved?: boolean | null
          branch_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          notification_methods?: string[] | null
          organization_id?: string | null
          other_email_address?: string | null
          priority?: string | null
          recipient_ids: string[]
          recipient_names: string[]
          recipient_types: string[]
          sender_id: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_required?: boolean | null
          admin_eyes_only?: boolean | null
          attachments?: Json | null
          auto_saved?: boolean | null
          branch_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          notification_methods?: string[] | null
          organization_id?: string | null
          other_email_address?: string | null
          priority?: string | null
          recipient_ids?: string[]
          recipient_names?: string[]
          recipient_types?: string[]
          sender_id?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draft_messages_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      essential_types_master: {
        Row: {
          category: string
          created_at: string | null
          default_validity_months: number | null
          description: string | null
          display_name: string
          essential_type: string
          id: string
          is_mandatory: boolean | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_validity_months?: number | null
          description?: string | null
          display_name: string
          essential_type: string
          id?: string
          is_mandatory?: boolean | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_validity_months?: number | null
          description?: string | null
          display_name?: string
          essential_type?: string
          id?: string
          is_mandatory?: boolean | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_shares: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          share_method: string | null
          share_note: string | null
          shared_by: string | null
          shared_with: string[] | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          share_method?: string | null
          share_note?: string | null
          shared_by?: string | null
          shared_with?: string[] | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          share_method?: string | null
          share_note?: string | null
          shared_by?: string | null
          shared_with?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "event_shares_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "client_events_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_types: {
        Row: {
          amount: number
          created_at: string
          id: string
          organization_id: string | null
          status: string
          tax: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          tax?: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          tax?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          booking_id: string | null
          branch_id: string
          category: string
          client_id: string | null
          created_at: string
          created_by: string
          description: string
          expense_date: string
          expense_source: string | null
          id: string
          is_invoiced: boolean | null
          metadata: Json | null
          notes: string | null
          organization_id: string | null
          payment_method: string
          receipt_url: string | null
          rejection_reason: string | null
          staff_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          branch_id: string
          category: string
          client_id?: string | null
          created_at?: string
          created_by: string
          description: string
          expense_date?: string
          expense_source?: string | null
          id?: string
          is_invoiced?: boolean | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string | null
          payment_method?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          branch_id?: string
          category?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          expense_source?: string | null
          id?: string
          is_invoiced?: boolean | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string | null
          payment_method?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_time_records: {
        Row: {
          actual_duration_minutes: number | null
          actual_end_time: string | null
          actual_start_time: string | null
          approved_at: string | null
          approved_by: string | null
          booking_id: string | null
          branch_id: string
          client_id: string | null
          created_at: string
          created_by: string | null
          extra_time_minutes: number
          extra_time_rate: number | null
          hourly_rate: number
          id: string
          invoice_id: string | null
          invoiced: boolean
          notes: string | null
          organization_id: string | null
          reason: string | null
          rejection_reason: string | null
          scheduled_duration_minutes: number
          scheduled_end_time: string
          scheduled_start_time: string
          staff_id: string
          status: string
          total_cost: number
          updated_at: string
          work_date: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          actual_end_time?: string | null
          actual_start_time?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          branch_id: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          extra_time_minutes?: number
          extra_time_rate?: number | null
          hourly_rate: number
          id?: string
          invoice_id?: string | null
          invoiced?: boolean
          notes?: string | null
          organization_id?: string | null
          reason?: string | null
          rejection_reason?: string | null
          scheduled_duration_minutes: number
          scheduled_end_time: string
          scheduled_start_time: string
          staff_id: string
          status?: string
          total_cost?: number
          updated_at?: string
          work_date: string
        }
        Update: {
          actual_duration_minutes?: number | null
          actual_end_time?: string | null
          actual_start_time?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          branch_id?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          extra_time_minutes?: number
          extra_time_rate?: number | null
          hourly_rate?: number
          id?: string
          invoice_id?: string | null
          invoiced?: boolean
          notes?: string | null
          organization_id?: string | null
          reason?: string | null
          rejection_reason?: string | null
          scheduled_duration_minutes?: number
          scheduled_end_time?: string
          scheduled_start_time?: string
          staff_id?: string
          status?: string
          total_cost?: number
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_time_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_time_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_time_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_time_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_time_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_time_records_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_time_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_time_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      file_categories: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fluid_balance_targets: {
        Row: {
          alert_threshold_percentage: number | null
          client_id: string
          created_at: string | null
          daily_intake_target_ml: number | null
          daily_output_target_ml: number | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          alert_threshold_percentage?: number | null
          client_id: string
          created_at?: string | null
          daily_intake_target_ml?: number | null
          daily_output_target_ml?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_threshold_percentage?: number | null
          client_id?: string
          created_at?: string | null
          daily_intake_target_ml?: number | null
          daily_output_target_ml?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fluid_balance_targets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_balance_targets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      fluid_intake_records: {
        Row: {
          amount_ml: number
          client_id: string
          comments: string | null
          created_at: string | null
          fluid_type: string
          id: string
          method: string
          record_date: string
          recorded_by: string | null
          service_report_id: string | null
          time: string
          updated_at: string | null
          visit_record_id: string | null
        }
        Insert: {
          amount_ml: number
          client_id: string
          comments?: string | null
          created_at?: string | null
          fluid_type: string
          id?: string
          method: string
          record_date: string
          recorded_by?: string | null
          service_report_id?: string | null
          time: string
          updated_at?: string | null
          visit_record_id?: string | null
        }
        Update: {
          amount_ml?: number
          client_id?: string
          comments?: string | null
          created_at?: string | null
          fluid_type?: string
          id?: string
          method?: string
          record_date?: string
          recorded_by?: string | null
          service_report_id?: string | null
          time?: string
          updated_at?: string | null
          visit_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fluid_intake_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_intake_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_intake_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_intake_records_service_report_id_fkey"
            columns: ["service_report_id"]
            isOneToOne: false
            referencedRelation: "client_service_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_intake_records_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      fluid_output_records: {
        Row: {
          amount_estimate: string | null
          amount_ml: number | null
          appearance: string | null
          client_id: string
          comments: string | null
          created_at: string | null
          id: string
          output_type: string
          record_date: string
          recorded_by: string | null
          service_report_id: string | null
          time: string
          updated_at: string | null
          visit_record_id: string | null
        }
        Insert: {
          amount_estimate?: string | null
          amount_ml?: number | null
          appearance?: string | null
          client_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          output_type: string
          record_date: string
          recorded_by?: string | null
          service_report_id?: string | null
          time: string
          updated_at?: string | null
          visit_record_id?: string | null
        }
        Update: {
          amount_estimate?: string | null
          amount_ml?: number | null
          appearance?: string | null
          client_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          output_type?: string
          record_date?: string
          recorded_by?: string | null
          service_report_id?: string | null
          time?: string
          updated_at?: string | null
          visit_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fluid_output_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_output_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_output_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_output_records_service_report_id_fkey"
            columns: ["service_report_id"]
            isOneToOne: false
            referencedRelation: "client_service_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluid_output_records_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      form_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string
          assignee_id: string
          assignee_name: string
          assignee_type: string
          form_id: string
          id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assignee_id: string
          assignee_name: string
          assignee_type: string
          form_id: string
          id?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assignee_id?: string
          assignee_name?: string
          assignee_type?: string
          form_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_assignees_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_elements: {
        Row: {
          created_at: string
          element_type: string
          form_id: string
          id: string
          label: string
          order_index: number
          properties: Json | null
          required: boolean
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          element_type: string
          form_id: string
          id?: string
          label: string
          order_index: number
          properties?: Json | null
          required?: boolean
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          element_type?: string
          form_id?: string
          id?: string
          label?: string
          order_index?: number
          properties?: Json | null
          required?: boolean
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_elements_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_permissions: {
        Row: {
          created_at: string
          form_id: string
          id: string
          permission_type: string
          role_type: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          permission_type: string
          role_type: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          permission_type?: string
          role_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_permissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          branch_id: string
          form_id: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submission_data: Json
          submission_type: string | null
          submitted_at: string
          submitted_by: string
          submitted_by_admin: string | null
          submitted_by_type: string
          submitted_on_behalf_of: string | null
        }
        Insert: {
          branch_id: string
          form_id: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_data?: Json
          submission_type?: string | null
          submitted_at?: string
          submitted_by: string
          submitted_by_admin?: string | null
          submitted_by_type: string
          submitted_on_behalf_of?: string | null
        }
        Update: {
          branch_id?: string
          form_id?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_data?: Json
          submission_type?: string | null
          submitted_at?: string
          submitted_by?: string
          submitted_by_admin?: string | null
          submitted_by_type?: string
          submitted_on_behalf_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          organization_id: string | null
          published: boolean
          requires_review: boolean
          settings: Json | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          organization_id?: string | null
          published?: boolean
          requires_review?: boolean
          settings?: Json | null
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          published?: boolean
          requires_review?: boolean
          settings?: Json | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "forms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hobbies: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          source_system_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hobbies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hobbies_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "system_hobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_email_queue: {
        Row: {
          client_id: string
          created_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          invoice_id: string
          max_retries: number | null
          recipient_email: string
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_data: Json | null
          template_name: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          invoice_id: string
          max_retries?: number | null
          recipient_email: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_data?: Json | null
          template_name?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          invoice_id?: string
          max_retries?: number | null
          recipient_email?: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_data?: Json | null
          template_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_email_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_email_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_email_queue_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_billing"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_expense_entries: {
        Row: {
          admin_cost_percentage: number
          amount: number
          created_at: string
          date: string | null
          description: string | null
          expense_id: string | null
          expense_type_id: string
          expense_type_name: string
          id: string
          invoice_id: string
          organization_id: string | null
          pay_staff: boolean | null
          pay_staff_amount: number | null
          staff_id: string | null
          staff_name: string | null
          updated_at: string
        }
        Insert: {
          admin_cost_percentage?: number
          amount?: number
          created_at?: string
          date?: string | null
          description?: string | null
          expense_id?: string | null
          expense_type_id: string
          expense_type_name: string
          id?: string
          invoice_id: string
          organization_id?: string | null
          pay_staff?: boolean | null
          pay_staff_amount?: number | null
          staff_id?: string | null
          staff_name?: string | null
          updated_at?: string
        }
        Update: {
          admin_cost_percentage?: number
          amount?: number
          created_at?: string
          date?: string | null
          description?: string | null
          expense_id?: string | null
          expense_type_id?: string
          expense_type_name?: string
          id?: string
          invoice_id?: string
          organization_id?: string | null
          pay_staff?: boolean | null
          pay_staff_amount?: number | null
          staff_id?: string | null
          staff_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_expense_entries_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_expense_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_expense_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_expense_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_generation_batches: {
        Row: {
          branch_id: string
          clients_processed: number
          created_at: string | null
          error_details: Json | null
          execution_time_ms: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          invoice_ids: string[] | null
          invoices_created: number
          invoices_failed: number
          organization_id: string
          period_end_date: string
          period_start_date: string
          period_type: string
          status: string | null
          total_amount: number | null
          total_net_amount: number | null
          total_vat_amount: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          clients_processed?: number
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          invoice_ids?: string[] | null
          invoices_created?: number
          invoices_failed?: number
          organization_id: string
          period_end_date: string
          period_start_date: string
          period_type: string
          status?: string | null
          total_amount?: number | null
          total_net_amount?: number | null
          total_vat_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          clients_processed?: number
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          invoice_ids?: string[] | null
          invoices_created?: number
          invoices_failed?: number
          organization_id?: string
          period_end_date?: string
          period_start_date?: string
          period_type?: string
          status?: string | null
          total_amount?: number | null
          total_net_amount?: number | null
          total_vat_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_generation_batches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_generation_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          bank_holiday_multiplier_applied: number | null
          booking_id: string | null
          created_at: string
          day_type: string | null
          description: string
          discount_amount: number | null
          duration_minutes: number | null
          id: string
          invoice_id: string
          line_total: number
          organization_id: string
          quantity: number | null
          rate_per_unit: number | null
          rate_type_applied: string | null
          service_end_time: string | null
          service_id: string | null
          service_start_time: string | null
          unit_price: number
          updated_at: string
          visit_date: string | null
          visit_record_id: string | null
        }
        Insert: {
          bank_holiday_multiplier_applied?: number | null
          booking_id?: string | null
          created_at?: string
          day_type?: string | null
          description: string
          discount_amount?: number | null
          duration_minutes?: number | null
          id?: string
          invoice_id: string
          line_total: number
          organization_id: string
          quantity?: number | null
          rate_per_unit?: number | null
          rate_type_applied?: string | null
          service_end_time?: string | null
          service_id?: string | null
          service_start_time?: string | null
          unit_price: number
          updated_at?: string
          visit_date?: string | null
          visit_record_id?: string | null
        }
        Update: {
          bank_holiday_multiplier_applied?: number | null
          booking_id?: string | null
          created_at?: string
          day_type?: string | null
          description?: string
          discount_amount?: number | null
          duration_minutes?: number | null
          id?: string
          invoice_id?: string
          line_total?: number
          organization_id?: string
          quantity?: number | null
          rate_per_unit?: number | null
          rate_type_applied?: string | null
          service_end_time?: string | null
          service_id?: string | null
          service_start_time?: string | null
          unit_price?: number
          updated_at?: string
          visit_date?: string | null
          visit_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_periods: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          is_bank_holiday: boolean | null
          multiplier: number | null
          period_end: string
          period_start: string
          rate_applied: number | null
          service_hours: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          is_bank_holiday?: boolean | null
          multiplier?: number | null
          period_end: string
          period_start: string
          rate_applied?: number | null
          service_hours?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          is_bank_holiday?: boolean | null
          multiplier?: number | null
          period_end?: string
          period_start?: string
          rate_applied?: number | null
          service_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_periods_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_billing"
            referencedColumns: ["id"]
          },
        ]
      }
      library_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      library_resource_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          branch_id: string | null
          id: string
          resource_id: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          branch_id?: string | null
          id?: string
          resource_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          branch_id?: string | null
          id?: string
          resource_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_resource_access_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_resource_access_logs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "library_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      library_resources: {
        Row: {
          access_roles: string[] | null
          author: string | null
          branch_id: string | null
          category: string
          created_at: string | null
          description: string | null
          downloads_count: number | null
          expires_at: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_private: boolean | null
          rating: number | null
          resource_type: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
          uploaded_by_name: string | null
          url: string | null
          version: string | null
          views_count: number | null
        }
        Insert: {
          access_roles?: string[] | null
          author?: string | null
          branch_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          expires_at?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_private?: boolean | null
          rating?: number | null
          resource_type: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          url?: string | null
          version?: string | null
          views_count?: number | null
        }
        Update: {
          access_roles?: string[] | null
          author?: string | null
          branch_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          expires_at?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_private?: boolean | null
          rating?: number | null
          resource_type?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          url?: string | null
          version?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "library_resources_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_conditions: {
        Row: {
          category_id: string | null
          created_at: string
          field_caption: string | null
          id: string
          organization_id: string | null
          source_system_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          field_caption?: string | null
          id?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          field_caption?: string | null
          id?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_conditions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "medical_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_conditions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_conditions_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "system_medical_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_administration_records: {
        Row: {
          administered_at: string
          administered_by: string
          created_at: string
          id: string
          medication_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          administered_at: string
          administered_by: string
          created_at?: string
          id?: string
          medication_id: string
          notes?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          administered_at?: string
          administered_by?: string
          created_at?: string
          id?: string
          medication_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_administration_records_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "client_medications"
            referencedColumns: ["id"]
          },
        ]
      }
      message_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          thread_id: string
          user_id: string
          user_name: string
          user_type: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          thread_id: string
          user_id: string
          user_name: string
          user_type: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          thread_id?: string
          user_id?: string
          user_name?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_status: {
        Row: {
          delivered_at: string | null
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          delivered_at?: string | null
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_status_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          admin_only: boolean | null
          branch_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_archived: boolean | null
          is_deleted: boolean | null
          last_message_at: string | null
          organization_id: string | null
          requires_action: boolean | null
          subject: string
          thread_type: string | null
          updated_at: string
        }
        Insert: {
          admin_only?: boolean | null
          branch_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_archived?: boolean | null
          is_deleted?: boolean | null
          last_message_at?: string | null
          organization_id?: string | null
          requires_action?: boolean | null
          subject: string
          thread_type?: string | null
          updated_at?: string
        }
        Update: {
          admin_only?: boolean | null
          branch_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_archived?: boolean | null
          is_deleted?: boolean | null
          last_message_at?: string | null
          organization_id?: string | null
          requires_action?: boolean | null
          subject?: string
          thread_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          action_required: boolean | null
          admin_eyes_only: boolean | null
          attachments: Json | null
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          has_attachments: boolean | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean
          message_type: string | null
          notification_methods: string[] | null
          other_email_address: string | null
          priority: string | null
          sender_id: string
          sender_type: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          action_required?: boolean | null
          admin_eyes_only?: boolean | null
          attachments?: Json | null
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          has_attachments?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean
          message_type?: string | null
          notification_methods?: string[] | null
          other_email_address?: string | null
          priority?: string | null
          sender_id: string
          sender_type: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          action_required?: boolean | null
          admin_eyes_only?: boolean | null
          attachments?: Json | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          has_attachments?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean
          message_type?: string | null
          notification_methods?: string[] | null
          other_email_address?: string | null
          priority?: string | null
          sender_id?: string
          sender_type?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      news2_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          id: string
          message: string
          news2_observation_id: string
          news2_patient_id: string
          resolved: boolean
          resolved_at: string | null
          severity: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          id?: string
          message: string
          news2_observation_id: string
          news2_patient_id: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          news2_observation_id?: string
          news2_patient_id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "news2_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news2_alerts_news2_observation_id_fkey"
            columns: ["news2_observation_id"]
            isOneToOne: false
            referencedRelation: "news2_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news2_alerts_news2_patient_id_fkey"
            columns: ["news2_patient_id"]
            isOneToOne: false
            referencedRelation: "news2_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      news2_observations: {
        Row: {
          action_taken: string | null
          ai_recommendations: string | null
          clinical_notes: string | null
          consciousness_level: string
          consciousness_level_score: number
          created_at: string
          diastolic_bp: number | null
          diastolic_bp_score: number | null
          id: string
          news2_patient_id: string
          next_review_time: string | null
          oxygen_saturation: number | null
          oxygen_saturation_score: number
          pulse_rate: number | null
          pulse_rate_score: number
          recorded_at: string
          recorded_by_staff_id: string
          respiratory_rate: number | null
          respiratory_rate_score: number
          risk_level: string
          supplemental_oxygen: boolean
          supplemental_oxygen_score: number
          systolic_bp: number | null
          systolic_bp_score: number
          temperature: number | null
          temperature_score: number
          total_score: number
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          ai_recommendations?: string | null
          clinical_notes?: string | null
          consciousness_level?: string
          consciousness_level_score?: number
          created_at?: string
          diastolic_bp?: number | null
          diastolic_bp_score?: number | null
          id?: string
          news2_patient_id: string
          next_review_time?: string | null
          oxygen_saturation?: number | null
          oxygen_saturation_score?: number
          pulse_rate?: number | null
          pulse_rate_score?: number
          recorded_at?: string
          recorded_by_staff_id: string
          respiratory_rate?: number | null
          respiratory_rate_score?: number
          risk_level?: string
          supplemental_oxygen?: boolean
          supplemental_oxygen_score?: number
          systolic_bp?: number | null
          systolic_bp_score?: number
          temperature?: number | null
          temperature_score?: number
          total_score?: number
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          ai_recommendations?: string | null
          clinical_notes?: string | null
          consciousness_level?: string
          consciousness_level_score?: number
          created_at?: string
          diastolic_bp?: number | null
          diastolic_bp_score?: number | null
          id?: string
          news2_patient_id?: string
          next_review_time?: string | null
          oxygen_saturation?: number | null
          oxygen_saturation_score?: number
          pulse_rate?: number | null
          pulse_rate_score?: number
          recorded_at?: string
          recorded_by_staff_id?: string
          respiratory_rate?: number | null
          respiratory_rate_score?: number
          risk_level?: string
          supplemental_oxygen?: boolean
          supplemental_oxygen_score?: number
          systolic_bp?: number | null
          systolic_bp_score?: number
          temperature?: number | null
          temperature_score?: number
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news2_observations_news2_patient_id_fkey"
            columns: ["news2_patient_id"]
            isOneToOne: false
            referencedRelation: "news2_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news2_observations_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      news2_patients: {
        Row: {
          assigned_carer_id: string | null
          branch_id: string
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          monitoring_frequency: string
          notes: string | null
          risk_category: string
          updated_at: string
        }
        Insert: {
          assigned_carer_id?: string | null
          branch_id: string
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          monitoring_frequency?: string
          notes?: string | null
          risk_category?: string
          updated_at?: string
        }
        Update: {
          assigned_carer_id?: string | null
          branch_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          monitoring_frequency?: string
          notes?: string | null
          risk_category?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news2_patients_assigned_carer_id_fkey"
            columns: ["assigned_carer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news2_patients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news2_patients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news2_patients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          branch_id: string | null
          category: string
          created_at: string
          data: Json | null
          email_sent: boolean | null
          expires_at: string | null
          id: string
          message: string
          organization_id: string | null
          priority: string
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          category: string
          created_at?: string
          data?: Json | null
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          message: string
          organization_id?: string | null
          priority?: string
          read_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          category?: string
          created_at?: string
          data?: Json | null
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          message?: string
          organization_id?: string | null
          priority?: string
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          permissions: Json | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          billing_email: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          director: string | null
          id: string
          is_trial: boolean | null
          logo_url: string | null
          max_branches: number | null
          max_users: number | null
          name: string
          primary_color: string | null
          registration_number: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          subscription_expires_at: string | null
          subscription_plan: string
          subscription_plan_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          director?: string | null
          id?: string
          is_trial?: boolean | null
          logo_url?: string | null
          max_branches?: number | null
          max_users?: number | null
          name: string
          primary_color?: string | null
          registration_number?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          subscription_expires_at?: string | null
          subscription_plan?: string
          subscription_plan_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          director?: string | null
          id?: string
          is_trial?: boolean | null
          logo_url?: string | null
          max_branches?: number | null
          max_users?: number | null
          name?: string
          primary_color?: string | null
          registration_number?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          subscription_expires_at?: string | null
          subscription_plan?: string
          subscription_plan_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          payment_reference: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_amount: number
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_billing"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          basic_salary: number
          bonus: number
          branch_id: string
          created_at: string
          created_by: string
          gross_pay: number
          hourly_rate: number
          id: string
          net_pay: number
          ni_deduction: number
          notes: string | null
          other_deductions: number
          overtime_hours: number
          overtime_pay: number
          overtime_rate: number | null
          pay_period_end: string
          pay_period_start: string
          payment_date: string | null
          payment_method: string
          payment_reference: string | null
          payment_status: string
          pension_deduction: number
          regular_hours: number
          staff_id: string
          tax_deduction: number
          updated_at: string
        }
        Insert: {
          basic_salary?: number
          bonus?: number
          branch_id: string
          created_at?: string
          created_by: string
          gross_pay: number
          hourly_rate: number
          id?: string
          net_pay: number
          ni_deduction?: number
          notes?: string | null
          other_deductions?: number
          overtime_hours?: number
          overtime_pay?: number
          overtime_rate?: number | null
          pay_period_end: string
          pay_period_start: string
          payment_date?: string | null
          payment_method?: string
          payment_reference?: string | null
          payment_status?: string
          pension_deduction?: number
          regular_hours?: number
          staff_id: string
          tax_deduction?: number
          updated_at?: string
        }
        Update: {
          basic_salary?: number
          bonus?: number
          branch_id?: string
          created_at?: string
          created_by?: string
          gross_pay?: number
          hourly_rate?: number
          id?: string
          net_pay?: number
          ni_deduction?: number
          notes?: string | null
          other_deductions?: number
          overtime_hours?: number
          overtime_pay?: number
          overtime_rate?: number | null
          pay_period_end?: string
          pay_period_start?: string
          payment_date?: string | null
          payment_method?: string
          payment_reference?: string | null
          payment_status?: string
          pension_deduction?: number
          regular_hours?: number
          staff_id?: string
          tax_deduction?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      report_shares: {
        Row: {
          branch_id: string | null
          created_at: string | null
          file_format: string | null
          id: string
          report_data: Json | null
          report_type: string
          share_method: string | null
          share_note: string | null
          shared_by: string | null
          shared_with: string[] | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          file_format?: string | null
          id?: string
          report_data?: Json | null
          report_type: string
          share_method?: string | null
          share_note?: string | null
          shared_by?: string | null
          shared_with?: string[] | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          file_format?: string | null
          id?: string
          report_data?: Json | null
          report_type?: string
          share_method?: string | null
          share_note?: string | null
          shared_by?: string | null
          shared_with?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "report_shares_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      report_types: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          booking_id: string | null
          branch_id: string | null
          can_edit_until: string
          client_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          rating: number
          service_date: string
          service_type: string | null
          staff_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          booking_id?: string | null
          branch_id?: string | null
          can_edit_until?: string
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          rating: number
          service_date?: string
          service_type?: string | null
          staff_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          booking_id?: string | null
          branch_id?: string | null
          can_edit_until?: string
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          rating?: number
          service_date?: string
          service_type?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "client_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_agreements: {
        Row: {
          attachment_file_id: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          scheduled_for: string | null
          scheduled_with_client_id: string | null
          scheduled_with_name: string | null
          scheduled_with_staff_id: string | null
          status: Database["public"]["Enums"]["scheduled_agreement_status"]
          template_id: string | null
          title: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          attachment_file_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scheduled_for?: string | null
          scheduled_with_client_id?: string | null
          scheduled_with_name?: string | null
          scheduled_with_staff_id?: string | null
          status?: Database["public"]["Enums"]["scheduled_agreement_status"]
          template_id?: string | null
          title: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          attachment_file_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scheduled_for?: string | null
          scheduled_with_client_id?: string | null
          scheduled_with_name?: string | null
          scheduled_with_staff_id?: string | null
          status?: Database["public"]["Enums"]["scheduled_agreement_status"]
          template_id?: string | null
          title?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_agreements_attachment_file_id_fkey"
            columns: ["attachment_file_id"]
            isOneToOne: false
            referencedRelation: "agreement_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_agreements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_agreements_scheduled_with_client_id_fkey"
            columns: ["scheduled_with_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_agreements_scheduled_with_client_id_fkey"
            columns: ["scheduled_with_client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_agreements_scheduled_with_staff_id_fkey"
            columns: ["scheduled_with_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_agreements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_agreements_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "agreement_types"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          action_required: boolean | null
          admin_eyes_only: boolean | null
          attachments: Json | null
          branch_id: string | null
          content: string
          created_at: string
          error_message: string | null
          id: string
          message_type: string | null
          notification_methods: string[] | null
          organization_id: string | null
          other_email_address: string | null
          priority: string | null
          recipient_ids: string[]
          scheduled_for: string
          sender_id: string
          sent_at: string | null
          status: string
          subject: string | null
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          action_required?: boolean | null
          admin_eyes_only?: boolean | null
          attachments?: Json | null
          branch_id?: string | null
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_type?: string | null
          notification_methods?: string[] | null
          organization_id?: string | null
          other_email_address?: string | null
          priority?: string | null
          recipient_ids: string[]
          scheduled_for: string
          sender_id: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          action_required?: boolean | null
          admin_eyes_only?: boolean | null
          attachments?: Json | null
          branch_id?: string | null
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_type?: string | null
          notification_methods?: string[] | null
          organization_id?: string | null
          other_email_address?: string | null
          priority?: string | null
          recipient_ids?: string[]
          scheduled_for?: string
          sender_id?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      service_rates: {
        Row: {
          amount: number
          applicable_days: string[]
          bank_holiday_multiplier: number | null
          branch_id: string
          charge_type: string | null
          client_type: string
          consecutive_hours: number | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          effective_from: string
          effective_to: string | null
          funding_source: string
          id: string
          is_default: boolean
          is_vatable: boolean | null
          mileage_excluded: boolean | null
          pay_based_on: string | null
          rate_15_minutes: number | null
          rate_30_minutes: number | null
          rate_45_minutes: number | null
          rate_60_minutes: number | null
          rate_category: string | null
          rate_type: string
          service_code: string
          service_id: string | null
          service_name: string
          service_type: string | null
          status: string
          time_from: string | null
          time_until: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          applicable_days?: string[]
          bank_holiday_multiplier?: number | null
          branch_id: string
          charge_type?: string | null
          client_type?: string
          consecutive_hours?: number | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          funding_source?: string
          id?: string
          is_default?: boolean
          is_vatable?: boolean | null
          mileage_excluded?: boolean | null
          pay_based_on?: string | null
          rate_15_minutes?: number | null
          rate_30_minutes?: number | null
          rate_45_minutes?: number | null
          rate_60_minutes?: number | null
          rate_category?: string | null
          rate_type?: string
          service_code: string
          service_id?: string | null
          service_name: string
          service_type?: string | null
          status?: string
          time_from?: string | null
          time_until?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          applicable_days?: string[]
          bank_holiday_multiplier?: number | null
          branch_id?: string
          charge_type?: string | null
          client_type?: string
          consecutive_hours?: number | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          funding_source?: string
          id?: string
          is_default?: boolean
          is_vatable?: boolean | null
          mileage_excluded?: boolean | null
          pay_based_on?: string | null
          rate_15_minutes?: number | null
          rate_30_minutes?: number | null
          rate_45_minutes?: number | null
          rate_60_minutes?: number | null
          rate_category?: string | null
          rate_type?: string
          service_code?: string
          service_id?: string | null
          service_name?: string
          service_type?: string | null
          status?: string
          time_from?: string | null
          time_until?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_rates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_rates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_rates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          code: string | null
          created_at: string
          description: string | null
          double_handed: boolean
          id: string
          organization_id: string | null
          source_system_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          code?: string | null
          created_at?: string
          description?: string | null
          double_handed?: boolean
          id?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string | null
          created_at?: string
          description?: string | null
          double_handed?: boolean
          id?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          name: string
          organization_id: string | null
          source_system_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          name: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "system_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          address: string | null
          auth_user_id: string | null
          availability: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_sort_code: string | null
          branch_id: string | null
          certifications: string[] | null
          contract_start_date: string | null
          contract_type: string | null
          created_at: string | null
          date_of_birth: string | null
          dbs_certificate_number: string | null
          dbs_check_date: string | null
          dbs_status: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          experience: string | null
          first_login_completed: boolean | null
          first_name: string
          hire_date: string | null
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          last_name: string
          late_arrival_count: number | null
          missed_booking_count: number | null
          national_insurance_number: string | null
          organization_id: string | null
          phone: string | null
          photo_url: string | null
          profile_completed: boolean | null
          punctuality_score: number | null
          qualifications: string[] | null
          salary_amount: number | null
          salary_frequency: string | null
          specialization: string | null
          status: string | null
          temporary_password: string | null
          training_records: Json | null
          travel_payment_type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          availability?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_sort_code?: string | null
          branch_id?: string | null
          certifications?: string[] | null
          contract_start_date?: string | null
          contract_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          dbs_certificate_number?: string | null
          dbs_check_date?: string | null
          dbs_status?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          experience?: string | null
          first_login_completed?: boolean | null
          first_name: string
          hire_date?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_name: string
          late_arrival_count?: number | null
          missed_booking_count?: number | null
          national_insurance_number?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_completed?: boolean | null
          punctuality_score?: number | null
          qualifications?: string[] | null
          salary_amount?: number | null
          salary_frequency?: string | null
          specialization?: string | null
          status?: string | null
          temporary_password?: string | null
          training_records?: Json | null
          travel_payment_type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          availability?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_sort_code?: string | null
          branch_id?: string | null
          certifications?: string[] | null
          contract_start_date?: string | null
          contract_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          dbs_certificate_number?: string | null
          dbs_check_date?: string | null
          dbs_status?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          experience?: string | null
          first_login_completed?: boolean | null
          first_name?: string
          hire_date?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_name?: string
          late_arrival_count?: number | null
          missed_booking_count?: number | null
          national_insurance_number?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_completed?: boolean | null
          punctuality_score?: number | null
          qualifications?: string[] | null
          salary_amount?: number | null
          salary_frequency?: string | null
          specialization?: string | null
          status?: string | null
          temporary_password?: string | null
          training_records?: Json | null
          travel_payment_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at: string
          iban: string | null
          id: string
          is_active: boolean
          sort_code: string
          staff_id: string
          swift_code: string | null
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          sort_code: string
          staff_id: string
          swift_code?: string | null
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          sort_code?: string
          staff_id?: string
          swift_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_bank_details_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_branch_transfers: {
        Row: {
          created_at: string | null
          effective_date: string
          from_branch_id: string | null
          future_bookings_moved: number | null
          id: string
          move_future_bookings: boolean | null
          staff_id: string
          to_branch_id: string
          transfer_notes: string | null
          transfer_reason: string | null
          transferred_by: string | null
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          from_branch_id?: string | null
          future_bookings_moved?: number | null
          id?: string
          move_future_bookings?: boolean | null
          staff_id: string
          to_branch_id: string
          transfer_notes?: string | null
          transfer_reason?: string | null
          transferred_by?: string | null
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          from_branch_id?: string | null
          future_bookings_moved?: number | null
          id?: string
          move_future_bookings?: boolean | null
          staff_id?: string
          to_branch_id?: string
          transfer_notes?: string | null
          transfer_reason?: string | null
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_branch_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branch_transfers_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branch_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_career_highlights: {
        Row: {
          achieved_date: string
          color: string
          created_at: string
          description: string
          highlight_type: string
          id: string
          staff_id: string
          title: string
          updated_at: string
        }
        Insert: {
          achieved_date: string
          color?: string
          created_at?: string
          description: string
          highlight_type: string
          id?: string
          staff_id: string
          title: string
          updated_at?: string
        }
        Update: {
          achieved_date?: string
          color?: string
          created_at?: string
          description?: string
          highlight_type?: string
          id?: string
          staff_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_career_highlights_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_contacts: {
        Row: {
          address: string | null
          branch_id: string | null
          contact_type: string
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string
          relationship: string
          staff_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          contact_type: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone: string
          relationship: string
          staff_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          contact_type?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string
          relationship?: string
          staff_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_contacts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_contacts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_deduction_settings: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          effective_until: string | null
          employer_pension_percentage: number | null
          has_student_loan: boolean | null
          id: string
          is_active: boolean | null
          ni_active: boolean | null
          ni_amount: number | null
          ni_category: string | null
          ni_rate: number | null
          notes: string | null
          organization_id: string | null
          other_deductions: Json | null
          other_deductions_active: boolean | null
          other_deductions_amount: number | null
          pension_active: boolean | null
          pension_amount: number | null
          pension_opted_in: boolean | null
          pension_percentage: number | null
          pension_provider: string | null
          staff_id: string
          student_loan_plan: string | null
          tax_active: boolean | null
          tax_amount: number | null
          tax_code: string | null
          tax_rate: number | null
          updated_at: string | null
          use_custom_ni_rate: boolean | null
          use_custom_tax_rate: boolean | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          employer_pension_percentage?: number | null
          has_student_loan?: boolean | null
          id?: string
          is_active?: boolean | null
          ni_active?: boolean | null
          ni_amount?: number | null
          ni_category?: string | null
          ni_rate?: number | null
          notes?: string | null
          organization_id?: string | null
          other_deductions?: Json | null
          other_deductions_active?: boolean | null
          other_deductions_amount?: number | null
          pension_active?: boolean | null
          pension_amount?: number | null
          pension_opted_in?: boolean | null
          pension_percentage?: number | null
          pension_provider?: string | null
          staff_id: string
          student_loan_plan?: string | null
          tax_active?: boolean | null
          tax_amount?: number | null
          tax_code?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          use_custom_ni_rate?: boolean | null
          use_custom_tax_rate?: boolean | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          employer_pension_percentage?: number | null
          has_student_loan?: boolean | null
          id?: string
          is_active?: boolean | null
          ni_active?: boolean | null
          ni_amount?: number | null
          ni_category?: string | null
          ni_rate?: number | null
          notes?: string | null
          organization_id?: string | null
          other_deductions?: Json | null
          other_deductions_active?: boolean | null
          other_deductions_amount?: number | null
          pension_active?: boolean | null
          pension_amount?: number | null
          pension_opted_in?: boolean | null
          pension_percentage?: number | null
          pension_provider?: string | null
          staff_id?: string
          student_loan_plan?: string | null
          tax_active?: boolean | null
          tax_amount?: number | null
          tax_code?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          use_custom_ni_rate?: boolean | null
          use_custom_tax_rate?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_deduction_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_deduction_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_deduction_settings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: string | null
          file_type: string | null
          id: string
          staff_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: string | null
          file_type?: string | null
          id?: string
          staff_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: string | null
          file_type?: string | null
          id?: string
          staff_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_documents_staff_id"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_employment_history: {
        Row: {
          created_at: string
          employer: string
          end_date: string | null
          id: string
          location: string
          position: string
          responsibilities: string[] | null
          staff_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employer: string
          end_date?: string | null
          id?: string
          location: string
          position: string
          responsibilities?: string[] | null
          staff_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employer?: string
          end_date?: string | null
          id?: string
          location?: string
          position?: string
          responsibilities?: string[] | null
          staff_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_employment_history_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_essentials_checklist: {
        Row: {
          category: string
          completion_date: string | null
          created_at: string | null
          display_name: string
          document_id: string | null
          essential_type: string
          expiry_date: string | null
          id: string
          notes: string | null
          reminder_sent_at: string | null
          required: boolean | null
          staff_id: string
          status: Database["public"]["Enums"]["essential_status"] | null
          training_record_id: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category: string
          completion_date?: string | null
          created_at?: string | null
          display_name: string
          document_id?: string | null
          essential_type: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          reminder_sent_at?: string | null
          required?: boolean | null
          staff_id: string
          status?: Database["public"]["Enums"]["essential_status"] | null
          training_record_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string
          completion_date?: string | null
          created_at?: string | null
          display_name?: string
          document_id?: string | null
          essential_type?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          reminder_sent_at?: string | null
          required?: boolean | null
          staff_id?: string
          status?: Database["public"]["Enums"]["essential_status"] | null
          training_record_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_essentials_checklist_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "staff_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_essentials_checklist_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_essentials_checklist_training_record_id_fkey"
            columns: ["training_record_id"]
            isOneToOne: false
            referencedRelation: "staff_training_records"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_hobbies: {
        Row: {
          created_at: string
          enjoys_teaching: boolean | null
          hobby_id: string
          id: string
          notes: string | null
          proficiency_level: string | null
          staff_id: string
        }
        Insert: {
          created_at?: string
          enjoys_teaching?: boolean | null
          hobby_id: string
          id?: string
          notes?: string | null
          proficiency_level?: string | null
          staff_id: string
        }
        Update: {
          created_at?: string
          enjoys_teaching?: boolean | null
          hobby_id?: string
          id?: string
          notes?: string | null
          proficiency_level?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_hobbies_hobby_id_fkey"
            columns: ["hobby_id"]
            isOneToOne: false
            referencedRelation: "hobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_hobbies_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_improvement_areas: {
        Row: {
          action_plan: string | null
          area_title: string
          branch_id: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          identified_at: string | null
          identified_by: string | null
          last_review_date: string | null
          next_review_date: string | null
          priority: string
          progress_notes: string | null
          progress_percentage: number | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_reference_id: string | null
          source_type: string | null
          staff_id: string
          status: string
          support_required: string | null
          target_completion_date: string | null
          training_recommended: boolean | null
          updated_at: string | null
        }
        Insert: {
          action_plan?: string | null
          area_title: string
          branch_id?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          identified_at?: string | null
          identified_by?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          priority: string
          progress_notes?: string | null
          progress_percentage?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source_reference_id?: string | null
          source_type?: string | null
          staff_id: string
          status?: string
          support_required?: string | null
          target_completion_date?: string | null
          training_recommended?: boolean | null
          updated_at?: string | null
        }
        Update: {
          action_plan?: string | null
          area_title?: string
          branch_id?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          identified_at?: string | null
          identified_by?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          priority?: string
          progress_notes?: string | null
          progress_percentage?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_reference_id?: string | null
          source_type?: string | null
          staff_id?: string
          status?: string
          support_required?: string | null
          target_completion_date?: string | null
          training_recommended?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_improvement_areas_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_improvement_areas_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leave_requests: {
        Row: {
          branch_id: string
          created_at: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          requested_at: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          staff_id: string
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id: string
          start_date: string
          status?: string
          total_days: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_leave_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notes: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          staff_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          staff_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          staff_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_performance_reviews: {
        Row: {
          action_items: Json | null
          areas_for_improvement: string | null
          branch_id: string | null
          communication_rating: number | null
          created_at: string | null
          development_goals: string | null
          follow_up_date: string | null
          id: string
          initiative_rating: number | null
          overall_rating: number | null
          performance_summary: string
          professionalism_rating: number | null
          punctuality_rating: number | null
          quality_of_work_rating: number | null
          review_date: string
          review_period_end: string
          review_period_start: string
          review_type: string
          reviewer_id: string
          reviewer_name: string
          staff_acknowledged_at: string | null
          staff_comments: string | null
          staff_id: string
          status: string
          strengths: string | null
          teamwork_rating: number | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          areas_for_improvement?: string | null
          branch_id?: string | null
          communication_rating?: number | null
          created_at?: string | null
          development_goals?: string | null
          follow_up_date?: string | null
          id?: string
          initiative_rating?: number | null
          overall_rating?: number | null
          performance_summary: string
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          quality_of_work_rating?: number | null
          review_date: string
          review_period_end: string
          review_period_start: string
          review_type: string
          reviewer_id: string
          reviewer_name: string
          staff_acknowledged_at?: string | null
          staff_comments?: string | null
          staff_id: string
          status?: string
          strengths?: string | null
          teamwork_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          areas_for_improvement?: string | null
          branch_id?: string | null
          communication_rating?: number | null
          created_at?: string | null
          development_goals?: string | null
          follow_up_date?: string | null
          id?: string
          initiative_rating?: number | null
          overall_rating?: number | null
          performance_summary?: string
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          quality_of_work_rating?: number | null
          review_date?: string
          review_period_end?: string
          review_period_start?: string
          review_type?: string
          reviewer_id?: string
          reviewer_name?: string
          staff_acknowledged_at?: string | null
          staff_comments?: string | null
          staff_id?: string
          status?: string
          strengths?: string | null
          teamwork_rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_performance_reviews_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_quality_metrics: {
        Row: {
          average_rating: number | null
          branch_id: string | null
          calculated_at: string | null
          calculated_by: string | null
          calculation_period: string
          cancelled_bookings: number | null
          client_satisfaction_score: number | null
          communication_skills_score: number | null
          completed_bookings: number | null
          created_at: string | null
          documentation_quality_score: number | null
          id: string
          incidents_reported: number | null
          incidents_resolved: number | null
          late_arrivals: number | null
          period_end_date: string
          period_start_date: string
          professionalism_score: number | null
          punctuality_score: number | null
          staff_id: string
          task_completion_rate: number | null
          total_bookings: number | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          branch_id?: string | null
          calculated_at?: string | null
          calculated_by?: string | null
          calculation_period: string
          cancelled_bookings?: number | null
          client_satisfaction_score?: number | null
          communication_skills_score?: number | null
          completed_bookings?: number | null
          created_at?: string | null
          documentation_quality_score?: number | null
          id?: string
          incidents_reported?: number | null
          incidents_resolved?: number | null
          late_arrivals?: number | null
          period_end_date: string
          period_start_date: string
          professionalism_score?: number | null
          punctuality_score?: number | null
          staff_id: string
          task_completion_rate?: number | null
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          branch_id?: string | null
          calculated_at?: string | null
          calculated_by?: string | null
          calculation_period?: string
          cancelled_bookings?: number | null
          client_satisfaction_score?: number | null
          communication_skills_score?: number | null
          completed_bookings?: number | null
          created_at?: string | null
          documentation_quality_score?: number | null
          id?: string
          incidents_reported?: number | null
          incidents_resolved?: number | null
          late_arrivals?: number | null
          period_end_date?: string
          period_start_date?: string
          professionalism_score?: number | null
          punctuality_score?: number | null
          staff_id?: string
          task_completion_rate?: number | null
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_quality_metrics_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_quality_metrics_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_rate_schedules: {
        Row: {
          authority_type: string
          bank_holiday_multiplier: number | null
          base_rate: number
          branch_id: string | null
          charge_type: string | null
          consecutive_hours_rate: number | null
          created_at: string | null
          created_by: string | null
          days_covered: string[]
          end_date: string | null
          extra_time_rate: number | null
          id: string
          is_active: boolean | null
          is_vatable: boolean
          organization_id: string | null
          overtime_multiplier: number | null
          overtime_threshold_hours: number | null
          pay_based_on: string | null
          rate_15_minutes: number | null
          rate_30_minutes: number | null
          rate_45_minutes: number | null
          rate_60_minutes: number | null
          rate_category: string | null
          service_type_codes: string[] | null
          staff_id: string
          start_date: string
          time_from: string
          time_until: string
          updated_at: string | null
        }
        Insert: {
          authority_type: string
          bank_holiday_multiplier?: number | null
          base_rate: number
          branch_id?: string | null
          charge_type?: string | null
          consecutive_hours_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          days_covered?: string[]
          end_date?: string | null
          extra_time_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_vatable?: boolean
          organization_id?: string | null
          overtime_multiplier?: number | null
          overtime_threshold_hours?: number | null
          pay_based_on?: string | null
          rate_15_minutes?: number | null
          rate_30_minutes?: number | null
          rate_45_minutes?: number | null
          rate_60_minutes?: number | null
          rate_category?: string | null
          service_type_codes?: string[] | null
          staff_id: string
          start_date: string
          time_from: string
          time_until: string
          updated_at?: string | null
        }
        Update: {
          authority_type?: string
          bank_holiday_multiplier?: number | null
          base_rate?: number
          branch_id?: string | null
          charge_type?: string | null
          consecutive_hours_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          days_covered?: string[]
          end_date?: string | null
          extra_time_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_vatable?: boolean
          organization_id?: string | null
          overtime_multiplier?: number | null
          overtime_threshold_hours?: number | null
          pay_based_on?: string | null
          rate_15_minutes?: number | null
          rate_30_minutes?: number | null
          rate_45_minutes?: number | null
          rate_60_minutes?: number | null
          rate_category?: string | null
          service_type_codes?: string[] | null
          staff_id?: string
          start_date?: string
          time_from?: string
          time_until?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_rate_schedules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_rate_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_rate_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_references: {
        Row: {
          company: string
          contact_date: string
          created_at: string
          id: string
          name: string
          position: string
          rating: number
          relationship: string
          staff_id: string
          statement: string
          updated_at: string
        }
        Insert: {
          company: string
          contact_date: string
          created_at?: string
          id?: string
          name: string
          position: string
          rating: number
          relationship: string
          staff_id: string
          statement: string
          updated_at?: string
        }
        Update: {
          company?: string
          contact_date?: string
          created_at?: string
          id?: string
          name?: string
          position?: string
          rating?: number
          relationship?: string
          staff_id?: string
          statement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_references_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_skills: {
        Row: {
          created_at: string | null
          id: string
          last_assessed: string | null
          notes: string | null
          proficiency_level: string
          skill_id: string
          staff_id: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_assessed?: string | null
          notes?: string | null
          proficiency_level?: string
          skill_id: string
          staff_id: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_assessed?: string | null
          notes?: string | null
          proficiency_level?: string
          skill_id?: string
          staff_id?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_statements: {
        Row: {
          created_at: string
          id: string
          staff_id: string
          statement: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          staff_id: string
          statement: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          staff_id?: string
          statement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_statements_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_training_records: {
        Row: {
          assigned_by: string | null
          assigned_date: string | null
          branch_id: string
          certificate_url: string | null
          competency_assessment: Json | null
          completion_date: string | null
          created_at: string
          evidence_files: Json | null
          expiry_date: string | null
          id: string
          last_accessed: string | null
          notes: string | null
          progress_percentage: number | null
          reflection_notes: string | null
          renewal_requested_at: string | null
          retake_count: number | null
          score: number | null
          staff_id: string
          status: string
          status_extended:
            | Database["public"]["Enums"]["training_status_extended"]
            | null
          supervisor_comments: string | null
          time_spent_minutes: number | null
          training_course_id: string
          training_notes: string | null
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_date?: string | null
          branch_id: string
          certificate_url?: string | null
          competency_assessment?: Json | null
          completion_date?: string | null
          created_at?: string
          evidence_files?: Json | null
          expiry_date?: string | null
          id?: string
          last_accessed?: string | null
          notes?: string | null
          progress_percentage?: number | null
          reflection_notes?: string | null
          renewal_requested_at?: string | null
          retake_count?: number | null
          score?: number | null
          staff_id: string
          status?: string
          status_extended?:
            | Database["public"]["Enums"]["training_status_extended"]
            | null
          supervisor_comments?: string | null
          time_spent_minutes?: number | null
          training_course_id: string
          training_notes?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_date?: string | null
          branch_id?: string
          certificate_url?: string | null
          competency_assessment?: Json | null
          completion_date?: string | null
          created_at?: string
          evidence_files?: Json | null
          expiry_date?: string | null
          id?: string
          last_accessed?: string | null
          notes?: string | null
          progress_percentage?: number | null
          reflection_notes?: string | null
          renewal_requested_at?: string | null
          retake_count?: number | null
          score?: number | null
          staff_id?: string
          status?: string
          status_extended?:
            | Database["public"]["Enums"]["training_status_extended"]
            | null
          supervisor_comments?: string | null
          time_spent_minutes?: number | null
          training_course_id?: string
          training_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_training_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_records_training_course_id_fkey"
            columns: ["training_course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_work_preferences: {
        Row: {
          client_types: string[] | null
          created_at: string
          id: string
          service_types: string[] | null
          special_notes: string | null
          staff_id: string
          travel_distance: number | null
          updated_at: string
          work_locations: string[] | null
          work_patterns: string[] | null
        }
        Insert: {
          client_types?: string[] | null
          created_at?: string
          id?: string
          service_types?: string[] | null
          special_notes?: string | null
          staff_id: string
          travel_distance?: number | null
          updated_at?: string
          work_locations?: string[] | null
          work_patterns?: string[] | null
        }
        Update: {
          client_types?: string[] | null
          created_at?: string
          id?: string
          service_types?: string[] | null
          special_notes?: string | null
          staff_id?: string
          travel_distance?: number | null
          updated_at?: string
          work_locations?: string[] | null
          work_patterns?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_work_preferences_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_working_hours: {
        Row: {
          availability_type: string
          branch_id: string
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          notes: string | null
          organization_id: string
          staff_id: string
          start_time: string
          status: string
          updated_at: string | null
          work_date: string
        }
        Insert: {
          availability_type?: string
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          notes?: string | null
          organization_id: string
          staff_id: string
          start_time: string
          status?: string
          updated_at?: string | null
          work_date: string
        }
        Update: {
          availability_type?: string
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          organization_id?: string
          staff_id?: string
          start_time?: string
          status?: string
          updated_at?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_working_hours_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_working_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_working_hours_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_expiry_notifications: {
        Row: {
          created_at: string | null
          days_before_expiry: number
          id: string
          notification_sent_at: string | null
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          days_before_expiry: number
          id?: string
          notification_sent_at?: string | null
          organization_id: string
        }
        Update: {
          created_at?: string | null
          days_before_expiry?: number
          id?: string
          notification_sent_at?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_expiry_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_branches: number | null
          max_users: number | null
          name: string
          price_monthly: number
          price_yearly: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_branches?: number | null
          max_users?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_branches?: number | null
          max_users?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          system_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          system_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          system_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_audit_logs_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_body_map_points: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          letter: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          letter: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          letter?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_hobbies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_medical_categories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_medical_conditions: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          field_caption: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          field_caption?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          field_caption?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_medical_conditions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "system_medical_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_services: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          last_activity_at: string
          session_token: string
          system_user_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          last_activity_at?: string
          session_token: string
          system_user_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_activity_at?: string
          session_token?: string
          system_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_sessions_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_skills: {
        Row: {
          created_at: string
          created_by: string | null
          explanation: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_template_elements: {
        Row: {
          created_at: string
          element_type: string
          id: string
          label: string
          order_index: number
          properties: Json | null
          required: boolean
          template_id: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          element_type: string
          id?: string
          label: string
          order_index: number
          properties?: Json | null
          required?: boolean
          template_id: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          element_type?: string
          id?: string
          label?: string
          order_index?: number
          properties?: Json | null
          required?: boolean
          template_id?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_template_elements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "system_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      system_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          published: boolean
          requires_review: boolean
          settings: Json | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          published?: boolean
          requires_review?: boolean
          settings?: Json | null
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          published?: boolean
          requires_review?: boolean
          settings?: Json | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      system_tenant_agreement_files: {
        Row: {
          agreement_id: string | null
          created_at: string
          file_category: Database["public"]["Enums"]["system_tenant_agreement_file_category"]
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          template_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          agreement_id?: string | null
          created_at?: string
          file_category?: Database["public"]["Enums"]["system_tenant_agreement_file_category"]
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          template_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          agreement_id?: string | null
          created_at?: string
          file_category?: Database["public"]["Enums"]["system_tenant_agreement_file_category"]
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          template_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_tenant_agreement_files_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreement_files_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreement_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_tenant_agreement_templates: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          template_file_id: string | null
          title: string
          type_id: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_file_id?: string | null
          title: string
          type_id?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_file_id?: string | null
          title?: string
          type_id?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_template_file"
            columns: ["template_file_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreement_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreement_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreement_templates_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreement_types"
            referencedColumns: ["id"]
          },
        ]
      }
      system_tenant_agreement_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_tenant_agreements: {
        Row: {
          agreement_reference: string | null
          confidentiality_clause: string | null
          content: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          data_protection_privacy: string | null
          discount_amount: number | null
          discount_percentage: number | null
          expiry_date: string | null
          governing_law: string | null
          id: string
          jurisdiction: string | null
          late_payment_penalty: string | null
          liability_indemnity: string | null
          payment_mode: string | null
          payment_terms: string | null
          previous_version_id: string | null
          price_amount: number | null
          provider_address: string | null
          provider_company_name: string | null
          provider_contact_person: string | null
          provider_email: string | null
          provider_phone: string | null
          renewal_date: string | null
          services_included: string | null
          signed_at: string | null
          signed_by_system: string | null
          signed_by_tenant: string | null
          software_service_name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["system_tenant_agreement_status"]
          subscription_plan: string | null
          support_maintenance: string | null
          system_digital_signature: string | null
          system_signature_date: string | null
          system_signature_file_id: string | null
          template_id: string | null
          tenant_address: string | null
          tenant_contact_person: string | null
          tenant_digital_signature: string | null
          tenant_email: string | null
          tenant_id: string
          tenant_phone: string | null
          tenant_signature_date: string | null
          tenant_signature_file_id: string | null
          termination_clause: string | null
          title: string
          training_onboarding: string | null
          type_id: string | null
          updated_at: string
          user_limitations: string | null
          version_number: number | null
        }
        Insert: {
          agreement_reference?: string | null
          confidentiality_clause?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          data_protection_privacy?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expiry_date?: string | null
          governing_law?: string | null
          id?: string
          jurisdiction?: string | null
          late_payment_penalty?: string | null
          liability_indemnity?: string | null
          payment_mode?: string | null
          payment_terms?: string | null
          previous_version_id?: string | null
          price_amount?: number | null
          provider_address?: string | null
          provider_company_name?: string | null
          provider_contact_person?: string | null
          provider_email?: string | null
          provider_phone?: string | null
          renewal_date?: string | null
          services_included?: string | null
          signed_at?: string | null
          signed_by_system?: string | null
          signed_by_tenant?: string | null
          software_service_name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["system_tenant_agreement_status"]
          subscription_plan?: string | null
          support_maintenance?: string | null
          system_digital_signature?: string | null
          system_signature_date?: string | null
          system_signature_file_id?: string | null
          template_id?: string | null
          tenant_address?: string | null
          tenant_contact_person?: string | null
          tenant_digital_signature?: string | null
          tenant_email?: string | null
          tenant_id: string
          tenant_phone?: string | null
          tenant_signature_date?: string | null
          tenant_signature_file_id?: string | null
          termination_clause?: string | null
          title: string
          training_onboarding?: string | null
          type_id?: string | null
          updated_at?: string
          user_limitations?: string | null
          version_number?: number | null
        }
        Update: {
          agreement_reference?: string | null
          confidentiality_clause?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          data_protection_privacy?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expiry_date?: string | null
          governing_law?: string | null
          id?: string
          jurisdiction?: string | null
          late_payment_penalty?: string | null
          liability_indemnity?: string | null
          payment_mode?: string | null
          payment_terms?: string | null
          previous_version_id?: string | null
          price_amount?: number | null
          provider_address?: string | null
          provider_company_name?: string | null
          provider_contact_person?: string | null
          provider_email?: string | null
          provider_phone?: string | null
          renewal_date?: string | null
          services_included?: string | null
          signed_at?: string | null
          signed_by_system?: string | null
          signed_by_tenant?: string | null
          software_service_name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["system_tenant_agreement_status"]
          subscription_plan?: string | null
          support_maintenance?: string | null
          system_digital_signature?: string | null
          system_signature_date?: string | null
          system_signature_file_id?: string | null
          template_id?: string | null
          tenant_address?: string | null
          tenant_contact_person?: string | null
          tenant_digital_signature?: string | null
          tenant_email?: string | null
          tenant_id?: string
          tenant_phone?: string | null
          tenant_signature_date?: string | null
          tenant_signature_file_id?: string | null
          termination_clause?: string | null
          title?: string
          training_onboarding?: string | null
          type_id?: string | null
          updated_at?: string
          user_limitations?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_system_signature_file"
            columns: ["system_signature_file_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreement_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenant_signature_file"
            columns: ["tenant_signature_file_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreement_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreements_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tenant_agreements_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "system_tenant_agreement_types"
            referencedColumns: ["id"]
          },
        ]
      }
      system_user_organization_audit: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          new_role: string | null
          old_role: string | null
          organization_id: string
          performed_at: string | null
          performed_by: string | null
          success: boolean
          system_user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          new_role?: string | null
          old_role?: string | null
          organization_id: string
          performed_at?: string | null
          performed_by?: string | null
          success: boolean
          system_user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          new_role?: string | null
          old_role?: string | null
          organization_id?: string
          performed_at?: string | null
          performed_by?: string | null
          success?: boolean
          system_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_user_organization_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_user_organization_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_user_organization_audit_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_user_organizations: {
        Row: {
          assigned_at: string
          id: string
          is_primary: boolean
          organization_id: string
          role: string
          system_user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          is_primary?: boolean
          organization_id: string
          role?: string
          system_user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          role?: string
          system_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_user_organizations_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["system_role"]
          system_user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["system_role"]
          system_user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          system_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_user_roles_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          created_by: string | null
          email: string
          encrypted_password: string
          failed_login_attempts: number
          first_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          encrypted_password: string
          failed_login_attempts?: number
          first_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          encrypted_password?: string
          failed_login_attempts?: number
          first_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_work_types: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          staff_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          staff_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          staff_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          branch_id: string
          category: string | null
          client_can_complete: boolean | null
          client_id: string | null
          client_visible: boolean | null
          completion_percentage: number | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          branch_id: string
          category?: string | null
          client_can_complete?: boolean | null
          client_id?: string | null
          client_visible?: boolean | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          branch_id?: string
          category?: string | null
          client_can_complete?: boolean | null
          client_id?: string | null
          client_visible?: boolean | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_access_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          third_party_user_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          third_party_user_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          third_party_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_party_access_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "third_party_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_party_access_logs_third_party_user_id_fkey"
            columns: ["third_party_user_id"]
            isOneToOne: false
            referencedRelation: "third_party_users"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_access_requests: {
        Row: {
          access_from: string
          access_until: string | null
          approved_at: string | null
          approved_by: string | null
          branch_id: string
          client_consent_required: boolean
          created_at: string
          created_by: string
          email: string
          first_name: string
          id: string
          invite_sent_at: string | null
          invite_token: string | null
          organisation: string | null
          password: string | null
          reason_for_access: string
          rejection_reason: string | null
          request_for: Database["public"]["Enums"]["third_party_access_type"]
          role: string | null
          status: Database["public"]["Enums"]["third_party_request_status"]
          surname: string
          updated_at: string
        }
        Insert: {
          access_from: string
          access_until?: string | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id: string
          client_consent_required?: boolean
          created_at?: string
          created_by: string
          email: string
          first_name: string
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          organisation?: string | null
          password?: string | null
          reason_for_access: string
          rejection_reason?: string | null
          request_for?: Database["public"]["Enums"]["third_party_access_type"]
          role?: string | null
          status?: Database["public"]["Enums"]["third_party_request_status"]
          surname: string
          updated_at?: string
        }
        Update: {
          access_from?: string
          access_until?: string | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string
          client_consent_required?: boolean
          created_at?: string
          created_by?: string
          email?: string
          first_name?: string
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          organisation?: string | null
          password?: string | null
          reason_for_access?: string
          rejection_reason?: string | null
          request_for?: Database["public"]["Enums"]["third_party_access_type"]
          role?: string | null
          status?: Database["public"]["Enums"]["third_party_request_status"]
          surname?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "third_party_access_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_login_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_accessed_at: string
          third_party_user_id: string
          token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_accessed_at?: string
          third_party_user_id: string
          token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_accessed_at?: string
          third_party_user_id?: string
          token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_party_login_sessions_third_party_user_id_fkey"
            columns: ["third_party_user_id"]
            isOneToOne: false
            referencedRelation: "third_party_users"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_sessions: {
        Row: {
          ended_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity_at: string
          session_token: string
          started_at: string
          third_party_user_id: string
          user_agent: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string
          session_token: string
          started_at?: string
          third_party_user_id: string
          user_agent?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string
          session_token?: string
          started_at?: string
          third_party_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_party_sessions_third_party_user_id_fkey"
            columns: ["third_party_user_id"]
            isOneToOne: false
            referencedRelation: "third_party_users"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_users: {
        Row: {
          access_expires_at: string
          access_type: Database["public"]["Enums"]["third_party_access_type"]
          auth_user_id: string | null
          branch_id: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          login_count: number
          organisation: string | null
          password_hash: string | null
          request_id: string
          role: string | null
          surname: string
          updated_at: string
        }
        Insert: {
          access_expires_at: string
          access_type: Database["public"]["Enums"]["third_party_access_type"]
          auth_user_id?: string | null
          branch_id: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          login_count?: number
          organisation?: string | null
          password_hash?: string | null
          request_id: string
          role?: string | null
          surname: string
          updated_at?: string
        }
        Update: {
          access_expires_at?: string
          access_type?: Database["public"]["Enums"]["third_party_access_type"]
          auth_user_id?: string | null
          branch_id?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          login_count?: number
          organisation?: string | null
          password_hash?: string | null
          request_id?: string
          role?: string | null
          surname?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "third_party_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_party_users_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "third_party_access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          branch_id: string | null
          category: string
          certificate_template: string | null
          created_at: string
          description: string | null
          id: string
          is_mandatory: boolean | null
          max_score: number | null
          required_score: number | null
          status: string
          title: string
          updated_at: string
          valid_for_months: number | null
        }
        Insert: {
          branch_id?: string | null
          category?: string
          certificate_template?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          max_score?: number | null
          required_score?: number | null
          status?: string
          title: string
          updated_at?: string
          valid_for_months?: number | null
        }
        Update: {
          branch_id?: string | null
          category?: string
          certificate_template?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          max_score?: number | null
          required_score?: number | null
          status?: string
          title?: string
          updated_at?: string
          valid_for_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_rates: {
        Row: {
          created_at: string
          from_date: string
          id: string
          organization_id: string | null
          rate_per_hour: number
          rate_per_mile: number
          status: string
          title: string
          updated_at: string
          user_type: string
        }
        Insert: {
          created_at?: string
          from_date: string
          id?: string
          organization_id?: string | null
          rate_per_hour: number
          rate_per_mile: number
          status?: string
          title: string
          updated_at?: string
          user_type: string
        }
        Update: {
          created_at?: string
          from_date?: string
          id?: string
          organization_id?: string | null
          rate_per_hour?: number
          rate_per_mile?: number
          status?: string
          title?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_id: string | null
          branch_id: string
          client_id: string | null
          created_at: string
          distance_miles: number
          end_location: string
          id: string
          mileage_rate: number
          notes: string | null
          organization_id: string | null
          purpose: string
          receipt_url: string | null
          reimbursed_at: string | null
          rejection_reason: string | null
          staff_id: string
          start_location: string
          status: string
          total_cost: number
          travel_date: string
          travel_time_minutes: number | null
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          branch_id: string
          client_id?: string | null
          created_at?: string
          distance_miles: number
          end_location: string
          id?: string
          mileage_rate: number
          notes?: string | null
          organization_id?: string | null
          purpose: string
          receipt_url?: string | null
          reimbursed_at?: string | null
          rejection_reason?: string | null
          staff_id: string
          start_location: string
          status?: string
          total_cost: number
          travel_date?: string
          travel_time_minutes?: number | null
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          branch_id?: string
          client_id?: string | null
          created_at?: string
          distance_miles?: number
          end_location?: string
          id?: string
          mileage_rate?: number
          notes?: string | null
          organization_id?: string | null
          purpose?: string
          receipt_url?: string | null
          reimbursed_at?: string | null
          rejection_reason?: string | null
          staff_id?: string
          start_location?: string
          status?: string
          total_cost?: number
          travel_date?: string
          travel_time_minutes?: number | null
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      urinary_output_records: {
        Row: {
          amount_estimate: string | null
          amount_ml: number | null
          client_id: string
          collection_method: string
          colour: string | null
          created_at: string | null
          discomfort_observations: string | null
          id: string
          odour: string | null
          record_date: string
          recorded_by: string | null
          service_report_id: string | null
          time: string
          updated_at: string | null
          visit_record_id: string | null
        }
        Insert: {
          amount_estimate?: string | null
          amount_ml?: number | null
          client_id: string
          collection_method: string
          colour?: string | null
          created_at?: string | null
          discomfort_observations?: string | null
          id?: string
          odour?: string | null
          record_date: string
          recorded_by?: string | null
          service_report_id?: string | null
          time: string
          updated_at?: string | null
          visit_record_id?: string | null
        }
        Update: {
          amount_estimate?: string | null
          amount_ml?: number | null
          client_id?: string
          collection_method?: string
          colour?: string | null
          created_at?: string | null
          discomfort_observations?: string | null
          id?: string
          odour?: string | null
          record_date?: string
          recorded_by?: string | null
          service_report_id?: string | null
          time?: string
          updated_at?: string | null
          visit_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "urinary_output_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "urinary_output_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "urinary_output_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "urinary_output_records_service_report_id_fkey"
            columns: ["service_report_id"]
            isOneToOne: false
            referencedRelation: "client_service_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "urinary_output_records_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_events: {
        Row: {
          body_map_data: Json | null
          created_at: string
          event_category: string | null
          event_description: string
          event_time: string
          event_title: string
          event_type: string
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          immediate_action_taken: string | null
          location_in_home: string | null
          photo_urls: string[] | null
          photos_taken: boolean | null
          reported_to: string[] | null
          severity: string
          updated_at: string
          visit_record_id: string
          witnesses: string[] | null
        }
        Insert: {
          body_map_data?: Json | null
          created_at?: string
          event_category?: string | null
          event_description: string
          event_time?: string
          event_title: string
          event_type: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          immediate_action_taken?: string | null
          location_in_home?: string | null
          photo_urls?: string[] | null
          photos_taken?: boolean | null
          reported_to?: string[] | null
          severity?: string
          updated_at?: string
          visit_record_id: string
          witnesses?: string[] | null
        }
        Update: {
          body_map_data?: Json | null
          created_at?: string
          event_category?: string | null
          event_description?: string
          event_time?: string
          event_title?: string
          event_type?: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          immediate_action_taken?: string | null
          location_in_home?: string | null
          photo_urls?: string[] | null
          photos_taken?: boolean | null
          reported_to?: string[] | null
          severity?: string
          updated_at?: string
          visit_record_id?: string
          witnesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_events_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_medications: {
        Row: {
          administered_by: string | null
          administration_method: string | null
          administration_notes: string | null
          administration_time: string | null
          created_at: string
          dosage: string
          id: string
          is_administered: boolean
          medication_id: string | null
          medication_name: string
          missed_reason: string | null
          prescribed_time: string | null
          side_effects_observed: string | null
          updated_at: string
          visit_record_id: string
          witnessed_by: string | null
        }
        Insert: {
          administered_by?: string | null
          administration_method?: string | null
          administration_notes?: string | null
          administration_time?: string | null
          created_at?: string
          dosage: string
          id?: string
          is_administered?: boolean
          medication_id?: string | null
          medication_name: string
          missed_reason?: string | null
          prescribed_time?: string | null
          side_effects_observed?: string | null
          updated_at?: string
          visit_record_id: string
          witnessed_by?: string | null
        }
        Update: {
          administered_by?: string | null
          administration_method?: string | null
          administration_notes?: string | null
          administration_time?: string | null
          created_at?: string
          dosage?: string
          id?: string
          is_administered?: boolean
          medication_id?: string | null
          medication_name?: string
          missed_reason?: string | null
          prescribed_time?: string | null
          side_effects_observed?: string | null
          updated_at?: string
          visit_record_id?: string
          witnessed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_medications_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_records: {
        Row: {
          actual_duration_minutes: number | null
          arrival_delay_minutes: number | null
          booking_id: string | null
          branch_id: string
          client_id: string | null
          client_signature_data: string | null
          completion_percentage: number | null
          created_at: string
          id: string
          late_arrival_reason: string | null
          late_submitted_at: string | null
          late_submitted_by: string | null
          location_data: Json | null
          organization_id: string | null
          staff_id: string | null
          staff_signature_data: string | null
          status: string
          updated_at: string
          visit_end_time: string | null
          visit_notes: string | null
          visit_photos: Json | null
          visit_start_time: string
          visit_summary: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          arrival_delay_minutes?: number | null
          booking_id?: string | null
          branch_id: string
          client_id?: string | null
          client_signature_data?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          late_arrival_reason?: string | null
          late_submitted_at?: string | null
          late_submitted_by?: string | null
          location_data?: Json | null
          organization_id?: string | null
          staff_id?: string | null
          staff_signature_data?: string | null
          status?: string
          updated_at?: string
          visit_end_time?: string | null
          visit_notes?: string | null
          visit_photos?: Json | null
          visit_start_time?: string
          visit_summary?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          arrival_delay_minutes?: number | null
          booking_id?: string | null
          branch_id?: string
          client_id?: string | null
          client_signature_data?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          late_arrival_reason?: string | null
          late_submitted_at?: string | null
          late_submitted_by?: string | null
          location_data?: Json | null
          organization_id?: string | null
          staff_id?: string | null
          staff_signature_data?: string | null
          status?: string
          updated_at?: string
          visit_end_time?: string | null
          visit_notes?: string | null
          visit_photos?: Json | null
          visit_start_time?: string
          visit_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_ready_for_invoicing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_late_submitted_by_fkey"
            columns: ["late_submitted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_tasks: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          completion_notes: string | null
          completion_time_minutes: number | null
          created_at: string
          id: string
          is_completed: boolean
          priority: string | null
          task_category: string
          task_description: string | null
          task_name: string
          updated_at: string
          visit_record_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_time_minutes?: number | null
          created_at?: string
          id?: string
          is_completed?: boolean
          priority?: string | null
          task_category: string
          task_description?: string | null
          task_name: string
          updated_at?: string
          visit_record_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_time_minutes?: number | null
          created_at?: string
          id?: string
          is_completed?: boolean
          priority?: string | null
          task_category?: string
          task_description?: string | null
          task_name?: string
          updated_at?: string
          visit_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_tasks_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_vitals: {
        Row: {
          blood_sugar_mmol: number | null
          client_id: string
          consciousness_level: string | null
          created_at: string
          diastolic_bp: number | null
          id: string
          news2_risk_level: string | null
          news2_total_score: number | null
          notes: string | null
          other_readings: Json | null
          oxygen_saturation: number | null
          pulse_rate: number | null
          reading_time: string
          respiratory_rate: number | null
          supplemental_oxygen: boolean | null
          systolic_bp: number | null
          taken_by: string | null
          temperature: number | null
          verified_by: string | null
          visit_record_id: string
          vital_type: string
          weight_kg: number | null
        }
        Insert: {
          blood_sugar_mmol?: number | null
          client_id: string
          consciousness_level?: string | null
          created_at?: string
          diastolic_bp?: number | null
          id?: string
          news2_risk_level?: string | null
          news2_total_score?: number | null
          notes?: string | null
          other_readings?: Json | null
          oxygen_saturation?: number | null
          pulse_rate?: number | null
          reading_time?: string
          respiratory_rate?: number | null
          supplemental_oxygen?: boolean | null
          systolic_bp?: number | null
          taken_by?: string | null
          temperature?: number | null
          verified_by?: string | null
          visit_record_id: string
          vital_type?: string
          weight_kg?: number | null
        }
        Update: {
          blood_sugar_mmol?: number | null
          client_id?: string
          consciousness_level?: string | null
          created_at?: string
          diastolic_bp?: number | null
          id?: string
          news2_risk_level?: string | null
          news2_total_score?: number | null
          notes?: string | null
          other_readings?: Json | null
          oxygen_saturation?: number | null
          pulse_rate?: number | null
          reading_time?: string
          respiratory_rate?: number | null
          supplemental_oxygen?: boolean | null
          systolic_bp?: number | null
          taken_by?: string | null
          temperature?: number | null
          verified_by?: string | null
          visit_record_id?: string
          vital_type?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_vitals_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      work_types: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          source_system_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          source_system_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_types_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "system_work_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clients_ready_for_invoicing: {
        Row: {
          billing_frequency: string | null
          branch_id: string | null
          first_name: string | null
          id: string | null
          last_booking_date: string | null
          last_invoice_generated_at: string | null
          last_name: string | null
          organization_id: string | null
          unbilled_amount: number | null
          uninvoiced_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _is_system_super_admin: {
        Args: { p_system_user_id: string }
        Returns: boolean
      }
      _validate_system_session: {
        Args: { p_session_token: string }
        Returns: string
      }
      admin_set_client_password: {
        Args: {
          p_admin_id: string
          p_client_id: string
          p_new_password: string
        }
        Returns: Json
      }
      admin_set_staff_password: {
        Args: { p_admin_id: string; p_new_password: string; p_staff_id: string }
        Returns: Json
      }
      authenticate_third_party_user: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      auto_confirm_branch_admins: { Args: never; Returns: Json }
      calculate_invoice_total: { Args: { invoice_id: string }; Returns: number }
      calculate_invoice_totals: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      calculate_leave_days: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: number
      }
      calculate_news2_score:
        | {
            Args: {
              consciousness: string
              dias_bp: number
              o2_sat: number
              pulse: number
              resp_rate: number
              supp_o2: boolean
              sys_bp: number
              temp: number
            }
            Returns: {
              bp_score: number
              consciousness_score: number
              o2_score: number
              pulse_score: number
              resp_score: number
              risk: string
              supp_o2_score: number
              temp_score: number
              total: number
            }[]
          }
        | {
            Args: {
              consciousness: string
              o2_sat: number
              pulse: number
              resp_rate: number
              supp_o2: boolean
              sys_bp: number
              temp: number
            }
            Returns: {
              bp_score: number
              consciousness_score: number
              o2_score: number
              pulse_score: number
              resp_score: number
              risk: string
              supp_o2_score: number
              temp_score: number
              total: number
            }[]
          }
      can_access_client_data: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_thread: {
        Args: { thread_id_param: string; user_id_param: string }
        Returns: boolean
      }
      can_access_visit_record: {
        Args: { _user_id: string; _visit_record_id: string }
        Returns: boolean
      }
      check_auth_health: { Args: never; Returns: Json }
      check_auth_schema_health: { Args: never; Returns: Json }
      check_carer_auth_health: { Args: never; Returns: Json }
      check_document_upload_access: {
        Args: { p_branch_id: string }
        Returns: Json
      }
      check_pending_agreements: { Args: never; Returns: Json }
      check_user_role_health: {
        Args: never
        Returns: {
          email: string
          has_auth: boolean
          has_role: boolean
          issue_type: string
          suggested_role: string
          user_id: string
        }[]
      }
      client_can_access_thread: {
        Args: { thread_id_param: string; user_id_param: string }
        Returns: boolean
      }
      create_auth_user_for_system_user:
        | {
            Args: {
              p_email: string
              p_password?: string
              p_system_user_id: string
            }
            Returns: Json
          }
        | {
            Args: { p_password?: string; p_system_user_id: string }
            Returns: Json
          }
      create_carer_preapproved: {
        Args: {
          p_address: string
          p_admin_id: string
          p_availability: string
          p_branch_id: string
          p_date_of_birth: string
          p_email: string
          p_experience: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_specialization: string
        }
        Returns: Json
      }
      create_carer_with_invitation: {
        Args: { p_branch_id: string; p_carer_data: Json }
        Returns: string
      }
      create_organization_member_with_role: {
        Args: {
          p_invited_by?: string
          p_organization_id: string
          p_permissions?: Json
          p_role: string
          p_user_id: string
        }
        Returns: string
      }
      create_overdue_booking_notifications: { Args: never; Returns: undefined }
      create_subscription_plan_as_admin: {
        Args: {
          p_description: string
          p_features: Json
          p_is_active: boolean
          p_max_branches: number
          p_max_users: number
          p_name: string
          p_price_monthly: number
          p_price_yearly: number
          p_session_token: string
        }
        Returns: string
      }
      create_system_user_and_role: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_password: string
          p_role?: Database["public"]["Enums"]["system_role"]
        }
        Returns: Json
      }
      create_system_user_and_role_with_session: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_password: string
          p_role?: Database["public"]["Enums"]["system_role"]
          p_session_token: string
        }
        Returns: Json
      }
      create_third_party_login_session: {
        Args: {
          ip_address_param?: unknown
          token_param: string
          user_agent_param?: string
          user_id_param: string
        }
        Returns: string
      }
      create_third_party_user_account: {
        Args: { request_id_param: string }
        Returns: string
      }
      create_third_party_user_with_password:
        | {
            Args: {
              p_access_expires_at?: string
              p_email: string
              p_first_name: string
              p_password: string
              p_request_id: string
              p_surname: string
            }
            Returns: string
          }
        | {
            Args: {
              p_access_expires_at?: string
              p_email: string
              p_full_name: string
              p_password: string
              p_request_id: string
            }
            Returns: string
          }
      current_user_branch_ids: {
        Args: never
        Returns: {
          branch_id: string
        }[]
      }
      delete_admin_completely: {
        Args: { admin_user_id: string }
        Returns: Json
      }
      delete_demo_requests: { Args: { p_request_ids: string[] }; Returns: Json }
      delete_organization_cascade: {
        Args: { p_organization_id: string; p_system_user_id: string }
        Returns: Json
      }
      delete_subscription_plan_as_admin: {
        Args: { p_plan_id: string; p_session_token: string }
        Returns: boolean
      }
      delete_system_user_with_session: {
        Args: { p_session_token: string; p_user_id: string }
        Returns: Json
      }
      expire_third_party_access: { Args: never; Returns: undefined }
      fix_all_client_auth_issues: { Args: never; Returns: Json }
      fix_auth_users_schema: { Args: never; Returns: Json }
      fix_branch_admin_organization_memberships: { Args: never; Returns: Json }
      fix_client_auth_links: { Args: never; Returns: Json }
      fix_client_message_participants: {
        Args: never
        Returns: {
          details: Json
          error_count: number
          fixed_count: number
        }[]
      }
      fix_message_participants_user_ids: {
        Args: never
        Returns: {
          details: Json
          error_count: number
          fixed_count: number
        }[]
      }
      fix_staff_auth_links: { Args: never; Returns: Json }
      force_insert_staff_document: {
        Args: {
          p_document_type: string
          p_expiry_date?: string
          p_file_path: string
          p_file_size?: string
          p_staff_id: string
        }
        Returns: string
      }
      form_is_in_admins_branch: {
        Args: { p_form_id: string; p_user_id?: string }
        Returns: boolean
      }
      generate_invite_token: { Args: never; Returns: string }
      generate_invoice_ledger: {
        Args: {
          client_id_param: string
          end_date_param: string
          invoice_id_param: string
          start_date_param: string
        }
        Returns: undefined
      }
      generate_temporary_password: { Args: never; Returns: string }
      get_admin_user_details: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_branch_chart_data: { Args: { p_branch_id: string }; Returns: Json }
      get_branch_documents: {
        Args: { p_branch_id: string }
        Returns: {
          category: string
          id: string
          name: string
          related_entity: string
          related_entity_id: string
          size: string
          source_table: string
          status: string
          storage_path: string
          type: string
          uploaded_at: string
          uploaded_by: string
          uploaded_by_name: string
        }[]
      }
      get_client_care_team: {
        Args: { p_org_id: string }
        Returns: {
          email: string
          user_id: string
          user_name: string
          user_type: string
        }[]
      }
      get_client_funding_info: {
        Args: { p_client_id: string; p_date?: string }
        Returns: {
          authority_id: string
          authority_name: string
          funding_type: string
        }[]
      }
      get_client_rate: {
        Args: {
          client_id_param: string
          day_type_param: string
          duration_minutes_param: number
          service_date: string
        }
        Returns: {
          bank_holiday_multiplier: number
          is_vatable: boolean
          rate_amount: number
          rate_type: string
        }[]
      }
      get_client_reports_data: {
        Args: {
          p_branch_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_client_suspension_status: {
        Args: { client_id_param: string }
        Returns: {
          apply_to: Json
          effective_from: string
          effective_until: string
          is_suspended: boolean
          reason: string
          suspension_id: string
          suspension_type: string
        }[]
      }
      get_compliance_reports_data: {
        Args: {
          p_branch_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_current_system_session_id: { Args: never; Returns: string }
      get_current_system_user_id: { Args: never; Returns: string }
      get_current_user_organization_id: { Args: never; Returns: string }
      get_day_type: {
        Args: { branch_id_param: string; check_date: string }
        Returns: string
      }
      get_demo_request_stats: {
        Args: never
        Returns: {
          last_request_date: string
          pending_requests: number
          total_requests: number
        }[]
      }
      get_demo_requests: {
        Args: never
        Returns: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          notes: string
          phone: string
          status: string
          submitted_at: string
          updated_at: string
        }[]
      }
      get_enhanced_compliance_reports_data: {
        Args: {
          p_branch_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_financial_reports_data: {
        Args: {
          p_branch_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_max_users_from_plan: { Args: { plan_text: string }; Returns: number }
      get_notification_stats: {
        Args: { p_branch_id?: string; p_user_id: string }
        Returns: {
          by_type: Json
          high_priority_count: number
          total_count: number
          unread_count: number
        }[]
      }
      get_operational_reports_data: {
        Args: {
          p_branch_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_optimized_tenant_data: {
        Args: never
        Returns: {
          active_clients: number
          active_users: number
          contact_email: string
          contact_phone: string
          created_at: string
          has_agreement: boolean
          id: string
          name: string
          plan_max_users: number
          plan_price_monthly: number
          plan_price_yearly: number
          settings: Json
          slug: string
          subscription_expires_at: string
          subscription_plan: string
          subscription_status: string
          super_admin_email: string
          super_admin_first_name: string
          super_admin_last_name: string
          total_branches: number
          total_clients: number
          total_users: number
        }[]
      }
      get_organization_id_from_client: {
        Args: { client_id_param: string }
        Returns: string
      }
      get_service_reports_data: {
        Args: {
          p_branch_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_staff_branch_id: { Args: never; Returns: string }
      get_staff_branch_id_safe: { Args: never; Returns: string }
      get_staff_organization_id_safe: { Args: never; Returns: string }
      get_staff_profile: {
        Args: { staff_user_id: string }
        Returns: {
          address: string
          availability: string
          branch_id: string
          date_of_birth: string
          email: string
          experience: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          phone: string
          specialization: string
          status: string
        }[]
      }
      get_staff_profile_by_auth_user_id: {
        Args: { auth_user_id_param: string }
        Returns: {
          address: string
          auth_user_id: string
          availability: string
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          bank_sort_code: string
          branch_id: string
          certifications: string[]
          date_of_birth: string
          email: string
          emergency_contact_name: string
          emergency_contact_phone: string
          experience: string
          first_login_completed: boolean
          first_name: string
          hire_date: string
          id: string
          invitation_accepted_at: string
          last_name: string
          national_insurance_number: string
          phone: string
          photo_url: string
          profile_completed: boolean
          qualifications: string[]
          specialization: string
          status: string
        }[]
      }
      get_staff_reports_data: {
        Args: {
          p_branch_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_super_admin_org: {
        Args: { p_user_id: string }
        Returns: {
          slug: string
        }[]
      }
      get_system_analytics: { Args: never; Returns: Json }
      get_system_notifications: {
        Args: { p_user_id?: string }
        Returns: {
          category: string
          created_at: string
          data: Json
          id: string
          message: string
          priority: string
          read_at: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }[]
      }
      get_system_user_stats_with_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      get_third_party_user_by_token: {
        Args: { token_param: string }
        Returns: {
          access_expires_at: string
          access_type: Database["public"]["Enums"]["third_party_access_type"]
          branch_id: string
          email: string
          first_name: string
          is_active: boolean
          organisation: string
          role: string
          surname: string
          user_id: string
        }[]
      }
      get_uninvoiced_bookings: {
        Args: { branch_id_param?: string }
        Returns: {
          booking_id: string
          client_id: string
          client_name: string
          days_since_service: number
          end_time: string
          revenue: number
          service_title: string
          start_time: string
        }[]
      }
      get_user_highest_role: {
        Args: { p_user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_user_organization_id: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_primary_org_slug: {
        Args: { user_id_param: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_definer: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_password: { Args: { password_text: string }; Returns: string }
      is_app_admin: { Args: { user_id_param: string }; Returns: boolean }
      is_authenticated_admin: { Args: never; Returns: boolean }
      is_current_staff_member: {
        Args: { staff_id_param: string }
        Returns: boolean
      }
      is_staff_in_branch: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff_user: { Args: never; Returns: boolean }
      is_staff_user_safe: { Args: never; Returns: boolean }
      is_system_admin: { Args: { user_id_param: string }; Returns: boolean }
      is_system_super_admin: {
        Args: { _system_user_id: string }
        Returns: boolean
      }
      is_thread_participant: {
        Args: { thread_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_thread_participant_safe: {
        Args: { thread_id_param: string; user_id_param: string }
        Returns: boolean
      }
      link_client_to_auth_user: {
        Args: {
          p_admin_id: string
          p_auth_user_id: string
          p_client_id: string
        }
        Returns: Json
      }
      list_system_users_with_session: {
        Args: { p_session_token: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_login_at: string
          last_name: string
          organizations: Json
          role: string
        }[]
      }
      list_system_users_with_session_and_orgs: {
        Args: { p_session_token: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_login_at: string
          last_name: string
          organizations: Json
          role: string
        }[]
      }
      map_org_role_to_system_role: {
        Args: { org_role: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      mark_system_notifications_read: {
        Args: { p_notification_ids: string[]; p_session_token?: string }
        Returns: Json
      }
      notify_unassigned_bookings: { Args: never; Returns: undefined }
      process_expiring_agreements: { Args: never; Returns: Json }
      process_subscription_expiry: { Args: never; Returns: Json }
      process_subscription_expiry_notifications: { Args: never; Returns: Json }
      repair_system_user_organization_sync: { Args: never; Returns: Json }
      reset_system_user_password_with_session:
        | {
            Args: {
              p_admin_id: string
              p_new_password: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_new_password: string
              p_session_token: string
              p_user_id: string
            }
            Returns: Json
          }
      safe_notify: {
        Args: {
          p_branch_id: string
          p_category: string
          p_data?: Json
          p_message: string
          p_priority: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      safe_setup_client_auth: {
        Args: { p_admin_id: string; p_client_id: string; p_password: string }
        Returns: Json
      }
      safe_setup_client_messaging_auth: { Args: never; Returns: Json }
      seed_default_parameters_for_organization: {
        Args: { org_id: string }
        Returns: undefined
      }
      sync_booking_status_from_visit: {
        Args: never
        Returns: {
          synced_count: number
        }[]
      }
      sync_client_message_participants: { Args: never; Returns: undefined }
      sync_organization_members_with_roles: {
        Args: never
        Returns: {
          action_taken: string
          email: string
          org_role: string
          system_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      sync_system_user_to_organization: {
        Args: {
          p_organization_id: string
          p_role?: string
          p_system_user_id: string
        }
        Returns: Json
      }
      system_authenticate:
        | { Args: { p_email: string; p_password: string }; Returns: Json }
        | {
            Args: {
              p_email: string
              p_ip_address?: unknown
              p_password: string
              p_user_agent?: string
            }
            Returns: Json
          }
      system_create_session_for_auth_user: {
        Args: {
          p_auth_user_id: string
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: Json
      }
      system_logout: { Args: { p_session_token: string }; Returns: Json }
      system_validate_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      toggle_system_user_status_with_session: {
        Args: {
          p_is_active: boolean
          p_session_token: string
          p_user_id: string
        }
        Returns: Json
      }
      update_demo_request_status: {
        Args: { new_notes?: string; new_status: string; request_id: string }
        Returns: boolean
      }
      update_resource_stats: {
        Args: { resource_id: string; stat_type: string }
        Returns: undefined
      }
      update_subscription_plan_as_admin: {
        Args: {
          p_description: string
          p_features: Json
          p_is_active: boolean
          p_max_branches: number
          p_max_users: number
          p_name: string
          p_plan_id: string
          p_price_monthly: number
          p_price_yearly: number
          p_session_token: string
        }
        Returns: boolean
      }
      update_system_session_activity: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      update_system_user_with_session: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_role: Database["public"]["Enums"]["system_role"]
          p_session_token: string
          p_user_id: string
        }
        Returns: Json
      }
      upload_staff_document:
        | {
            Args: {
              p_document_type: string
              p_expiry_date?: string
              p_file_path: string
              p_file_size?: string
              p_staff_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_document_type: string
              p_file_name: string
              p_file_path: string
              p_file_size: string
              p_staff_id: string
            }
            Returns: string
          }
      upload_staff_document_bypass_rls: {
        Args: {
          p_description?: string
          p_document_type: string
          p_expiry_date?: string
          p_file_name?: string
          p_file_path: string
          p_file_size?: string
          p_staff_id: string
        }
        Returns: Json
      }
      user_belongs_to_organization: {
        Args: { org_id: string; user_id_param: string }
        Returns: boolean
      }
      user_belongs_to_organization_safe: {
        Args: { org_id: string; user_id_param: string }
        Returns: boolean
      }
      user_can_access_thread: {
        Args: { thread_id_param: string; user_id_param: string }
        Returns: boolean
      }
      user_has_access_to_org: {
        Args: { org_id_param: string; user_id_param: string }
        Returns: boolean
      }
      user_is_admin: { Args: { user_id_param: string }; Returns: boolean }
      user_is_assigned_to_form: {
        Args: { p_form_id: string }
        Returns: boolean
      }
      validate_organization_member_roles: {
        Args: never
        Returns: {
          email: string
          has_org_membership: boolean
          has_user_role: boolean
          issue_type: string
          user_id: string
        }[]
      }
      validate_system_session: {
        Args: { p_session_token: string }
        Returns: string
      }
      validate_system_user_organization_integrity: {
        Args: never
        Returns: {
          email: string
          missing_in_organization_members: boolean
          missing_in_system_user_organizations: boolean
          organization_id: string
          organization_name: string
          system_user_id: string
        }[]
      }
      verify_staff_auth_context: { Args: never; Returns: string }
    }
    Enums: {
      age_group: "child" | "young_person" | "adult"
      agreement_party: "client" | "staff" | "other"
      agreement_status: "Active" | "Pending" | "Expired" | "Terminated"
      app_role:
        | "super_admin"
        | "branch_admin"
        | "admin"
        | "carer"
        | "client"
        | "app_admin"
      essential_status:
        | "pending"
        | "complete"
        | "expiring"
        | "expired"
        | "not_required"
      scheduled_agreement_status:
        | "Upcoming"
        | "Pending Approval"
        | "Under Review"
        | "Completed"
        | "Cancelled"
      system_role:
        | "super_admin"
        | "tenant_manager"
        | "support_admin"
        | "analytics_viewer"
      system_tenant_agreement_file_category:
        | "document"
        | "signature"
        | "template"
        | "attachment"
      system_tenant_agreement_status:
        | "Active"
        | "Pending"
        | "Expired"
        | "Terminated"
        | "Draft"
      third_party_access_type: "client" | "staff" | "both"
      third_party_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
        | "revoked"
      training_status_extended:
        | "not-started"
        | "in-progress"
        | "completed"
        | "expired"
        | "paused"
        | "under-review"
        | "failed"
        | "renewal-required"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      age_group: ["child", "young_person", "adult"],
      agreement_party: ["client", "staff", "other"],
      agreement_status: ["Active", "Pending", "Expired", "Terminated"],
      app_role: [
        "super_admin",
        "branch_admin",
        "admin",
        "carer",
        "client",
        "app_admin",
      ],
      essential_status: [
        "pending",
        "complete",
        "expiring",
        "expired",
        "not_required",
      ],
      scheduled_agreement_status: [
        "Upcoming",
        "Pending Approval",
        "Under Review",
        "Completed",
        "Cancelled",
      ],
      system_role: [
        "super_admin",
        "tenant_manager",
        "support_admin",
        "analytics_viewer",
      ],
      system_tenant_agreement_file_category: [
        "document",
        "signature",
        "template",
        "attachment",
      ],
      system_tenant_agreement_status: [
        "Active",
        "Pending",
        "Expired",
        "Terminated",
        "Draft",
      ],
      third_party_access_type: ["client", "staff", "both"],
      third_party_request_status: [
        "pending",
        "approved",
        "rejected",
        "expired",
        "revoked",
      ],
      training_status_extended: [
        "not-started",
        "in-progress",
        "completed",
        "expired",
        "paused",
        "under-review",
        "failed",
        "renewal-required",
      ],
    },
  },
} as const
