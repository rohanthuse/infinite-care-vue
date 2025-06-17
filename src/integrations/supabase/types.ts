export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
            foreignKeyName: "admin_branches_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      agreement_templates: {
        Row: {
          branch_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
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
      client_billing: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          description: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          paid_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          paid_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          paid_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          client_id: string
          created_at: string
          end_date: string | null
          goals_progress: number | null
          id: string
          provider_name: string
          review_date: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          goals_progress?: number | null
          id?: string
          provider_name: string
          review_date?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          goals_progress?: number | null
          id?: string
          provider_name?: string
          review_date?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_care_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
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
      client_events_logs: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          event_type: string
          id: string
          reporter: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          reporter: string
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          reporter?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_events_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
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
      clients: {
        Row: {
          additional_information: string | null
          address: string | null
          avatar_initials: string | null
          branch_id: string | null
          country_code: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          middle_name: string | null
          mobile_number: string | null
          other_identifier: string | null
          phone: string | null
          preferred_name: string | null
          pronouns: string | null
          referral_route: string | null
          region: string | null
          registered_on: string | null
          status: string | null
          telephone_number: string | null
          title: string | null
        }
        Insert: {
          additional_information?: string | null
          address?: string | null
          avatar_initials?: string | null
          branch_id?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          mobile_number?: string | null
          other_identifier?: string | null
          phone?: string | null
          preferred_name?: string | null
          pronouns?: string | null
          referral_route?: string | null
          region?: string | null
          registered_on?: string | null
          status?: string | null
          telephone_number?: string | null
          title?: string | null
        }
        Update: {
          additional_information?: string | null
          address?: string | null
          avatar_initials?: string | null
          branch_id?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          mobile_number?: string | null
          other_identifier?: string | null
          phone?: string | null
          preferred_name?: string | null
          pronouns?: string | null
          referral_route?: string | null
          region?: string | null
          registered_on?: string | null
          status?: string | null
          telephone_number?: string | null
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
      reviews: {
        Row: {
          branch_id: string | null
          client_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          staff_id: string | null
        }
        Insert: {
          branch_id?: string | null
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          staff_id?: string | null
        }
        Update: {
          branch_id?: string | null
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          staff_id?: string | null
        }
        Relationships: [
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
          branch_id: string | null
          created_at: string
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
          branch_id?: string | null
          created_at?: string
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
          branch_id?: string | null
          created_at?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_agreements_scheduled_with_staff_id_fkey"
            columns: ["scheduled_with_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          branch_id: string | null
          created_at: string | null
          first_name: string
          id: string
          last_name: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          first_name: string
          id?: string
          last_name: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
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
      staff_documents: {
        Row: {
          created_at: string | null
          document_type: string
          expiry_date: string | null
          id: string
          staff_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          expiry_date?: string | null
          id?: string
          staff_id?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          expiry_date?: string | null
          id?: string
          staff_id?: string | null
          status?: string
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
      get_branch_chart_data: {
        Args: { p_branch_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      agreement_party: "client" | "staff" | "other"
      agreement_status: "Active" | "Pending" | "Expired" | "Terminated"
      app_role: "super_admin" | "branch_admin"
      scheduled_agreement_status:
        | "Upcoming"
        | "Pending Approval"
        | "Under Review"
        | "Completed"
        | "Cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agreement_party: ["client", "staff", "other"],
      agreement_status: ["Active", "Pending", "Expired", "Terminated"],
      app_role: ["super_admin", "branch_admin"],
      scheduled_agreement_status: [
        "Upcoming",
        "Pending Approval",
        "Under Review",
        "Completed",
        "Cancelled",
      ],
    },
  },
} as const
