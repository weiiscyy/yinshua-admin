import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button, InputNumber, Tag, Typography, Space, message, List, Spin, Input, Tabs, Statistic, Row, Col, Empty, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { ScanOutlined, HistoryOutlined, BarChartOutlined, CheckCircleFilled, ClockCircleOutlined, ExclamationCircleFilled, SendOutlined, ArrowLeftOutlined, MinusCircleFilled } from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import { getProductionOrders, getProductionOrder, submitReport, getMyReports, getProductionStatsDaily } from '../api';
import { PRODUCT_MAP, PRODUCT_COLORS } from '../utils/productColors';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 工序步骤（与后端STEPS一致）
const STEPS_DEF = [
  { field: 'jhkddClass', label: '接单', order: 1 },
  { field: 'jhkprint', label: '打印/晒版', order: 2 },
  { field: 'sccjjs', label: '车间接收', order: 3 },
  { field: 'sccjyl', label: '预领料', order: 4 },
  { field: 'sccjdn', label: '电脑制版', order: 5 },
  { field: 'sccjsc', label: '生产', order: 6 },
  { field: 'sccjwc', label: '完成', order: 7 },
  { field: 'hzljs', label: '汇总', order: 8 },
  { field: 'fahuo', label: '发货', order: 9 },
];

// 获取当前可报工工序（从current_step字段）
function getCurrentStep(order) {
  // order.current_step 是 API 返回的当前工序对象
  return order.current_step || null;
}

// 步骤进度指示器
function StepProgress({ steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {STEPS_DEF.map((s, i) => {
        const completed = steps[s.field];
        const isCurrent = !completed && (i === 0 || steps[STEPS_DEF[i - 1].field]);
        return (
          <div key={s.field} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            {i > 0 && (
              <div style={{
                width: 12,
                height: 2,
                background: completed ? '#10b981' : '#e2e8f0',
                borderRadius: 1,
              }} />
            )}
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              background: completed ? '#10b981' : isCurrent ? '#f59e0b' : '#f1f5f9',
              color: completed || isCurrent ? '#fff' : '#94a3b8',
            }}>
              {completed ? '✓' : s.order}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 报工表单
function ReportForm({ order, onSuccess }) {
  const [baochanNum, setBaochanNum] = useState(null);
  const [buliangNum, setBuliangNum] = useState(0);
  const [buliangReason, setBuliangReason] = useState(null);
  const [gongxuColor, setGongxuColor] = useState(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentStep = getCurrentStep(order);

  // 颜色选项（来自订单颜色字段，仅 YS/YM 显示）
  const colorOptions = order.color_options || [];
  const showColorSelect = (order.product_type === 'YS' || order.product_type === 'YM') && colorOptions.length > 0;

  // 印刷行业不良原因预设
  const BULIANG_REASONS = [
    '纸起皱', '颜色偏位', '版面脏污', '混料', '尺寸偏差',
    '模切偏位', '覆膜气泡', '烫金不良', '粘胶不牢', '切边毛刺',
    '印迹模糊', '套印不准', '材料色差', '其他',
  ];

  const handleSubmit = async () => {
    if (!baochanNum || baochanNum <= 0) {
      message.warning('请输入报产数量');
      return;
    }
    if (buliangNum < 0 || buliangNum > baochanNum) {
      message.warning('不良数量不能为负或超过报产数量');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitReport({
        dd_id: order.DD_id,
        product_type: order.product_type,
        gongxu_field: currentStep.field,
        gongxu_color: gongxuColor,
        baochan_num: baochanNum,
        buliang_num: buliangNum,
        buliang_reason: buliangReason,
        remark,
      });
      message.success(res.message);
      setBaochanNum(null);
      setBuliangNum(0);
      setBuliangReason(null);
      setGongxuColor(null);
      setRemark('');
      // 用返回的数据直接更新 UI，不跳转不刷新
      onSuccess(res.data);
    } catch (e) {
      // error handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentStep) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleFilled style={{ fontSize: 48, color: '#10b981' }} />
          <Title level={5} style={{ marginTop: 12 }}>所有工序已完成</Title>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <Tag color="blue">{PRODUCT_MAP[order.product_type]}</Tag>
          <Text strong>{order.ddbh}</Text>
        </Space>
      }
      extra={<Tag icon={<ClockCircleOutlined />} color="warning">{currentStep.label}</Tag>}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
          <Text type="secondary">客户：</Text>
          <Text strong style={{ marginLeft: 8 }}>{order.company}</Text>
          <br />
          <Text type="secondary">订单数量：</Text>
          <Text strong style={{ marginLeft: 8 }}>{order.shuliang}</Text>
          <br />
          <Text type="secondary">已报产：</Text>
          <Text strong style={{ marginLeft: 8, color: order.remain <= 0 ? '#10b981' : '#f59e0b' }}>
            {order.total_reported || 0}
          </Text>
          <Text type="secondary"> / {order.shuliang}</Text>
        </div>

        {/* 颜色选择（YS/YM 显示） */}
        {showColorSelect && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>颜色（印刷面）</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="选择报工颜色（选填）"
              allowClear
              value={gongxuColor}
              onChange={setGongxuColor}
              options={colorOptions}
              size="large"
            />
          </div>
        )}

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>报产数量 *</Text>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={1}
            max={order.shuliang * 1.1}
            value={baochanNum}
            onChange={val => { setBaochanNum(val); if (val < buliangNum) setBuliangNum(0); }}
            placeholder="输入报产数量"
          />
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>不良数量</Text>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={0}
            max={baochanNum || 0}
            value={buliangNum}
            onChange={val => setBuliangNum(Math.min(val, baochanNum || 0))}
            placeholder="输入不良数量（选填）"
          />
        </div>

        {/* 不良原因（不良数 > 0 时显示） */}
        {buliangNum > 0 && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>不良原因 *</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="选择不良原因"
              value={buliangReason}
              onChange={setBuliangReason}
              size="large"
              options={BULIANG_REASONS.map(r => ({ value: r, label: r }))}
            />
          </div>
        )}

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>备注</Text>
          <TextArea
            rows={2}
            value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder="可选备注信息"
          />
        </div>

        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          loading={submitting}
          onClick={handleSubmit}
          style={{ width: '100%', borderRadius: 8 }}
        >
          提交报工
        </Button>
      </Space>
    </Card>
  );
}

// 订单选择列表
function OrderList({ onSelect }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getProductionOrders({ page: p, page_size: 20 });
      setOrders(res.items || []);
      setTotal(res.total);
      setPage(p);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredOrders = searchText
    ? orders.filter(o => o.ddbh.includes(searchText) || o.company?.includes(searchText))
    : orders;

  return (
    <div>
      <Input
        placeholder="搜索订单号/客户..."
        prefix={<ScanOutlined />}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        style={{ marginBottom: 12, borderRadius: 8 }}
        allowClear
      />

      <Spin spinning={loading}>
        <List
          dataSource={filteredOrders}
          locale={{ emptyText: <Empty description="暂无可报工订单" /> }}
          renderItem={(order) => (
            <List.Item
              style={{
                padding: '12px 16px',
                marginBottom: 8,
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
              }}
              onClick={() => onSelect(order)}
            >
              <div style={{ width: '100%' }}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Space>
                    <Tag className={`tag-${order.product_type.toLowerCase()}`}>
                      {PRODUCT_MAP[order.product_type]}
                    </Tag>
                    <Text strong>{order.ddbh}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {order.current_step_name}
                  </Text>
                </Space>
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>{order.company}</Text>
                </div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    数量: {order.shuliang}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    剩余: {order.remain}
                  </Text>
                  <Tag color={order.can_report ? 'success' : 'default'} style={{ marginLeft: 'auto' }}>
                    {order.can_report ? '可报工' : '已完成'}
                  </Tag>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Spin>

      {total > 20 && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button onClick={() => load(page + 1)}>加载更多</Button>
        </div>
      )}
    </div>
  );
}

// 我的记录
function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyReports({ page: 1, page_size: 50 });
      setReports(res.items || []);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Spin spinning={loading}>
      {reports.length === 0 ? (
        <Empty description="暂无报工记录" />
      ) : (
        <List
          dataSource={reports}
          renderItem={(r, i) => (
            <List.Item
              key={r.id || i}
              style={{
                padding: '12px 16px',
                marginBottom: 8,
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ width: '100%' }}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Space>
                    <Tag color="blue">{r.gongxu_name}</Tag>
                    <Text strong>{r.ddbh || r.dd_id}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(r.bao_time).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Space>
                <div style={{ marginTop: 6, display: 'flex', gap: 16 }}>
                  <Text style={{ fontSize: 13 }}>
                    报产: <Text strong style={{ color: '#10b981' }}>{r.baochan_num}</Text>
                  </Text>
                  {r.buliang_num > 0 && (
                    <Text style={{ fontSize: 13 }}>
                      不良: <Text strong style={{ color: '#ef4444' }}>{r.buliang_num}</Text>
                    </Text>
                  )}
                  <Text style={{ fontSize: 13 }}>
                    合格: <Text strong>{r.hege_num}</Text>
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Spin>
  );
}

// 统计
function ReportStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await getProductionStatsDaily({ date: today });
      setStats(res);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spin spinning />;

  if (!stats || stats.summary.report_times === 0) {
    return <Empty description="今日暂无报工数据" />;
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="报产总数"
              value={stats.summary.total_baochan}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="不良数"
              value={stats.summary.total_buliang}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="报工次数"
              value={stats.summary.report_times}
            />
          </Card>
        </Col>
      </Row>

      <List
        header={<Text strong>今日报工明细</Text>}
        dataSource={stats.items}
        renderItem={(item) => (
          <List.Item style={{ padding: '10px 0' }}>
            <Space>
              <Tag>{PRODUCT_MAP[item.ProductType]}</Tag>
              <Text>{item.GongXuName}</Text>
            </Space>
            <Space>
              <Text type="secondary">报产: {item.total_baochan}</Text>
              {item.total_buliang > 0 && (
                <Text type="danger">不良: {item.total_buliang}</Text>
              )}
              <Text type="secondary">({item.report_times}次)</Text>
            </Space>
          </List.Item>
        )}
      />
    </div>
  );
}

// 主页面
export default function ProductionPage() {

// 不良分析组件
function DefectStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);

  const load = async () => {
    setLoading(true);
    try {
      const [start, end] = dateRange;
      const res = await fetch(
        `/api/production/stats/defects?start_date=${start.format('YYYY-MM-DD')}&end_date=${end.format('YYYY-MM-DD')}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      ).then(r => r.json());
      setStats(res);
    } catch {
      message.error('加载不良统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateRange]);

  if (loading) return <Spin />;
  if (!stats) return null;

  return (
    <div>
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Text strong>时间范围：</Text>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => { if (dates) setDateRange(dates); }}
            size="small"
          />
          <Button size="small" onClick={load}>刷新</Button>
        </Space>
      </Card>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="不良总数"
              value={stats.total_buliang || 0}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="不良次数"
              value={stats.items?.reduce((s, i) => s + i.report_times, 0) || 0}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="不良原因排行榜">
        {(!stats.items || stats.items.length === 0) ? (
          <Empty description="暂无不良记录" />
        ) : (
          <List
            size="small"
            dataSource={stats.items}
            renderItem={(item, idx) => (
              <List.Item
                style={{ padding: '8px 0' }}
                extra={<Text strong style={{ color: '#ef4444' }}>{item.total_buliang}</Text>}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#94a3b8',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 'bold',
                    }}>{idx + 1}</div>
                  }
                  title={
                    <Space>
                      <Text>{item.reason}</Text>
                      <Tag>{item.gongxu_name}</Tag>
                    </Space>
                  }
                  description={`出现 ${item.report_times} 次`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('report');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchParams] = useSearchParams();
  const scannedOrderRef = useRef(null);

  // ── 扫码枪入口：检测 URL 参数，未登录则跳转登录 ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // 未登录：跳转登录页，登录后返回此页面
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
      return;
    }

    const ddId = searchParams.get('dd_id');
    const productType = searchParams.get('product_type');
    const step = searchParams.get('step');

    if (ddId && productType && step) {
      // 扫码枪扫码进入，直接加载订单
      if (scannedOrderRef.current === ddId + step) return; // 防止重复加载
      scannedOrderRef.current = ddId + step;

      setLoadingDetail(true);
      setActiveTab('report'); // 确保显示报工 tab
      getProductionOrder(parseInt(ddId), productType)
        .then(detail => {
          setSelectedOrder(detail);
        })
        .catch(() => {
          message.error('加载订单失败，请检查订单是否存在');
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    }
  }, [searchParams]);

  const handleOrderSelect = async (order) => {
    setLoadingDetail(true);
    try {
      const detail = await getProductionOrder(order.DD_id, order.product_type);
      setSelectedOrder(detail);
    } catch {
      message.error('加载订单详情失败');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReportSuccess = (reportData) => {
    // P0-1：工序自动完工 — 报工成功后更新 UI
    setSelectedOrder(prev => {
      const updatedSteps = prev.steps.map(s => {
        if (s.field === reportData.gongxu_field) {
          return {
            ...s,
            total_reported: reportData.total_reported,
            completed: reportData.step_completed || false, // 工序自动完工
            completed_at: reportData.step_completed
              ? new Date().toISOString()
              : (s.completed_at || null),
          };
        }
        // 下一工序标记为新的 current_step
        if (reportData.next_step && s.field === reportData.next_step.field) {
          return { ...s, can_report: true };
        }
        return s;
      });
      return {
        ...prev,
        total_reported: reportData.total_reported,
        remain: reportData.remain,
        all_reported: reportData.all_reported,
        current_step: reportData.next_step || prev.current_step,
        steps: updatedSteps,
      };
    });

    // P0-1：显示下一工序交接提示
    if (reportData.step_completed && reportData.next_step) {
      message.success({
        content: `✓ ${reportData.gongxu_name} 工序已完工，请交接给【${reportData.next_step.label}】工序`,
        duration: 5,
      });
    }
  };

  return (
    <AppLayout>
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 12px',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 0 12px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: 16,
        }}>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SendOutlined style={{ color: '#2563eb' }} />
            生产报工
          </Title>
        </div>

        {/* 报工表单 */}
        {selectedOrder ? (
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setSelectedOrder(null)}
              style={{ marginBottom: 12, borderRadius: 8 }}
            >
              返回订单列表
            </Button>
            {loadingDetail ? (
              <Card>
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              </Card>
            ) : (
              <ReportForm order={selectedOrder} onSuccess={handleReportSuccess} />
            )}
          </div>
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'report',
                label: (
                  <span><ScanOutlined /> 报工</span>
                ),
                children: <OrderList onSelect={handleOrderSelect} />,
              },
              {
                key: 'reports',
                label: (
                  <span><HistoryOutlined /> 我的记录</span>
                ),
                children: <MyReports />,
              },
              {
                key: 'stats',
                label: (
                  <span><BarChartOutlined /> 统计</span>
                ),
                children: <ReportStats />,
              },
              {
                key: 'defects',
                label: (
                  <span><ExclamationCircleFilled /> 不良分析</span>
                ),
                children: <DefectStats />,
              },
            ]}
          />
        )}
      </div>
    </AppLayout>
  );
}
