import React, { useState, useRef, useEffect } from 'react';
import { FiMenu, FiSearch, FiBell, FiChevronDown, FiSettings, FiActivity, FiLogOut, FiArrowDownRight, FiUserPlus, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import './Header.css';

const Header = ({ toggleSidebarMobile, toggleSidebarDesktop }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Poll for notifications
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/v1/tickets');
      let count = 0;
      res.data.tickets.forEach(ticket => {
        count += ticket.messages.filter(m => !m.read && m.senderId._id !== user?.id).length;
      });
      setUnreadCount(count);
    } catch (error) {
      // ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Generate Breadcrumbs
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    
    return (
      <div className="breadcrumbs">
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const label = path.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return (
            <React.Fragment key={path}>
              <span className={`breadcrumb-item ${isLast ? 'active' : ''}`}>{label}</span>
              {!isLast && <span className="breadcrumb-separator">/</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <button className="nav-toggle-btn" onClick={() => {
            if (window.innerWidth <= 1024) toggleSidebarMobile();
            else toggleSidebarDesktop();
        }}>
          <FiMenu size={22} />
        </button>
        {getBreadcrumbs()}
      </div>
      
      <div className="nav-right">
        {/* Quick action + search */}
        <div className="nav-search hidden-mobile">
            <FiSearch className="nav-search-icon" />
            <input type="text" placeholder="Quick search..." />
        </div>

        {/* Notifications Dropdown */}
        <div className="nav-dropdown-wrapper" ref={notifRef}>
          <button
            className="nav-icon-btn"
            onClick={() => setIsNotifDropdownOpen(prev => !prev)}
            title="Notifications"
          >
            <FiBell size={20} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {isNotifDropdownOpen && (
            <div className="nav-dropdown-menu notif-menu">
              {/* Header */}
              <div className="notif-header">
                <div className="notif-header-left">
                  <FiBell size={16} />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="notif-count-badge">{unreadCount} new</span>
                )}
              </div>

              {/* Body */}
              <div className="notif-body">
                {unreadCount > 0 ? (
                  <div className="notif-item unread">
                    <div className="notif-item-icon">
                      <FiMessageSquare size={16} />
                    </div>
                    <div className="notif-item-content">
                      <p className="notif-item-title">
                        <strong>{unreadCount} unread</strong> support message{unreadCount > 1 ? 's' : ''}
                      </p>
                      <p className="notif-item-desc">You have new replies in your support tickets</p>
                      <span className="notif-item-time">Just now</span>
                    </div>
                    <div className="notif-item-dot" />
                  </div>
                ) : (
                  <div className="notif-empty">
                    <div className="notif-empty-icon">🔔</div>
                    <p className="notif-empty-title">All caught up!</p>
                    <p className="notif-empty-sub">No new notifications right now</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="notif-footer">
                <button
                  className="notif-footer-btn"
                  onClick={() => { setIsNotifDropdownOpen(false); navigate('/dashboard/tickets'); }}
                >
                  <FiMessageSquare size={14} />
                  View Support Tickets
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="nav-divider"></div>

        {/* Profile Dropdown */}
        <div className="nav-dropdown-wrapper" ref={profileRef}>
          <div 
            className="user-profile-btn" 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="user-avatar">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
            </div>
            <div className="user-info hidden-mobile">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'merchant'}</span>
            </div>
            <FiChevronDown className="dropdown-icon hidden-mobile" />
          </div>

          {isProfileDropdownOpen && (
            <div className="nav-dropdown-menu profile-menu">
              <div className="dropdown-header profile-header">
                <div className="user-avatar large">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
                </div>
                <div>
                  <h4>{user?.name || 'User'}</h4>
                  <p>{user?.email || 'admin@aeropay.com'}</p>
                </div>
              </div>
              <div className="dropdown-links">
                <button 
                  className="dropdown-link-item" 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    navigate('/dashboard/account-settings');
                  }}
                >
                  <FiSettings /> Account Settings
                </button>
                <button 
                  className="dropdown-link-item" 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    navigate('/dashboard/activity-log');
                  }}
                >
                  <FiActivity /> Activity Log
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-link-item danger" onClick={handleLogout}><FiLogOut /> Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
