import React, { useEffect, useState } from 'react';
import { Row, Col, Table, Tag, Button, Spin } from 'antd';
import {
  ShoppingCartOutlined, ClockCircleOutlined, CheckCircleOutlined,
  PlusOutlined, SendOutlined, SearchOutlined, AreaChartOutlined, ArrowRightOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { adminGetOverview, getLatestOrders } from '../api';
import dayjs from 'dayjs';

import { PRODUCT_COLORS, PRODUCT_BG, PRODUCT_LABELS } from '../utils/productColors';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [latestOrders, setLatestOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminGetOverview(), getLatestOrders({ limit: 20 })])
      .then(([ov, res]) => {
        setStats(ov);
        setLatestOrders(res.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalInProgress = Object.values(stats).reduce((s, v) => s + (v.in_progress || 0), 0);
  const totalCompleted = Object.values(stats).reduce((s, v) => s + (v.completed || 0), 0);
  const totalOrders = Object.values(stats).reduce((s, v) => s + (v.total || 0), 0);

  const statCards = [
    { key: 'total', label: '全部订单', value: totalOrders, icon: <ShoppingCartOutlined />, color: '#3b82f6', bg: '#eff6ff' },
    { key: 'in_progress', label: '进行中', value: totalInProgress, icon: <ClockCircleOutlined />, color: '#f59e0b', bg: '#fffbeb' },
    { key: 'completed', label: '已完成', value: totalCompleted, icon: <CheckCircleOutlined />, color: '#10b981', bg: '#ecfdf5' },
  ];

  const latestColumns = [
    {
      title: '产品',
      dataIndex: 'product_type',
      key: 'product_type',
      width: 100,
      render: pt => (
        <Tag style={{
          background: PRODUCT_BG[pt] || '#f1f5f9',
          color: PRODUCT_COLORS[pt] || '#666',
          fontWeight: 700,
          border: 'none',
          borderRadius: 20,
          padding: '3px 10px',
        }}>{PRODUCT_LABELS[pt] || pt}</Tag>
      ),
    },
    {
      title: '订单号',
      dataIndex: 'ddbh',
      key: 'ddbh',
      render: v => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748b' }}>{v}</span>,
    },
    {
      title: '客户',
      dataIndex: 'company',
      key: 'company',
      ellipsis: true,
    },
    {
      title: '日期',
      dataIndex: 'prouddate',
      key: 'prouddate',
      width: 90,
      render: v => dayjs(v).format('MM-DD'),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, r) => (
        <Button
          type="text"
          size="small"
          icon={<ArrowRightOutlined style={{ fontSize: 11 }} />}
          onClick={() => navigate(`/orders/${r.product_type}/${r.DD_id}`)}
          style={{ color: '#94a3b8' }}
        />
      ),
    },
  ];

  return (
    <AppLayout>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Spin />
        </div>
      ) : (
        <>
          {/* 统计卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {statCards.map(s => (
              <Col span={8} key={s.key}>
                <div className="stat-card" style={{ '--stat-color': s.color }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div className="stat-card-label">{s.label}</div>
                      <div className="stat-card-value">{s.value.toLocaleString()}</div>
                    </div>
                    <div style={{
                      width: 44, height: 44,
                      background: s.bg,
                      borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: s.color, fontSize: 20,
                    }}>
                      {s.icon}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* 产品线快速入口 */}
          <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
            {Object.entries(PRODUCT_LABELS).map(([pt, name]) => (
              <Col span={6} key={pt}>
                <div
                  onClick={() => navigate(`/orders?product_type=${pt}`)}
                  style={{
                    background: PRODUCT_BG[pt],
                    border: `1px solid ${PRODUCT_COLORS[pt]}22`,
                    borderRadius: 12,
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: PRODUCT_COLORS[pt], fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      {pt}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: PRODUCT_COLORS[pt], fontFamily: 'var(--font-display)' }}>
                      {(stats[pt]?.total || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{name}</div>
                  </div>
                  <ArrowRightOutlined style={{ color: PRODUCT_COLORS[pt], fontSize: 14, opacity: 0.5 }} />
                </div>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            {/* 最新订单 */}
            <Col span={16}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📋 最新订单</span>
                  <Button type="link" size="small" onClick={() => navigate('/orders')} style={{ color: 'var(--color-primary)', fontSize: 12 }}>
                    查看全部 <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </Button>
                </div>
                <div className="card-body" style={{ padding: '0 0 8px' }}>
                  <Table
                    columns={latestColumns}
                    dataSource={latestOrders}
                    rowKey="DD_id"
                    size="small"
                    pagination={false}
                    onRow={r => ({
                      onClick: () => navigate(`/orders/${r.product_type}/${r.DD_id}`),
                      style: { cursor: 'pointer' },
                    })}
                  />
                </div>
              </div>
            </Col>

            {/* 快捷操作 */}
            <Col span={8}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">⚡ 快捷操作</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { icon: <PlusOutlined />, label: '新建订单', action: () => navigate('/orders/new'), primary: true },
                      { icon: <SendOutlined />, label: '发货单管理', action: () => navigate('/fahuo') },
                      { icon: <SearchOutlined />, label: '综合查询', action: () => navigate('/query') },
                      { icon: <AreaChartOutlined />, label: '数据统计', action: () => navigate('/stats') },
                      { icon: <SettingOutlined />, label: '基础数据', action: () => navigate('/base-data') },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={item.action}
                        className={`btn ${item.primary ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
                      >
                        <span style={{ fontSize: 15 }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}
    </AppLayout>
  );
}
