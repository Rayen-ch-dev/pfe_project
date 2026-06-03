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
      setUsers(users.map(user => user.id === userId ? response : user));
      setError('');
    } catch (err: any) {
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
      } catch {
        setError('Failed to update users');
      }
    }
  };

  const handleViewDocument = (user: User) => {
    if (user.documentImage) {
      setSelectedDocument({ user, documentUrl: user.documentImage });
      setShowDocumentModal(true);
    }
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    let compareA: any, compareB: any;
    switch (sortBy) {
      case 'name':  compareA = `${a.firstName} ${a.lastName}`; compareB = `${b.firstName} ${b.lastName}`; break;
      case 'date':  compareA = new Date(a.createdAt).getTime(); compareB = new Date(b.createdAt).getTime(); break;
      case 'role':  compareA = a.role; compareB = b.role; break;
      default: return 0;
    }
    if (sortOrder === 'asc') return compareA > compareB ? 1 : -1;
    return compareA < compareB ? 1 : -1;
  });

  // Role badge — gradient pills kept as-is (they work in dark too since text is white)
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':            return 'bg-gradient-to-r from-red-500   to-red-600   text-white';
      case 'AGENT_RESTAURANT': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'STUDENT':          return 'bg-gradient-to-r from-blue-500  to-blue-600  text-white';
      default:                 return 'bg-gradient-to-r from-gray-500  to-gray-600  text-white';
    }
  };

  // Status badge — same dark pattern as PaymentsPage / SettingsPage
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100  dark:bg-green-950/40  text-green-800  dark:text-green-200  border-green-200  dark:border-green-800';
      case 'PENDING':  return 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'REJECTED': return 'bg-red-100    dark:bg-red-950/40    text-red-800    dark:text-red-200    border-red-200    dark:border-red-800';
      default:         return 'bg-gray-100   dark:bg-gray-800      text-gray-800   dark:text-gray-200   border-gray-200   dark:border-gray-600';
    }
  };



  const canEditUser   = (_user: User) => currentUser?.role === 'ADMIN';
  const canDeleteUser = (user: User)  => !(currentUser?.role === 'ADMIN' && user.id === currentUser.id);
  const isCurrentUser = (user: User)  => user.id === currentUser?.id;

  const handleEditUser   = (user: User) => { setSelectedUser(user); setShowEditModal(true); };
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setShowEditModal(false);
    setSelectedUser(null);
  };
  const handleCreateUser = (newUser: User) => { setUsers([...users, newUser]); setShowCreateModal(false); };
  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ?`)) {
      try {
        await dashboardService.deleteUser(user.id);
        setUsers(users.filter(u => u.id !== user.id));
        setError('');
      } catch {
        setError('Failed to delete user');
      }
    }
  };

  const toggleUserSelection = (userId: string) =>
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);

  const selectAllUsers = () =>
    setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id));

  const stats = {
    total:    users.length,
    students: users.filter(u => u.role === 'STUDENT').length,
    agents:   users.filter(u => u.role === 'AGENT_RESTAURANT').length,
    admins:   users.filter(u => u.role === 'ADMIN').length,
    approved: users.filter(u => u.status === 'APPROVED').length,
    pending:  users.filter(u => u.status === 'PENDING').length,
  };

  const statCards = [
    { label: 'Total',      value: stats.total,    color: 'text-gray-900  dark:text-white',         bg: 'bg-blue-100   dark:bg-blue-950/50',   dot: 'bg-blue-600'   },
    { label: 'Étudiants',  value: stats.students,  color: 'text-blue-600  dark:text-blue-400',      bg: 'bg-blue-100   dark:bg-blue-950/50',   dot: 'bg-blue-600'   },
    { label: 'Agents',     value: stats.agents,    color: 'text-green-600 dark:text-green-400',     bg: 'bg-green-100  dark:bg-green-950/50',  dot: 'bg-green-600'  },
    { label: 'Admins',     value: stats.admins,    color: 'text-red-600   dark:text-red-400',       bg: 'bg-red-100    dark:bg-red-950/50',    dot: 'bg-red-600'    },
    { label: 'Approuvés',  value: stats.approved,  color: 'text-green-600 dark:text-green-400',     bg: 'bg-green-100  dark:bg-green-950/50',  dot: 'bg-green-600'  },
    { label: 'En attente', value: stats.pending,   color: 'text-yellow-600 dark:text-yellow-400',  bg: 'bg-yellow-100 dark:bg-yellow-950/50', dot: 'bg-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* ── Header — same pattern as SettingsPage / PaymentsPage ── */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Gestion des Utilisateurs
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gérez les comptes et permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Ajouter un utilisateur
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(({ label, value, color, bg, dot }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div className={`h-10 w-10 ${bg} rounded-lg flex items-center justify-center`}>
                  <div className={`h-5 w-5 ${dot} rounded`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Error alert ── */}
        {error && (
          <div className="p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-400">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={loadUsers} className="text-sm underline ml-4 hover:opacity-80">
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ── Search & Filters ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Tous les rôles</option>
                <option value="STUDENT">Étudiants</option>
                <option value="AGENT_RESTAURANT">Agents</option>
                <option value="ADMIN">Admins</option>
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Tous les statuts</option>
                <option value="APPROVED">Approuvés</option>
                <option value="PENDING">En attente</option>
                <option value="REJECTED">Rejetés</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Bulk Actions ── */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-xl p-4 flex items-center justify-between border border-blue-100 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </span>
              <button
                onClick={() => handleBulkStatusUpdate('APPROVED')}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Approuver
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('REJECTED')}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Rejeter
              </button>
            </div>
            <button
              onClick={() => setSelectedUsers([])}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-lg"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Users Table ── */}
        {!loading && !error && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">

                {/* thead */}
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={selectAllUsers}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Utilisateur</span>
                        {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Rôle & Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Document
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date de création</span>
                        {sortBy === 'date' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* tbody */}
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">

                      {/* Checkbox */}
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Name + avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-semibold text-sm">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                              {user.firstName} {user.lastName}
                              {isCurrentUser(user) && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                  Vous
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{user.email}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                      </td>

                      {/* Role & Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-lg ${getRoleColor(user.role)}`}>
                            {user.role === 'AGENT_RESTAURANT' ? 'Agent' : user.role}
                          </span>
                          {user.role === 'STUDENT' && (
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(user.status)}`}>
                             
                              {user.status || 'PENDING'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Document */}
                      <td className="px-6 py-4">
                        {user.role === 'STUDENT' && user.documentImage ? (
                          <button
                            onClick={() => handleViewDocument(user)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Voir document
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {user.role === 'STUDENT' ? 'Aucun document' : 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleTimeString('fr-FR')}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {canEditUser(user) && (
                            <button
                              onClick={() => handleEditUser(user)}
                              className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                            >
                              Modifier
                            </button>
                          )}
                          {canDeleteUser(user) && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
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

            {/* Empty state */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Aucun utilisateur trouvé</p>
                <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">Essayez de modifier vos critères de recherche</p>
              </div>
            )}

            {/* Footer / pagination */}
            {filteredUsers.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Affichage de <span className="font-medium text-gray-900 dark:text-white">1</span> à{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{Math.min(10, filteredUsers.length)}</span> sur{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{filteredUsers.length}</span> utilisateurs
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Précédent
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      1
                    </button>
                    <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <UserEditModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
        onUpdate={handleUpdateUser}
      />
      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateUser}
      />

      {/* ── Document View Modal ── */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">

            {/* Modal header */}
            <div className="bg-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Document d'identification</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedDocument.user.firstName} {selectedDocument.user.lastName} — {selectedDocument.user.email}
                  </p>
                </div>
                <button
                  onClick={handleCloseDocumentModal}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center min-h-[400px]">
                  {selectedDocument.documentUrl.startsWith('data:') ? (
                    <img
                      src={selectedDocument.documentUrl}
                      alt="Document d'identification"
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Document disponible</p>
                      <a
                        href={selectedDocument.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ouvrir le document
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Statut:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(selectedDocument.user.status)}`}>
                      {selectedDocument.user.status || 'PENDING'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Rôle:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{selectedDocument.user.role}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {selectedDocument.user.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => { handleUpdateStatus(selectedDocument.user.id, 'REJECTED'); handleCloseDocumentModal(); }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={() => { handleUpdateStatus(selectedDocument.user.id, 'APPROVED'); handleCloseDocumentModal(); }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Approuver
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleCloseDocumentModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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