import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Modal from '../components/shared/Modal';
import Loader from '../components/shared/Loader';
import { User, UnmatchedTest, DashboardStats } from '../types';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} from '../services/auth';

const Admin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'unmatched' | 'settings'>(
    'users'
  );
  const [users, setUsers] = useState<User[]>([]);
  const [unmatchedTests, setUnmatchedTests] = useState<UnmatchedTest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // User Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'technician',
  });

  // Settings State
  const [monthlyTarget, setMonthlyTarget] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    target: 1500000000,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users') {
        const usersData = await getUsers();
        setUsers(usersData);
      } else if (activeTab === 'unmatched') {
        const [unmatchedData, statsData] = await Promise.all([
          api.get('/admin/unmatched-tests'),
          api.get('/admin/stats'),
        ]);
        setUnmatchedTests(unmatchedData.data);
        setStats(statsData.data);
      } else if (activeTab === 'settings') {
        const response = await api.get('/settings/monthly-target', {
          params: {
            month: monthlyTarget.month,
            year: monthlyTarget.year,
          },
        });
        setMonthlyTarget((prev) => ({ ...prev, target: response.data.target }));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        username: user.username,
        email: user.email || '',
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        username: '',
        email: '',
        password: '',
        role: 'technician',
      });
    }
    setUserModalOpen(true);
  };

  const handleUserSubmit = async () => {
    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, {
          email: userFormData.email,
          role: userFormData.role as any,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? updated : u))
        );
      } else {
        const newUser = await createUser(userFormData);
        setUsers((prev) => [...prev, newUser]);
      }
      setUserModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleResetPassword = async (id: number) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      await resetPassword(id, newPassword);
      alert('Password reset successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const updated = await updateUser(id, { is_active: !isActive });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (error) {
      console.error('Error toggling user active status:', error);
    }
  };

  const handleResolveUnmatched = async (id: number) => {
    try {
      await api.post(`/admin/unmatched-tests/${id}/resolve`);
      setUnmatchedTests((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error resolving unmatched test:', error);
    }
  };

  const handleSaveMonthlyTarget = async () => {
    try {
      await api.post('/settings/monthly-target', monthlyTarget);
      alert('Monthly target saved successfully');
    } catch (error) {
      console.error('Error saving monthly target:', error);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <Header title="Admin Panel" />

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-highlight">
                {stats.totalTests}
              </div>
              <div className="text-sm text-gray-400">Total Tests</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-success">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-warning">
                {stats.unmatchedTests}
              </div>
              <div className="text-sm text-gray-400">Unmatched Tests</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-danger">
                {stats.recentCancellations}
              </div>
              <div className="text-sm text-gray-400">Recent Cancellations</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-highlight text-white'
                : 'bg-secondary text-gray-400 hover:text-white'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('unmatched')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
              activeTab === 'unmatched'
                ? 'bg-highlight text-white'
                : 'bg-secondary text-gray-400 hover:text-white'
            }`}
          >
            Unmatched Tests
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-highlight text-white'
                : 'bg-secondary text-gray-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="card">
          {isLoading ? (
            <Loader />
          ) : (
            <>
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Users</h2>
                    {isAdmin && (
                      <button onClick={() => openUserModal()} className="btn-primary">
                        Add User
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="neon-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Last Login</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="font-medium">{user.username}</td>
                            <td>{user.email || 'N/A'}</td>
                            <td>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  user.role === 'admin'
                                    ? 'bg-danger/20 text-danger'
                                    : user.role === 'manager'
                                    ? 'bg-warning/20 text-warning'
                                    : 'bg-success/20 text-success'
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td>
                              {user.is_active ? (
                                <span className="text-success">Active</span>
                              ) : (
                                <span className="text-gray-500">Inactive</span>
                              )}
                            </td>
                            <td>
                              {user.last_login
                                ? new Date(user.last_login).toLocaleString()
                                : 'Never'}
                            </td>
                            <td className="text-center space-x-2">
                              <button
                                onClick={() => openUserModal(user)}
                                className="bg-highlight text-white px-3 py-1 rounded text-sm hover:opacity-80"
                              >
                                Edit
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleResetPassword(user.id)}
                                    className="bg-warning text-white px-3 py-1 rounded text-sm hover:opacity-80"
                                  >
                                    Reset Password
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleToggleActive(user.id, user.is_active)
                                    }
                                    className="bg-secondary text-white px-3 py-1 rounded text-sm hover:opacity-80"
                                  >
                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-danger text-white px-3 py-1 rounded text-sm hover:opacity-80"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Unmatched Tests Tab */}
              {activeTab === 'unmatched' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Unmatched Test Names
                  </h2>

                  {unmatchedTests.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      No unmatched tests found! All test names are properly configured.
                    </div>
                  ) : (
                    <>
                      <div className="bg-warning/20 border border-warning text-warning px-4 py-3 rounded mb-4">
                        <strong>Important:</strong> Copy test names exactly as shown
                        below when adding to the Meta Table. This ensures proper
                        matching with LabGuru data.
                      </div>

                      <div className="overflow-x-auto">
                        <table className="neon-table">
                          <thead>
                            <tr>
                              <th>Test Name</th>
                              <th>Source</th>
                              <th>First Seen</th>
                              <th>Occurrences</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unmatchedTests.map((test) => (
                              <tr key={test.id}>
                                <td className="font-mono font-bold text-highlight">
                                  {test.test_name}
                                </td>
                                <td>{test.source}</td>
                                <td>
                                  {new Date(test.first_seen).toLocaleDateString()}
                                </td>
                                <td>
                                  <span className="bg-danger/20 text-danger px-3 py-1 rounded-full text-sm font-semibold">
                                    {test.occurrence_count}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <button
                                    onClick={() => handleResolveUnmatched(test.id)}
                                    className="bg-success text-white px-3 py-1 rounded text-sm hover:opacity-80"
                                  >
                                    Mark as Resolved
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

                  <div className="max-w-2xl">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Monthly Revenue Target
                        </h3>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Month
                            </label>
                            <select
                              value={monthlyTarget.month}
                              onChange={(e) =>
                                setMonthlyTarget((prev) => ({
                                  ...prev,
                                  month: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            >
                              {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {new Date(2000, i).toLocaleString('default', {
                                    month: 'long',
                                  })}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Year
                            </label>
                            <input
                              type="number"
                              value={monthlyTarget.year}
                              onChange={(e) =>
                                setMonthlyTarget((prev) => ({
                                  ...prev,
                                  year: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Target (UGX)
                            </label>
                            <input
                              type="number"
                              value={monthlyTarget.target}
                              onChange={(e) =>
                                setMonthlyTarget((prev) => ({
                                  ...prev,
                                  target: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleSaveMonthlyTarget}
                          className="btn-primary"
                        >
                          Save Monthly Target
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* User Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={userFormData.username}
              onChange={(e) =>
                setUserFormData({ ...userFormData, username: e.target.value })
              }
              className="w-full"
              disabled={!!editingUser}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={userFormData.email}
              onChange={(e) =>
                setUserFormData({ ...userFormData, email: e.target.value })
              }
              className="w-full"
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={userFormData.password}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, password: e.target.value })
                }
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={userFormData.role}
              onChange={(e) =>
                setUserFormData({ ...userFormData, role: e.target.value })
              }
              className="w-full"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setUserModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleUserSubmit}
              className="btn-primary"
              disabled={
                !userFormData.username ||
                (!editingUser && !userFormData.password)
              }
            >
              {editingUser ? 'Update' : 'Create'} User
            </button>
          </div>
        </div>
      </Modal>

      <footer className="bg-primary/80 backdrop-blur-sm border-t border-highlight/20 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>&copy; 2025 Zyntel</p>
        </div>
      </footer>
    </div>
  );
};

export default Admin;