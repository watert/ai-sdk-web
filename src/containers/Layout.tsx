import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* 左侧菜单 */}
      <aside 
        className={`w-[250px] h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-[250px]' : 'w-[60px]'}`}
      >
        <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all duration-200">
          <h2 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>AI 聊天</h2>
          <button 
            className="text-slate-900 dark:text-slate-100 text-base cursor-pointer p-2 rounded-md transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/chat" 
                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${location.pathname === '/chat' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600 dark:border-blue-400' : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
              >
                <span className="text-lg mr-3 min-w-[20px]">💬</span>
                <span className={`text-sm font-medium transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>真实聊天</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/mock-chat" 
                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${location.pathname === '/mock-chat' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600 dark:border-blue-400' : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
              >
                <span className="text-lg mr-3 min-w-[20px]">🤖</span>
                <span className={`text-sm font-medium transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>模拟聊天</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/events" 
                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${(location.pathname === '/events' || location.pathname.startsWith('/events/')) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600 dark:border-blue-400' : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
              >
                <span className="text-lg mr-3 min-w-[20px]">📅</span>
                <span className={`text-sm font-medium transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>事件管理</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* 主内容区 */}
      <main className="flex-1 p-6 bg-slate-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-200">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
