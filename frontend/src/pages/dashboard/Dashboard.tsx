import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardStats } from '../../services/dashboardService';
import api from '../../services/apiClient';

import { 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  MoreHorizontal,
  Activity,
  ArrowUp,
  ArrowDown,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';


const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeReservations: 0,
    ticketsSold: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [mealTypeData, setMealTypeData] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboardStats();
  }, [user, navigate]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setChartsLoading(true);
      const statsData = await dashboardService.getStats();
      setStats(statsData);
      await loadChartData();
      setError('');
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
      setChartsLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const responses = await Promise.all([
        api.get('/api/admin/monthly-stats'),
        api.get('/api/admin/meal-distribution'),
        api.get('/api/admin/weekly-activity'),
        api.get('/api/admin/user-growth'),
      ]);

      const [monthlyRes, mealsRes, weeklyRes, growthRes] = responses;

      setMonthlyData(monthlyRes || []);
      setMealTypeData(mealsRes || []);
      setWeeklyActivity(weeklyRes || []);
      setUserGrowthData(growthRes || []);

      if (!mealsRes || (Array.isArray(mealsRes) && mealsRes.length === 0)) {
        setMealTypeData([
          { name: 'Déjeuner', value: 1, color: '#3B82F6' },
          { name: 'Dîner',    value: 3, color: '#8B5CF6' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setMonthlyData([]);
      setMealTypeData([]);
      setWeeklyActivity([]);
      setUserGrowthData([]);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':            return 'Administrateur';
      case 'AGENT_RESTAURANT': return 'Agent Restaurant';
      case 'STUDENT':          return 'Étudiant';
      default:                 return 'Utilisateur';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':            return 'bg-purple-100 text-purple-800';
      case 'AGENT_RESTAURANT': return 'bg-blue-100   text-blue-800';
      case 'STUDENT':          return 'bg-green-100  text-green-800';
      default:                 return 'bg-gray-100   text-gray-800';
    }
  };

  // Shared loading spinner used inside chart cards
  const ChartSpinner = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-950/50 rounded-full mb-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">Chargement des données...</p>
      </div>
    </div>
  );

  // Shared empty state used inside chart cards
  const ChartEmpty = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
      </div>
    </div>
  );

  // ── Full-screen loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chargement...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Chargement des données du tableau de bord</p>
        </div>
      </div>
    );
  }

  // ── Full-screen error state ──
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Erreur</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
          <button
            onClick={loadDashboardStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

 {/* ── Welcome banner ── */}
<div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm p-5 text-white">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold mb-1">
        Bienvenue, {user?.firstName}!
      </h1>

      <p className="text-blue-100 text-sm">
        Voici un aperçu complet de votre tableau de bord
      </p>

      <div className="mt-3">
        <span
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(
            user?.role || ""
          )}`}
        >
          {getRoleLabel(user?.role || "")}
        </span>
      </div>
    </div>

    <div className="hidden lg:block">
      <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
        <Activity className="w-10 h-10 text-white" />
      </div>
    </div>
  </div>
</div>

      {/* ── Stat Cards — same card style as SettingsPage / PaymentsPage ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Users */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Utilisateurs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
           
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Reservations */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Réservations Actives</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeReservations}</p>
       
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Payments */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paiements</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.ticketsSold}</p>
           
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950/50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenu Mensuel</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.monthlyRevenue.toFixed(2)} DT</p>
       
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Revenue Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenus Mensuels</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {chartsLoading ? <ChartSpinner /> : monthlyData.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280' }} />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Meal Type Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Répartition des Repas</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {chartsLoading ? <ChartSpinner /> : mealTypeData.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mealTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {mealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* User Growth */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Croissance des Utilisateurs</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {chartsLoading ? <ChartSpinner /> : userGrowthData.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280' }} />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="#3B82F6" name="Étudiants" />
                <Line type="monotone" dataKey="agents"   stroke="#8B5CF6" name="Agents" />
                <Line type="monotone" dataKey="admins"   stroke="#10B981" name="Admins" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activité Hebdomadaire</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {chartsLoading ? <ChartSpinner /> : weeklyActivity.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                <XAxis dataKey="day" tick={{ fill: '#6B7280' }} />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827',
                  }}
                />
                <Legend />
                <Bar dataKey="reservations" fill="#3B82F6" name="Réservations" />
                <Bar dataKey="payments"     fill="#10B981" name="Paiements" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ── Quick Actions — same card style as SettingsPage / PaymentsPage ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <button
            onClick={() => navigate('/dashboard/users')}
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">Gérer les Utilisateurs</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/reservations')}
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">Voir les Réservations</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/payments')}
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">Gérer les Paiements</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/reports')}
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">Voir les Rapports</span>
          </button>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;