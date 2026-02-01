import React from 'react';
import './ReportSectionNav.css';

/**
 * ReportSectionNav Component
 * Horizontal tab navigation for selecting report sections
 */
const ReportSectionNav = ({ sections = [], activeSection, onSectionChange }) => {
    return (
        <div className="report-section-nav">
            <div className="section-tabs">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        className={`section-tab ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => onSectionChange(section.id)}
                    >
                        {section.icon && (
                            <span className="section-icon">{section.icon}</span>
                        )}
                        <span className="section-label">{section.label}</span>
                        {section.badge && (
                            <span className="section-badge">{section.badge}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReportSectionNav;
