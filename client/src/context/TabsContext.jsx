import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TabsContext = createContext();

export const useTabs = () => useContext(TabsContext);

export const TabsProvider = ({ children }) => {
  const [tabs, setTabs] = useState([
    { path: '/dashboard', label: 'Home' } // Default tab
  ]);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Route map to generate labels dynamically
  const routeLabels = {
    '/dashboard': 'Home',
    '/dashboard/basic': 'Basic Setting',
    '/dashboard/payin': 'Payin Order',
    '/dashboard/payin-history': 'Payin History',
    '/dashboard/payout': 'Payout Order',
    '/dashboard/payout-history': 'Payout History',
    '/dashboard/daily-summary': 'Daily Summary',
    '/dashboard/bal-day-sum': 'Bal Day Sum',
    '/dashboard/tickets': 'Ticket List',
    '/dashboard/users': 'User Management',
    '/dashboard/system-overview': 'Gateway Health',
  };

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Check if the current route is in our known labels (exclude unknown dynamic routes)
    if (routeLabels[currentPath]) {
      setTabs((prevTabs) => {
        // If tab already exists, do nothing
        if (prevTabs.some((tab) => tab.path === currentPath)) {
          return prevTabs;
        }
        // Add new tab
        return [...prevTabs, { path: currentPath, label: routeLabels[currentPath] }];
      });
    }
  }, [location.pathname]);

  const removeTab = (pathToRemove, e) => {
    e.stopPropagation(); // Prevent tab click event
    
    if (tabs.length === 1) return; // Don't close the last tab

    const index = tabs.findIndex(t => t.path === pathToRemove);
    const newTabs = tabs.filter(t => t.path !== pathToRemove);
    setTabs(newTabs);

    // If we are closing the active tab, navigate to the previous one
    if (location.pathname === pathToRemove) {
      const nextTab = newTabs[index - 1] || newTabs[0];
      navigate(nextTab.path);
    }
  };

  return (
    <TabsContext.Provider value={{ tabs, removeTab, currentPath: location.pathname }}>
      {children}
    </TabsContext.Provider>
  );
};
