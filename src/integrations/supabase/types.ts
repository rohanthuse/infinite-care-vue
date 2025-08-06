export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
        }
        Insert: {
          admin_id: string
          branch_id: string
        }
        Update: {
          admin_id?: string
          branch_id?: string
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
          branch_id: string
          confirmed_care_plan: boolean
          created_at: string
          finance: boolean
          id: string
          report_accounting: boolean
          report_client: boolean
          report_service: boolean
          report_staff: boolean
          report_total_working_hours: boolean
          reviews: boolean
          system: boolean
          third_party: boolean
          under_review_care_plan: boolean
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
          branch_id: string
          confirmed_care_plan?: boolean
          created_at?: string
          finance?: boolean
          id?: string
          report_accounting?: boolean
          report_client?: boolean
          report_service?: boolean
          report_staff?: boolean
          report_total_working_hours?: boolean
          reviews?: boolean
          system?: boolean
          third_party?: boolean
          under_review_care_plan?: boolean
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
          branch_id?: string
          confirmed_care_plan?: boolean
          created_at?: string
          finance?: boolean
          id?: string
          report_accounting?: boolean
          report_client?: boolean
          report_service?: boolean
          report_staff?: boolean
          report_total_working_hours?: boolean
          reviews?: boolean
          system?: boolean
          third_party?: boolean
          under_review_care_plan?: boolean
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
          branch_id: string | null
          content: string | null
          created_at: string
          digital_signature: string | null
          id: string
          primary_document_id: string | null
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
          branch_id?: string | null
          content?: string | null
          created_at?: string
          digital_signature?: string | null
          id?: string
          primary_document_id?: string | null
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
          branch_id?: string | null
          content?: string | null
          created_at?: string
          digital_signature?: string | null
          id?: string
          primary_document_id?: string | null
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
          id: string
          is_company_wide: boolean
          is_recurring: boolean
          leave_date: string
          leave_name: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_company_wide?: boolean
          is_recurring?: boolean
          leave_date: string
          leave_name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_company_wide?: boolean
          is_recurring?: boolean
          leave_date?: string
          leave_name?: string
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
      bank_holidays: {
        Row: {
          created_at: string
          id: string
          registered_by: string
          registered_on: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          registered_by: string
          registered_on: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          registered_by?: string
          registered_on?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      body_map_points: {
        Row: {
          color: string
          created_at: string
          id: string
          letter: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          letter: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          letter?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          branch_id: string | null
          client_id: string | null
          created_at: string | null
          end_time: string
          id: string
          revenue: number | null
          service_id: string | null
          staff_id: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          branch_id?: string | null
          client_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          revenue?: number | null
          service_id?: string | null
          staff_id?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          branch_id?: string | null
          client_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          revenue?: number | null
          service_id?: string | null
          staff_id?: string | null
          start_time?: string
          status?: string | null
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
          phone: string | null
          regulatory: string
          status: string
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
          phone?: string | null
          regulatory: string
          status: string
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
          phone?: string | null
          regulatory?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
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
      client_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          client_id: string
          created_at: string
          id: string
          location: string
          notes: string | null
          provider_name: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          client_id: string
          created_at?: string
          id?: string
          location: string
          notes?: string | null
          provider_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          client_id?: string
          created_at?: string
          id?: string
          location?: string
          notes?: string | null
          provider_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
            foreignKeyName: "client_assessments_performed_by_id_fkey"
            columns: ["performed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_billing: {
        Row: {
          amount: number
          booking_id: string | null
          client_id: string
          created_at: string
          currency: string | null
          description: string
          due_date: string
          generated_from_booking: boolean | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: string | null
          notes: string | null
          overdue_date: string | null
          paid_date: string | null
          payment_terms: string | null
          sent_date: string | null
          service_provided_date: string | null
          status: string
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          client_id: string
          created_at?: string
          currency?: string | null
          description: string
          due_date: string
          generated_from_booking?: boolean | null
          id?: string
          invoice_date: string
          invoice_number: string
          invoice_type?: string | null
          notes?: string | null
          overdue_date?: string | null
          paid_date?: string | null
          payment_terms?: string | null
          sent_date?: string | null
          service_provided_date?: string | null
          status?: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          client_id?: string
          created_at?: string
          currency?: string | null
          description?: string
          due_date?: string
          generated_from_booking?: boolean | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string | null
          notes?: string | null
          overdue_date?: string | null
          paid_date?: string | null
          payment_terms?: string | null
          sent_date?: string | null
          service_provided_date?: string | null
          status?: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
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
          client_acknowledgment_ip: unknown | null
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
          client_acknowledgment_ip?: unknown | null
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
          client_acknowledgment_ip?: unknown | null
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
          external_reporting_required: boolean | null
          family_notified: boolean | null
          follow_up_assigned_to: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          gp_notified: boolean | null
          id: string
          immediate_actions_taken: string | null
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
          external_reporting_required?: boolean | null
          family_notified?: boolean | null
          follow_up_assigned_to?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          gp_notified?: boolean | null
          id?: string
          immediate_actions_taken?: string | null
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
          external_reporting_required?: boolean | null
          family_notified?: boolean | null
          follow_up_assigned_to?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          gp_notified?: boolean | null
          id?: string
          immediate_actions_taken?: string | null
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
            foreignKeyName: "client_events_logs_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
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
          mental_health_status: string | null
          mobility_status: string | null
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
          mental_health_status?: string | null
          mobility_status?: string | null
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
          mental_health_status?: string | null
          mobility_status?: string | null
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
        ]
      }
      client_medications: {
        Row: {
          care_plan_id: string
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          care_plan_id: string
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          care_plan_id?: string
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
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
        ]
      }
      client_personal_care: {
        Row: {
          bathing_preferences: string | null
          behavioral_notes: string | null
          client_id: string
          comfort_measures: string | null
          continence_status: string | null
          created_at: string
          dressing_assistance_level: string | null
          id: string
          pain_management: string | null
          personal_hygiene_needs: string | null
          skin_care_needs: string | null
          sleep_patterns: string | null
          toileting_assistance_level: string | null
          updated_at: string
        }
        Insert: {
          bathing_preferences?: string | null
          behavioral_notes?: string | null
          client_id: string
          comfort_measures?: string | null
          continence_status?: string | null
          created_at?: string
          dressing_assistance_level?: string | null
          id?: string
          pain_management?: string | null
          personal_hygiene_needs?: string | null
          skin_care_needs?: string | null
          sleep_patterns?: string | null
          toileting_assistance_level?: string | null
          updated_at?: string
        }
        Update: {
          bathing_preferences?: string | null
          behavioral_notes?: string | null
          client_id?: string
          comfort_measures?: string | null
          continence_status?: string | null
          created_at?: string
          dressing_assistance_level?: string | null
          id?: string
          pain_management?: string | null
          personal_hygiene_needs?: string | null
          skin_care_needs?: string | null
          sleep_patterns?: string | null
          toileting_assistance_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_personal_care_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_personal_info: {
        Row: {
          client_id: string
          created_at: string
          cultural_preferences: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          gp_name: string | null
          gp_phone: string | null
          gp_practice: string | null
          id: string
          language_preferences: string | null
          marital_status: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relationship: string | null
          preferred_communication: string | null
          religion: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          cultural_preferences?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          gp_name?: string | null
          gp_phone?: string | null
          gp_practice?: string | null
          id?: string
          language_preferences?: string | null
          marital_status?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          preferred_communication?: string | null
          religion?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          cultural_preferences?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          gp_name?: string | null
          gp_phone?: string | null
          gp_practice?: string | null
          id?: string
          language_preferences?: string | null
          marital_status?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          preferred_communication?: string | null
          religion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_personal_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_risk_assessments: {
        Row: {
          assessed_by: string
          assessment_date: string
          client_id: string
          created_at: string
          id: string
          mitigation_strategies: string[] | null
          review_date: string | null
          risk_factors: string[] | null
          risk_level: string
          risk_type: string
          status: string
          updated_at: string
        }
        Insert: {
          assessed_by: string
          assessment_date: string
          client_id: string
          created_at?: string
          id?: string
          mitigation_strategies?: string[] | null
          review_date?: string | null
          risk_factors?: string[] | null
          risk_level: string
          risk_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          assessed_by?: string
          assessment_date?: string
          client_id?: string
          created_at?: string
          id?: string
          mitigation_strategies?: string[] | null
          review_date?: string | null
          risk_factors?: string[] | null
          risk_level?: string
          risk_type?: string
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
        ]
      }
      clients: {
        Row: {
          additional_information: string | null
          address: string | null
          auth_user_id: string | null
          avatar_initials: string | null
          branch_id: string | null
          communication_preferences: string | null
          country_code: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string
          gender: string | null
          gp_details: string | null
          id: string
          invitation_sent_at: string | null
          last_name: string
          middle_name: string | null
          mobile_number: string | null
          mobility_status: string | null
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
          status: string | null
          telephone_number: string | null
          temporary_password: string | null
          title: string | null
        }
        Insert: {
          additional_information?: string | null
          address?: string | null
          auth_user_id?: string | null
          avatar_initials?: string | null
          branch_id?: string | null
          communication_preferences?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name: string
          gender?: string | null
          gp_details?: string | null
          id?: string
          invitation_sent_at?: string | null
          last_name: string
          middle_name?: string | null
          mobile_number?: string | null
          mobility_status?: string | null
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
          status?: string | null
          telephone_number?: string | null
          temporary_password?: string | null
          title?: string | null
        }
        Update: {
          additional_information?: string | null
          address?: string | null
          auth_user_id?: string | null
          avatar_initials?: string | null
          branch_id?: string | null
          communication_preferences?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string
          gender?: string | null
          gp_details?: string | null
          id?: string
          invitation_sent_at?: string | null
          last_name?: string
          middle_name?: string | null
          mobile_number?: string | null
          mobility_status?: string | null
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
          status?: string | null
          telephone_number?: string | null
          temporary_password?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_types: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: "documents_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
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
      expense_types: {
        Row: {
          amount: number
          created_at: string
          id: string
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
          status?: string
          tax?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          branch_id: string
          category: string
          client_id: string | null
          created_at: string
          created_by: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string
          receipt_url: string | null
          staff_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          branch_id: string
          category: string
          client_id?: string | null
          created_at?: string
          created_by: string
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          receipt_url?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string
          category?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          receipt_url?: string | null
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
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
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
          reason: string | null
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
          reason?: string | null
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
          reason?: string | null
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
            referencedRelation: "staff"
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
            foreignKeyName: "extra_time_records_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_billing"
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
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          submitted_at: string
          submitted_by: string
          submitted_by_type: string
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
          submitted_at?: string
          submitted_by: string
          submitted_by_type: string
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
          submitted_at?: string
          submitted_by?: string
          submitted_by_type?: string
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
      hobbies: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          discount_amount: number | null
          id: string
          invoice_id: string
          line_total: number
          quantity: number | null
          service_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_amount?: number | null
          id?: string
          invoice_id: string
          line_total: number
          quantity?: number | null
          service_id?: string | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_amount?: number | null
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number | null
          service_id?: string | null
          unit_price?: number
          updated_at?: string
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
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_conditions: {
        Row: {
          category_id: string
          created_at: string
          field_caption: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          field_caption?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          field_caption?: string | null
          id?: string
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
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
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
          id: string
          is_archived: boolean | null
          last_message_at: string | null
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
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
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
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
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
        ]
      }
      messages: {
        Row: {
          action_required: boolean | null
          admin_eyes_only: boolean | null
          attachments: Json | null
          content: string
          created_at: string
          has_attachments: boolean | null
          id: string
          message_type: string | null
          notification_methods: string[] | null
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
          has_attachments?: boolean | null
          id?: string
          message_type?: string | null
          notification_methods?: string[] | null
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
          has_attachments?: boolean | null
          id?: string
          message_type?: string | null
          notification_methods?: string[] | null
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
          expires_at: string | null
          id: string
          message: string
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
          expires_at?: string | null
          id?: string
          message: string
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
          expires_at?: string | null
          id?: string
          message?: string
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
      report_types: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      service_rates: {
        Row: {
          amount: number
          applicable_days: string[]
          branch_id: string
          client_type: string
          created_at: string
          created_by: string
          currency: string
          description: string | null
          effective_from: string
          effective_to: string | null
          funding_source: string
          id: string
          is_default: boolean
          rate_type: string
          service_code: string
          service_id: string | null
          service_name: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          applicable_days?: string[]
          branch_id: string
          client_type?: string
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          funding_source?: string
          id?: string
          is_default?: boolean
          rate_type?: string
          service_code: string
          service_id?: string | null
          service_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          applicable_days?: string[]
          branch_id?: string
          client_type?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          funding_source?: string
          id?: string
          is_default?: boolean
          rate_type?: string
          service_code?: string
          service_id?: string | null
          service_name?: string
          status?: string
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
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          double_handed: boolean
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          double_handed?: boolean
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          double_handed?: boolean
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
          national_insurance_number: string | null
          phone: string | null
          profile_completed: boolean | null
          qualifications: string[] | null
          salary_amount: number | null
          salary_frequency: string | null
          specialization: string | null
          status: string | null
          temporary_password: string | null
          training_records: Json | null
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
          national_insurance_number?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          qualifications?: string[] | null
          salary_amount?: number | null
          salary_frequency?: string | null
          specialization?: string | null
          status?: string | null
          temporary_password?: string | null
          training_records?: Json | null
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
          national_insurance_number?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          qualifications?: string[] | null
          salary_amount?: number | null
          salary_frequency?: string | null
          specialization?: string | null
          status?: string | null
          temporary_password?: string | null
          training_records?: Json | null
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
      staff_documents: {
        Row: {
          created_at: string | null
          document_type: string
          expiry_date: string | null
          file_path: string | null
          file_size: string | null
          file_type: string | null
          id: string
          staff_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: string | null
          file_type?: string | null
          id?: string
          staff_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: string | null
          file_type?: string | null
          id?: string
          staff_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
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
      tasks: {
        Row: {
          assignee_id: string | null
          branch_id: string
          category: string | null
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
        ]
      }
      third_party_access_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          branch_id: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          login_count: number
          organisation: string | null
          request_id: string
          role: string | null
          surname: string
          updated_at: string
        }
        Insert: {
          access_expires_at: string
          access_type: Database["public"]["Enums"]["third_party_access_type"]
          branch_id: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          login_count?: number
          organisation?: string | null
          request_id: string
          role?: string | null
          surname: string
          updated_at?: string
        }
        Update: {
          access_expires_at?: string
          access_type?: Database["public"]["Enums"]["third_party_access_type"]
          branch_id?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          login_count?: number
          organisation?: string | null
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
          rate_per_hour?: number
          rate_per_mile?: number
          status?: string
          title?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: []
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
          purpose: string
          receipt_url: string | null
          reimbursed_at: string | null
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
          purpose: string
          receipt_url?: string | null
          reimbursed_at?: string | null
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
          purpose?: string
          receipt_url?: string | null
          reimbursed_at?: string | null
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
            foreignKeyName: "travel_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
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
          booking_id: string
          branch_id: string
          client_id: string
          client_signature_data: string | null
          completion_percentage: number | null
          created_at: string
          id: string
          location_data: Json | null
          staff_id: string
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
          booking_id: string
          branch_id: string
          client_id: string
          client_signature_data?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          location_data?: Json | null
          staff_id: string
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
          booking_id?: string
          branch_id?: string
          client_id?: string
          client_signature_data?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          location_data?: Json | null
          staff_id?: string
          staff_signature_data?: string | null
          status?: string
          updated_at?: string
          visit_end_time?: string | null
          visit_notes?: string | null
          visit_photos?: Json | null
          visit_start_time?: string
          visit_summary?: string | null
        }
        Relationships: []
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
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_client_password: {
        Args: {
          p_client_id: string
          p_new_password: string
          p_admin_id: string
        }
        Returns: Json
      }
      admin_set_staff_password: {
        Args: { p_staff_id: string; p_new_password: string; p_admin_id: string }
        Returns: Json
      }
      calculate_invoice_total: {
        Args: { invoice_id: string }
        Returns: number
      }
      calculate_leave_days: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: number
      }
      calculate_news2_score: {
        Args:
          | {
              resp_rate: number
              o2_sat: number
              supp_o2: boolean
              sys_bp: number
              dias_bp: number
              pulse: number
              consciousness: string
              temp: number
            }
          | {
              resp_rate: number
              o2_sat: number
              supp_o2: boolean
              sys_bp: number
              pulse: number
              consciousness: string
              temp: number
            }
        Returns: {
          resp_score: number
          o2_score: number
          supp_o2_score: number
          bp_score: number
          pulse_score: number
          consciousness_score: number
          temp_score: number
          total: number
          risk: string
        }[]
      }
      can_access_thread: {
        Args: { thread_id_param: string; user_id_param: string }
        Returns: boolean
      }
      check_auth_schema_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_carer_auth_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_user_role_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          has_auth: boolean
          has_role: boolean
          suggested_role: string
          issue_type: string
        }[]
      }
      create_carer_with_invitation: {
        Args: { p_carer_data: Json; p_branch_id: string }
        Returns: string
      }
      create_overdue_booking_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_third_party_login_session: {
        Args: {
          token_param: string
          user_id_param: string
          ip_address_param?: unknown
          user_agent_param?: string
        }
        Returns: string
      }
      create_third_party_user_account: {
        Args: { request_id_param: string }
        Returns: string
      }
      expire_third_party_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_all_client_auth_issues: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_client_auth_links: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_client_message_participants: {
        Args: Record<PropertyKey, never>
        Returns: {
          fixed_count: number
          error_count: number
          details: Json
        }[]
      }
      fix_message_participants_user_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          fixed_count: number
          error_count: number
          details: Json
        }[]
      }
      fix_staff_auth_links: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_invite_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_temporary_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_branch_chart_data: {
        Args: { p_branch_id: string }
        Returns: Json
      }
      get_branch_documents: {
        Args: { p_branch_id: string }
        Returns: {
          id: string
          name: string
          type: string
          category: string
          description: string
          file_path: string
          file_size: string
          file_type: string
          uploaded_by_name: string
          client_name: string
          staff_name: string
          tags: string[]
          status: string
          created_at: string
          updated_at: string
          source_table: string
          related_entity: string
        }[]
      }
      get_client_reports_data: {
        Args: {
          p_branch_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      get_compliance_reports_data: {
        Args: {
          p_branch_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      get_financial_reports_data: {
        Args: {
          p_branch_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      get_notification_stats: {
        Args: { p_user_id: string; p_branch_id?: string }
        Returns: {
          total_count: number
          unread_count: number
          high_priority_count: number
          by_type: Json
        }[]
      }
      get_operational_reports_data: {
        Args: {
          p_branch_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      get_service_reports_data: {
        Args: {
          p_branch_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      get_staff_profile: {
        Args: { staff_user_id: string }
        Returns: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string
          status: string
          experience: string
          specialization: string
          availability: string
          date_of_birth: string
          hire_date: string
          branch_id: string
        }[]
      }
      get_staff_profile_by_auth_user_id: {
        Args: { auth_user_id_param: string }
        Returns: {
          id: string
          auth_user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string
          status: string
          experience: string
          specialization: string
          availability: string
          date_of_birth: string
          hire_date: string
          branch_id: string
          first_login_completed: boolean
          profile_completed: boolean
          national_insurance_number: string
          emergency_contact_name: string
          emergency_contact_phone: string
          qualifications: string[]
          certifications: string[]
          bank_name: string
          bank_account_name: string
          bank_account_number: string
          bank_sort_code: string
          invitation_accepted_at: string
        }[]
      }
      get_staff_reports_data: {
        Args: {
          p_branch_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      get_third_party_user_by_token: {
        Args: { token_param: string }
        Returns: {
          user_id: string
          email: string
          first_name: string
          surname: string
          organisation: string
          role: string
          branch_id: string
          access_type: Database["public"]["Enums"]["third_party_access_type"]
          access_expires_at: string
          is_active: boolean
        }[]
      }
      get_uninvoiced_bookings: {
        Args: { branch_id_param?: string }
        Returns: {
          booking_id: string
          client_id: string
          client_name: string
          service_title: string
          start_time: string
          end_time: string
          revenue: number
          days_since_service: number
        }[]
      }
      get_user_highest_role: {
        Args: { p_user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_current_staff_member: {
        Args: { staff_id_param: string }
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
          p_client_id: string
          p_auth_user_id: string
          p_admin_id: string
        }
        Returns: Json
      }
      safe_setup_client_auth: {
        Args: { p_client_id: string; p_password: string; p_admin_id: string }
        Returns: Json
      }
      safe_setup_client_messaging_auth: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_client_message_participants: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_resource_stats: {
        Args: { resource_id: string; stat_type: string }
        Returns: undefined
      }
      user_can_access_thread: {
        Args: { thread_id_param: string; user_id_param: string }
        Returns: boolean
      }
      user_is_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      agreement_party: "client" | "staff" | "other"
      agreement_status: "Active" | "Pending" | "Expired" | "Terminated"
      app_role: "super_admin" | "branch_admin" | "admin" | "carer" | "client"
      scheduled_agreement_status:
        | "Upcoming"
        | "Pending Approval"
        | "Under Review"
        | "Completed"
        | "Cancelled"
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
      agreement_party: ["client", "staff", "other"],
      agreement_status: ["Active", "Pending", "Expired", "Terminated"],
      app_role: ["super_admin", "branch_admin", "admin", "carer", "client"],
      scheduled_agreement_status: [
        "Upcoming",
        "Pending Approval",
        "Under Review",
        "Completed",
        "Cancelled",
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
