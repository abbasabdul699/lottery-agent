import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt?: string;
}

interface Game {
  _id: string;
  gameNumber: string;
  gameName: string;
  costPerTicket?: number;
  isActive: boolean;
  description?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'games' | 'settings'>('users');
  const [storeSettings, setStoreSettings] = useState({
    expectedGameCount: 100,
    expectedPriceGroups: [50, 30, 20, 10, 5, 2, 1] as number[],
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState('');
  const [resettingPasswordFor, setResettingPasswordFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee' as 'admin' | 'employee',
  });

  const [gameFormData, setGameFormData] = useState({
    gameNumber: '',
    gameName: '',
    costPerTicket: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    // Check if user is admin
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/admin/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      // Redirect non-admin users to the main dashboard
      router.push('/dashboard');
      return;
    }

    fetchUsers();
    fetchGames();
    fetchStoreSettings();
  }, [router]);

  const fetchGames = async () => {
    setGamesLoading(true);
    try {
      const response = await fetch('/api/admin/games');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch games');
        return;
      }

      setGames(data.games);
    } catch (error: any) {
      console.error('Error fetching games:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setGamesLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch users');
        return;
      }

      setUsers(data.users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch('/api/admin/store-settings');
      const data = await response.json();

      if (data.success && data.settings) {
        setStoreSettings({
          expectedGameCount: data.settings.expectedGameCount || 100,
          expectedPriceGroups: data.settings.expectedPriceGroups || [50, 30, 20, 10, 5, 2, 1],
        });
      }
    } catch (error: any) {
      console.error('Error fetching store settings:', error);
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/store-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save store settings');
        return;
      }

      if (data.success) {
        setError('');
        alert('Store settings saved successfully!');
      }
    } catch (error: any) {
      console.error('Error saving store settings:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }

      // Reset form and refresh users
      setFormData({ email: '', password: '', name: '', role: 'employee' });
      setShowCreateForm(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');

    try {
      const updateData: any = {
        id: editingUser.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update user');
        return;
      }

      // Reset form and refresh users
      setFormData({ email: '', password: '', name: '', role: 'employee' });
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete user');
        return;
      }

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
    });
    setShowCreateForm(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordFor) return;

    setPasswordResetError('');
    setPasswordResetSuccess('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setPasswordResetError('Both password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordResetError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordResetError('Passwords do not match');
      return;
    }

    setPasswordResetLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: resettingPasswordFor.id,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordResetError(data.error || 'Failed to reset password');
        setPasswordResetLoading(false);
        return;
      }

      setPasswordResetSuccess('Password reset successfully');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        setResettingPasswordFor(null);
        setPasswordResetSuccess('');
      }, 1500);
      
      setPasswordResetLoading(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setPasswordResetError('An error occurred. Please try again.');
      setPasswordResetLoading(false);
    }
  };

  const openResetPasswordModal = (user: User) => {
    setResettingPasswordFor(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordResetError('');
    setPasswordResetSuccess('');
  };

  const closeResetPasswordModal = () => {
    setResettingPasswordFor(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordResetError('');
    setPasswordResetSuccess('');
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create game');
        return;
      }

      setGameFormData({ gameNumber: '', gameName: '', costPerTicket: '', description: '', isActive: true });
      setShowGameForm(false);
      fetchGames();
    } catch (error: any) {
      console.error('Error creating game:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    setError('');

    try {
      const response = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingGame._id,
          ...gameFormData,
          costPerTicket: gameFormData.costPerTicket ? parseFloat(gameFormData.costPerTicket) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update game');
        return;
      }

      setGameFormData({ gameNumber: '', gameName: '', costPerTicket: '', description: '', isActive: true });
      setEditingGame(null);
      setShowGameForm(false);
      fetchGames();
    } catch (error: any) {
      console.error('Error updating game:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm('Are you sure you want to delete this game?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/games?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete game');
        return;
      }

      fetchGames();
    } catch (error: any) {
      console.error('Error deleting game:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleImportGames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImportLoading(true);
    setImportSuccess('');
    setError('');

    try {
      const fileContent = await importFile.text();
      const fileType = importFile.type;

      const response = await fetch('/api/admin/games/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent,
          fileType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to import games');
        setImportLoading(false);
        return;
      }

      setImportSuccess(`Successfully imported ${data.imported} game(s). ${data.errors > 0 ? `${data.errors} error(s) occurred.` : ''}`);
      setImportFile(null);
      fetchGames();
      
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccess('');
      }, 2000);
      
      setImportLoading(false);
    } catch (error: any) {
      console.error('Error importing games:', error);
      setError('An error occurred. Please try again.');
      setImportLoading(false);
    }
  };

  const startEditGame = (game: Game) => {
    setEditingGame(game);
    setGameFormData({
      gameNumber: game.gameNumber,
      gameName: game.gameName,
      costPerTicket: game.costPerTicket?.toString() || '',
      description: game.description || '',
      isActive: game.isActive,
    });
    setShowGameForm(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2">
                <Image 
                  src="/logos.png" 
                  alt="QuickRepp Logo" 
                  width={48} 
                  height={48}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold text-blue-600">
                    Quick<span className="text-orange-400">Repp</span>
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">Admin Dashboard</p>
                </div>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'games'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Games Management
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Store Settings
          </button>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <>
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingUser(null);
                  setFormData({ email: '', password: '', name: '', role: 'employee' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showCreateForm ? 'Cancel' : '+ Create User'}
              </button>
            </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingUser && '(leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'employee' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-base"
                    style={{ fontSize: '16px', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found. Create your first user above.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => startEdit(user)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="text-orange-600 hover:text-orange-900 mr-4"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {/* Games Management Tab */}
        {activeTab === 'games' && (
          <>
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Games Management</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Import Games
                </button>
                <button
                  onClick={() => {
                    setShowGameForm(!showGameForm);
                    setEditingGame(null);
                    setGameFormData({ gameNumber: '', gameName: '', costPerTicket: '', description: '', isActive: true });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showGameForm ? 'Cancel' : '+ Create Game'}
                </button>
              </div>
            </div>

            {/* Create/Edit Game Form */}
            {showGameForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingGame ? 'Edit Game' : 'Create New Game'}
                </h3>
                <form onSubmit={editingGame ? handleUpdateGame : handleCreateGame} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Game Number *</label>
                      <input
                        type="text"
                        value={gameFormData.gameNumber}
                        onChange={(e) => setGameFormData({ ...gameFormData, gameNumber: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="e.g., 507"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Game Name *</label>
                      <input
                        type="text"
                        value={gameFormData.gameName}
                        onChange={(e) => setGameFormData({ ...gameFormData, gameName: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="e.g., Mega Millions"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Ticket</label>
                      <input
                        type="number"
                        step="0.01"
                        value={gameFormData.costPerTicket}
                        onChange={(e) => setGameFormData({ ...gameFormData, costPerTicket: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={gameFormData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setGameFormData({ ...gameFormData, isActive: e.target.value === 'active' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={gameFormData.description}
                        onChange={(e) => setGameFormData({ ...gameFormData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingGame ? 'Update Game' : 'Create Game'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Games Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Game #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Game Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost per Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gamesLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          Loading games...
                        </td>
                      </tr>
                    ) : games.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No games found. Import or create your first game.
                        </td>
                      </tr>
                    ) : (
                      games.map((game) => (
                        <tr key={game._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {game.gameNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {game.gameName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {game.costPerTicket ? `$${game.costPerTicket.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                game.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {game.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => startEditGame(game)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGame(game._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Store Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Store Settings</h2>
            <p className="text-gray-600 mb-6">
              Configure the expected number of games and price groups for your store. This helps the closing checklist determine when all tickets have been scanned.
            </p>

            <form onSubmit={handleSaveStoreSettings} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Game Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={storeSettings.expectedGameCount}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings,
                    expectedGameCount: parseInt(e.target.value) || 100,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The number of unique games/books your store typically has on the shelf (e.g., 100 for large stores, 30 for smaller stores).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Price Groups
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {[50, 30, 20, 10, 5, 2, 1].map((price) => (
                      <label key={price} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeSettings.expectedPriceGroups.includes(price)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStoreSettings({
                                ...storeSettings,
                                expectedPriceGroups: [...storeSettings.expectedPriceGroups, price].sort((a, b) => b - a),
                              });
                            } else {
                              setStoreSettings({
                                ...storeSettings,
                                expectedPriceGroups: storeSettings.expectedPriceGroups.filter(p => p !== price),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">${price}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Select all price groups that your store typically sells. The checklist will mark scanning as complete when tickets from all selected price groups have been scanned.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => fetchStoreSettings()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {resettingPasswordFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reset Password for {resettingPasswordFor.name}
              </h3>
              <button
                onClick={closeResetPasswordModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {passwordResetError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {passwordResetError}
                </div>
              )}

              {passwordResetSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {passwordResetSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeResetPasswordModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordResetLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordResetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Games Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Import Games
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportSuccess('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleImportGames} className="space-y-4">
              {importSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {importSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV or JSON File
                </label>
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-2">
                  CSV format: Game Number, Game Name, Cost per Ticket (optional), Description (optional)
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportSuccess('');
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !importFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importLoading ? 'Importing...' : 'Import Games'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

