import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  FiHome, FiCreditCard, FiSettings,
  FiMessageSquare, FiUsers, FiX, FiChevronDown, FiActivity, FiCode, FiUser
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ isSidebarOpen, isSidebarCollapsed, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const [expandedMenus, setExpandedMenus] = useState({});

  // Base menu structure based on user's screenshots
  const baseMenuItems = [
    { id: '/dashboard', label: 'Home', icon: <FiHome /> },
    { id: '/dashboard/profile', label: 'My Profile', icon: <FiUser /> },
    { id: '/dashboard/basic', label: 'Basic Setting', icon: <FiSettings /> },
    {
      id: 'recharge_management', label: 'Payment', icon: <FiCreditCard />,
      subItems: [
        { id: '/dashboard/payin', label: 'Payin Order' },
        { id: '/dashboard/payin-history', label: 'Payin History' },
        { id: '/dashboard/payout', label: 'Payout Order' },
        { id: '/dashboard/payout-history', label: 'Payout History' },
        { id: '/dashboard/daily-summary', label: 'Daily Summary' },
        { id: '/dashboard/bal-day-sum', label: 'Bal Day Sum' }
      ]
    },
    {
      id: 'support_tickets', label: 'Support Tickets', icon: <FiMessageSquare />,
      subItems: [
        { id: '/dashboard/tickets', label: 'Ticket List' }
      ]
    },
    { id: '/dashboard/api-docs', label: 'Developer API', icon: <FiCode /> }
  ];

  const adminMenuItems = [
    baseMenuItems[0],
    {
      id: 'user_management', label: 'User Management', icon: <FiUsers />,
      subItems: [
        { id: '/dashboard/users', label: 'User List' }
      ]
    },
    ...baseMenuItems.slice(1)
  ];

  const superAdminMenuItems = [
    {
      id: 'super_admin', label: 'Superadmin', icon: <FiActivity />,
      subItems: [
        { id: '/dashboard/system-overview', label: 'Home' },
        { id: '/dashboard/users', label: 'User Management' },
        { id: '/dashboard/roles-permissions', label: 'Roles & Permissions' },
        { id: '/dashboard/system-payins', label: 'Payin' },
        { id: '/dashboard/system-payouts', label: 'Payout' },
        { id: '/dashboard/system-transactions', label: 'Transaction history' },
        { id: '/dashboard/system-balances', label: 'Balance' }
      ]
    },
    ...baseMenuItems
  ];

  // Helper to check if admin has view permission
  const hasViewPerm = (moduleName) => {
    if (!currentUser?.permissions) return false;
    return currentUser.permissions[moduleName]?.view === true;
  };

  // Build admin menu dynamically based on customRole permissions
  let finalAdminMenuItems = [];
  if (currentUser?.role === 'admin') {
    if (hasViewPerm('Dashboard Overview')) finalAdminMenuItems.push(baseMenuItems[0]);
    
    if (hasViewPerm('User Management')) {
      finalAdminMenuItems.push({
        id: 'user_management', label: 'User Management', icon: <FiUsers />,
        subItems: [{ id: '/dashboard/users', label: 'User List' }]
      });
    }

    if (hasViewPerm('Developer Settings')) finalAdminMenuItems.push(baseMenuItems[1]);

    // Payment Section
    let paymentSubItems = [];
    if (hasViewPerm('Payin Management')) {
      paymentSubItems.push({ id: '/dashboard/payin', label: 'Payin Order' });
      paymentSubItems.push({ id: '/dashboard/payin-history', label: 'Payin History' });
    }
    if (hasViewPerm('Payout Management')) {
      paymentSubItems.push({ id: '/dashboard/payout', label: 'Payout Order' });
      paymentSubItems.push({ id: '/dashboard/payout-history', label: 'Payout History' });
    }
    if (hasViewPerm('Transaction History')) {
      paymentSubItems.push({ id: '/dashboard/daily-summary', label: 'Daily Summary' });
      paymentSubItems.push({ id: '/dashboard/bal-day-sum', label: 'Bal Day Sum' });
    }
    if (paymentSubItems.length > 0) {
      finalAdminMenuItems.push({
        id: 'recharge_management', label: 'Payment', icon: <FiCreditCard />,
        subItems: paymentSubItems
      });
    }

    if (hasViewPerm('Support Tickets')) finalAdminMenuItems.push(baseMenuItems[3]);
    if (hasViewPerm('API Documentation')) finalAdminMenuItems.push(baseMenuItems[4]);
  }

  const menuItems = currentUser?.role === 'superadmin'
    ? superAdminMenuItems
    : (currentUser?.role === 'admin' ? finalAdminMenuItems : baseMenuItems);

  // Auto-expand menu if active path is inside it
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(sub => location.pathname === sub.id || location.pathname.startsWith(`${sub.id}/`));
        if (isChildActive) {
          setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const handleTabClick = (item) => {
    if (item.subItems) {
      if (isSidebarCollapsed) {
        // Can't expand in collapsed mode easily without popovers, so maybe open sidebar
        // In a real app, you'd trigger a floating menu. For now, just expand.
        setExpandedMenus(prev => ({ ...prev, [item.id]: !prev[item.id] }));
      } else {
        setExpandedMenus(prev => ({ ...prev, [item.id]: !prev[item.id] }));
      }
    } else {
      navigate(item.id);
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      }
    }
  };

  const isItemActive = (id) => {
    if (id === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    return location.pathname === id || location.pathname.startsWith(`${id}/`);
  };

  return (
    <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {isSidebarCollapsed ? (
            <img src="/fanicon.png" alt="Z" className="logo-icon-small" style={{ background: 'transparent', objectFit: 'contain' }} />
          ) : (
            <img src="/logo.png" alt="Zetto.in" className="brand-logo-img" />
          )}
        </div>
        <button className="sidebar-close-mobile" onClick={() => setIsSidebarOpen(false)}>
          <FiX size={24} />
        </button>
      </div>

      <div className="sidebar-menu">
        {!isSidebarCollapsed && <div className="menu-label">MAIN NAVIGATION</div>}
        <nav className="menu-nav">
          {menuItems.map(item => {
            const isActive = isItemActive(item.id) || (item.subItems && item.subItems.some(sub => isItemActive(sub.id)));
            return (
              <div key={item.id} className="menu-item-wrapper">
                <button
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(item)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="menu-text">{item.label}</span>}

                  {!isSidebarCollapsed && item.subItems && (
                    <span className={`menu-chevron ${expandedMenus[item.id] ? 'expanded' : ''}`}>
                      <FiChevronDown />
                    </span>
                  )}
                </button>

                {/* Render Accordion Submenu */}
                {!isSidebarCollapsed && item.subItems && (
                  <div className={`submenu-wrapper ${expandedMenus[item.id] ? 'open' : ''}`}>
                    {item.subItems.map(subItem => (
                      <button
                        key={subItem.id}
                        className={`submenu-item ${isItemActive(subItem.id) ? 'active' : ''}`}
                        onClick={() => handleTabClick(subItem)}
                      >
                        <span className="submenu-bullet"></span>
                        <span className="submenu-text">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
