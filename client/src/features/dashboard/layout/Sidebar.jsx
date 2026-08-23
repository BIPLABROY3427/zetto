import { useEffect, useState } from 'react';
import {
  FiChevronDown,
  FiCode,
  FiCreditCard,
  FiHome,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiUser,
  FiUsers, FiX
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

/* ── Icon wrapper with color class ── */
const Icon = ({ icon: Comp, colorClass }) => (
  <span className={`menu-icon ${colorClass || ''}`}>
    <Comp />
  </span>
);

const Sidebar = ({ isSidebarOpen, isSidebarCollapsed, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});

  /* ── Menu Definitions ── */
  const baseMenuItems = [
    { id: '/dashboard', label: 'Home', icon: FiHome, color: 'icon-sky' },
    { id: '/dashboard/account-settings', label: 'Account Settings', icon: FiUser, color: 'icon-violet' },
    { id: '/dashboard/basic', label: 'Basic Setting', icon: FiSettings, color: 'icon-amber' },
    {
      id: 'recharge_management', label: 'Payment', icon: FiCreditCard, color: 'icon-emerald',
      subItems: [
        { id: '/dashboard/payin', label: 'Payins' },
        { id: '/dashboard/payout', label: 'Payouts' },
        { id: '/dashboard/daily-summary', label: 'Daily Summary' },
        { id: '/dashboard/bal-day-sum', label: 'Balance Summary' },
      ],
    },
    {
      id: 'support_tickets', label: 'Support Tickets', icon: FiMessageSquare, color: 'icon-rose',
      subItems: [{ id: '/dashboard/tickets', label: 'Ticket List' }],
    },
    { id: '/dashboard/api-docs', label: 'Developer API', icon: FiCode, color: 'icon-cyan' },
  ];

  const superAdminMenuItems = [
    {
      id: 'super_admin', label: 'Superadmin', icon: FiShield, color: 'icon-indigo',
      subItems: [
        { id: '/dashboard/system-overview', label: 'Gateway Health' },
        { id: '/dashboard/users', label: 'User Management' },
        { id: '/dashboard/roles-permissions', label: 'Roles & Permissions' },
        { id: '/dashboard/system-payins', label: 'Payin' },
        { id: '/dashboard/system-payouts', label: 'Payout' },
        { id: '/dashboard/system-transactions', label: 'Transaction History' },
        { id: '/dashboard/system-balances', label: 'Balance' },
      ],
    },
    ...baseMenuItems,
  ];

  const adminMenuItems = [
    baseMenuItems[0],
    {
      id: 'user_management', label: 'User Management', icon: FiUsers, color: 'icon-purple',
      subItems: [{ id: '/dashboard/users', label: 'User List' }]
    },
    ...baseMenuItems.slice(1),
  ];

  /* ── Admin permission-filtered menu ── */
  const hasViewPerm = (mod) => currentUser?.permissions?.[mod]?.view === true;

  let finalAdminMenuItems = [];
  if (currentUser?.role === 'admin') {
    const adminSystemSubs = [];

    // If they have Dashboard Overview, let them see Gateway Health
    if (hasViewPerm('Dashboard Overview')) adminSystemSubs.push({ id: '/dashboard/system-overview', label: 'Gateway Health' });

    // User Management
    if (hasViewPerm('User Management')) adminSystemSubs.push({ id: '/dashboard/users', label: 'User Management' });

    // Payment / Transaction Management (System-wide)
    if (hasViewPerm('Payin Management')) adminSystemSubs.push({ id: '/dashboard/system-payins', label: 'Payin' });
    if (hasViewPerm('Payout Management')) adminSystemSubs.push({ id: '/dashboard/system-payouts', label: 'Payout' });
    if (hasViewPerm('Transaction History')) {
      adminSystemSubs.push({ id: '/dashboard/system-transactions', label: 'Transaction History' });
      adminSystemSubs.push({ id: '/dashboard/system-balances', label: 'Balance' });
    }

    if (adminSystemSubs.length > 0) {
      finalAdminMenuItems.push({
        id: 'admin_system', label: 'Administration', icon: FiShield, color: 'icon-indigo',
        subItems: adminSystemSubs
      });
    }

    // Admins also get the standard merchant base menu so they can manage their own account
    finalAdminMenuItems.push(...baseMenuItems);
  }

  const menuItems =
    currentUser?.role === 'superadmin' ? superAdminMenuItems :
      currentUser?.role === 'admin' ? (finalAdminMenuItems.length > 0 ? finalAdminMenuItems : baseMenuItems) : baseMenuItems;

  /* ── Auto-expand active parent ── */
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems) {
        const childActive = item.subItems.some(s =>
          location.pathname === s.id || location.pathname.startsWith(`${s.id}/`)
        );
        if (childActive)
          setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
      }
    });
  }, [location.pathname]);

  const handleClick = (item) => {
    if (item.subItems) {
      setExpandedMenus(prev => ({ ...prev, [item.id]: !prev[item.id] }));
    } else {
      navigate(item.id);
      if (window.innerWidth <= 1024) setIsSidebarOpen(false);
    }
  };

  const isActive = (id) => {
    if (id === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    return location.pathname === id || location.pathname.startsWith(`${id}/`);
  };

  return (
    <aside className={`dashboard-sidebar${isSidebarOpen ? ' open' : ''}${isSidebarCollapsed ? ' collapsed' : ''}`}>

      {/* ── Logo ── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {isSidebarCollapsed ? (
            <div className="logo-icon-small">Z</div>
          ) : (
            <img src="/logo.png" alt="Zetto.in" className="brand-logo-img"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
        <button className="sidebar-close-mobile" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">
          <FiX size={18} />
        </button>
      </div>

      {/* ── Scrollable nav ── */}
      <div className="sidebar-menu">
        {!isSidebarCollapsed && <div className="menu-label">MAIN NAVIGATION</div>}

        <nav className="menu-nav">
          {menuItems.map(item => {
            const parentActive = isActive(item.id) || (item.subItems?.some(s => isActive(s.id)));
            return (
              <div key={item.id} className="menu-item-wrapper">
                <button
                  className={`menu-item${parentActive ? ' active' : ''}`}
                  onClick={() => handleClick(item)}
                >
                  <Icon icon={item.icon} colorClass={item.color} />

                  {!isSidebarCollapsed && (
                    <span className="menu-text">{item.label}</span>
                  )}

                  {!isSidebarCollapsed && item.subItems && (
                    <span className={`menu-chevron${expandedMenus[item.id] ? ' expanded' : ''}`}>
                      <FiChevronDown />
                    </span>
                  )}
                </button>

                {/* Submenu */}
                {!isSidebarCollapsed && item.subItems && (
                  <div className={`submenu-wrapper${expandedMenus[item.id] ? ' open' : ''}`}>
                    {item.subItems.map(sub => (
                      <button
                        key={sub.id}
                        className={`submenu-item${isActive(sub.id) ? ' active' : ''}`}
                        onClick={() => handleClick(sub)}
                      >
                        <span className="submenu-text">{sub.label}</span>
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
