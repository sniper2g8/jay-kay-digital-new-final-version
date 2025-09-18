/**
 * User Management Hooks
 * Handles user CRUD operations, password resets, and role management
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database-generated.types';

type User = Database['public']['Tables']['appUsers']['Row'];
type UserRole = Database['public']['Enums']['user_role'];
type UserStatus = Database['public']['Enums']['user_status'];

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  primary_role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  primary_role?: UserRole;
  status?: UserStatus;
}

export interface UserFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  primary_role: UserRole;
  status: UserStatus;
  password?: string;
  confirmPassword?: string;
}

/**
 * Hook to fetch all users with real-time updates
 */
export function useAllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('appUsers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appUsers' 
        }, 
        () => {
          fetchUsers(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers
  };
}

/**
 * Create a new user with authentication and profile
 */
export async function createUser(userData: CreateUserData): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phone || '',
          address: userData.address || ''
        }
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    // Generate human_id
    const humanId = await generateHumanId();

    // Create user profile in appUsers table
    const { error: profileError } = await supabase
      .from('appUsers')
      .insert({
        id: authData.user.id,
        human_id: humanId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        address: userData.address || null,
        primary_role: userData.primary_role,
        status: userData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Try to clean up auth user if profile creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      return { success: false, error: 'Failed to create user profile' };
    }

    // Create default notification preferences
    await supabase
      .from('notification_preferences')
      .insert({
        id: crypto.randomUUID(),
        user_id: authData.user.id,
        email_notifications: true,
        sms_notifications: false,
        job_status_updates: true,
        delivery_updates: true,
        promotional_messages: false,
        created_at: new Date().toISOString()
      });

    return { success: true, userId: authData.user.id };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Update an existing user
 */
export async function updateUser(userId: string, userData: UpdateUserData): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user profile in appUsers table
    const { error: profileError } = await supabase
      .from('appUsers')
      .update({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        address: userData.address || null,
        primary_role: userData.primary_role,
        status: userData.status,
        updated_at: new Date().toISOString(),
        last_role_update: userData.primary_role ? new Date().toISOString() : undefined
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return { success: false, error: 'Failed to update user profile' };
    }

    // Update auth user email if changed
    if (userData.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: userData.email,
        user_metadata: {
          name: userData.name,
          phone: userData.phone || '',
          address: userData.address || ''
        }
      });

      if (authError) {
        console.error('Auth update error:', authError);
        // Don't fail the operation for auth update errors
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Delete a user (soft delete by setting status to inactive)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Soft delete by setting status to inactive
    const { error: profileError } = await supabase
      .from('appUsers')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('User deletion error:', profileError);
      return { success: false, error: 'Failed to delete user' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }

    // Log the password reset action
    await supabase
      .from('appUsers')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Toggle user status (active/inactive)
 */
export async function toggleUserStatus(userId: string, currentStatus: UserStatus): Promise<{ success: boolean; error?: string }> {
  try {
    const newStatus: UserStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const { error } = await supabase
      .from('appUsers')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Status toggle error:', error);
      return { success: false, error: 'Failed to update user status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('appUsers')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get user error:', error);
      return { success: false, error: 'User not found' };
    }

    return { success: true, user: data };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get all users with optional filters
 */
export async function getUsers(filters?: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}): Promise<{ success: boolean; users?: User[]; error?: string }> {
  try {
    let query = supabase
      .from('appUsers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.role) {
      query = query.eq('primary_role', filters.role);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,human_id.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get users error:', error);
      return { success: false, error: 'Failed to fetch users' };
    }

    return { success: true, users: data || [] };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Generate unique human-readable ID
 */
async function generateHumanId(): Promise<string> {
  const prefix = 'USR';
  const year = new Date().getFullYear();
  
  try {
    // Get the latest user ID for this year
    const { data: latestUser, error } = await supabase
      .from('appUsers')
      .select('human_id')
      .like('human_id', `${prefix}-${year}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching latest user:', error);
    }

    let nextNumber = 1;
    if (latestUser?.human_id) {
      const match = latestUser.human_id.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating human ID:', error);
    // Fallback to timestamp-based ID
    return `${prefix}-${year}-${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Validate user data
 */
export function validateUserData(userData: Partial<UserFormData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!userData.name?.trim()) {
    errors.push('Name is required');
  }

  if (!userData.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Invalid email format');
  }

  if (!userData.primary_role) {
    errors.push('Role is required');
  }

  if (userData.password && userData.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (userData.password && userData.confirmPassword && userData.password !== userData.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (userData.phone && !/^\+?[\d\s\-\(\)]+$/.test(userData.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if email is already in use
 */
export async function checkEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('appUsers')
      .select('id')
      .eq('email', email);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data } = await query.single();
    return !!data;
  } catch (error) {
    return false; // Assume email doesn't exist if query fails
  }
}

/**
 * Generate a random secure password
 */
export const generateRandomPassword = (): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly (12 total characters)
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};