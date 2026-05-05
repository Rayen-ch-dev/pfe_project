import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('users');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

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
          data.map((user: any) => 
            `${user.id},"${user.firstName}","${user.lastName}","${user.email}",${user.role},${user.status || 'N/A'},${user.createdAt}`
          ).join('\n');
      
      case 'reservations':
        return 'ID,Utilisateur,Email,Date,Type de repas,Status\n' + 
          data.map((res: any) => 
            `${res.id},"${res.user.firstName} ${res.user.lastName}","${res.user.email}",${res.date},${res.mealType},${res.status}`
          ).join('\n');
      
      case 'payments':
        return 'ID,Utilisateur,Email,Montant,Tickets,Date\n' + 
          data.map((pay: any) => 
            `${pay.id},"${pay.user.firstName} ${pay.user.lastName}","${pay.user.email}",${pay.amount},${pay.ticketsAdded},${pay.date}`
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

  const reportTypes = [
    { value: 'users', label: 'Rapport des Utilisateurs', description: 'Liste complète des utilisateurs avec leurs rôles et status' },
    { value: 'reservations', label: 'Rapport des Réservations', description: 'Historique des réservations avec dates et status' },
    { value: 'payments', label: 'Rapport des Paiements', description: 'Transactions et achats de tickets' },
    { value: 'revenue', label: 'Rapport des Revenus', description: 'Analyse des revenus par période' }
  ];

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
                  <span className="text-sm font-medium">Retour</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Génération de Rapports
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Exportez des données et analyses</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Configurer le rapport</h2>
                <p className="text-sm text-gray-500">Sélectionnez les paramètres pour générer votre rapport</p>
              </div>

              {/* Report Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Type de rapport
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                        reportType === type.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={type.value}
                        checked={reportType === type.value}
                        onChange={(e) => setReportType(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex-shrink-0 transition-colors ${
                          reportType === type.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {reportType === type.value && (
                            <div className="w-2 h-2 rounded-full bg-white mx-auto mt-1"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Plage de dates
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">Date de début</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">Date de fin</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Date Range Buttons */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sélection rapide
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date();
                      weekAgo.setDate(today.getDate() - 7);
                      setDateRange({
                        start: weekAgo.toISOString().split('T')[0],
                        end: today.toISOString().split('T')[0]
                      });
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ️7 derniers jours
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date();
                      monthAgo.setMonth(today.getMonth() - 1);
                      setDateRange({
                        start: monthAgo.toISOString().split('T')[0],
                        end: today.toISOString().split('T')[0]
                      });
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    30 derniers jours
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const yearAgo = new Date();
                      yearAgo.setFullYear(today.getFullYear() - 1);
                      setDateRange({
                        start: yearAgo.toISOString().split('T')[0],
                        end: today.toISOString().split('T')[0]
                      });
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    12 derniers mois
                  </button>
                  <button
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Effacer
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={generateReport}
                  disabled={loading || !dateRange.start || !dateRange.end}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Génération en cours...
                    </div>
                  ) : (
                    'Générer et télécharger'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-xl p-3">
                  <div className="w-6 h-6 bg-blue-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Format d'export</div>
                  <div className="text-xl font-bold text-gray-900">CSV</div>
                  <div className="text-xs text-gray-500 mt-1">Compatible avec Excel</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-xl p-3">
                  <div className="w-6 h-6 bg-green-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Type d'export</div>
                  <div className="text-xl font-bold text-gray-900">Téléchargement</div>
                  <div className="text-xs text-gray-500 mt-1">Sauvegarde locale</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-xl p-3">
                  <div className="w-6 h-6 bg-purple-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Données</div>
                  <div className="text-xl font-bold text-gray-900">Temps réel</div>
                  <div className="text-xs text-gray-500 mt-1">Mises à jour quotidiennes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Besoin d'aide ?
                </h3>
                <p className="text-sm text-gray-600">
                  Les rapports sont générés au format CSV et peuvent être ouverts avec Excel, Google Sheets ou tout autre tableur.
                </p>
              </div>
              <button
                onClick={() => window.open('/help/reports', '_blank')}
                className="mt-4 md:mt-0 px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-blue-200"
              >
                Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;