import SupabaseConnectionTest from '@/components/SupabaseConnectionTest';

export default function ConnectionTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      <SupabaseConnectionTest />
    </div>
  );
}
