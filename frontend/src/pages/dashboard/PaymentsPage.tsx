import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, type Payment } from '../../services/dashboardService';
import { api } from '../../services/apiClient';

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
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardService.getPayments();
      setPayments(data);
    } catch (err: any) {
      setError('Impossible de charger les paiements. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const setPaymentLoading = (id: string, value: boolean) =>
    setActionLoading(prev => ({ ...prev, [id]: value }));

  const handleApprovePayment = async (paymentId: string) => {
    setPaymentLoading(paymentId, true);
    try {
      await api.put(`/api/admin/payments/${paymentId}/approve`);
      await new Promise(resolve => setTimeout(resolve, 500));
      setPayments([]);
      await loadPayments();
    } catch { setError("Échec de l'approbation du paiement"); }
    finally { setPaymentLoading(paymentId, false); }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!window.confirm('Confirmer le rejet de ce paiement ?')) return;
    setPaymentLoading(paymentId, true);
    try {
      await api.put(`/api/admin/payments/${paymentId}/reject`);
      await new Promise(resolve => setTimeout(resolve, 500));
      setPayments([]);
      await loadPayments();
    } catch { setError('Échec du rejet du paiement'); }
    finally { setPaymentLoading(paymentId, false); }
  };

  const handleBulkApprove = async () => {
    if (selectedPayments.length === 0) return;
    if (!window.confirm(`Approuver ${selectedPayments.length} paiement(s) ?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedPayments.map(id => api.put(`/api/admin/payments/${id}/approve`)));
      await new Promise(resolve => setTimeout(resolve, 500));
      setPayments([]);
      await loadPayments();
      setSelectedPayments([]);
    } catch { setError("Échec de l'approbation groupée"); }
    finally { setLoading(false); }
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortOrder('desc'); }
  };

  const filteredPayments = (payments || [])
    .filter(payment => {
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
          cmp = da - db; break;
        }
        case 'amount': cmp = a.amount - b.amount; break;
        case 'user':
          cmp = `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`);
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':      return 'bg-green-100  dark:bg-green-950/40  text-green-800  dark:text-green-200  border-green-200  dark:border-green-800';
      case 'PENDING':   return 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'CANCELLED': return 'bg-red-100    dark:bg-red-950/40    text-red-800    dark:text-red-200    border-red-200    dark:border-red-800';
      default:          return 'bg-gray-100   dark:bg-gray-800      text-gray-800   dark:text-gray-200   border-gray-200   dark:border-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':      return 'Approuvé';
      case 'PENDING':   return 'En attente';
      case 'CANCELLED': return 'Annulé';
      default:          return status;
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

  const stats = {
    total:        (payments || []).length,
    paid:         (payments || []).filter(p => p.status === 'PAID').length,
    pending:      (payments || []).filter(p => p.status === 'PENDING').length,
    cancelled:    (payments || []).filter(p => p.status === 'CANCELLED').length,
    totalRevenue: (payments || []).filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
    totalTickets: (payments || []).filter(p => p.status === 'PAID').reduce((s, p) => s + (p.ticketsAdded || 0), 0),
  };

  const statCards = [
    { label: 'Total',          value: stats.total,                           color: 'text-blue-600   dark:text-blue-400'   },
    { label: 'Approuvés',      value: stats.paid,                            color: 'text-green-600  dark:text-green-400'  },
    { label: 'En attente',     value: stats.pending,                         color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Revenus (PAID)', value: `${stats.totalRevenue.toFixed(2)} DT`, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Tickets vendus', value: stats.totalTickets,                    color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Annulés',        value: stats.cancelled,                       color: 'text-red-600    dark:text-red-400'    },
  ];

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortBy === col ? (
      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Paiements des Packages</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Approuvez les achats de packages des étudiants</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Exporter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-400">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={loadPayments} className="text-sm underline ml-4 hover:opacity-80">Réessayer</button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tous les statuts</option>
              <option value="PAID">Approuvés</option>
              <option value="PENDING">En attente</option>
              <option value="CANCELLED">Annulés</option>
            </select>
            <button
              onClick={loadPayments}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Rafraîchir
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPayments.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-xl p-4 flex items-center justify-between border border-blue-100 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedPayments.length} paiement(s) sélectionné(s)
              </span>
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                ✓ Approuver tout
              </button>
            </div>
            <button onClick={() => setSelectedPayments([])} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-lg">✕</button>
          </div>
        )}

        {/* Loading skeleton */}
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

        {/* Payments Table */}
        {!loading && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">

                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    {/* Checkbox */}
                    <th className="px-6 py-4 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                        onChange={selectAllVisible}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    {/* Étudiant */}
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => handleSort('user')}
                    >
                      Étudiant <SortIcon col="user" />
                    </th>
                    {/* Montant */}
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => handleSort('amount')}
                    >
                      Montant <SortIcon col="amount" />
                    </th>
                    {/* Tickets */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Tickets
                    </th>
                    {/* Date */}
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => handleSort('date')}
                    >
                      Date <SortIcon col="date" />
                    </th>
                    {/* Statut */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPayments.map(payment => {
                    const { date, time } = formatDate(payment.date);
                    const isLoading = actionLoading[payment.id];
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">

                        {/* Checkbox */}
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPayments.includes(payment.id)}
                            onChange={() => togglePaymentSelection(payment.id)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                        </td>

                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {payment.user.firstName[0]}{payment.user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {payment.user.firstName} {payment.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{payment.user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {payment.amount.toFixed(2)} DT
                          </span>
                        </td>

                        {/* Tickets */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {payment.ticketsAdded ?? 0} tickets
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{date}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
                        </td>

                        {/* Status + actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {payment.status === 'PENDING' && (
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(payment.status)}`}>
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
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(payment.status)}`}>
                              ✓ Approuvé
                            </span>
                          )}
                          {payment.status === 'CANCELLED' && (
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(payment.status)}`}>
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

            {/* Empty state */}
            {filteredPayments.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Aucun paiement trouvé</p>
                <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">Essayez de modifier vos critères de recherche</p>
              </div>
            )}

            {/* Footer count */}
            {filteredPayments.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 text-right">
                {filteredPayments.length} résultat(s) sur {payments.length} au total
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentsPage;