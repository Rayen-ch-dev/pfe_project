import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, type Payment } from '../../services/dashboardService';
import { api } from '../../services/apiClient';

// Safe date parser — handles ISO strings, timestamps, and null gracefully
const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (value: unknown) => {
  const d = parseDate(value);
  if (!d) return { date: '—', time: '' };
  return {
    date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
};

type SortKey = 'date' | 'amount' | 'user';

const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  // FIX: default sort is date DESC so newest reservations appear first
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardService.getPayments();
      console.log('💰 Payments data received:', data);
      console.log('💰 Payments count:', data?.length || 0);
      setPayments(data);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setError('Impossible de charger les paiements. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const setPaymentLoading = (id: string, value: boolean) =>
    setActionLoading(prev => ({ ...prev, [id]: value }));

  const handleApprovePayment = async (paymentId: string) => {
    setPaymentLoading(paymentId, true);
    try {
      console.log('🔵 Approving payment:', paymentId);
      const response = await api.put(`/api/admin/payments/${paymentId}/approve`);
      console.log('✅ Payment approve response:', response);
      
      // Force a small delay to ensure backend processes the change
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear any cached data and force reload
      setPayments([]); // Clear current payments
      await loadPayments(); // Reload fresh data
    } catch (err: any) {
      console.error('Failed to approve payment:', err);
      setError('Échec de l\'approbation du paiement');
    } finally {
      setPaymentLoading(paymentId, false);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!window.confirm('Confirmer le rejet de ce paiement ?')) return;
    setPaymentLoading(paymentId, true);
    try {
      console.log('🔴 Rejecting payment:', paymentId);
      const response = await api.put(`/api/admin/payments/${paymentId}/reject`);
      console.log('✅ Payment reject response:', response);
      
      // Force a small delay to ensure backend processes the change
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear any cached data and force reload
      setPayments([]); // Clear current payments
      await loadPayments(); // Reload fresh data
    } catch (err: any) {
      console.error('Failed to reject payment:', err);
      setError('Échec du rejet du paiement');
    } finally {
      setPaymentLoading(paymentId, false);
    }
  };

  // FIX: bulk approve now actually calls the API for each selected payment
  const handleBulkApprove = async () => {
    if (selectedPayments.length === 0) return;
    if (!window.confirm(`Approuver ${selectedPayments.length} paiement(s) ?`)) return;
    try {
      setLoading(true);
      console.log('🔵 Bulk approving payments:', selectedPayments);
      
      const responses = await Promise.all(
        selectedPayments.map(id => api.put(`/api/admin/payments/${id}/approve`))
      );
      console.log('✅ Bulk approve responses:', responses);
      
      // Force a small delay to ensure backend processes changes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear any cached data and force reload
      setPayments([]); // Clear current payments
      await loadPayments(); // Reload fresh data
      setSelectedPayments([]);
    } catch (err: any) {
      console.error('Failed to bulk approve payments:', err);
      setError('Échec de l\'approbation groupée');
    } finally {
      setLoading(false);
    }
  };

  // FIX: switching sortBy resets order to desc so it always makes sense
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const filteredPayments = (payments || [])
    .filter(payment => {
      console.log('🔍 Filtering payment:', payment);
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        payment.user.firstName.toLowerCase().includes(term) ||
        payment.user.lastName.toLowerCase().includes(term) ||
        payment.user.email.toLowerCase().includes(term) ||
        payment.id.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date': {
          const da = parseDate(a.date)?.getTime() ?? 0;
          const db = parseDate(b.date)?.getTime() ?? 0;
          cmp = da - db;
          break;
        }
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'user':
          cmp = `${a.user.firstName} ${a.user.lastName}`.localeCompare(
            `${b.user.firstName} ${b.user.lastName}`
          );
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return '✓ Approuvé';
      case 'PENDING': return '⏳ En attente';
      case 'CANCELLED': return '✗ Annulé';
      default: return status;
    }
  };

  const togglePaymentSelection = (paymentId: string) =>
    setSelectedPayments(prev =>
      prev.includes(paymentId) ? prev.filter(id => id !== paymentId) : [...prev, paymentId]
    );

  const selectAllVisible = () => {
    if (selectedPayments.length === filteredPayments.length && filteredPayments.length > 0) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map(p => p.id));
    }
  };

  // FIX: revenue only counts PAID payments
  const stats = {
    total: (payments || []).length,
    paid: (payments || []).filter(p => p.status === 'PAID').length,
    pending: (payments || []).filter(p => p.status === 'PENDING').length,
    cancelled: (payments || []).filter(p => p.status === 'CANCELLED').length,
    totalRevenue: (payments || [])
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0),
    totalTickets: (payments || [])
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.ticketsAdded || 0), 0),
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortBy === col ? (
      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-gray-300">↕</span>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="group flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span className="text-lg">←</span>
                  <span className="text-sm font-medium">Retour</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Paiements des Packages
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Approuvez les achats de packages des étudiants
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                🖨 Exporter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, color: 'blue' },
              { label: 'Approuvés', value: stats.paid, color: 'green' },
              { label: 'En attente', value: stats.pending, color: 'yellow' },
              { label: 'Revenus (PAID)', value: `${stats.totalRevenue.toFixed(2)} DT`, color: 'purple' },
              { label: 'Tickets vendus', value: stats.totalTickets, color: 'orange' },
              { label: 'Annulés', value: stats.cancelled, color: 'red' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-xl font-bold text-${color}-600 mt-1`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="PAID">Approuvés</option>
                <option value="PENDING">En attente</option>
                <option value="CANCELLED">Annulés</option>
              </select>
              <button
                onClick={loadPayments}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                title="Rafraîchir"
              >
                🔄 Rafraîchir
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedPayments.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center justify-between border border-blue-100">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedPayments.length} paiement(s) sélectionné(s)
                </span>
                <button
                  onClick={handleBulkApprove}
                  className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition"
                >
                  ✓ Approuver tout
                </button>
              </div>
              <button onClick={() => setSelectedPayments([])} className="text-blue-600 hover:text-blue-800 text-lg">
                ✕
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-center justify-between">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={loadPayments} className="text-sm text-red-600 underline hover:text-red-800 ml-4">
                Réessayer
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payments Table */}
          {!loading && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedPayments.length === filteredPayments.length &&
                            filteredPayments.length > 0
                          }
                          onChange={selectAllVisible}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        ID
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none"
                        onClick={() => handleSort('user')}
                      >
                        Étudiant <SortIcon col="user" />
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none"
                        onClick={() => handleSort('amount')}
                      >
                        Montant <SortIcon col="amount" />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tickets
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none"
                        onClick={() => handleSort('date')}
                      >
                        Date <SortIcon col="date" />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map(payment => {
                      const { date, time } = formatDate(payment.date);
                      const isLoading = actionLoading[payment.id];
                      return (
                        <tr
                          key={payment.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedPayments.includes(payment.id)}
                              onChange={() => togglePaymentSelection(payment.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="text-sm font-mono text-gray-500 cursor-pointer hover:text-gray-900"
                              title={payment.id}
                              onClick={() => navigator.clipboard?.writeText(payment.id)}
                            >
                              {payment.id.substring(0, 8)}…
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                                <span className="text-white font-semibold text-sm">
                                  {payment.user.firstName[0]}{payment.user.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {payment.user.firstName} {payment.user.lastName}
                                </div>
                                <div className="text-xs text-gray-500">{payment.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {payment.amount.toFixed(2)} DT
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {payment.ticketsAdded ?? 0} tickets
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {/* FIX: safe date display — shows '—' instead of 'Invalid Date' */}
                            <div className="text-sm text-gray-900">{date}</div>
                            <div className="text-xs text-gray-500">{time}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {payment.status === 'PENDING' && (
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(payment.status)}`}
                                >
                                  {getStatusLabel(payment.status)}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleApprovePayment(payment.id)}
                                    disabled={isLoading}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                  >
                                    {isLoading ? '…' : '✓'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(payment.id)}
                                    disabled={isLoading}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                  >
                                    {isLoading ? '…' : '✗'}
                                  </button>
                                </div>
                              </div>
                            )}
                            {payment.status === 'PAID' && (
                              <span
                                className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(payment.status)}`}
                              >
                                ✓ Approuvé
                              </span>
                            )}
                            {payment.status === 'CANCELLED' && (
                              <span
                                className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(payment.status)}`}
                              >
                                ✗ Rejeté
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredPayments.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg font-medium">Aucun paiement trouvé</p>
                  <p className="text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                </div>
              )}

              {/* Row count footer */}
              {filteredPayments.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-right">
                  {filteredPayments.length} résultat(s) sur {payments.length} au total
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;