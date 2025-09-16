'use client';

import React, { useState } from 'react';
import { FileUploadComponent } from '@/components/FileUploadComponent';
import { JobFilesViewer } from '@/components/JobFilesViewer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TestFileUploadPage() {
  const [testJobId, setTestJobId] = useState('550e8400-e29b-41d4-a716-446655440000'); // Valid UUID format
  const [uploadKey, setUploadKey] = useState(0); // Key to force re-render of FileUploadComponent
  const { user, loading } = useAuth();

  const handleUploadComplete = (files: File[]) => {
    console.log('📤 Upload completed for files:', files.map(f => f.name));
    toast.success(`Successfully uploaded ${files.length} file(s)`);
    
    // Force refresh of the file viewer by incrementing the key
    setUploadKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold text-center">File Upload System Test</h1>
        <p className="text-gray-600 text-center max-w-2xl">
          Test the file upload and viewing system for jobs. Files will be stored in Supabase storage 
          and tracked in the database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">✅ Authenticated as: {user.email}</p>
              <p className="text-sm text-gray-600">User ID: {user.id}</p>
              <p className="text-sm text-blue-600">Ready to test file uploads!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You must be logged in to test file uploads. Please use the test credentials below.
                </AlertDescription>
              </Alert>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-800 mb-2">Test Credentials:</p>
                <p className="text-sm text-blue-700">Email: testuser@confirmed.com</p>
                <p className="text-sm text-blue-700">Password: TestPassword123!</p>
              </div>
              <div className="flex gap-2">
                <Link href="/auth/login">
                  <Button>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="outline">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="jobId">Job ID for Testing (UUID format required)</Label>
              <Input
                id="jobId"
                value={testJobId}
                onChange={(e) => setTestJobId(e.target.value)}
                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                className="max-w-md font-mono text-sm"
                disabled={!user}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be a valid UUID format. Use the default or generate a new UUID.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTestJobId('550e8400-e29b-41d4-a716-446655440000')}
                disabled={!user}
              >
                Reset to Default
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Generate a simple UUID v4
                  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                  });
                  setTestJobId(uuid);
                }}
                disabled={!user}
              >
                Generate New UUID
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <FileUploadComponent 
                key={uploadKey} // Force re-render after uploads
                showUploadButton={true}
                jobId={testJobId}
                onUploadComplete={handleUploadComplete}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Please log in to test file uploads</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Viewer Section */}
        <Card>
          <CardHeader>
            <CardTitle>View Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <JobFilesViewer key={uploadKey} jobId={testJobId} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Please log in to view uploaded files</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800">Step 1: Set Job ID</h4>
              <p>Enter a valid UUID format job ID above (or use the default/generate a new one)</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Step 2: Select Files</h4>
              <p>Use the upload component on the left to select files (max 10MB each)</p>
              <p className="text-xs text-blue-600">
                • Click &quot;Choose Files&quot; button to browse files<br/>
                • Or drag and drop files directly onto the upload area<br/>
                • Supported: PDF, Images (JPG, PNG, GIF), Word docs, Text files
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Step 3: Upload Files</h4>
              <p>Click the &quot;Upload Files&quot; button to start the upload process</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Step 4: View Files</h4>
              <p>The files viewer on the right will automatically refresh to show uploaded files</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Step 5: Test Actions</h4>
              <p>Try downloading and deleting files to test the complete workflow</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
              <h4 className="font-semibold text-green-800">✅ Fixed Issues:</h4>
              <ul className="text-green-700 text-xs space-y-1 mt-1">
                <li>• Choose file button now works properly</li>
                <li>• Drag and drop functionality added</li>
                <li>• File validation with toast notifications</li>
                <li>• Better error handling and user feedback</li>
                <li>• UUID format validation for job IDs</li>
                <li>• Upload button now appears when files are selected</li>
                <li>• Progress bars show upload status</li>
              </ul>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-800">Important Note:</h4>
              <p className="text-yellow-700">The database expects UUID format for job IDs. Use the buttons above to ensure proper formatting.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}