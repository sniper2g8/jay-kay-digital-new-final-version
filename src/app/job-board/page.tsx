'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  RefreshCw,
  Users,
  Timer,
  TrendingUp
} from "lucide-react";
import { supabase } from '@/lib/supabase';

interface JobBoardData {
  id: string;
  job_number: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string | null;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
}

interface WaitingAreaStats {
  total_jobs: number;
  in_progress: number;
  pending: number;
  completed_today: number;
  average_wait_time: string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'in_progress': return <Printer className="h-4 w-4" />;
    case 'review': return <AlertCircle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'normal': case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function JobBoard() {
  return <JobBoardContent />;
}

function JobBoardContent() {
  const [jobs, setJobs] = useState<JobBoardData[]>([]);
  const [stats, setStats] = useState<WaitingAreaStats>({
    total_jobs: 0,
    in_progress: 0,
    pending: 0,
    completed_today: 0,
    average_wait_time: '0 hours'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchJobBoardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Debug environment variables on first run
      if (typeof window !== 'undefined') {
        console.log('🔧 Job Board Debug Info:', {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
          timestamp: new Date().toISOString()
        });
      }

      // Fetch jobs with customer information
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          jobNo,
          title,
          status,
          priority,
          created_at,
          updated_at
        `)
        .in('status', ['pending', 'completed', 'Completed', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (jobsError) {
        console.error('Supabase query error:', jobsError);
        throw jobsError;
      }

      // Transform data for display (no customer information for privacy)
      const transformedJobs: JobBoardData[] = (jobsData || []).map(job => ({
        id: job.id,
        job_number: job.jobNo || 'N/A',
        title: job.title || 'Print Job',
        status: job.status || 'pending',
        priority: job.priority || 'medium',
        due_date: null, // Due date not available in this format
        created_at: job.created_at || '',
        updated_at: job.updated_at || '',
        estimated_completion: estimateCompletion(job.status || 'pending', job.created_at || '')
      }));

      setJobs(transformedJobs);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const totalJobs = transformedJobs.length;
      const inProgress = transformedJobs.filter(j => j.status === 'in_progress').length;
      const pending = transformedJobs.filter(j => j.status === 'pending').length;
      
      // Get completed jobs today
      const { count: completedToday } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', today);

      setStats({
        total_jobs: totalJobs,
        in_progress: inProgress,
        pending: pending,
        completed_today: completedToday || 0,
        average_wait_time: calculateAverageWaitTime(transformedJobs)
      });

      setLastUpdated(new Date());
    } catch (error) {
      // Comprehensive error logging for debugging
      console.group('🔴 Job Board Data Fetch Error');
      console.error('Raw error object:', error);
      
      // Try different ways to extract error information
      const errorDetails = {
        message: 'Unknown error',
        code: undefined as string | undefined,
        details: undefined as string | undefined,
        hint: undefined as string | undefined,
        name: undefined as string | undefined,
        stack: undefined as string | undefined
      };

      if (error instanceof Error) {
        errorDetails.message = error.message;
        errorDetails.name = error.name;
        errorDetails.stack = error.stack;
      } else if (error && typeof error === 'object') {
        // Handle Supabase-specific error format
        const supabaseError = error as Record<string, unknown>;
        errorDetails.message = (typeof supabaseError.message === 'string' ? supabaseError.message : String(error));
        errorDetails.code = (typeof supabaseError.code === 'string' ? supabaseError.code : undefined);
        errorDetails.details = (typeof supabaseError.details === 'string' ? supabaseError.details : undefined);
        errorDetails.hint = (typeof supabaseError.hint === 'string' ? supabaseError.hint : undefined);
      } else {
        errorDetails.message = String(error);
      }

      console.error('Parsed error details:', errorDetails);
      
      // Environment check
      console.error('Environment check:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      // Check if it's an RLS (Row Level Security) error
      if (errorDetails.code === '42501' || errorDetails.message?.includes('permission') || errorDetails.message?.includes('policy')) {
        console.error('🔒 This appears to be a Row Level Security (RLS) policy error');
        console.error('💡 The job board might need anonymous access or public read permissions');
      }

      // Check if it's a network/connection error
      if (errorDetails.message?.includes('fetch') || errorDetails.message?.includes('network')) {
        console.error('🌐 This appears to be a network connectivity error');
      }

      console.groupEnd();
      
      // Set empty state with user-friendly message
      setJobs([]);
      setStats({
        total_jobs: 0,
        in_progress: 0,
        pending: 0,
        completed_today: 0,
        average_wait_time: '0 mins'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const estimateCompletion = (status: string, createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

    switch (status) {
      case 'pending':
        return `~${2 - Math.min(hoursSinceCreated, 2)} hours to start`;
      case 'in_progress':
        return `~${4 - Math.min(hoursSinceCreated, 4)} hours to complete`;
      case 'review':
        return `~1 hour for review`;
      case 'completed':
        return 'Ready for pickup';
      default:
        return 'TBD';
    }
  };

  const calculateAverageWaitTime = (jobs: JobBoardData[]): string => {
    const activeJobs = jobs.filter(j => ['pending', 'in_progress'].includes(j.status));
    if (activeJobs.length === 0) return '0 hours';

    const totalHours = activeJobs.reduce((sum, job) => {
      const created = new Date(job.created_at);
      const now = new Date();
      return sum + Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    }, 0);

    const averageHours = Math.floor(totalHours / activeJobs.length);
    return `${averageHours} hours`;
  };

  useEffect(() => {
    fetchJobBoardData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchJobBoardData, 30000);

    // Set up Supabase real-time subscription for instant updates
    const subscription = supabase
      .channel('job-board-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs'
      }, () => {
        fetchJobBoardData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [fetchJobBoardData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jay Kay Digital Press</h1>
            <p className="text-gray-600 mt-1">Public Job Status Board</p>
            <p className="text-sm text-gray-500 mt-1">Check your job number for status updates</p>
          </div>
          <div className="text-right">
            <Button 
              onClick={fetchJobBoardData} 
              disabled={isLoading}
              className="mb-2"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_jobs}</div>
            <p className="text-xs text-muted-foreground">Active jobs in queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Printer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
            <p className="text-xs text-muted-foreground">Currently printing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed_today}</div>
            <p className="text-xs text-muted-foreground">Jobs finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Average Wait Time Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center space-x-4">
          <Timer className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-medium text-blue-900">
            Average Wait Time: {stats.average_wait_time}
          </span>
        </div>
      </div>

      {/* Job Status Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* In Progress Jobs */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center space-x-2">
              <Printer className="h-5 w-5 text-blue-600" />
              <span>In Progress ({jobs.filter(j => j.status === 'in_progress').length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {jobs.filter(j => j.status === 'in_progress').map(job => (
              <JobCard key={job.id} job={job} showEstimate />
            ))}
            {jobs.filter(j => j.status === 'in_progress').length === 0 && (
              <p className="text-center text-gray-500 py-4">No jobs in progress</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Jobs */}
        <Card className="border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span>Waiting Queue ({jobs.filter(j => j.status === 'pending').length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {jobs.filter(j => j.status === 'pending').map(job => (
              <JobCard key={job.id} job={job} showEstimate />
            ))}
            {jobs.filter(j => j.status === 'pending').length === 0 && (
              <p className="text-center text-gray-500 py-4">No jobs waiting</p>
            )}
          </CardContent>
        </Card>

        {/* Recently Completed */}
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Recently Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {jobs.filter(j => j.status === 'completed').slice(0, 5).map(job => (
              <JobCard key={job.id} job={job} showPickup />
            ))}
            {jobs.filter(j => j.status === 'completed').length === 0 && (
              <p className="text-center text-gray-500 py-4">No recent completions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Updates automatically every 30 seconds | For assistance, contact our team</p>
        <p className="mt-1 text-xs">Only job numbers are displayed for privacy protection</p>
      </div>
    </div>
  );
}

interface JobCardProps {
  job: JobBoardData;
  showEstimate?: boolean;
  showPickup?: boolean;
}

function JobCard({ job, showEstimate = false, showPickup = false }: JobCardProps) {
  return (
    <div className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">{job.job_number}</span>
            <Badge className={getPriorityColor(job.priority)} variant="outline">
              {job.priority}
            </Badge>
          </div>
          <h4 className="font-medium text-gray-900 text-sm mb-1">{job.title}</h4>
          <p className="text-xs text-gray-500">Print Job</p>
        </div>
        <Badge className={getStatusColor(job.status)}>
          <div className="flex items-center space-x-1">
            {getStatusIcon(job.status)}
            <span className="text-xs">{job.status.replace('_', ' ')}</span>
          </div>
        </Badge>
      </div>

      {showEstimate && job.estimated_completion && (
        <div className="flex items-center space-x-1 text-xs text-blue-600 mt-2">
          <Timer className="h-3 w-3" />
          <span>{job.estimated_completion}</span>
        </div>
      )}

      {showPickup && (
        <div className="flex items-center space-x-1 text-xs text-green-600 mt-2">
          <CheckCircle className="h-3 w-3" />
          <span>Ready for pickup</span>
        </div>
      )}

      <div className="text-xs text-gray-400 mt-1">
        Created: {new Date(job.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}