import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, type User } from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';
import UserEditModal from '../../components/UserEditModal';
import UserCreateModal from '../../components/UserCreateModal';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ user: User; documentUrl: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getUsers();
      setUsers(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const response = await dashboardService.updateUserStatus(userId, status);
      setUsers(users.map(user => 
        user.id === userId ? response : user
      ));
      setError('');
    } catch (err: any) {
      console.error('Failed to update user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`Appliquer "${status}" à ${selectedUsers.length} utilisateur(s) ?`)) {
      try {
        await Promise.all(selectedUsers.map(id => dashboardService.updateUserStatus(id, status)));
        await loadUsers();
        setSelectedUsers([]);
      } catch (err: any) {
        setError('Failed to update users');
      }
    }
  };

  const handleViewDocument = (user: User) => {
    if (user.documentImage) {
      setSelectedDocument({
        user,
        documentUrl: user.documentImage
      });
      setShowDocumentModal(true);
    }
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    let compareA, compareB;
    switch (sortBy) {
      case 'name':
        compareA = `${a.firstName} ${a.lastName}`;
        compareB = `${b.firstName} ${b.lastName}`;
        break;
      case 'date':
        compareA = new Date(a.createdAt).getTime();
        compareB = new Date(b.createdAt).getTime();
        break;
      case 'role':
        compareA = a.role;
        compareB = b.role;
        break;
      default:
        return 0;
    }
    if (sortOrder === 'asc') return compareA > compareB ? 1 : -1;
    return compareA < compareB ? 1 : -1;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'AGENT_RESTAURANT': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'STUDENT': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'APPROVED': return '✓';
      case 'PENDING': return '⏱️';
      case 'REJECTED': return '✗';
      default: return '?';
    }
  };

  const canEditUser = (user: User) => {
    return currentUser?.role === 'ADMIN';
  };

  const canDeleteUser = (user: User) => {
    if (currentUser?.role === 'ADMIN' && user.id === currentUser.id) {
      return false;
    }
    return true;
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleCreateUser = (newUser: User) => {
    setUsers([...users, newUser]);
    setShowCreateModal(false);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ?`)) {
      try {
        await dashboardService.deleteUser(user.id);
        setUsers(users.filter(u => u.id !== user.id));
        setError('');
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        setError('Failed to delete user');
      }
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const isCurrentUser = (user: User) => {
    return user.id === currentUser?.id;
  };

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'STUDENT').length,
    agents: users.filter(u => u.role === 'AGENT_RESTAURANT').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    approved: users.filter(u => u.status === 'APPROVED').length,
    pending: users.filter(u => u.status === 'PENDING').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="group flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span className="text-sm font-medium">Retour</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Gestion des Utilisateurs
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Gérez les comptes et permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Ajouter un utilisateur
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="h-5 w-5 bg-blue-600 rounded"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Étudiants</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="h-5 w-5 bg-blue-600 rounded"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Agents</p>
                  <p className="text-2xl font-bold text-green-600">{stats.agents}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="h-5 w-5 bg-green-600 rounded"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Admins</p>
                  <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
                </div>
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <div className="h-5 w-5 bg-red-600 rounded"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Approuvés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="h-5 w-5 bg-green-600 rounded"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <div className="h-5 w-5 bg-yellow-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="STUDENT">Étudiants</option>
                  <option value="AGENT_RESTAURANT">Agents</option>
                  <option value="ADMIN">Admins</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="APPROVED">Approuvés</option>
                  <option value="PENDING">En attente</option>
                  <option value="REJECTED">Rejetés</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </span>
                <button
                  onClick={() => handleBulkStatusUpdate('APPROVED')}
                  className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('REJECTED')}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition"
                >
                  Rejeter
                </button>
              </div>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={loadUsers}
                  className="ml-auto text-sm text-red-600 underline hover:text-red-800"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          {!loading && !error && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={selectAllUsers}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                        <div className="flex items-center space-x-1">
                          <span>Utilisateur</span>
                          {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rôle & Statut</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Document</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                        <div className="flex items-center space-x-1">
                          <span>Date de création</span>
                          {sortBy === 'date' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center shadow-md`}>
                              <span className="text-white font-semibold text-sm">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {user.firstName} {user.lastName}
                                {isCurrentUser(user) && (
                                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Vous</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{user.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-lg ${getRoleColor(user.role)}`}>
                              {user.role === 'AGENT_RESTAURANT' ? 'Agent' : user.role}
                            </span>
                            {user.role === 'STUDENT' && (
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(user.status)}`}>
                                <span className="mr-1">{getStatusIcon(user.status)}</span>
                                {user.status || 'PENDING'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'STUDENT' && user.documentImage ? (
                            <button
                              onClick={() => handleViewDocument(user)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Voir document
                            </button>
                          ) : user.role === 'STUDENT' ? (
                            <span className="text-xs text-gray-400">Aucun document</span>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleTimeString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {canEditUser(user) && (
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                Modifier
                              </button>
                            )}
                            {canDeleteUser(user) && (
                              <button 
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-gray-400">
                    <p className="mt-4 text-lg font-medium">Aucun utilisateur trouvé</p>
                    <p className="mt-1 text-sm">Essayez de modifier vos critères de recherche</p>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Affichage de <span className="font-medium">1</span> à{' '}
                      <span className="font-medium">{Math.min(10, filteredUsers.length)}</span> sur{' '}
                      <span className="font-medium">{filteredUsers.length}</span> utilisateurs
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition">Précédent</button>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">1</button>
                      <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition">Suivant</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserEditModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onUpdate={handleUpdateUser}
      />

      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateUser}
      />

      {/* Document View Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Document d'identification</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedDocument.user.firstName} {selectedDocument.user.lastName} - {selectedDocument.user.email}
                  </p>
                </div>
                <button
                  onClick={handleCloseDocumentModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center min-h-[400px]">
                  {selectedDocument.documentUrl.startsWith('data:') ? (
                    <img
                      src={selectedDocument.documentUrl}
                      alt="Document d'identification"
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-4">Document disponible</p>
                      <a
                        href={selectedDocument.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ouvrir le document
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Statut:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border ${
                      selectedDocument.user.status === 'APPROVED' 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : selectedDocument.user.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {selectedDocument.user.status || 'PENDING'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Rôle:</span>
                    <span className="ml-2 text-gray-900">{selectedDocument.user.role}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {selectedDocument.user.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedDocument.user.id, 'REJECTED');
                          handleCloseDocumentModal();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedDocument.user.id, 'APPROVED');
                          handleCloseDocumentModal();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approuver
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleCloseDocumentModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;