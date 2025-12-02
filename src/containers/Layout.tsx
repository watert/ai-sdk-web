import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MenuItem from '../components/MenuItem';
import { MessageSquare, Bot, Calendar, Building2, LogIn, User, Layers } from 'lucide-react';
import { useUser } from '../hooks/useUser';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // 使用 useUser hook 管理登录状态
  const { 
    session, 
    email, 
    setEmail, 
    handleLogin, 
    handleLogout 
  } = useUser();

  // 发送登录邮件
  const handleSignInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await handleLogin(email);
    
    if (error) {
      console.error('登录失败:', error);
      alert('登录失败，请检查邮箱格式');
    } else {
      alert('登录链接已发送到您的邮箱，请查收');
      setShowLoginForm(false);
      setEmail('');
    }
  };

  // 退出登录
  const handleSignOut = async () => {
    await handleLogout();
  };

  // 抽象出 LayoutHeader 内部组件
  const LayoutHeader: React.FC = () => {
    return (
      <div className="flex truncate justify-between items-center p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all duration-200">
        <h2 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>AI 聊天</h2>
        <div className="flex items-center space-x-2">
          {session ? (
            <div className="flex items-center space-x-2">
              <User size={16} className="text-slate-600 dark:text-slate-400" />
              <span className={`text-sm text-slate-600 dark:text-slate-400 transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                {session.user.email}
              </span>
              <button
                className="text-slate-900 dark:text-slate-100 text-base cursor-pointer p-2 rounded-md transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                onClick={handleSignOut}
              >
                登出
              </button>
            </div>
          ) : showLoginForm ? (
            <form onSubmit={handleSignInWithEmail} className="flex space-x-2">
              <input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-200"
                required
              />
              <button
                type="submit"
                className="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
              >
                发送
              </button>
              <button
                type="button"
                onClick={() => setShowLoginForm(false)}
                className="px-2 py-1 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-md transition-colors duration-200"
              >
                取消
              </button>
            </form>
          ) : (
            <button
              className="flex items-center space-x-1 text-slate-900 dark:text-slate-100 text-base cursor-pointer p-2 rounded-md transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              onClick={() => setShowLoginForm(true)}
            >
              <LogIn size={16} />
              <span className={`transition-all duration-200 ${isSidebarOpen ? 'block' : 'hidden'}`}>登录</span>
            </button>
          )}
          <button 
            className="text-slate-900 dark:text-slate-100 text-base cursor-pointer p-2 rounded-md transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* 顶部 Header */}
      <header className="w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all duration-200">
        <LayoutHeader />
      </header>
      
      {/* 主内容区域 - 包含侧边栏和内容 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧菜单 */}
        <aside 
          className={`h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-[200px]' : 'w-[80px]'}`}
        >
          <nav className="flex-1 p-4 pt-6">
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
              <MenuItem 
                to="/industry-research" 
                icon={<Layers size={18} />} 
                label="行业研究" 
                isSidebarOpen={isSidebarOpen}
                matchExact={true}
              />
            </ul>
          </nav>
        </aside>
        
        {/* 主内容区 */}
        <main className="flex-1 p-6 bg-slate-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
