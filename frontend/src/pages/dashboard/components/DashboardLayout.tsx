import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardHeader from './header/DashboardHeader';
import DashboardSidebar from './sideSection/DashboardSidebar';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <DashboardHeader 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen} 
      />

      {/* Sidebar + Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar 
          open={sidebarOpen} 
          onClose={closeSidebar} 
        />

        {/* Main Content Area */}
        <div className={`
          flex-1 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}
        `}>
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 z-40 lg:hidden"
              onClick={closeSidebar}
            >
              <div className="absolute inset-0 bg-gray-600 opacity-75 dark:bg-gray-900 dark:opacity-90"></div>
            </div>
          )}

          {/* Page Content */}
          <main className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
