import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  is_active: boolean;
  last_login: string;
}

interface UnmatchedTest {
  id: number;
  test_name: string;
  source: string;
  first_seen: string;
  occurrence_count: number;
}

interface DashboardStats {
  totalTests: number;
  totalUsers: number;
  unmatchedTests: number;
  recentCancellations: number;
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'unmatched' | 'settings'>('users');
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
    role: 'technician' as 'admin' | 'manager' | 'technician' | 'viewer',
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
        // Mock data
        const mockUsers: User[] = [
          { id: 1, username: 'admin', email: 'admin@nhl.com', role: 'admin', is_active: true, last_login: '2025-01-15T10:30:00' },
          { id: 2, username: 'manager', email: 'manager@nhl.com', role: 'manager', is_active: true, last_login: '2025-01-14T15:45:00' },
          { id: 3, username: 'tech1', email: 'tech1@nhl.com', role: 'technician', is_active: true, last_login: '2025-01-15T08:20:00' },
          { id: 4, username: 'viewer1', email: 'viewer1@nhl.com', role: 'viewer', is_active: false, last_login: '2025-01-10T12:00:00' },
        ];
        setUsers(mockUsers);
      } else if (activeTab === 'unmatched') {
        // Mock data
        const mockStats: DashboardStats = {
          totalTests: 1245,
          totalUsers: 42,
          unmatchedTests: 18,
          recentCancellations: 7
        };
        setStats(mockStats);
        
        const mockUnmatched: UnmatchedTest[] = [
          { id: 1, test_name: 'CBC with Differential', source: 'LabGuru', first_seen: '2025-01-10', occurrence_count: 12 },
          { id: 2, test_name: 'LFT Comprehensive', source: 'Manual Entry', first_seen: '2025-01-12', occurrence_count: 8 },
          { id: 3, test_name: 'HbA1c Test', source: 'LabGuru', first_seen: '2025-01-14', occurrence_count: 5 },
        ];
        setUnmatchedTests(mockUnmatched);
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
        // Update user logic here
        alert(`Updated user: ${userFormData.username}`);
      } else {
        // Create user logic here
        alert(`Created user: ${userFormData.username}`);
      }
      setUserModalOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      // Delete logic here
      alert(`Deleted user ID: ${id}`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleResetPassword = async (id: number) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      // Reset password logic here
      alert(`Password reset for user ID: ${id}`);
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      // Toggle active logic here
      alert(`User ${id} ${isActive ? 'deactivated' : 'activated'}`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error toggling user active status:', error);
    }
  };

  const handleResolveUnmatched = async (id: number) => {
    try {
      // Resolve unmatched test logic here
      alert(`Resolved unmatched test ID: ${id}`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error resolving unmatched test:', error);
    }
  };

  const handleSaveMonthlyTarget = async () => {
    try {
      // Save monthly target logic here
      alert('Monthly target saved successfully');
    } catch (error) {
      console.error('Error saving monthly target:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background-color">
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <img src="/images/logo-nakasero.png" alt="logo" />
            </div>
            <div>
              <h1>NHL Laboratory Dashboard</h1>
              <div style={{ marginTop: '5px' }}>
                <a href="/dashboard" className="text-sm text-hover-color">
                  ← Back to Dashboard
                </a>
              </div>
            </div>
          </div>
          <div className="page">
            <span>Home</span>
            <a href="#" className="logout-button" id="logout-button">Logout</a>
            <span className="three-dots-menu-container">
              <button className="three-dots-button">&#x22EE;</button>
              <ul className="dropdown-menu">
                <li><a href="/dashboard"><i className="fas fa-home mr-2"></i> Dashboard</a></li>
                <li><a href="/reception"><i className="fas fa-table mr-2"></i> Reception</a></li>
                <li><a href="/admin"><i className="fas fa-cog mr-2"></i> Admin Panel</a></li>
              </ul>
            </span>
          </div>
        </div>
      </header>

      {/* Admin Panel Title */}
      <div style={{
        marginTop: '90px',
        padding: '0 30px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: 'var(--main-color)',
            margin: '0'
          }}>
            <i className="fas fa-cog mr-2"></i>
            Admin Panel
          </h2>
        </div>
      </div>

      {/* Admin Tabs - EXACT VANILLA DESIGN */}
      <div style={{
        backgroundColor: 'var(--background-color)',
        borderBottom: '1px solid var(--border-bottom)',
        padding: '0 30px'
      }}>
        <div style={{
          display: 'flex',
          gap: '0'
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '15px 30px',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: activeTab === 'users' ? 'var(--hover-color)' : 'var(--main-color)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid var(--hover-color)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'users') {
                e.currentTarget.style.color = 'var(--hover-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'users') {
                e.currentTarget.style.color = 'var(--main-color)';
              }
            }}
          >
            <i className="fas fa-users mr-2"></i>
            User Management
          </button>
          
          <button
            onClick={() => setActiveTab('unmatched')}
            style={{
              padding: '15px 30px',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: activeTab === 'unmatched' ? 'var(--hover-color)' : 'var(--main-color)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'unmatched' ? '3px solid var(--hover-color)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'unmatched') {
                e.currentTarget.style.color = 'var(--hover-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'unmatched') {
                e.currentTarget.style.color = 'var(--main-color)';
              }
            }}
          >
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Unmatched Tests
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '15px 30px',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: activeTab === 'settings' ? 'var(--hover-color)' : 'var(--main-color)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'settings' ? '3px solid var(--hover-color)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'settings') {
                e.currentTarget.style.color = 'var(--hover-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'settings') {
                e.currentTarget.style.color = 'var(--main-color)';
              }
            }}
          >
            <i className="fas fa-sliders-h mr-2"></i>
            Settings
          </button>
        </div>
      </div>

      {/* Stats Cards - Only for Unmatched tab */}
      {stats && activeTab === 'unmatched' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          padding: '30px',
          backgroundColor: 'var(--background-color)'
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'var(--main-color)',
              marginBottom: '10px'
            }}>
              {stats.totalTests}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--border-color)'
            }}>
              Total Tests
            </div>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#22c55e',
              marginBottom: '10px'
            }}>
              {stats.totalUsers}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--border-color)'
            }}>
              Active Users
            </div>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#f59e0b',
              marginBottom: '10px'
            }}>
              {stats.unmatchedTests}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--border-color)'
            }}>
              Unmatched Tests
            </div>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#ef4444',
              marginBottom: '10px'
            }}>
              {stats.recentCancellations}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--border-color)'
            }}>
              Recent Cancellations
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ padding: '30px' }}>
        {isLoading ? (
          <div className="loader">
            <div className="one"></div>
            <div className="two"></div>
            <div className="three"></div>
            <div className="four"></div>
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '25px'
                }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: 'var(--main-color)',
                    margin: '0'
                  }}>
                    <i className="fas fa-users mr-2"></i>
                    User Management
                  </h3>
                  <button
                    onClick={() => openUserModal()}
                    style={{
                      backgroundColor: 'var(--main-color)',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--main-color)'}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add New User
                  </button>
                </div>

                <div className="table-container">
                  <table className="neon-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td style={{ fontWeight: '500' }}>{user.username}</td>
                          <td>{user.email || 'N/A'}</td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              backgroundColor: 
                                user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' :
                                user.role === 'manager' ? 'rgba(245, 158, 11, 0.1)' :
                                user.role === 'technician' ? 'rgba(34, 197, 94, 0.1)' :
                                'rgba(156, 163, 175, 0.1)',
                              color:
                                user.role === 'admin' ? '#ef4444' :
                                user.role === 'manager' ? '#f59e0b' :
                                user.role === 'technician' ? '#22c55e' :
                                '#9ca3af'
                            }}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td>
                            {user.is_active ? (
                              <span style={{ color: '#22c55e', fontWeight: '500' }}>
                                <i className="fas fa-circle mr-1" style={{ fontSize: '0.7rem' }}></i>
                                Active
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af', fontWeight: '500' }}>
                                <i className="fas fa-circle mr-1" style={{ fontSize: '0.7rem' }}></i>
                                Inactive
                              </span>
                            )}
                          </td>
                          <td>
                            {user.last_login
                              ? new Date(user.last_login).toLocaleString()
                              : 'Never'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => openUserModal(user)}
                                style={{
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <i className="fas fa-edit mr-1"></i>
                                Edit
                              </button>
                              <button
                                onClick={() => handleResetPassword(user.id)}
                                style={{
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <i className="fas fa-key mr-1"></i>
                                Reset
                              </button>
                              <button
                                onClick={() => handleToggleActive(user.id, user.is_active)}
                                style={{
                                  backgroundColor: user.is_active ? '#9ca3af' : '#22c55e',
                                  color: 'white',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <i className={`fas mr-1 ${user.is_active ? 'fa-ban' : 'fa-check'}`}></i>
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                style={{
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <i className="fas fa-trash mr-1"></i>
                                Delete
                              </button>
                            </div>
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
              <div className="card">
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: 'var(--main-color)',
                  marginBottom: '25px'
                }}>
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Unmatched Test Names
                </h3>

                {unmatchedTests.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '50px 20px',
                    color: 'var(--border-color)'
                  }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#22c55e', marginBottom: '20px' }}></i>
                    <p style={{ fontSize: '1.1rem' }}>No unmatched tests found! All test names are properly configured.</p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#92400e',
                      padding: '15px 20px',
                      borderRadius: '8px',
                      marginBottom: '25px',
                      fontSize: '0.9rem'
                    }}>
                      <i className="fas fa-exclamation-circle mr-2"></i>
                      <strong>Important:</strong> Copy test names exactly as shown below when adding to the Meta Table. This ensures proper matching with LabGuru data.
                    </div>

                    <div className="table-container">
                      <table className="neon-table">
                        <thead>
                          <tr>
                            <th>Test Name</th>
                            <th>Source</th>
                            <th>First Seen</th>
                            <th>Occurrences</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unmatchedTests.map((test) => (
                            <tr key={test.id}>
                              <td style={{
                                fontFamily: 'monospace',
                                fontWeight: '700',
                                color: 'var(--main-color)',
                                fontSize: '0.9rem'
                              }}>
                                {test.test_name}
                              </td>
                              <td>{test.source}</td>
                              <td>
                                {new Date(test.first_seen).toLocaleDateString()}
                              </td>
                              <td>
                                <span style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
                                  fontWeight: '600'
                                }}>
                                  {test.occurrence_count} times
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => handleResolveUnmatched(test.id)}
                                  style={{
                                    backgroundColor: '#22c55e',
                                    color: 'white',
                                    padding: '6px 15px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    margin: '0 auto'
                                  }}
                                >
                                  <i className="fas fa-check mr-1"></i>
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
              <div className="card">
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: 'var(--main-color)',
                  marginBottom: '30px'
                }}>
                  <i className="fas fa-sliders-h mr-2"></i>
                  Settings
                </h3>

                <div style={{ maxWidth: '800px' }}>
                  <div style={{ marginBottom: '40px' }}>
                    <h4 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: 'var(--main-color)',
                      marginBottom: '20px'
                    }}>
                      <i className="fas fa-bullseye mr-2"></i>
                      Monthly Revenue Target
                    </h4>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '20px',
                      marginBottom: '25px'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: 'var(--border-color)',
                          marginBottom: '8px'
                        }}>
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
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            color: 'var(--main-color)',
                            backgroundColor: 'white'
                          }}
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
                        <label style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: 'var(--border-color)',
                          marginBottom: '8px'
                        }}>
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
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            color: 'var(--main-color)',
                            backgroundColor: 'white'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: 'var(--border-color)',
                          marginBottom: '8px'
                        }}>
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
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            color: 'var(--main-color)',
                            backgroundColor: 'white'
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveMonthlyTarget}
                      style={{
                        backgroundColor: 'var(--main-color)',
                        color: 'white',
                        padding: '10px 25px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background-color 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--main-color)'}
                    >
                      <i className="fas fa-save mr-2"></i>
                      Save Monthly Target
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* User Modal */}
      {userModalOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              color: 'var(--main-color)',
              marginBottom: '25px'
            }}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--border-color)',
                  marginBottom: '8px'
                }}>
                  Username
                </label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, username: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--main-color)',
                    backgroundColor: editingUser ? '#f3f4f6' : 'white'
                  }}
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--border-color)',
                  marginBottom: '8px'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, email: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--main-color)',
                    backgroundColor: 'white'
                  }}
                />
              </div>

              {!editingUser && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'var(--border-color)',
                    marginBottom: '8px'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, password: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      color: 'var(--main-color)',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--border-color)',
                  marginBottom: '8px'
                }}>
                  Role
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, role: e.target.value as any })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--main-color)',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="technician">Technician</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '15px',
              marginTop: '30px'
            }}>
              <button
                onClick={() => setUserModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  color: 'var(--border-color)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--main-color)';
                  e.currentTarget.style.borderColor = 'var(--main-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--border-color)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUserSubmit}
                style={{
                  padding: '10px 25px',
                  backgroundColor: 'var(--main-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.3s',
                  opacity: (!userFormData.username || (!editingUser && !userFormData.password)) ? 0.5 : 1
                }}
                disabled={!userFormData.username || (!editingUser && !userFormData.password)}
                onMouseEnter={(e) => {
                  if (!(!userFormData.username || (!editingUser && !userFormData.password))) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!userFormData.username || (!editingUser && !userFormData.password))) {
                    e.currentTarget.style.backgroundColor = 'var(--main-color)';
                  }
                }}
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer>
        <p>&copy;2025 Zyntel</p>
        <div className="zyntel">
          <img src="/images/zyntel_no_background.png" alt="logo" />
        </div>
      </footer>
    </div>
  );
};

export default Admin;