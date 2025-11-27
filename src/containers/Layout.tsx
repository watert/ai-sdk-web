import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import '../App.css';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* 左侧菜单 */}
      <aside 
        className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
      >
        <div className="sidebar-header">
          <h2>AI 聊天</h2>
          <button 
            className="toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>
        
        <nav className="menu">
          <ul>
            <li>
              <Link 
                to="/chat" 
                className={`menu-item ${location.pathname === '/chat' ? 'active' : ''}`}
              >
                <span className="menu-icon">💬</span>
                <span className="menu-text">真实聊天</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/mock-chat" 
                className={`menu-item ${location.pathname === '/mock-chat' ? 'active' : ''}`}
              >
                <span className="menu-icon">🤖</span>
                <span className="menu-text">模拟聊天</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* 主内容区 */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
