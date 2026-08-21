import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TabsBar from './TabsBar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebarMobile = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarDesktop = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        isSidebarCollapsed={isSidebarCollapsed} 
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="dashboard-content">
        <Header 
          toggleSidebarMobile={() => setIsSidebarOpen(!isSidebarOpen)}
          toggleSidebarDesktop={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <TabsBar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
