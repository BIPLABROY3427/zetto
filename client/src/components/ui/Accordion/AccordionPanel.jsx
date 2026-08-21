import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import './AccordionPanel.css';

const AccordionPanel = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`accordion-panel ${isOpen ? 'open' : ''}`}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="accordion-title-group">
          {Icon && <Icon className="accordion-icon" />}
          <h3 className="accordion-title">{title}</h3>
        </div>
        <div className="accordion-toggle">
          {isOpen ? <FiChevronDown /> : <FiChevronRight />}
        </div>
      </div>
      
      {/* 
        Using a wrapper for smooth height transition if needed, 
        or simple conditional rendering for fast performance 
      */}
      {isOpen && (
        <div className="accordion-content-wrapper">
          <div className="accordion-content">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccordionPanel;
