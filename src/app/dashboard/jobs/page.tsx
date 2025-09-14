import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Filter,
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Printer
} from "lucide-react";
import Link from "next/link";

// Mock data showcasing human-readable IDs and relationships
const mockJobs = [
  {
    job_number: "JKDP-JOB-2024-001",
    customer_human_id: "JKDP-CUS-001",
    customer_name: "ABC Marketing Solutions", 
    job_title: "Business Cards - Premium",
    description: "500 premium business cards with UV coating",
    status: "in_progress",
    priority: "high",
    quantity: 500,
    unit_price: 1.20,
    total_amount: 600.00,
    order_date: "2024-01-10",
    due_date: "2024-01-15", 
    assigned_to: "John Smith",
    print_method: "Digital",
    paper_type: "Premium Cardstock",
    finishing: "UV Coating"
  },
  {
    job_number: "JKDP-JOB-2024-002", 
    customer_human_id: "JKDP-CUS-002",
    customer_name: "TechStart Inc",
    job_title: "Company Brochures",
    description: "200 tri-fold brochures for tech conference",
    status: "pending",
    priority: "medium",
    quantity: 200,
    unit_price: 3.50,
    total_amount: 700.00,
    order_date: "2024-01-08",
    due_date: "2024-01-18",
    assigned_to: "Sarah Johnson", 
    print_method: "Offset",
    paper_type: "Glossy",
    finishing: "Folding"
  },
  {
    job_number: "JKDP-JOB-2024-003",
    customer_human_id: "JKDP-CUS-003", 
    customer_name: "Local Restaurant Group",
    job_title: "Menu Printing",
    description: "100 laminated menus for 3 restaurant locations",
    status: "completed",
    priority: "low",
    quantity: 100,
    unit_price: 8.50,
    total_amount: 850.00,
    order_date: "2024-01-05",
    due_date: "2024-01-12",
    assigned_to: "Mike Chen",
    print_method: "Digital",
    paper_type: "Heavy Weight",
    finishing: "Lamination"
  },
  {
    job_number: "JKDP-JOB-2024-004",
    customer_human_id: "JKDP-CUS-001",
    customer_name: "ABC Marketing Solutions",
    job_title: "Flyer Campaign",
    description: "1000 promotional flyers for new product launch",
    status: "quote_sent",
    priority: "medium", 
    quantity: 1000,
    unit_price: 0.45,
    total_amount: 450.00,
    order_date: "2024-01-12",
    due_date: "2024-01-20",
    assigned_to: "Emma Davis",
    print_method: "Digital",
    paper_type: "Standard",
    finishing: "None"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-green-100 text-green-800";
    case "in_progress": return "bg-blue-100 text-blue-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "quote_sent": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-red-100 text-red-800";
    case "medium": return "bg-yellow-100 text-yellow-800"; 
    case "low": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="h-4 w-4" />;
    case "in_progress": return <Clock className="h-4 w-4" />;
    case "pending": return <AlertCircle className="h-4 w-4" />;
    case "quote_sent": return <FileText className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600">Track and manage all printing jobs from quote to delivery</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search jobs by number, customer, or description..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                1 completed, 3 active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Currently being worked on
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,600</div>
              <p className="text-xs text-muted-foreground">
                All active jobs
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$650</div>
              <p className="text-xs text-muted-foreground">
                Per job average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Job List */}
        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
            <CardDescription>Complete list of printing jobs with human-readable tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockJobs.map((job) => (
                <div key={job.job_number} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Printer className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{job.job_title}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(job.status)}
                            <span>{job.status.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(job.priority)}>
                          {job.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {job.job_number} • {job.customer_name}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {job.assigned_to}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due: {new Date(job.due_date).toLocaleDateString()}
                        </div>
                        <div>
                          Qty: {job.quantity.toLocaleString()}
                        </div>
                        <div>
                          {job.print_method} • {job.paper_type}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${job.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">${job.unit_price}/unit</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Human-Readable Query Examples */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Database Query Examples</CardTitle>
            <CardDescription>How to query job data using human-readable IDs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Example Queries:</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="text-blue-600">
                  {/* Get jobs for specific customer */}
                </div>
                <div>
                  supabase.from(&apos;jobs&apos;).select(&apos;*&apos;).eq(&apos;customer_human_id&apos;, &apos;JKDP-CUS-001&apos;)
                </div>
                <div className="text-blue-600 mt-3">
                  {/* Get specific job by job number */}
                </div>
                <div>
                  supabase.from(&apos;jobs&apos;).select(&apos;*&apos;).eq(&apos;job_number&apos;, &apos;JKDP-JOB-2024-001&apos;)
                </div>
                <div className="text-blue-600 mt-3">
                  {/* Get jobs by status */}
                </div>
                <div>
                  supabase.from(&apos;jobs&apos;).select(&apos;*&apos;).eq(&apos;status&apos;, &apos;in_progress&apos;)
                </div>
                <div className="text-blue-600 mt-3">
                  {/* Join with customer data */}
                </div>
                <div>
                  supabase.from(&apos;jobs&apos;).select(&apos;*, customers(business_name, contact_person)&apos;)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
