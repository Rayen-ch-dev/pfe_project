import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Moon, 
  Globe, 
  HelpCircle, 
  Mail, 
  Info, 
  LogOut, 
  Trash2, 
  Smartphone, 
  Key,
  AlertTriangle,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsState {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  darkMode: boolean;
  language: string;
  notifications: boolean;
  twoFactorEnabled: boolean;
  loginActivity: boolean;
  connectedDevices: boolean;
}

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('account');
  const [accountLoading, setAccountLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [settings, setSettings] = useState<SettingsState>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    darkMode: false,
    language: 'fr',
    notifications: true,
    twoFactorEnabled: false,
    loginActivity: true,
    connectedDevices: true,
  });

  const [mockData] = useState({
    loginActivity: [
      { id: 1, device: 'Chrome on Windows', location: 'Tunis, Tunisia', time: '2026-05-09 14:30', status: 'active' },
      { id: 2, device: 'Mobile App', location: 'Tunis, Tunisia', time: '2026-05-09 12:15', status: 'active' },
      { id: 3, device: 'Firefox on Mac', location: 'Tunis, Tunisia', time: '2026-05-08 18:45', status: 'expired' },
    ],
    connectedDevices: [
      { id: 1, name: 'Windows Laptop', type: 'desktop', lastActive: '2026-05-09 14:30', trusted: true },
      { id: 2, name: 'iPhone 14', type: 'mobile', lastActive: '2026-05-09 12:15', trusted: true },
      { id: 3, name: 'iPad Pro', type: 'tablet', lastActive: '2026-05-08 09:20', trusted: false },
    ],
  });

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleSaveAccount = async () => {
    setAccountLoading(true);
    try {
      if (!settings.firstName || !settings.lastName || !settings.email) {
        setMessage('Tous les champs sont obligatoires');
        setMessageType('error');
        return;
      }
      await dashboardService.updateAdminProfile({
        firstName: settings.firstName,
        lastName: settings.lastName,
        email: settings.email,
      });
      setMessage('Informations du compte mises à jour avec succès');
      setMessageType('success');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Échec de la mise à jour du compte');
      setMessageType('error');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordLoading(true);
    try {
      if (!settings.currentPassword || !settings.newPassword || !settings.confirmPassword) {
        setMessage('Tous les champs de mot de passe sont obligatoires');
        setMessageType('error');
        return;
      }
      if (settings.newPassword !== settings.confirmPassword) {
        setMessage('Les mots de passe ne correspondent pas');
        setMessageType('error');
        return;
      }
      await dashboardService.updateAdminProfile({
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword,
      });
      setMessage('Mot de passe mis à jour avec succès');
      setMessageType('success');
      setSettings(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Échec de la mise à jour du mot de passe');
      setMessageType('error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/signin');
    } catch {
      setMessage('Échec de la déconnexion');
      setMessageType('error');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await handleLogout();
      } catch {
        setMessage('Échec de la suppression du compte');
        setMessageType('error');
      }
    }
  };

  const sections = [
    { id: 'account',     name: 'Compte',      icon: User },
    { id: 'preferences', name: 'Préférences', icon: Settings },
    { id: 'security',    name: 'Sécurité',    icon: Shield },
    { id: 'support',     name: 'Support',     icon: HelpCircle },
  ];

  // Reusable toggle switch
  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={
        'relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
        (on ? 'bg-blue-600' : 'bg-gray-200')
      }
    >
      <span className={
        'inline-block w-4 h-4 transform bg-white rounded-full transition-transform ' +
        (on ? 'translate-x-6' : 'translate-x-1')
      } />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-sm text-gray-500">Gérez vos préférences et votre compte</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-1">
                {sections.map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={
                      'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ' +
                      (activeSection === id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')
                    }
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">

              {/* Alert */}
              {message && (
                <div className={
                  'p-4 rounded-xl border-l-4 ' +
                  (messageType === 'success' ? 'bg-green-50 text-green-800 border-green-400'
                    : messageType === 'error' ? 'bg-red-50 text-red-800 border-red-400'
                    : 'bg-yellow-50 text-yellow-800 border-yellow-400')
                }>
                  <div className="flex items-center">
                    {messageType === 'success'
                      ? <Bell className="h-4 w-4 mr-2" />
                      : <AlertTriangle className="h-4 w-4 mr-2" />}
                    <span className="text-sm font-medium">{message}</span>
                  </div>
                </div>
              )}

              {/* ── ACCOUNT ── */}
              {activeSection === 'account' && (
                <>
                  {/* Profile info card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-6">
                      <User className="h-5 w-5 text-blue-600 mr-3" />
                      <h2 className="text-lg font-semibold text-gray-900">Paramètres du compte</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                          <input
                            type="text"
                            value={settings.firstName}
                            onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                          <input
                            type="text"
                            value={settings.lastName}
                            onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex justify-end space-x-4 pt-2">
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSaveAccount}
                          disabled={accountLoading}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {accountLoading ? 'Enregistrement...' : 'Enregistrer les informations'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password card — separate sibling card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-6">
                      <Key className="h-5 w-5 text-blue-600 mr-3" />
                      <h2 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={settings.currentPassword}
                            onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Requis pour changer le mot de passe"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showCurrentPassword
                              ? <EyeOff className="h-4 w-4 text-gray-400" />
                              : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={settings.newPassword}
                              onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Laisser vide pour garder l'actuel"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showNewPassword
                                ? <EyeOff className="h-4 w-4 text-gray-400" />
                                : <Eye className="h-4 w-4 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                          <input
                            type="password"
                            value={settings.confirmPassword}
                            onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirmer le nouveau mot de passe"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4 pt-2">
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSavePassword}
                          disabled={passwordLoading}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {passwordLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── PREFERENCES ── */}
              {activeSection === 'preferences' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-6">
                    <Settings className="h-5 w-5 text-blue-600 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-900">Préférences</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 text-gray-600 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Mode sombre</h3>
                          <p className="text-xs text-gray-500">Activer le thème sombre pour l'interface</p>
                        </div>
                      </div>
                      <Toggle on={settings.darkMode} onToggle={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 text-gray-600 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Langue</h3>
                          <p className="text-xs text-gray-500">Choisir la langue de l'interface</p>
                        </div>
                      </div>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bell className="h-4 w-4 text-gray-600 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                          <p className="text-xs text-gray-500">Recevoir des notifications par email</p>
                        </div>
                      </div>
                      <Toggle on={settings.notifications} onToggle={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-6">
                      <Shield className="h-5 w-5 text-blue-600 mr-3" />
                      <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Key className="h-4 w-4 text-gray-600 mr-3" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">Authentification à deux facteurs</h3>
                            <p className="text-xs text-gray-500">Ajouter une couche de sécurité supplémentaire</p>
                          </div>
                        </div>
                        <Toggle on={settings.twoFactorEnabled} onToggle={() => setSettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 text-gray-600 mr-3" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">Activité de connexion</h3>
                            <p className="text-xs text-gray-500">Voir l'historique des connexions</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, loginActivity: !prev.loginActivity }))}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          {settings.loginActivity ? 'Masquer' : 'Voir'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Smartphone className="h-4 w-4 text-gray-600 mr-3" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">Appareils connectés</h3>
                            <p className="text-xs text-gray-500">Gérer les appareils connectés</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, connectedDevices: !prev.connectedDevices }))}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          {settings.connectedDevices ? 'Masquer' : 'Gérer'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {settings.loginActivity && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Activité de connexion récente</h3>
                      <div className="space-y-3">
                        {mockData.loginActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-3 ${activity.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{activity.device}</p>
                                <p className="text-xs text-gray-500">{activity.location} • {activity.time}</p>
                              </div>
                            </div>
                            <span className={
                              'text-xs px-2 py-1 rounded-full ' +
                              (activity.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')
                            }>
                              {activity.status === 'active' ? 'Actif' : 'Expiré'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {settings.connectedDevices && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Appareils connectés</h3>
                      <div className="space-y-3">
                        {mockData.connectedDevices.map((device) => (
                          <div key={device.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center">
                              <Smartphone className="h-4 w-4 text-gray-600 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{device.name}</p>
                                <p className="text-xs text-gray-500">Dernière activité: {device.lastActive}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={
                                'text-xs px-2 py-1 rounded-full ' +
                                (device.trusted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')
                              }>
                                {device.trusted ? 'Fiable' : 'Non fiable'}
                              </span>
                              <button className="text-red-600 hover:text-red-800 text-sm">
                                Révoquer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SUPPORT ── */}
              {activeSection === 'support' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-6">
                      <HelpCircle className="h-5 w-5 text-blue-600 mr-3" />
                      <h2 className="text-lg font-semibold text-gray-900">Support</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <HelpCircle className="h-6 w-6 text-blue-600 mb-2" />
                        <h3 className="text-sm font-medium text-gray-900">Centre d'aide</h3>
                        <p className="text-xs text-gray-500">Articles et tutoriels</p>
                      </button>
                      <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <Mail className="h-6 w-6 text-blue-600 mb-2" />
                        <h3 className="text-sm font-medium text-gray-900">Nous contacter</h3>
                        <p className="text-xs text-gray-500">Support par email</p>
                      </button>
                      <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <Info className="h-6 w-6 text-blue-600 mb-2" />
                        <h3 className="text-sm font-medium text-gray-900">À propos</h3>
                        <p className="text-xs text-gray-500">Informations sur l'application</p>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">À propos de l'application</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Version</span>
                        <span className="text-sm font-medium text-gray-900">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Dernière mise à jour</span>
                        <span className="text-sm font-medium text-gray-900">09/05/2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Licence</span>
                        <span className="text-sm font-medium text-gray-900">MIT</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DANGER ZONE (always visible) ── */}
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <div className="flex items-center mb-6">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Zone de danger</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Déconnexion</h3>
                      <p className="text-xs text-gray-500">Se déconnecter de votre compte</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Supprimer le compte</h3>
                      <p className="text-xs text-gray-500">Supprimer définitivement votre compte</p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;