import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { setRouterNavigate } from './router';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrderListPage from './pages/OrderListPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderEntryPage from './pages/OrderEntryPage';
import QueryPage from './pages/QueryPage';
import FahuoListPage from './pages/FahuoListPage';
import StatsPage from './pages/StatsPage';
import BaseDataPage from './pages/BaseDataPage';
import ProductionPage from './pages/ProductionPage';
import JhkEditPage from './pages/JhkEditPage';
import UserManagePage from './pages/UserManagePage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// 在路由初始化时将 navigate 函数注册到单例，供 api 拦截器使用
function RouterInit({ children }) {
  const navigate = useNavigate();
  useEffect(() => {
    setRouterNavigate(navigate);
    return () => setRouterNavigate(null);
  }, [navigate]);
  return children;
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <RouterInit>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrderListPage /></ProtectedRoute>} />
            <Route path="/orders/:productType/:ddId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/orders/new" element={<ProtectedRoute><OrderEntryPage /></ProtectedRoute>} />
            <Route path="/orders/edit/:productType/:ddId" element={<ProtectedRoute><OrderEntryPage /></ProtectedRoute>} />
            <Route path="/query" element={<ProtectedRoute><QueryPage /></ProtectedRoute>} />
            <Route path="/fahuo" element={<ProtectedRoute><FahuoListPage /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
            <Route path="/base-data" element={<ProtectedRoute><BaseDataPage /></ProtectedRoute>} />
            <Route path="/production" element={<ProtectedRoute><ProductionPage /></ProtectedRoute>} />
            <Route path="/jhk-edit" element={<ProtectedRoute><JhkEditPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagePage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RouterInit>
      </BrowserRouter>
    </ConfigProvider>
  );
}
