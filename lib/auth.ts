import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from './supabase';

export type UserRole = 'Manager' | 'Pharmacist' | 'User';

export interface UserWithRole {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_admin: boolean;
}

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const session = await getServerSession(authOptions);
  
  console.log('getCurrentUser - Session:', !!session, session?.user?.email);
  
  if (!session?.user?.email) {
    console.log('getCurrentUser - No session or email');
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, is_admin')
    .eq('email', session.user.email)
    .single();

  console.log('getCurrentUser - Database query result:', { user, error });

  if (error || !user) {
    console.log('getCurrentUser - Error or no user found');
    return null;
  }

  return user as UserWithRole;
}

export async function checkUserRole(requiredRole: UserRole | UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }

  // Manager can access everything
  if (user.is_admin || user.role === 'Manager') {
    return true;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

export async function requireAuth(requiredRole?: UserRole | UserRole[]) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  if (requiredRole && !await checkUserRole(requiredRole)) {
    throw new Error('Insufficient permissions');
  }

  return user;
}

export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

export async function updateUserRole(userId: string, role: UserRole, isAdmin: boolean = false): Promise<boolean> {
  const currentUser = await getCurrentUser();
  
  if (!currentUser?.is_admin && currentUser?.role !== 'Manager') {
    throw new Error('Only managers can update user roles');
  }

  const { error } = await supabase
    .from('users')
    .update({ role, is_admin: isAdmin })
    .eq('id', userId);

  return !error;
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'User': 1,
  'Pharmacist': 2,
  'Manager': 3
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}