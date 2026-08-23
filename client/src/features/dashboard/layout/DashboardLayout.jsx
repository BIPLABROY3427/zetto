import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import './DashboardLayout.css';
import Header from './Header';
import Sidebar from './Sidebar';
import TabsBar from './TabsBar';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="dashboard-layout">
      <div
        className={`sidebar-mobile-overlay ${isSidebarOpen ? 'visible' : ''}`}
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
