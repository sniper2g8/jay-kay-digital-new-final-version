// Updated Jobs table interface after cost consolidation migration
export interface JobsTable {
  Row: {
    title: string | null
    jobNo: string | null
    description: string | null
    quantity: number | null
    createdBy: string | null
    status: string | null
    invoiced: boolean | null
    submittedDate: string | null
    customerName: string | null
    serviceName: string | null
    invoiceNo: string | null
    __open: boolean | null
    id: string
    customer_id: string | null
    service_id: string | null
    invoice_id: string | null
    created_at: string | null
    updated_at: string | null
    qr_code: string | null
    tracking_url: string | null
    estimated_delivery: string | null
    actual_delivery: string | null
    assigned_to: string | null
    job_type: string | null
    priority: string | null
    unit_price: number | null
    estimate_price: number | null
    final_price: number | null
  }
  Insert: {
    title?: string | null
    jobNo?: string | null
    description?: string | null
    quantity?: number | null
    createdBy?: string | null
    status?: string | null
    invoiced?: boolean | null
    submittedDate?: string | null
    customerName?: string | null
    serviceName?: string | null
    invoiceNo?: string | null
    __open?: boolean | null
    id?: string
    customer_id?: string | null
    service_id?: string | null
    invoice_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    qr_code?: string | null
    tracking_url?: string | null
    estimated_delivery?: string | null
    actual_delivery?: string | null
    assigned_to?: string | null
    job_type?: string | null
    priority?: string | null
    unit_price?: number | null
    estimate_price?: number | null
    final_price?: number | null
  }
  Update: {
    title?: string | null
    jobNo?: string | null
    description?: string | null
    quantity?: number | null
    createdBy?: string | null
    status?: string | null
    invoiced?: boolean | null
    submittedDate?: string | null
    customerName?: string | null
    serviceName?: string | null
    invoiceNo?: string | null
    __open?: boolean | null
    id?: string
    customer_id?: string | null
    service_id?: string | null
    invoice_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    qr_code?: string | null
    tracking_url?: string | null
    estimated_delivery?: string | null
    actual_delivery?: string | null
    assigned_to?: string | null
    job_type?: string | null
    priority?: string | null
    unit_price?: number | null
    estimate_price?: number | null
    final_price?: number | null
  }
  Relationships: []
}