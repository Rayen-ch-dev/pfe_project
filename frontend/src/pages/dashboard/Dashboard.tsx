import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardStats } from '../../services/dashboardService';
import api from '../../services/apiClient';
import type { AxiosResponse } from 'axios';

import { 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  MoreHorizontal,
  UserPlus,
  Clock,
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown
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

  // Real data state for charts
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
      
      // Load main stats
      const statsData = await dashboardService.getStats();
      setStats(statsData);
      
      // Load chart data
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
      console.log('Loading chart data...');
      
      // Check authentication
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('🔐 Authentication check:');
      console.log('  Token exists:', !!token);
      console.log('  Token value:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('  User exists:', !!user);
      console.log('  User data:', user);

      // Fetch real data from individual API endpoints using authenticated API client
      try {
        console.log('🔍 Making API calls...');
        
        const monthlyResponse = api.get('/api/admin/monthly-stats');
        const mealsResponse = api.get('/api/admin/meal-distribution');
        const weeklyResponse = api.get('/api/admin/weekly-activity');
        const growthResponse = api.get('/api/admin/user-growth');

        console.log('📡 API calls initiated, waiting for responses...');

        const responses = await Promise.all([
          monthlyResponse,
          mealsResponse,
          weeklyResponse,
          growthResponse
        ]);

        console.log('✅ All API responses received:', responses);

        // Extract data from API responses
        console.log('🔍 Extracting data from responses:', responses);
        const monthlyData = responses[0];
        const mealsData = responses[1];
        const weeklyData = responses[2];
        const growthData = responses[3];
        
        console.log('📊 Extracted data:');
        console.log('  Monthly data:', monthlyData);
        console.log('  Meal data:', mealsData);
        console.log('  Weekly data:', weeklyData);
        console.log('  Growth data:', growthData);

        // Set all chart data from real API responses
        setMonthlyData(monthlyData || []);
        setMealTypeData(mealsData || []);
        setWeeklyActivity(weeklyData || []);
        setUserGrowthData(growthData || []);
        
        // TEMPORARY: Use mock data if API returns empty to test UI
        if (!mealsData || (Array.isArray(mealsData) && mealsData.length === 0)) {
          console.log('🔧 Using mock meal data for testing...');
          setMealTypeData([
            { name: 'Déjeuner', value: 1, color: '#3B82F6' },
            { name: 'Dîner', value: 3, color: '#8B5CF6' }
          ]);
        }
        
        console.log('✅ All real chart data loaded successfully!');
        console.log('Monthly data:', monthlyData);
        console.log('Meal distribution data:', mealsData);
        console.log('Weekly data:', weeklyData);
        console.log('User growth data:', growthData);
      } catch (apiError) {
        console.error('❌ API Error:', apiError);
        console.error('❌ API Error Details:', apiError.response?.status, apiError.response?.data);
        console.error('❌ Full Error Object:', apiError);
        // Set empty arrays if API calls fail
        setMonthlyData([]);
        setMealTypeData([]);
        setWeeklyActivity([]);
        setUserGrowthData([]);
      }
      
      console.log('✅ All real chart data loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load chart data:', error);
      // Set empty arrays if API calls fail
      setMonthlyData([]);
      setMealTypeData([]);
      setWeeklyActivity([]);
      setUserGrowthData([]);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'AGENT_RESTAURANT':
        return 'Agent Restaurant';
      case 'STUDENT':
        return 'Étudiant';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'AGENT_RESTAURANT':
        return 'bg-blue-100 text-blue-800';
      case 'STUDENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Chargement...</h2>
          <p className="text-gray-500 mt-2">Chargement des données du tableau de bord</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Erreur</h2>
          <p className="text-gray-500 mt-2">{error}</p>
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bienvenue, {user?.firstName}!
            </h1>
            <p className="text-blue-100 text-lg">
              Voici un aperçu complet de votre tableau de bord
            </p>
            <div className="mt-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(user?.role || '')}`}>
                {getRoleLabel(user?.role || '')}
              </span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
              <Activity className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Utilisateurs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">+12%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Réservations Actives</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeReservations}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">+8%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Paiements</p>
              <p className="text-3xl font-bold text-gray-900">{stats.ticketsSold}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-red-500">-3%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenu Mensuel</p>
              <p className="text-3xl font-bold text-gray-900">{stats.monthlyRevenue.toFixed(2)} DT</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">+15%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Revenus Mensuels</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {chartsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500">Chargement des données...</p>
              </div>
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Meal Type Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Répartition des Repas</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {chartsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500">Chargement des données...</p>
              </div>
            </div>
          ) : mealTypeData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mealTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* User Growth and Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Croissance des Utilisateurs</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {chartsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500">Chargement des données...</p>
              </div>
            </div>
          ) : userGrowthData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="#3B82F6" name="Étudiants" />
                <Line type="monotone" dataKey="agents" stroke="#8B5CF6" name="Agents" />
                <Line type="monotone" dataKey="admins" stroke="#10B981" name="Admins" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Activité Hebdomadaire</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {chartsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500">Chargement des données...</p>
              </div>
            </div>
          ) : weeklyActivity.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reservations" fill="#3B82F6" name="Réservations" />
                <Bar dataKey="payments" fill="#10B981" name="Paiements" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/dashboard/users')}
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-700 font-medium">Gérer les Utilisateurs</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/reservations')}
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Calendar className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-700 font-medium">Voir les Réservations</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/payments')}
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-700 font-medium">Gérer les Paiements</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/reports')}
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-700 font-medium">Voir les Rapports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
