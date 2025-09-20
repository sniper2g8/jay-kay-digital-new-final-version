# Fix Notifications RLS Policies

## Problem
The notifications page is showing the error "Error fetching notifications: {}" because Row Level Security (RLS) is enabled on the notifications table, but there are no policies allowing users to access their own notifications.

## Solution
You need to add RLS policies to the notifications table that allow users to:
1. Read their own notifications
2. Insert notifications (typically done by the system)
3. Update their own notifications
4. Delete their own notifications

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Policies**
3. Find the `notifications` table in the list
4. Click on the table name to view existing policies
5. Click **"Add policy"** and add the following policies:

#### SELECT Policy (Read)
- **Name**: Users can read their own notifications
- **Operation**: SELECT
- **Using**: `(recipient_id = auth.uid())`

#### INSERT Policy (Create)
- **Name**: Users can insert notifications
- **Operation**: INSERT
- **With Check**: `(recipient_id = auth.uid() OR recipient_id IS NULL)`

#### UPDATE Policy (Update)
- **Name**: Users can update their own notifications
- **Operation**: UPDATE
- **Using**: `(recipient_id = auth.uid())`

#### DELETE Policy (Delete)
- **Name**: Users can delete their own notifications
- **Operation**: DELETE
- **Using**: `(recipient_id = auth.uid())`

### Option 2: Using SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL commands:

```sql
-- Create policy for SELECT - users can read their own notifications
CREATE POLICY "Users can read their own notifications" 
ON notifications 
FOR SELECT 
USING (recipient_id = auth.uid());

-- Create policy for INSERT - users can insert notifications (typically done by system)
CREATE POLICY "Users can insert notifications" 
ON notifications 
FOR INSERT 
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

-- Create policy for UPDATE - users can update their own notifications
CREATE POLICY "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
USING (recipient_id = auth.uid());

-- Create policy for DELETE - users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON notifications 
FOR DELETE 
USING (recipient_id = auth.uid());
```

## Verification

After applying the policies, you can verify they work by:

1. Going to your notifications page: `/dashboard/notifications`
2. The error should no longer appear
3. Users should be able to see their own notifications

## Additional Notes

- The `auth.uid()` function returns the ID of the currently authenticated user
- The policies ensure users can only access notifications where `recipient_id` matches their user ID
- The INSERT policy allows `recipient_id` to be NULL to support system-generated notifications

## Troubleshooting

If you still see permission errors:

1. Make sure RLS is enabled on the notifications table:
   ```sql
   ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
   ```

2. Check that the policies were created correctly:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notifications';
   ```

3. Ensure the `recipient_id` column exists and is properly populated in your notifications data