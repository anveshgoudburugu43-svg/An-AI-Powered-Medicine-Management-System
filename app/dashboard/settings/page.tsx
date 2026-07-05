'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Shield, Settings as SettingsIcon, ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react';
import Link from 'next/link';
import LottieAnimation from '@/components/LottieAnimation';
import siteCustomizationAnimation from '@/lotties/Site customization, technical works.json';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'Manager' | 'Pharmacist' | 'User';
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ role: string; is_admin: boolean }>({ role: 'User', is_admin: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 403) {
        // User doesn't have admin permissions
        console.error('Access denied');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (user: User) => {
    setEditingId(user.id);
    setEditForm({
      role: user.role,
      is_admin: user.is_admin
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/users/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(user =>
          user.id === editingId ? updatedUser : user
        ));
        setEditingId(null);
        setEditForm({ role: 'User', is_admin: false });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    const colors = {
      Manager: 'bg-blue-500/20 text-blue-400',
      Pharmacist: 'bg-green-500/20 text-green-400',
      User: 'bg-gray-500/20 text-gray-400'
    };

    return (
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded text-xs ${colors[role as keyof typeof colors]}`}>
          {role.toUpperCase()}
        </span>
        {isAdmin && (
          <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
            ADMIN
          </span>
        )}
      </div>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Check if current user is manager (admin)
  const isCurrentUserManager = (session?.user as any)?.is_admin || (session?.user as any)?.role === 'Manager';

  if (!isCurrentUserManager) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-white text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">You need Manager privileges to access this page.</p>
          <Link href="/dashboard" className="text-[#41cbe2] hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#0a0d12] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a5568]"></div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="bg-[rgba(12,16,21,0.8)] backdrop-blur-sm border-b border-[rgba(255,255,255,0.04)] px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors duration-200">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-white text-xl font-semibold flex items-center space-x-2">
              <SettingsIcon size={24} />
              <span>Settings</span>
            </h1>
          </div>
          <div className="text-[rgba(255,255,255,0.6)] text-sm">
            Admin Panel
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Lottie Animation Section */}
        <div className="bg-[#171f34] rounded-lg border border-[rgba(255,255,255,0.2)] p-6 mb-6">
          <div className="flex items-center justify-center">
            <LottieAnimation 
              animationData={siteCustomizationAnimation}
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] rounded-xl border border-[rgba(255,255,255,0.04)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-lg font-semibold flex items-center space-x-2">
              <Users size={20} />
              <span>User Management</span>
            </h2>
            <div className="text-[rgba(255,255,255,0.6)] text-sm">
              {filteredUsers.length} users
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
            >
              <option value="" className="text-black">All Roles</option>
              <option value="Manager" className="text-black">Manager</option>
              <option value="Pharmacist" className="text-black">Pharmacist</option>
              <option value="User" className="text-black">User</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.04)]">
                  <th className="text-left text-[rgba(255,255,255,0.4)] font-medium py-3 px-4">User</th>
                  <th className="text-left text-[rgba(255,255,255,0.4)] font-medium py-3 px-4">Role</th>
                  <th className="text-left text-[rgba(255,255,255,0.4)] font-medium py-3 px-4">Joined</th>
                  <th className="text-right text-[rgba(255,255,255,0.4)] font-medium py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isEditing = editingId === user.id;
                  const isCurrentUser = user.email === session?.user?.email;

                  return (
                    <tr key={user.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-200">
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-white font-medium">
                            {user.full_name || user.email}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-blue-300">(You)</span>
                            )}
                          </div>
                          <div className="text-[rgba(255,255,255,0.4)] text-sm">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-white text-sm focus:border-[#4a5568] focus:outline-none"
                            >
                              <option value="User" className="text-black">User</option>
                              <option value="Pharmacist" className="text-black">Pharmacist</option>
                              <option value="Manager" className="text-black">Manager</option>
                            </select>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={editForm.is_admin}
                                onChange={(e) => setEditForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                                className="rounded bg-[rgba(255,255,255,0.04)] border-gray-600"
                              />
                              <span className="text-white text-sm">Admin privileges</span>
                            </label>
                          </div>
                        ) : (
                          getRoleBadge(user.role, user.is_admin)
                        )}
                      </td>
                      <td className="py-4 px-4 text-[rgba(255,255,255,0.4)] text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="text-green-400 hover:text-green-300 transition-colors"
                                title="Save changes"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditForm({ role: 'User', is_admin: false });
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(user)}
                                className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                title="Edit user"
                              >
                                <Edit size={16} />
                              </button>
                              {!isCurrentUser && (
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto text-gray-500 mb-2" size={32} />
              <p className="text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}