import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, UnorderedListOutlined, PlusSquareOutlined,
  SearchOutlined, SendOutlined, BarChartOutlined, LogoutOutlined,
  AreaChartOutlined, PlayCircleOutlined, EditOutlined, ShopOutlined
} from '@ant-design/icons';

const NAV_ITEMS = [
  { key: '/', label: '首页概览', icon: <DashboardOutlined /> },
  { key: 'divider1', label: '', divider: true },
  { key: 'label1', label: '订单管理', section: true },
  { key: '/orders', label: '订单列表', icon: <UnorderedListOutlined /> },
  { key: '/orders/new', label: '新建订单', icon: <PlusSquareOutlined /> },
  { key: 'divider2', label: '', divider: true },
  { key: '/production', label: '生产报工', icon: <PlayCircleOutlined />, highlight: true },
  { key: '/jhk-edit', label: '车间订单修改', icon: <EditOutlined /> },
  { key: 'divider3', label: '', divider: true },
  { key: '/fahuo', label: '发货单管理', icon: <SendOutlined /> },
  { key: '/query', label: '综合查询', icon: <SearchOutlined /> },
  { key: '/stats', label: '数据统计', icon: <AreaChartOutlined /> },
];

// 底部 Tab 显示的项（手机端）
const BOTTOM_TABS = [
  { key: '/', label: '首页', icon: <DashboardOutlined /> },
  { key: '/orders', label: '订单', icon: <UnorderedListOutlined /> },
  { key: '/orders/new', label: '新建', icon: <PlusSquareOutlined /> },
  { key: '/production', label: '报工', icon: <PlayCircleOutlined /> },
  { key: '/query', label: '查询', icon: <SearchOutlined /> },
];

export default function AppLayout({ children, title, extra }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getTitle = () => {
    if (title) return title;
    const item = NAV_ITEMS.find(n => n.key === location.pathname);
    return item?.label || '印刷订单管理系统';
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-layout">
      {/* 侧边栏（桌面端） */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">📋 印刷订单管理系统</div>
          <div className="sidebar-logo-sub">兰花印刷包装有限公司</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 10px' }} />;
            }
            if (item.section) {
              return <div key={idx} className="sidebar-nav-label">{item.label}</div>;
            }
            const active = isActive(item.key);
            return (
              <div
                key={item.key}
                className={`sidebar-nav-item ${active ? 'active' : ''} ${item.highlight ? 'sidebar-nav-item-highlight' : ''}`}
                onClick={() => { if (item.key) navigate(item.key); }}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.UserName ? user.UserName.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{user.UserName || '用户'}</div>
              <div className="sidebar-user-role">
                {user.Department === 'S' ? '系统管理员' : user.Department === 'A' ? '销售部' : '用户'}
              </div>
            </div>
            <LogoutOutlined
              style={{ color: 'var(--color-sidebar-text)', cursor: 'pointer', fontSize: 13 }}
              onClick={handleLogout}
            />
          </div>
        </div>
      </aside>

      {/* 主内容 */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">{getTitle()}</span>
          </div>
          {extra && <div className="topbar-right">{extra}</div>}
        </header>
        <div className="page-content">
          {children}
        </div>
      </div>

      {/* 底部Tab导航（手机端） */}
      <nav className="mobile-bottom-tabs">
        {BOTTOM_TABS.map(tab => (
          <div
            key={tab.key}
            className={`mobile-tab-item ${isActive(tab.key) ? 'active' : ''}`}
            onClick={() => navigate(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
