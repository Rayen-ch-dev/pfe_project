import React, { useState } from 'react';
import { dashboardService } from '../../services/dashboardService';

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('users');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const generateReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      setError('Veuillez sélectionner une plage de dates');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const reportData = await dashboardService.generateReport(reportType, dateRange);
      const csv = convertToCSV(reportData, reportType);
      downloadCSV(csv, `report-${reportType}-${dateRange.start}-to-${dateRange.end}.csv`);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data: any, type: string): string => {
    switch (type) {
      case 'users':
        return 'ID,Prénom,Nom,Email,Rôle,Status,Créé le\n' +
          data.map((u: any) =>
            `${u.id},"${u.firstName}","${u.lastName}","${u.email}",${u.role},${u.status || 'N/A'},${u.createdAt}`
          ).join('\n');
      case 'reservations':
        return 'ID,Utilisateur,Email,Date,Type de repas,Status\n' +
          data.map((r: any) =>
            `${r.id},"${r.user.firstName} ${r.user.lastName}","${r.user.email}",${r.date},${r.mealType},${r.status}`
          ).join('\n');
      case 'payments':
        return 'ID,Utilisateur,Email,Montant,Tickets,Date\n' +
          data.map((p: any) =>
            `${p.id},"${p.user.firstName} ${p.user.lastName}","${p.user.email}",${p.amount},${p.ticketsAdded},${p.date}`
          ).join('\n');
      default:
        return '';
    }
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setQuickRange = (days: number | null) => {
    if (days === null) { setDateRange({ start: '', end: '' }); return; }
    const today = new Date();
    const from  = new Date();
    if (days === 365) from.setFullYear(today.getFullYear() - 1);
    else              from.setDate(today.getDate() - days);
    setDateRange({
      start: from.toISOString().split('T')[0],
      end:   today.toISOString().split('T')[0],
    });
  };

  const reportTypes = [
    { value: 'users',        label: 'Rapport des Utilisateurs',  description: 'Liste complète des utilisateurs avec leurs rôles et status' },
    { value: 'reservations', label: 'Rapport des Réservations',  description: 'Historique des réservations avec dates et status' },
    { value: 'payments',     label: 'Rapport des Paiements',     description: 'Transactions et achats de tickets' },
    { value: 'revenue',      label: 'Rapport des Revenus',       description: 'Analyse des revenus par période' },
  ];

  const infoCards = [
    { label: "Format d'export", value: 'CSV',           sub: 'Compatible avec Excel',    bg: 'bg-blue-100   dark:bg-blue-950/50',   dot: 'bg-blue-600'   },
    { label: "Type d'export",   value: 'Téléchargement', sub: 'Sauvegarde locale',        bg: 'bg-green-100  dark:bg-green-950/50',  dot: 'bg-green-600'  },
    { label: 'Données',         value: 'Temps réel',    sub: 'Mises à jour quotidiennes', bg: 'bg-purple-100 dark:bg-purple-950/50', dot: 'bg-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* ── Header — identical to SettingsPage / PaymentsPage ── */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Génération de Rapports
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Exportez des données et analyses
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Main config card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Configurer le rapport
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sélectionnez les paramètres pour générer votre rapport
            </p>
          </div>

          {/* ── Report type radio cards ── */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Type de rapport
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map(type => (
                <label
                  key={type.value}
                  className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                    reportType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={e => setReportType(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start">
                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex-shrink-0 transition-colors ${
                      reportType === type.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {reportType === type.value && (
                        <div className="w-2 h-2 rounded-full bg-white mx-auto mt-1" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">{type.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Date range inputs ── */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Plage de dates
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Quick range buttons ── */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Sélection rapide
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '7 derniers jours',  days: 7   },
                { label: '30 derniers jours', days: 30  },
                { label: '12 derniers mois',  days: 365 },
              ].map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setQuickRange(days)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setQuickRange(null)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Effacer
              </button>
            </div>
          </div>

          {/* ── Error alert ── */}
          {error && (
            <div className="p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-400 mb-6">
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* ── Generate button ── */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={generateReport}
              disabled={loading || !dateRange.start || !dateRange.end}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Génération en cours...
                </div>
              ) : (
                'Générer et télécharger'
              )}
            </button>
          </div>
        </div>

        {/* ── Info cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {infoCards.map(({ label, value, sub, bg, dot }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${bg} rounded-xl p-3`}>
                  <div className={`w-6 h-6 ${dot} rounded`} />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Help banner ── */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Besoin d'aide ?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Les rapports sont générés au format CSV et peuvent être ouverts avec Excel, Google Sheets ou tout autre tableur.
              </p>
            </div>
            <button
              onClick={() => window.open('/help/reports', '_blank')}
              className="px-4 py-2 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-blue-200 dark:border-blue-700 whitespace-nowrap"
            >
              Documentation
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;