import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { industryData } from '../data/industry-data';

const IndustryListPage: React.FC = () => {
  const location = useLocation();
  const currentId = location.pathname.split('/')[2];

  return (
    <div className="industry-list-page">
      <div className="industry-sidebar">
        <h1>行业列表</h1>
        <ul className="industry-list">
          {industryData.map((industry) => (
            <li 
              key={industry.id} 
              className={`industry-item ${currentId === industry.id ? 'active' : ''}`}
            >
              <Link to={`/industries/${industry.id}`}>
                {industry.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="industry-content">
        <Outlet />
      </div>
    </div>
  );
};

export default IndustryListPage;