import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTabs } from '../../../context/TabsContext';
import './TabsBar.css';

const TabsBar = () => {
  const { tabs, removeTab, currentPath } = useTabs();
  const navigate = useNavigate();

  return (
    <div className="tabs-bar-container">
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className={`tab-item ${currentPath === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="tab-label">{tab.label}</span>
          {tabs.length > 1 && (
            <span
              className="tab-close"
              onClick={(e) => removeTab(tab.path, e)}
            >
              <FiX size={14} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default TabsBar;
