export interface Database {
  public: {
    Tables: {
      appUsers: {
        Row: {
          id: string;
          human_id: string; // JKDP-ADM-001 format
          name: string;
          email: string;
          primary_role:
            | "super_admin"
            | "admin"
            | "manager"
            | "staff"
            | "customer";
          status: "active" | "inactive" | "suspended";
          created_at: string;
          updated_at: string;
          profile_image_url?: string;
          phone?: string;
          address?: string;
          notes?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          human_id: string; // JKDP-CUS-001 format
          business_name: string;
          contact_person?: string;
          email?: string;
          phone?: string;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
          notes?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          payment_number: string; // PAY-2025-0001 format
          human_id: string; // FK to customers.human_id (JKDP-CUS-001)
          invoice_no: string; // FK to invoices.invoice_no (JKDP-INV-0001)
          amount: number;
          payment_method:
            | "cash"
            | "credit_card"
            | "bank_transfer"
            | "check"
            | "mobile_money";
          payment_date: string;
          reference_number?: string;
          notes?: string;
          received_by?: string;
          status: "pending" | "completed" | "failed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_no: string; // JKDP-INV-0001 format
          human_id: string; // FK to customers.human_id
          job_number?: string; // FK to jobs.job_number
          amount: number;
          subtotal?: number;
          tax?: number;
          taxRate?: number;
          discount?: number;
          currency: string;
          status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
          payment_status: "pending" | "partial" | "paid" | "overdue";
          issue_date: string;
          due_date: string;
          paid_date?: string;
          notes?: string;
          items?: unknown; // JSON array of line items (deprecated - use invoice_items table)
          created_at: string;
          updated_at: string;
        };
      };
      invoice_items: {
        Row: {
          id: number;
          invoice_id: string; // FK to invoices.id
          description: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          job_id?: string; // FK to jobs.id
          job_no?: string; // FK to jobs.job_number
          notes?: string;
          created_at: string;
          updated_at: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          job_number: string; // JKDP-JOB-2024-001 format
          human_id: string; // FK to customers.human_id
          title: string;
          description?: string;
          status:
            | "pending"
            | "in_progress"
            | "review"
            | "completed"
            | "cancelled"
            | "on_hold"
            | "quote_sent";
          priority: "low" | "medium" | "high" | "urgent";
          quantity?: number;
          unit_price?: number;
          total_amount?: number;
          order_date?: string;
          due_date?: string;
          assigned_to?: string;
          print_method?: string;
          paper_type?: string;
          finishing?: string;
          requirements?: string;
          created_at: string;
          updated_at: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description?: string;
          level: number;
          permissions?: string[];
          created_at: string;
          updated_at: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          name: string;
          description?: string;
          resource: string;
          action: string;
          created_at: string;
          updated_at: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string;
          assigned_at: string;
          created_at: string;
          updated_at: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description?: string;
          base_price?: number;
          category?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          item_name: string;
          sku?: string;
          category?: string;
          quantity: number;
          unit_price?: number;
          supplier?: string;
          low_stock_threshold?: number;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Views: {
      unified_user_roles: {
        Row: {
          user_id: string;
          user_name: string;
          user_email: string;
          user_human_id: string;
          role_name: string;
          role_level: number;
          assigned_at: string;
        };
      };
    };
  };
}

// Export individual table types for easier use
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type AppUser = Database["public"]["Tables"]["appUsers"]["Row"];
export type Role = Database["public"]["Tables"]["roles"]["Row"];
export type Permission = Database["public"]["Tables"]["permissions"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Inventory = Database["public"]["Tables"]["inventory"]["Row"];
