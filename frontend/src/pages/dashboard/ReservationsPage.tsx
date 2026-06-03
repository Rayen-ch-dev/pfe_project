import React, { useState, useEffect } from 'react';
import { dashboardService, type Reservation } from '../../services/dashboardService';

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'user' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'thisWeek' | 'thisYear'>('all');

  useEffect(() => { loadReservations(); }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getReservations();
      setReservations(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load reservations:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedReservation(null);
  };

  const filterByDate = (reservation: Reservation) => {
    const reservationDate = new Date(reservation.date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear   = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    switch (dateFilter) {
      case 'today':    return reservationDate >= today && reservationDate < tomorrow;
      case 'tomorrow': return reservationDate >= tomorrow && reservationDate < new Date(tomorrow.getTime() + 86400000);
      case 'thisWeek': return reservationDate >= startOfWeek && reservationDate <= endOfWeek;
      case 'thisYear': return reservationDate >= startOfYear && reservationDate <= endOfYear;
      default: return true;
    }
  };

  const filteredReservations = reservations.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.user.firstName.toLowerCase().includes(term) ||
      r.user.lastName.toLowerCase().includes(term)  ||
      r.user.email.toLowerCase().includes(term)      ||
      r.id.toLowerCase().includes(term);
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus && filterByDate(r);
  }).sort((a, b) => {
    let ca: any, cb: any;
    switch (sortBy) {
      case 'date':   ca = new Date(a.date).getTime(); cb = new Date(b.date).getTime(); break;
      case 'user':   ca = `${a.user.firstName} ${a.user.lastName}`; cb = `${b.user.firstName} ${b.user.lastName}`; break;
      case 'status': ca = a.status; cb = b.status; break;
      default: return 0;
    }
    if (sortOrder === 'asc') return ca > cb ? 1 : -1;
    return ca < cb ? 1 : -1;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':       return 'bg-green-100  dark:bg-green-950/40  text-green-800  dark:text-green-200  border-green-200  dark:border-green-800';
      case 'PAYMENT_PENDING': return 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'PENDING':         return 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'CANCELLED':       return 'bg-red-100    dark:bg-red-950/40    text-red-800    dark:text-red-200    border-red-200    dark:border-red-800';
      case 'USED':            return 'bg-blue-100   dark:bg-blue-950/40   text-blue-800   dark:text-blue-200   border-blue-200   dark:border-blue-800';
      default:                return 'bg-gray-100   dark:bg-gray-800      text-gray-800   dark:text-gray-200   border-gray-200   dark:border-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmée';
      case 'USED':      return 'Utilisée';
      default:          return status;
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'LUNCH':  return 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'DINNER': return 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      default:       return 'bg-gray-100   dark:bg-gray-800      text-gray-800   dark:text-gray-200   border-gray-200   dark:border-gray-600';
    }
  };

  const stats = {
    total:     filteredReservations.length,
    confirmed: filteredReservations.filter(r => r.status === 'CONFIRMED').length,
    used:      filteredReservations.filter(r => r.status === 'USED').length,
  };

  const handleSort = (col: 'date' | 'user' | 'status') => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('desc'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Réservations</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gérez toutes les réservations du système</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Exporter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Réservations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-950/50 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmées</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.confirmed}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilisées</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.used}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-950/50 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-400">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={loadReservations} className="text-sm underline ml-4 hover:opacity-80">Réessayer</button>
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
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tous les statuts</option>
              <option value="CONFIRMED">Confirmées</option>
              <option value="USED">Utilisées</option>
            </select>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="tomorrow">Demain</option>
              <option value="thisWeek">Cette semaine</option>
              <option value="thisYear">Cette année</option>
            </select>
          </div>
        </div>

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

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">

                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    {/* Utilisateur */}
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => handleSort('user')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Utilisateur</span>
                        {sortBy === 'user' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    {/* Date */}
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {sortBy === 'date' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    {/* Type de repas */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Type de repas
                    </th>
                    {/* Statut */}
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Statut</span>
                        {sortBy === 'status' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    {/* QR Code */}
                
                    {/* Actions */}
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReservations.map(reservation => (
                    <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">

                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {reservation.user.firstName[0]}{reservation.user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {reservation.user.firstName} {reservation.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{reservation.user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(reservation.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Meal type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg border ${getMealTypeColor(reservation.mealType)}`}>
                          {reservation.mealType === 'LUNCH' ? 'Déjeuner' : 'Dîner'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </td>

                  

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewDetails(reservation)}
                          className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-medium transition-colors"
                        >
                          Détails
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {filteredReservations.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Aucune réservation trouvée</p>
                <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">Essayez de modifier vos critères de recherche</p>
              </div>
            )}

            {/* Footer / pagination */}
            {filteredReservations.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Affichage de <span className="font-medium text-gray-900 dark:text-white">1</span> à{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{Math.min(10, filteredReservations.length)}</span> sur{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{filteredReservations.length}</span> réservations
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

      {/* Details Modal */}
      {showDetailsModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-6">

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Détails de la Réservation</h2>
                <button
                  onClick={handleCloseDetailsModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">

                {/* User info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Informations Utilisateur</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nom</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedReservation.user.firstName} {selectedReservation.user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedReservation.user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Reservation info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Informations Réservation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type de Repas</p>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg border ${getMealTypeColor(selectedReservation.mealType)}`}>
                        {selectedReservation.mealType === 'LUNCH' ? 'Déjeuner' : 'Dîner'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Statut</p>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(selectedReservation.status)}`}>
                        {getStatusText(selectedReservation.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedReservation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Heure</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedReservation.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date de Création</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedReservation.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR code */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Code QR</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Statut du Code QR</p>
                      <p className={`font-medium ${selectedReservation.qrCode ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {selectedReservation.qrCode ? 'Généré' : 'Non généré'}
                      </p>
                    </div>
                    {selectedReservation.qrCode && (
                      <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">QR</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={handleCloseDetailsModal}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReservationsPage;