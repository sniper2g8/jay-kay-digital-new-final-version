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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appUsers: {
        Row: {
          address: string | null
          created_at: string | null
          createdAt: Json | null
          email: string | null
          human_id: string | null
          id: string
          last_role_update: string | null
          name: string | null
          phone: string | null
          primary_role: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          createdAt?: Json | null
          email?: string | null
          human_id?: string | null
          id: string
          last_role_update?: string | null
          name?: string | null
          phone?: string | null
          primary_role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          createdAt?: Json | null
          email?: string | null
          human_id?: string | null
          id?: string
          last_role_update?: string | null
          name?: string | null
          phone?: string | null
          primary_role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_appusers_primary_role_name"
            columns: ["primary_role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      counters: {
        Row: {
          counter_id: string
          created_at: string | null
          id: string
          last: number
          updated_at: string | null
        }
        Insert: {
          counter_id: string
          created_at?: string | null
          id?: string
          last?: number
          updated_at?: string | null
        }
        Update: {
          counter_id?: string
          created_at?: string | null
          id?: string
          last?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_account_balances: {
        Row: {
          account_status: string | null
          created_at: string | null
          credit_limit: number | null
          credit_used: number | null
          credits_available: number | null
          current_balance: number | null
          customer_id: string | null
          id: string
          last_payment_date: string | null
          last_statement_date: string | null
          last_transaction_date: string | null
          outstanding_invoices: number | null
          payment_terms_days: number | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_used?: number | null
          credits_available?: number | null
          current_balance?: number | null
          customer_id?: string | null
          id?: string
          last_payment_date?: string | null
          last_statement_date?: string | null
          last_transaction_date?: string | null
          outstanding_invoices?: number | null
          payment_terms_days?: number | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_used?: number | null
          credits_available?: number | null
          current_balance?: number | null
          customer_id?: string | null
          id?: string
          last_payment_date?: string | null
          last_statement_date?: string | null
          last_transaction_date?: string | null
          outstanding_invoices?: number | null
          payment_terms_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_account_balances_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_estimates: {
        Row: {
          approved_by: string | null
          converted_to_job_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string
          customer_response: string | null
          description: string | null
          estimate_number: string
          expires_at: string | null
          id: string
          is_current_version: boolean | null
          parent_estimate_id: string | null
          priority: string | null
          quantity: number | null
          responded_at: string | null
          sent_at: string | null
          specifications: Json | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          title: string
          total_amount: number
          unit_price: number | null
          updated_at: string | null
          version: number | null
          viewed_at: string | null
        }
        Insert: {
          approved_by?: string | null
          converted_to_job_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          customer_response?: string | null
          description?: string | null
          estimate_number: string
          expires_at?: string | null
          id?: string
          is_current_version?: boolean | null
          parent_estimate_id?: string | null
          priority?: string | null
          quantity?: number | null
          responded_at?: string | null
          sent_at?: string | null
          specifications?: Json | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          title: string
          total_amount: number
          unit_price?: number | null
          updated_at?: string | null
          version?: number | null
          viewed_at?: string | null
        }
        Update: {
          approved_by?: string | null
          converted_to_job_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_response?: string | null
          description?: string | null
          estimate_number?: string
          expires_at?: string | null
          id?: string
          is_current_version?: boolean | null
          parent_estimate_id?: string | null
          priority?: string | null
          quantity?: number | null
          responded_at?: string | null
          sent_at?: string | null
          specifications?: Json | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          title?: string
          total_amount?: number
          unit_price?: number | null
          updated_at?: string | null
          version?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_estimates_converted_to_job_id_fkey"
            columns: ["converted_to_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_estimates_parent_estimate_id_fkey"
            columns: ["parent_estimate_id"]
            isOneToOne: false
            referencedRelation: "customer_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_statement_periods: {
        Row: {
          closing_balance: number | null
          created_at: string | null
          current_balance: number | null
          customer_id: string | null
          generated_by: string | null
          id: string
          is_current_period: boolean | null
          opening_balance: number | null
          period_end: string
          period_start: string
          sent_at: string | null
          statement_date: string | null
          statement_number: string
          status: string | null
          total_adjustments: number | null
          total_charges: number | null
          total_payments: number | null
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string | null
          current_balance?: number | null
          customer_id?: string | null
          generated_by?: string | null
          id?: string
          is_current_period?: boolean | null
          opening_balance?: number | null
          period_end: string
          period_start: string
          sent_at?: string | null
          statement_date?: string | null
          statement_number: string
          status?: string | null
          total_adjustments?: number | null
          total_charges?: number | null
          total_payments?: number | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          closing_balance?: number | null
          created_at?: string | null
          current_balance?: number | null
          customer_id?: string | null
          generated_by?: string | null
          id?: string
          is_current_period?: boolean | null
          opening_balance?: number | null
          period_end?: string
          period_start?: string
          sent_at?: string | null
          statement_date?: string | null
          statement_number?: string
          status?: string | null
          total_adjustments?: number | null
          total_charges?: number | null
          total_payments?: number | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_statement_periods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_statement_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string
          id: string
          invoice_id: string | null
          job_id: string | null
          payment_id: string | null
          reference_number: string | null
          running_balance: number
          statement_period_id: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description: string
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          payment_id?: string | null
          reference_number?: string | null
          running_balance: number
          statement_period_id?: string | null
          transaction_date: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          payment_id?: string | null
          reference_number?: string | null
          running_balance?: number
          statement_period_id?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_statement_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_statement_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_statement_transactions_statement_period_id_fkey"
            columns: ["statement_period_id"]
            isOneToOne: false
            referencedRelation: "customer_statement_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_statements: {
        Row: {
          closing_balance: number | null
          customer_id: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          opening_balance: number | null
          period_end: string
          period_start: string
          statement_data: Json | null
          statement_number: string
          total_charges: number | null
          total_payments: number | null
        }
        Insert: {
          closing_balance?: number | null
          customer_id?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          opening_balance?: number | null
          period_end: string
          period_start: string
          statement_data?: Json | null
          statement_number: string
          total_charges?: number | null
          total_payments?: number | null
        }
        Update: {
          closing_balance?: number | null
          customer_id?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          opening_balance?: number | null
          period_end?: string
          period_start?: string
          statement_data?: Json | null
          statement_number?: string
          total_charges?: number | null
          total_payments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_statements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_statements_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_statements_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_statements_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_statements_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customer_statements_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          app_user_id: string | null
          business_name: string
          city: string | null
          contact_person: string | null
          contact_person_id: string | null
          created_at: string | null
          credit_limit: number | null
          customer_status: string | null
          customer_type: string | null
          email: string | null
          human_id: string | null
          id: string
          name: string | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          state: string | null
          tax_id: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          app_user_id?: string | null
          business_name: string
          city?: string | null
          contact_person?: string | null
          contact_person_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          customer_status?: string | null
          customer_type?: string | null
          email?: string | null
          human_id?: string | null
          id: string
          name?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          app_user_id?: string | null
          business_name?: string
          city?: string | null
          contact_person?: string | null
          contact_person_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          customer_status?: string | null
          customer_type?: string | null
          email?: string | null
          human_id?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customers_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          resend_id: string | null
          sent_at: string
          status: string | null
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          resend_id?: string | null
          sent_at: string
          status?: string | null
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          resend_id?: string | null
          sent_at?: string
          status?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          subject: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          subject: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          subject?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string | null
          description: string
          expense_date: string
          expense_number: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          receipt_url: string | null
          recorded_by: string | null
          reference_number: string | null
          subcategory: string | null
          supplier_vendor: string | null
          tax_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          description: string
          expense_date?: string
          expense_number: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_url?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          subcategory?: string | null
          supplier_vendor?: string | null
          tax_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          description?: string
          expense_date?: string
          expense_number?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_url?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          subcategory?: string | null
          supplier_vendor?: string | null
          tax_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      file_attachments: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_primary: boolean | null
          thumbnail_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_primary?: boolean | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_primary?: boolean | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "file_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          invoice_id: string | null
          is_public: boolean | null
          job_id: string | null
          metadata: Json | null
          original_name: string | null
          storage_path: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          invoice_id?: string | null
          is_public?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          original_name?: string | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          invoice_id?: string | null
          is_public?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          original_name?: string | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      finish_options: {
        Row: {
          active: boolean | null
          appliesTo: Json | null
          category: string | null
          created_at: string | null
          createdAt: Json | null
          id: string
          name: string | null
          parameters: Json | null
          pricing: Json | null
          updated_at: string | null
          updatedAt: Json | null
        }
        Insert: {
          active?: boolean | null
          appliesTo?: Json | null
          category?: string | null
          created_at?: string | null
          createdAt?: Json | null
          id?: string
          name?: string | null
          parameters?: Json | null
          pricing?: Json | null
          updated_at?: string | null
          updatedAt?: Json | null
        }
        Update: {
          active?: boolean | null
          appliesTo?: Json | null
          category?: string | null
          created_at?: string | null
          createdAt?: Json | null
          id?: string
          name?: string | null
          parameters?: Json | null
          pricing?: Json | null
          updated_at?: string | null
          updatedAt?: Json | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          created_at: string | null
          current_stock: number | null
          description: string | null
          id: string
          item_code: string
          item_name: string
          last_updated_by: string | null
          location: string | null
          minimum_stock: number | null
          status: Database["public"]["Enums"]["inventory_status"] | null
          supplier_info: Json | null
          unit_cost: number | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          item_code: string
          item_name: string
          last_updated_by?: string | null
          location?: string | null
          minimum_stock?: number | null
          status?: Database["public"]["Enums"]["inventory_status"] | null
          supplier_info?: Json | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          item_code?: string
          item_name?: string
          last_updated_by?: string | null
          location?: string | null
          minimum_stock?: number | null
          status?: Database["public"]["Enums"]["inventory_status"] | null
          supplier_info?: Json | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inventory_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string | null
          moved_by: string | null
          movement_date: string | null
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          moved_by?: string | null
          movement_date?: string | null
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          moved_by?: string | null
          movement_date?: string | null
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: number
          invoice_id: string | null
          job_id: string | null
          job_no: string | null
          notes: string | null
          quantity: number | null
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: number
          invoice_id?: string | null
          job_id?: string | null
          job_no?: string | null
          notes?: string | null
          quantity?: number | null
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: number
          invoice_id?: string | null
          job_id?: string | null
          job_no?: string | null
          notes?: string | null
          quantity?: number | null
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string | null
          description: string
          discount_amount: number | null
          id: string
          invoice_id: string | null
          job_id: string | null
          line_order: number | null
          quantity: number | null
          service_id: string | null
          tax_amount: number | null
          tax_rate: number | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          discount_amount?: number | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          line_order?: number | null
          quantity?: number | null
          service_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          line_order?: number | null
          quantity?: number | null
          service_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_status_history: {
        Row: {
          change_date: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          reason: string | null
          status_from: string | null
          status_to: string
        }
        Insert: {
          change_date?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          status_from?: string | null
          status_to: string
        }
        Update: {
          change_date?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          status_from?: string | null
          status_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoice_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_status_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          font_family: string | null
          footer_html: string | null
          header_html: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          payment_instructions: string | null
          primary_color: string | null
          secondary_color: string | null
          show_line_numbers: boolean | null
          show_payment_terms: boolean | null
          show_tax_breakdown: boolean | null
          template_name: string
          template_type: string | null
          terms_conditions: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          font_family?: string | null
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          payment_instructions?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_line_numbers?: boolean | null
          show_payment_terms?: boolean | null
          show_tax_breakdown?: boolean | null
          template_name: string
          template_type?: string | null
          terms_conditions?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          font_family?: string | null
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          payment_instructions?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_line_numbers?: boolean | null
          show_payment_terms?: boolean | null
          show_tax_breakdown?: boolean | null
          template_name?: string
          template_type?: string | null
          terms_conditions?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoice_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amountDue: number | null
          amountPaid: number | null
          created_at: string | null
          createdAt: Json | null
          currency: string | null
          customer_id: string | null
          customerName: string | null
          discount: number | null
          discount_percentage: number | null
          due_date: string | null
          dueDate: Json | null
          generated_by: string | null
          grandTotal: number | null
          id: string
          invoice_date: string | null
          invoice_qr: string | null
          invoice_status: string | null
          invoiceNo: string | null
          issueDate: Json | null
          items: Json | null
          last_sent_at: string | null
          last_viewed_at: string | null
          late_fee_percentage: number | null
          notes: string | null
          payment_link: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pdf_generated: boolean | null
          pdf_url: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          taxable: number | null
          taxRate: number | null
          template_id: string | null
          terms_days: number | null
          total: number | null
          updated_at: string | null
          updatedAt: Json | null
        }
        Insert: {
          amountDue?: number | null
          amountPaid?: number | null
          created_at?: string | null
          createdAt?: Json | null
          currency?: string | null
          customer_id?: string | null
          customerName?: string | null
          discount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          dueDate?: Json | null
          generated_by?: string | null
          grandTotal?: number | null
          id: string
          invoice_date?: string | null
          invoice_qr?: string | null
          invoice_status?: string | null
          invoiceNo?: string | null
          issueDate?: Json | null
          items?: Json | null
          last_sent_at?: string | null
          last_viewed_at?: string | null
          late_fee_percentage?: number | null
          notes?: string | null
          payment_link?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pdf_generated?: boolean | null
          pdf_url?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          taxable?: number | null
          taxRate?: number | null
          template_id?: string | null
          terms_days?: number | null
          total?: number | null
          updated_at?: string | null
          updatedAt?: Json | null
        }
        Update: {
          amountDue?: number | null
          amountPaid?: number | null
          created_at?: string | null
          createdAt?: Json | null
          currency?: string | null
          customer_id?: string | null
          customerName?: string | null
          discount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          dueDate?: Json | null
          generated_by?: string | null
          grandTotal?: number | null
          id?: string
          invoice_date?: string | null
          invoice_qr?: string | null
          invoice_status?: string | null
          invoiceNo?: string | null
          issueDate?: Json | null
          items?: Json | null
          last_sent_at?: string | null
          last_viewed_at?: string | null
          late_fee_percentage?: number | null
          notes?: string | null
          payment_link?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pdf_generated?: boolean | null
          pdf_url?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          taxable?: number | null
          taxRate?: number | null
          template_id?: string | null
          terms_days?: number | null
          total?: number | null
          updated_at?: string | null
          updatedAt?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_customer_uuid"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      job_activity_log: {
        Row: {
          activity_timestamp: string | null
          activity_type: string
          description: string
          id: string
          job_id: string | null
          new_value: string | null
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          activity_timestamp?: string | null
          activity_type: string
          description: string
          id?: string
          job_id?: string | null
          new_value?: string | null
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          activity_timestamp?: string | null
          activity_type?: string
          description?: string
          id?: string
          job_id?: string | null
          new_value?: string | null
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      job_specifications: {
        Row: {
          created_at: string | null
          custom_height: number | null
          custom_width: number | null
          finishing_options: Json | null
          id: string
          job_id: string | null
          paper_type: string | null
          paper_weight: number | null
          requirements: string | null
          size_preset: string | null
          size_type: string | null
          size_unit: string | null
          special_instructions: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_height?: number | null
          custom_width?: number | null
          finishing_options?: Json | null
          id?: string
          job_id?: string | null
          paper_type?: string | null
          paper_weight?: number | null
          requirements?: string | null
          size_preset?: string | null
          size_type?: string | null
          size_unit?: string | null
          special_instructions?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_height?: number | null
          custom_width?: number | null
          finishing_options?: Json | null
          id?: string
          job_id?: string | null
          paper_type?: string | null
          paper_weight?: number | null
          requirements?: string | null
          size_preset?: string | null
          size_type?: string | null
          size_unit?: string | null
          special_instructions?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_specifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_tracking: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          location: string | null
          notes: string | null
          status_from: string | null
          status_to: string
          tracking_data: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          location?: string | null
          notes?: string | null
          status_from?: string | null
          status_to: string
          tracking_data?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          location?: string | null
          notes?: string | null
          status_from?: string | null
          status_to?: string
          tracking_data?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          __open: boolean | null
          actual_delivery: string | null
          assigned_to: string | null
          created_at: string | null
          createdBy: string | null
          custom_height: number | null
          custom_width: number | null
          customer_id: string | null
          customerName: string | null
          description: string | null
          estimate_price: number | null
          estimated_delivery: string | null
          final_price: number | null
          finishing_options: Json | null
          id: string
          invoice_id: string | null
          invoiced: boolean | null
          invoiceNo: string | null
          job_type: Database["public"]["Enums"]["job_type_enum"] | null
          jobNo: string | null
          paper_type: string | null
          paper_weight: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          qr_code: string | null
          quantity: number | null
          requirements: string | null
          service_id: string | null
          serviceName: string | null
          size_preset: string | null
          size_type: string | null
          size_unit: string | null
          special_instructions: string | null
          status: string | null
          submittedDate: string | null
          title: string | null
          tracking_url: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          __open?: boolean | null
          actual_delivery?: string | null
          assigned_to?: string | null
          created_at?: string | null
          createdBy?: string | null
          custom_height?: number | null
          custom_width?: number | null
          customer_id?: string | null
          customerName?: string | null
          description?: string | null
          estimate_price?: number | null
          estimated_delivery?: string | null
          final_price?: number | null
          finishing_options?: Json | null
          id: string
          invoice_id?: string | null
          invoiced?: boolean | null
          invoiceNo?: string | null
          job_type?: Database["public"]["Enums"]["job_type_enum"] | null
          jobNo?: string | null
          paper_type?: string | null
          paper_weight?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          qr_code?: string | null
          quantity?: number | null
          requirements?: string | null
          service_id?: string | null
          serviceName?: string | null
          size_preset?: string | null
          size_type?: string | null
          size_unit?: string | null
          special_instructions?: string | null
          status?: string | null
          submittedDate?: string | null
          title?: string | null
          tracking_url?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          __open?: boolean | null
          actual_delivery?: string | null
          assigned_to?: string | null
          created_at?: string | null
          createdBy?: string | null
          custom_height?: number | null
          custom_width?: number | null
          customer_id?: string | null
          customerName?: string | null
          description?: string | null
          estimate_price?: number | null
          estimated_delivery?: string | null
          final_price?: number | null
          finishing_options?: Json | null
          id?: string
          invoice_id?: string | null
          invoiced?: boolean | null
          invoiceNo?: string | null
          job_type?: Database["public"]["Enums"]["job_type_enum"] | null
          jobNo?: string | null
          paper_type?: string | null
          paper_weight?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          qr_code?: string | null
          quantity?: number | null
          requirements?: string | null
          service_id?: string | null
          serviceName?: string | null
          size_preset?: string | null
          size_type?: string | null
          size_unit?: string | null
          special_instructions?: string | null
          status?: string | null
          submittedDate?: string | null
          title?: string | null
          tracking_url?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_customer_uuid"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_jobs_invoice_uuid"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_backup_data: {
        Row: {
          createdAt: Json | null
          delivery: Json | null
          dueDate: Json | null
          estimate: Json | null
          files: Json | null
          finishIds: Json | null
          finishOptions: Json | null
          finishPrices: Json | null
          id: string | null
          lf: Json | null
          paper: Json | null
          size: Json | null
          specifications: Json | null
          updatedAt: Json | null
        }
        Insert: {
          createdAt?: Json | null
          delivery?: Json | null
          dueDate?: Json | null
          estimate?: Json | null
          files?: Json | null
          finishIds?: Json | null
          finishOptions?: Json | null
          finishPrices?: Json | null
          id?: string | null
          lf?: Json | null
          paper?: Json | null
          size?: Json | null
          specifications?: Json | null
          updatedAt?: Json | null
        }
        Update: {
          createdAt?: Json | null
          delivery?: Json | null
          dueDate?: Json | null
          estimate?: Json | null
          files?: Json | null
          finishIds?: Json | null
          finishOptions?: Json | null
          finishPrices?: Json | null
          id?: string | null
          lf?: Json | null
          paper?: Json | null
          size?: Json | null
          specifications?: Json | null
          updatedAt?: Json | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          delivery_updates: boolean | null
          email_notifications: boolean | null
          id: string
          job_status_updates: boolean | null
          promotional_messages: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_updates?: boolean | null
          email_notifications?: boolean | null
          id: string
          job_status_updates?: boolean | null
          promotional_messages?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_updates?: boolean | null
          email_notifications?: boolean | null
          id?: string
          job_status_updates?: boolean | null
          promotional_messages?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          email_sent: boolean | null
          id: string
          message: string
          read_at: string | null
          recipient_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sms_sent: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          message: string
          read_at?: string | null
          recipient_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sms_sent?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sms_sent?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_sizes: {
        Row: {
          active: boolean | null
          category: string | null
          common_uses: string[] | null
          created_at: string | null
          description: string | null
          height_inches: number
          height_mm: number
          id: string
          name: string
          series: string
          updated_at: string | null
          width_inches: number
          width_mm: number
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          common_uses?: string[] | null
          created_at?: string | null
          description?: string | null
          height_inches: number
          height_mm: number
          id?: string
          name: string
          series: string
          updated_at?: string | null
          width_inches: number
          width_mm: number
        }
        Update: {
          active?: boolean | null
          category?: string | null
          common_uses?: string[] | null
          created_at?: string | null
          description?: string | null
          height_inches?: number
          height_mm?: number
          id?: string
          name?: string
          series?: string
          updated_at?: string | null
          width_inches?: number
          width_mm?: number
        }
        Relationships: []
      }
      paper_types: {
        Row: {
          active: boolean | null
          category: string
          common_uses: string[] | null
          compatible_weights: number[] | null
          created_at: string | null
          description: string | null
          finish: string | null
          grain_direction: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          common_uses?: string[] | null
          compatible_weights?: number[] | null
          created_at?: string | null
          description?: string | null
          finish?: string | null
          grain_direction?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          common_uses?: string[] | null
          compatible_weights?: number[] | null
          created_at?: string | null
          description?: string | null
          finish?: string | null
          grain_direction?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      paper_weights: {
        Row: {
          active: boolean | null
          category: string
          common_uses: string[] | null
          created_at: string | null
          description: string | null
          gsm: number
          id: string
          name: string
          opacity_percent: number | null
          thickness_mm: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          common_uses?: string[] | null
          created_at?: string | null
          description?: string | null
          gsm: number
          id?: string
          name: string
          opacity_percent?: number | null
          thickness_mm?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          common_uses?: string[] | null
          created_at?: string | null
          description?: string | null
          gsm?: number
          id?: string
          name?: string
          opacity_percent?: number | null
          thickness_mm?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          allocation_date: string | null
          allocation_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_id: string | null
        }
        Insert: {
          allocated_amount: number
          allocation_date?: string | null
          allocation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_id?: string | null
        }
        Update: {
          allocated_amount?: number
          allocation_date?: string | null
          allocation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          applied_to_invoice_id: string | null
          created_at: string | null
          customer_human_id: string
          customer_id: string | null
          fees: number | null
          id: string
          invoice_no: string
          notes: string | null
          overpayment_amount: number | null
          payment_date: string
          payment_gateway: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_number: string
          payment_status: string | null
          received_by: string | null
          reference_number: string | null
          refund_amount: number | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          applied_to_invoice_id?: string | null
          created_at?: string | null
          customer_human_id: string
          customer_id?: string | null
          fees?: number | null
          id?: string
          invoice_no: string
          notes?: string | null
          overpayment_amount?: number | null
          payment_date?: string
          payment_gateway?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_number: string
          payment_status?: string | null
          received_by?: string | null
          reference_number?: string | null
          refund_amount?: number | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          applied_to_invoice_id?: string | null
          created_at?: string | null
          customer_human_id?: string
          customer_id?: string | null
          fees?: number | null
          id?: string
          invoice_no?: string
          notes?: string | null
          overpayment_amount?: number | null
          payment_date?: string
          payment_gateway?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_number?: string
          payment_status?: string | null
          received_by?: string | null
          reference_number?: string | null
          refund_amount?: number | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_customer_human_id"
            columns: ["customer_human_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["human_id"]
          },
          {
            foreignKeyName: "fk_payments_invoice_no"
            columns: ["invoice_no"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["invoiceNo"]
          },
          {
            foreignKeyName: "payments_applied_to_invoice_id_fkey"
            columns: ["applied_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          module: string
          name: string
          resource: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          module: string
          name: string
          resource?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          module?: string
          name?: string
          resource?: string | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          basePrice: number | null
          created_at: string | null
          createdAt: Json | null
          id: string
          meta: Json | null
          ruleType: string | null
          service_id: string | null
          unit: string | null
          updated_at: string | null
          updatedAt: Json | null
        }
        Insert: {
          basePrice?: number | null
          created_at?: string | null
          createdAt?: Json | null
          id?: string
          meta?: Json | null
          ruleType?: string | null
          service_id?: string | null
          unit?: string | null
          updated_at?: string | null
          updatedAt?: Json | null
        }
        Update: {
          basePrice?: number | null
          created_at?: string | null
          createdAt?: Json | null
          id?: string
          meta?: Json | null
          ruleType?: string | null
          service_id?: string | null
          unit?: string | null
          updated_at?: string | null
          updatedAt?: Json | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          quote_number: string
          raw_data: Json | null
          service_id: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          quote_number: string
          raw_data?: Json | null
          service_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          quote_number?: string
          raw_data?: Json | null
          service_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      recurring_invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          end_date: string | null
          frequency: string
          id: string
          interval_count: number | null
          is_active: boolean | null
          max_occurrences: number | null
          next_generation_date: string
          start_date: string
          template_invoice_id: string | null
          total_generated: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          interval_count?: number | null
          is_active?: boolean | null
          max_occurrences?: number | null
          next_generation_date: string
          start_date: string
          template_invoice_id?: string | null
          total_generated?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval_count?: number | null
          is_active?: boolean | null
          max_occurrences?: number | null
          next_generation_date?: string
          start_date?: string
          template_invoice_id?: string | null
          total_generated?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "recurring_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_template_invoice_id_fkey"
            columns: ["template_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["primary_role_id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string | null
          createdAt: Json | null
          description: string | null
          id: string
          imageUrl: string | null
          isPopular: boolean | null
          options: Json | null
          slug: string | null
          sortOrder: number | null
          specSchema: Json | null
          title: string | null
          updated_at: string | null
          updatedAt: Json | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          createdAt?: Json | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          isPopular?: boolean | null
          options?: Json | null
          slug?: string | null
          sortOrder?: number | null
          specSchema?: Json | null
          title?: string | null
          updated_at?: string | null
          updatedAt?: Json | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          createdAt?: Json | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          isPopular?: boolean | null
          options?: Json | null
          slug?: string | null
          sortOrder?: number | null
          specSchema?: Json | null
          title?: string | null
          updated_at?: string | null
          updatedAt?: Json | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          accent: string | null
          address: string | null
          appName: string | null
          background: string | null
          company_name: string | null
          created_at: string | null
          defaultRate: number | null
          email: string | null
          emailNotifications: boolean | null
          heroImageUrl: string | null
          heroSubtitle: string | null
          heroTitle: string | null
          id: string
          logo_url: string | null
          phone: string | null
          primary: string | null
          smsNotifications: boolean | null
          taxRate: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accent?: string | null
          address?: string | null
          appName?: string | null
          background?: string | null
          company_name?: string | null
          created_at?: string | null
          defaultRate?: number | null
          email?: string | null
          emailNotifications?: boolean | null
          heroImageUrl?: string | null
          heroSubtitle?: string | null
          heroTitle?: string | null
          id: string
          logo_url?: string | null
          phone?: string | null
          primary?: string | null
          smsNotifications?: boolean | null
          taxRate?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accent?: string | null
          address?: string | null
          appName?: string | null
          background?: string | null
          company_name?: string | null
          created_at?: string | null
          defaultRate?: number | null
          email?: string | null
          emailNotifications?: boolean | null
          heroImageUrl?: string | null
          heroSubtitle?: string | null
          heroTitle?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary?: string | null
          smsNotifications?: boolean | null
          taxRate?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      statement_settings: {
        Row: {
          auto_generate_monthly: boolean | null
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_phone: string | null
          created_at: string | null
          currency_symbol: string | null
          date_format: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          payment_instructions: string | null
          statement_due_days: number | null
          updated_at: string | null
        }
        Insert: {
          auto_generate_monthly?: boolean | null
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_phone?: string | null
          created_at?: string | null
          currency_symbol?: string | null
          date_format?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          payment_instructions?: string | null
          statement_due_days?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_generate_monthly?: boolean | null
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_phone?: string | null
          created_at?: string | null
          currency_symbol?: string | null
          date_format?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          payment_instructions?: string | null
          statement_due_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["primary_role_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "appUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_role_summary"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: never
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: never
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_view: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: never
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: never
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unified_user_roles: {
        Row: {
          created_at: string | null
          email: string | null
          human_id: string | null
          name: string | null
          primary_role: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          human_id?: string | null
          name?: string | null
          primary_role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          human_id?: string | null
          name?: string | null
          primary_role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_appusers_primary_role_name"
            columns: ["primary_role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      user_role_summary: {
        Row: {
          created_at: string | null
          email: string | null
          human_id: string | null
          id: string | null
          last_role_update: string | null
          name: string | null
          primary_role_description: string | null
          primary_role_id: string | null
          primary_role_name: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          total_permissions: number | null
          total_roles: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_appusers_primary_role_name"
            columns: ["primary_role_name"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
    }
    Functions: {
      firebase_id_to_uuid: {
        Args: { firebase_id: string }
        Returns: string
      }
      generate_number: {
        Args: { counter_name: string; prefix?: string; suffix?: string }
        Returns: string
      }
      generate_sequential_number: {
        Args: { counter_name: string; prefix?: string; year_prefix?: boolean }
        Returns: string
      }
      generate_tracking_url: {
        Args: { entity_id: string; entity_type: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_next_counter: {
        Args: { counter_name: string }
        Returns: number
      }
      get_profile_by_email: {
        Args: { user_email: string }
        Returns: {
          email: string
          id: string
          name: string
          role: string
        }[]
      }
      get_profile_by_id: {
        Args: { user_id: string }
        Returns: {
          email: string
          id: string
          name: string
          role: string
        }[]
      }
      get_role_hierarchy: {
        Args: Record<PropertyKey, never>
        Returns: {
          permission_count: number
          role_id: string
          role_name: string
          user_count: number
        }[]
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: string[]
      }
      get_user_primary_role: {
        Args: { user_id: string }
        Returns: {
          permissions: string[]
          role_description: string
          role_id: string
          role_name: string
        }[]
      }
      get_user_roles: {
        Args: { user_uuid: string }
        Returns: {
          role_display_name: string
          role_name: string
        }[]
      }
      increment_counter: {
        Args: { counter_name: string }
        Returns: number
      }
      link_profile_to_auth: {
        Args: { auth_user_id: string; profile_email: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { permission_name: string; user_uuid: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      user_is_admin_or_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      expense_category:
        | "materials"
        | "equipment"
        | "utilities"
        | "salaries"
        | "maintenance"
        | "transport"
        | "office"
        | "marketing"
        | "other"
      inventory_status:
        | "in_stock"
        | "low_stock"
        | "out_of_stock"
        | "ordered"
        | "discontinued"
      job_status_new:
        | "submitted"
        | "quoted"
        | "approved"
        | "in_production"
        | "quality_check"
        | "completed"
        | "delivered"
        | "cancelled"
        | "on_hold"
      job_type_enum:
        | "business_cards"
        | "flyers"
        | "banners"
        | "books"
        | "brochures"
        | "letterheads"
        | "calendars"
        | "stickers"
        | "certificates"
        | "other"
      notification_type:
        | "job_update"
        | "payment_due"
        | "delivery_ready"
        | "system_alert"
        | "promotion"
        | "reminder"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "mobile_money"
        | "card"
        | "cheque"
        | "credit"
      payment_status: "pending" | "partial" | "paid" | "overdue" | "cancelled"
      priority_level: "low" | "normal" | "high" | "urgent"
      user_role: "admin" | "staff" | "customer"
      user_status: "active" | "inactive" | "suspended" | "pending"
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
      expense_category: [
        "materials",
        "equipment",
        "utilities",
        "salaries",
        "maintenance",
        "transport",
        "office",
        "marketing",
        "other",
      ],
      inventory_status: [
        "in_stock",
        "low_stock",
        "out_of_stock",
        "ordered",
        "discontinued",
      ],
      job_status_new: [
        "submitted",
        "quoted",
        "approved",
        "in_production",
        "quality_check",
        "completed",
        "delivered",
        "cancelled",
        "on_hold",
      ],
      job_type_enum: [
        "business_cards",
        "flyers",
        "banners",
        "books",
        "brochures",
        "letterheads",
        "calendars",
        "stickers",
        "certificates",
        "other",
      ],
      notification_type: [
        "job_update",
        "payment_due",
        "delivery_ready",
        "system_alert",
        "promotion",
        "reminder",
      ],
      payment_method: [
        "cash",
        "bank_transfer",
        "mobile_money",
        "card",
        "cheque",
        "credit",
      ],
      payment_status: ["pending", "partial", "paid", "overdue", "cancelled"],
      priority_level: ["low", "normal", "high", "urgent"],
      user_role: ["admin", "staff", "customer"],
      user_status: ["active", "inactive", "suspended", "pending"],
    },
  },
} as const
