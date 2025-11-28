import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { industryData } from '../data/industry-data';

const IndustryListPage: React.FC = () => {
  const location = useLocation();
  const currentId = location.pathname.split('/')[2];

  // 按priority排序，priority越大越靠前，没有priority的排在最后
  const sortedIndustries = [...industryData].sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    return priorityB - priorityA;
  });

  return (
    <div className="flex h-full w-full">
      <div className="-ml-6 w-58 bg-gray-50 px-4 border-r border-gray-200 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-5">行业列表</h1>
        <ul className="list-none p-0 m-0">
          {sortedIndustries.map((industry) => (
            <li  key={industry.id}  className="mb-1" >
              <Link 
                to={`/industries/${industry.id}`}
                className={`block p-2 rounded-md transition-all duration-200 ${ 
                  currentId === industry.id 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-medium mb-1 flex items-center justify-between">
                  <div className="flex items-center">
                    {industry.emoji && <span className="mr-1">{industry.emoji}</span>}
                    {industry.name}
                  </div>
                  {industry.enableResearch && (
                    <span 
                      className="text-sm" 
                      title="已启用研究功能"
                    >
                      🔬
                    </span>
                  )}
                </div>
                <div className={`text-xs ${ 
                  currentId === industry.id 
                    ? 'text-blue-100' 
                    : 'text-gray-500'
                } truncate`}>
                  {industry.desc}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 p-5 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default IndustryListPage;