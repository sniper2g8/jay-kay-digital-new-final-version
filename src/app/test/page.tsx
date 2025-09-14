import DatabaseConnectionTest from '@/components/DatabaseConnectionTest';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Database Connection Test
          </h1>
          <p className="text-gray-600">
            Testing Supabase connectivity and resolving authentication issues
          </p>
        </div>
        
        <DatabaseConnectionTest />
      </div>
    </div>
  );
}
