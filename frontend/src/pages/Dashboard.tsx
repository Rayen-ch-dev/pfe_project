import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, type DashboardStats } from '../services/dashboardService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'Nouvel utilisateur inscrit', time: 'Il y a 5 minutes', read: false },
    { id: 2, title: 'Réservation annulée', time: 'Il y a 1 heure', read: false },
    { id: 3, title: 'Rapport mensuel disponible', time: 'Il y a 2 heures', read: true },
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsData, usersData, reservationsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getUsers(),
        dashboardService.getReservations()
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setReservations(reservationsData);
      setError('');
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  // Process real data for charts
  const processChartData = () => {
    // User growth data - group users by month
    const userGrowthByMonth = users.reduce((acc: any, user) => {
      const date = new Date(user.createdAt);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    // Reservation status data
    const reservationStatusCount = reservations.reduce((acc: any, reservation) => {
      const status = reservation.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Revenue data (mock for now - you can add payment data later)
    const revenueByMonth = reservations.reduce((acc: any, reservation) => {
      const date = new Date(reservation.date);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      acc[monthKey] = (acc[monthKey] || 0) + 10; // Assuming €10 per reservation
      return acc;
    }, {});

    return {
      userGrowthData: {
        labels: Object.keys(userGrowthByMonth).slice(-6), // Last 6 months
        datasets: [{
          label: 'Nouveaux utilisateurs',
          data: Object.values(userGrowthByMonth).slice(-6),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
        }]
      },
      reservationStatusData: {
        labels: ['Confirmées', 'En attente', 'Annulées', 'Terminées'],
        datasets: [{
          data: [
            reservationStatusCount.CONFIRMED || 0,
            reservationStatusCount.PENDING || 0,
            reservationStatusCount.CANCELLED || 0,
            reservationStatusCount.COMPLETED || 0
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(34, 197, 94, 0.8)',
          ],
          borderWidth: 0,
        }]
      },
      revenueData: {
        labels: Object.keys(revenueByMonth).slice(-6), // Last 6 months
        datasets: [{
          label: 'Revenus mensuels',
          data: Object.values(revenueByMonth).slice(-6),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        }]
      }
    };
  };

  const chartData = processChartData();
  const { userGrowthData, reservationStatusData, revenueData } = chartData;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  // Generate recent activities from real data
  const recentActivities: Array<{
    id: number;
    user: string;
    action: string;
    time: string;
    icon: string;
    color: string;
  }> = [
    // Show latest users
    ...users.slice(-3).reverse().map((user, index) => ({
      id: index + 1,
      user: `${user.firstName} ${user.lastName}`,
      action: 'a créé un compte',
      time: `Il y a ${Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60))} heures`,
      icon: '👤',
      color: 'green'
    })),
    // Show latest reservations
    ...reservations.slice(-2).reverse().map((reservation, index) => ({
      id: 100 + index,
      user: `${reservation.user.firstName} ${reservation.user.lastName}`,
      action: `a réservé ${reservation.mealType === 'LUNCH' ? 'un déjeuner' : 'un dîner'}`,
      time: `Il y a ${Math.floor((new Date().getTime() - new Date(reservation.date).getTime()) / (1000 * 60 * 60))} heures`,
      icon: '🍽️',
      color: 'blue'
    }))
  ].slice(0, 5); // Keep only 5 most recent activities

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-75"></div>
                  <div className="relative h-9 w-9 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AD</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Tableau de Bord
                  </h1>
                  <p className="text-xs text-gray-500">Panel Administrateur</p>
                </div>
              </div>
              
              {/* Time Range Selector */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                {(['week', 'month', 'year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      timeRange === range
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range === 'week' ? 'Semaine' : range === 'month' ? 'Mois' : 'Année'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}>
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="h-9 w-9 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center cursor-pointer shadow-md group-hover:shadow-lg transition-all">
                    <span className="text-white font-semibold text-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        Paramètres
                      </button>
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section with Stats Summary */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Bonjour, {user?.firstName || 'Administrateur'} 👋
              </h2>
              <p className="text-gray-600 mt-1">Voici ce qui se passe avec votre plateforme aujourd'hui</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Système opérationnel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white overflow-hidden shadow-lg rounded-2xl">
                  <div className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Grid with Modern Cards */}
          {!loading && !error && stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Utilisateurs</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-green-600 mt-2">↑ 12% depuis le mois dernier</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Réservations Actives</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeReservations?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-green-600 mt-2">↑ 8% depuis le mois dernier</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tickets Vendus</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stats.ticketsSold?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-yellow-600 mt-2">↑ 23% depuis le mois dernier</p>
                      </div>
                      <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white opacity-90">Revenus du Mois</p>
                        <p className="text-2xl font-bold text-white mt-2">€{stats.monthlyRevenue?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-white opacity-80 mt-2">↑ 15% depuis le mois dernier</p>
                      </div>
                      <div className="h-12 w-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Aperçu des Revenus</h3>
                      <p className="text-sm text-gray-500 mt-1">Évolution sur 12 mois</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md">Annuel</button>
                    </div>
                  </div>
                  <div className="h-80">
                    {revenueData.labels.length > 0 ? (
                      <Line data={revenueData} options={chartOptions} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-600">Aucune donnée de revenus</p>
                        <p className="text-sm text-gray-500 mt-1">Les données apparaîtront ici une fois que vous aurez des réservations</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Growth Chart */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Croissance des Utilisateurs</h3>
                      <p className="text-sm text-gray-500 mt-1">Nouveaux inscriptions par semaine</p>
                    </div>
                  </div>
                  <div className="h-80">
                    {userGrowthData.labels.length > 0 ? (
                      <Bar data={userGrowthData} options={chartOptions} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-600">Aucune donnée de croissance</p>
                        <p className="text-sm text-gray-500 mt-1">Les données apparaîtront ici une fois que vous aurez des nouveaux utilisateurs</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reservation Status Chart */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Statut des Réservations</h3>
                      <p className="text-sm text-gray-500 mt-1">Distribution par statut</p>
                    </div>
                  </div>
                  <div className="h-80">
                    {reservationStatusData.datasets[0].data.some(value => value > 0) ? (
                      <Doughnut data={reservationStatusData} options={chartOptions} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-600">Aucune réservation</p>
                        <p className="text-sm text-gray-500 mt-1">Les données apparaîtront ici une fois que vous aurez des réservations</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Activités Récentes</h3>
                      <p className="text-sm text-gray-500 mt-1">Dernières actions sur la plateforme</p>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700">Voir tout</button>
                  </div>
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                          <div className={`h-10 w-10 bg-${activity.color}-100 rounded-lg flex items-center justify-center`}>
                            <span className="text-xl">{activity.icon}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              <span className="font-semibold">{activity.user}</span> {activity.action}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Il y a {activity.time}</p>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-600">Aucune activité récente</p>
                        <p className="text-sm text-gray-500 mt-1">Les activités apparaîtront ici une fois que les utilisateurs commenceront à utiliser la plateforme</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions with Modern Design */}
              <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Actions Rapides</h3>
                  <p className="text-sm text-gray-500 mt-1">Accédez rapidement aux fonctionnalités administratives</p>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button 
                      onClick={() => navigate('/dashboard/users')}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Gérer les Utilisateurs</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => navigate('/dashboard/payments')}
                      className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Approuver Paiements</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => navigate('/dashboard/reservations')}
                      className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Voir les Réservations</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => navigate('/dashboard/reports')}
                      className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Générer un Rapport</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;