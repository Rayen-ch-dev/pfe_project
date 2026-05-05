import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current?: boolean;
  roles?: string[];
}

interface DashboardSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ open = true, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getIcon = (name: string) => {
    const iconBase = "w-5 h-5";
    switch (name) {
      case 'dashboard':
        return (
          <svg className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1H9M4 16h16M12 8h.01" />
          </svg>
        );
      case 'users':
        return (
          <svg className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'reservations':
        return (
          <svg className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'payments':
        return (
          <svg className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-6-4V3m2 2h4" />
          </svg>
        );
      case 'settings':
        return (
          <svg className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'reports':
        return (
          <svg className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
    }
  };

  const sidebarItems: SidebarItem[] = [
    {
      name: 'Tableau de bord',
      href: '/dashboard',
      icon: getIcon('dashboard'),
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Utilisateurs',
      href: '/dashboard/users',
      icon: getIcon('users'),
      current: location.pathname === '/dashboard/users',
      roles: ['ADMIN'],
    },
    {
      name: 'Réservations',
      href: '/dashboard/reservations',
      icon: getIcon('reservations'),
      current: location.pathname === '/dashboard/reservations',
      roles: ['ADMIN', 'AGENT_RESTAURANT'],
    },
    {
      name: 'Paiements',
      href: '/dashboard/payments',
      icon: getIcon('payments'),
      current: location.pathname === '/dashboard/payments',
      roles: ['ADMIN'],
    },
    {
      name: 'Rapports',
      href: '/dashboard/reports',
      icon: getIcon('reports'),
      current: location.pathname === '/dashboard/reports',
      roles: ['ADMIN'],
    },
    {
      name: 'Profil',
      href: '/dashboard/profile',
      icon: getIcon('settings'),
      current: location.pathname === '/dashboard/profile',
    },
  ];

  // Filter items based on user role
  const filteredItems = sidebarItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const handleItemClick = (item: SidebarItem) => {
    navigate(item.href);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.788 0l7-3a1 1 0 000-1.838l-7 3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM8.03 2h7.94a1 1 0 01.89.89 11.115 11.115 0 01.25 3.762 1 1 0 01-.89.89A8.969 8.969 0 0015 14.12v-4.102l1.69-.723a1 1 0 00.556-1.716l-7-3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">Portail</h1>
                <p className="text-xs text-gray-500">Scolaire</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleItemClick(item)}
                className={`
                  w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${item.current
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 p-1 rounded-md
                  ${item.current ? 'bg-white bg-opacity-20' : 'text-gray-400 group-hover:text-gray-500'}
                `}>
                  {item.icon}
                </div>
                <span className="ml-3">{item.name}</span>
                {item.current && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </nav>

          {/* User Info at Bottom */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === 'ADMIN' ? 'Administrateur' : 
                   user?.role === 'AGENT_RESTAURANT' ? 'Agent Restaurant' : 
                   user?.role === 'STUDENT' ? 'Étudiant' : 'Utilisateur'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
