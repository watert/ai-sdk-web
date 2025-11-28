import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MenuItem from '../components/MenuItem';
import { MessageSquare, Bot, Calendar, Building2 } from 'lucide-react';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 抽象出 LayoutHeader 内部组件
  const LayoutHeader: React.FC = () => {
    return (
      <div className="flex truncate justify-between items-center p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all duration-200">
        <h2 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>AI 聊天</h2>
        <button 
          className="text-slate-900 dark:text-slate-100 text-base cursor-pointer p-2 rounded-md transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? '←' : '→'}
        </button>
      </div>
    );
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* 左侧菜单 */}
      <aside 
        className={`h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-[200px]' : 'w-[80px]'}`}
      >
        <LayoutHeader />
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <MenuItem 
              to="/chat" 
              icon={<MessageSquare size={18} />} 
              label="真实聊天" 
              isSidebarOpen={isSidebarOpen} 
              matchExact={true}
            />
            <MenuItem 
              to="/mock-chat" 
              icon={<Bot size={18} />} 
              label="模拟聊天" 
              isSidebarOpen={isSidebarOpen} 
              matchExact={true}
            />
            <MenuItem 
              to="/events" 
              icon={<Calendar size={18} />} 
              label="事件管理" 
              isSidebarOpen={isSidebarOpen}
            />
            <MenuItem 
              to="/industries" 
              icon={<Building2 size={18} />} 
              label="行业管理" 
              isSidebarOpen={isSidebarOpen}
            />
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
