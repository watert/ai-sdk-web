import { Link, useLocation } from 'react-router-dom';

interface MenuItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isSidebarOpen: boolean;
  matchExact?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ to, icon, label, isSidebarOpen, matchExact = false }) => {
  const location = useLocation();
  
  // 判断是否激活
  const isActive = matchExact 
    ? location.pathname === to 
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <li>
      <Link 
        to={to} 
        className={`flex items-center truncate max-h-[40px] p-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600 dark:border-blue-400' : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
      >
        <span className="text-lg mr-3 min-w-[20px]">{icon}</span>
        <span className={`text-sm font-medium transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>{label}</span>
      </Link>
    </li>
  );
};

export default MenuItem;