import React, { useEffect, useState, useRef } from 'react';
import { Input, Button, Tag, Row, Col, Spin, Empty } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { adminListOrders, adminListUsers } from '../api';
import dayjs from 'dayjs';

const PRODUCT_MAP = { YS: '印刷', YM: '印刷面', ZM: '纸盒', DS: '模切' };
const PRODUCT_COLORS = { YS: '#2563eb', YM: '#0891b2', ZM: '#059669', DS: '#d97706' };
const PRODUCT_BG = { YS: '#eff6ff', YM: '#ecfeff', ZM: '#ecfdf5', DS: '#fffbeb' };
const PRODUCT_BORDER = { YS: '#bfdbfe', YM: '#a5f3fc', ZM: '#a7f3d0', DS: '#fde68a' };

const PRODUCT_TABS = [
  { key: '', label: '全部', color: '#64748b' },
  { key: 'YS', label: '印刷', color: PRODUCT_COLORS.YS },
  { key: 'YM', label: '印刷面', color: PRODUCT_COLORS.YM },
  { key: 'ZM', label: '纸盒', color: PRODUCT_COLORS.ZM },
  { key: 'DS', label: '模切', color: PRODUCT_COLORS.DS },
];

const PAGE_SIZE = 24;

export default function OrderListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [productType, setProductType] = useState(searchParams.get('product_type') || '');
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const debounceTimer = useRef(null);

  const fetchData = async (pg = 1, append = false) => {
    setLoading(!append);
    try {
      const params = { page: pg, page_size: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      if (productType) params.product_type = productType;
      if (status) params.status = status;
      const res = await adminListOrders(params);
      setData(prev => append ? [...prev, ...(res.items || [])] : (res.items || []));
      setTotal(res.total || 0);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleKeywordChange = (val) => {
    setKeyword(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setPage(1); fetchData(1); }, 400);
  };

  useEffect(() => { setPage(1); fetchData(1); }, [productType, status]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchData(next, true);
  };

  const activeTab = PRODUCT_TABS.find(t => t.key === productType) || PRODUCT_TABS[0];

  const extra = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orders/new')}>
      新建订单
    </Button>
  );

  return (
    <AppLayout title="订单列表" extra={extra}>
      {/* 搜索栏 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--color-bg)', borderRadius: 8, padding: '7px 12px',
            border: '1px solid var(--color-border)',
          }}>
            <SearchOutlined style={{ color: 'var(--color-text-muted)', fontSize: 14 }} />
            <input
              value={keyword}
              onChange={e => handleKeywordChange(e.target.value)}
              placeholder="搜索订单号 / 客户公司 / 花号..."
              style={{ border: 'none', outline: 'none', fontSize: 13, color: 'var(--color-text-primary)', width: '100%', background: 'transparent', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
            <FilterOutlined />
            共 {total.toLocaleString()} 条
          </div>
        </div>

        {/* 产品线 Tab */}
        <div style={{
          display: 'flex', gap: 4, padding: '0 18px 14px',
          borderTop: '1px solid var(--color-border)',
          marginTop: 0,
        }}>
          {PRODUCT_TABS.map(tab => {
            const isActive = tab.key === productType;
            return (
              <button
                key={tab.key}
                onClick={() => setProductType(tab.key)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  border: `1.5px solid ${isActive ? tab.color : 'var(--color-border)'}`,
                  background: isActive ? `${tab.color}15` : 'transparent',
                  color: isActive ? tab.color : 'var(--color-text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 订单卡片网格 */}
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : data.length === 0 ? (
        <Empty description="暂无订单，试试其他筛选条件" style={{ padding: 80 }} />
      ) : (
        <>
          <Row gutter={[14, 14]}>
            {data.map((order, idx) => (
              <Col span={8} key={`${order.product_type}-${order.DD_id}`}>
                <OrderCard
                  order={order}
                  idx={idx}
                  onClick={() => navigate(`/orders/${order.product_type}/${order.DD_id}`)}
                />
              </Col>
            ))}
          </Row>

          {data.length < total && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Button onClick={loadMore} loading={loading} style={{ borderRadius: 20, padding: '6px 28px' }}>
                加载更多 ({data.length}/{total})
              </Button>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

function OrderCard({ order, idx, onClick }) {
  const color = PRODUCT_COLORS[order.product_type] || '#64748b';
  const bg = PRODUCT_BG[order.product_type] || '#f8fafc';
  const steps = order.steps || [];
  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isShipped = order.fahuo;

  return (
    <div
      onClick={onClick}
      className="animate-in"
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        borderLeft: `3px solid ${color}`,
        animationDelay: `${Math.min(idx, 11) * 40}ms`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* 顶部行 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Tag style={{ background: bg, color, border: `1px solid ${color}40`, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '2px 10px' }}>
          {PRODUCT_MAP[order.product_type]}
        </Tag>
        <span style={{ fontSize: 10, fontWeight: 600, color: isShipped ? 'var(--color-success)' : '#f59e0b' }}>
          {isShipped ? '✓ 已发货' : '○ 进行中'}
        </span>
      </div>

      {/* 订单号 */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 5, letterSpacing: 0.3 }}>
        {order.ddbh}
      </div>

      {/* 客户 */}
      <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginBottom: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {order.company || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>无客户名称</span>}
      </div>

      {/* 进度条 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>工序进度</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{completedCount}/{totalCount}</span>
        </div>
        <div style={{ width: '100%', height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* 底部：日期 + 箭头 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {order.prouddate ? dayjs(order.prouddate).format('YYYY-MM-DD') : ''}
        </span>
        <ArrowRightOutlined style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
      </div>
    </div>
  );
}
