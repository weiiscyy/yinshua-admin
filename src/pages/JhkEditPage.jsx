import React, { useState, useEffect } from 'react';
import {
  Card, Input, Button, Row, Col, DatePicker, InputNumber,
  Tag, message, Spin, Space, Divider, Typography, Popconfirm,
  Descriptions, Badge
} from 'antd';
import {
  SearchOutlined, SaveOutlined, ArrowLeftOutlined,
  CheckOutlined, UndoOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AppLayout from '../components/AppLayout';
import { adminGetOrder, adminUpdateOrder, adminUpdateStep } from '../api';

const { Title, Text } = Typography;
// 已迁移到 productColors.js
const PRODUCT_COLORS = { YS: '#2563eb', YM: '#0891b2', ZM: '#059669', DS: '#d97706' };

// JHK 流水线步骤（与 admin.js 一致）
const JHK_STEPS = [
  { field: 'jhkdd',    label: '接单',     timeField: 'jhkddTime' },
  { field: 'jhkprint', label: '打印/晒版', timeField: 'jhkprintTime' },
  { field: 'sccjjs',   label: '车间接收',  timeField: 'sccjjsTime' },
  { field: 'sccjyl',   label: '预领料',    timeField: 'sccjylTime' },
  { field: 'sccjdn',   label: '电脑制版',  timeField: 'sccjdnTime' },
  { field: 'sccjsc',   label: '生产',      timeField: 'sccjscTime' },
  { field: 'sccjwc',   label: '完成',      timeField: 'sccjwcTime' },
  { field: 'hzljs',    label: '汇总',      timeField: 'hzljsTime' },
  { field: 'fahuo',    label: '发货',      timeField: 'fahuoTime' },
];

// 可编辑字段（车间层面）
const EDITABLE_FIELDS = ['prouddate', 'overdate', 'shuliang', 'beizhu', 'klyaoqiu', 'jyyaoqiu'];

export default function JhkEditPage() {
  const navigate = useNavigate();
  const loginUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stepUpdating, setStepUpdating] = useState(false);

  // 编辑状态
  const [editValues, setEditValues] = useState({});

  // 根据登录人判断可编辑的产品线
  const deptProductMap = { B: ['YS'], C: ['YM', 'DS', 'ZM'] };
  const allowedProducts = loginUser.dept === 'S' || loginUser.dept === 'A'
    ? ['YS', 'YM', 'ZM', 'DS']
    : (deptProductMap[loginUser.dept] || []);

  useEffect(() => {
    if (order) {
      setEditValues({
        prouddate: order.prouddate ? dayjs(order.prouddate) : null,
        overdate: order.overdate ? dayjs(order.overdate) : null,
        shuliang: order.shuliang ? Number(order.shuliang) : null,
        beizhu: order.beizhu || '',
        klyaoqiu: order.klyaoqiu || '',
        jyyaoqiu: order.jyyaoqiu || '',
      });
    }
  }, [order]);

  const handleSearch = async () => {
    if (!searchValue.trim()) { message.warning('请输入订单号或订单ID'); return; }
    setLoading(true);
    setOrder(null);

    try {
      // 尝试直接作为 DD_id 查找
      const numVal = parseInt(searchValue.trim());
      let foundOrder = null;
      let foundType = null;

      // 优先：如果是数字，直接在所有产品线查 DD_id
      if (!isNaN(numVal)) {
        for (const pt of allowedProducts) {
          try {
            const res = await adminGetOrder(pt, numVal);
            if (res && res.DD_id) {
              foundOrder = res;
              foundType = pt;
              break;
            }
          } catch { /* continue */ }
        }
      }

      // 如果没找到，按订单号 ddbh 搜索
      if (!foundOrder) {
        for (const pt of allowedProducts) {
          try {
            const res = await adminGetOrder(pt, searchValue.trim());
            if (res && res.DD_id) {
              foundOrder = res;
              foundType = pt;
              break;
            }
          } catch { /* continue */ }
        }
      }

      if (foundOrder) {
        setOrder(foundOrder);
        setSearchValue('');
        message.success(`找到订单：${foundOrder.ddbh}`);
      } else {
        message.error('未找到该订单');
      }
    } catch (e) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const payload = {
        prouddate: editValues.prouddate?.format('YYYY-MM-DD') || null,
        overdate: editValues.overdate?.format('YYYY-MM-DD') || null,
        shuliang: editValues.shuliang != null ? String(editValues.shuliang) : null,
        beizhu: editValues.beizhu || '',
        klyaoqiu: editValues.klyaoqiu || '',
        jyyaoqiu: editValues.jyyaoqiu || '',
      };
      const res = await adminUpdateOrder(order.product_type, order.DD_id, payload);
      setOrder(res.data);
      message.success('订单已更新');
    } catch (e) {
      // error shown by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleStepToggle = async (stepField, currentValue) => {
    if (!order) return;
    setStepUpdating(true);
    try {
      const completed = !(currentValue === true || currentValue === 1);
      const res = await adminUpdateStep(order.product_type, order.DD_id, stepField, completed);
      setOrder(res.data);
      message.success(res.message);
    } catch (e) { /* interceptor */ }
    finally { setStepUpdating(false); }
  };

  if (!order) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🏭</span>
              车间订单修改
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              查找并修改订单信息（仅允许修改部分字段）
            </Text>
          </div>

          {/* 可访问产品线 */}
          <Card style={{ borderRadius: 12, marginBottom: 20 }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              可访问产品线
            </div>
            <Space wrap>
              {allowedProducts.map(pt => (
                <Tag key={pt} style={{
                  background: `${PRODUCT_COLORS[pt]}15`,
                  color: PRODUCT_COLORS[pt],
                  border: `1px solid ${PRODUCT_COLORS[pt]}40`,
                  borderRadius: 20, fontSize: 13, padding: '2px 12px',
                }}>
                  {PRODUCT_MAP[pt]}
                </Tag>
              ))}
            </Space>
          </Card>

          {/* 搜索 */}
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '24px' } }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              查找订单
            </div>
            <Space style={{ width: '100%' }} direction="vertical">
              <Input
                size="large"
                placeholder="输入订单号（如：2604060001）或订单ID"
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onPressEnter={handleSearch}
                style={{ borderRadius: 8 }}
                allowClear
              />
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
                style={{ borderRadius: 8, width: '100%' }}
              >
                查找订单
              </Button>
            </Space>

            <Divider style={{ margin: '20px 0 16px' }} />

            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                可修改字段
              </div>
              <Space wrap>
                {['接单日期', '交货日期', '印刷数量', '备注', '开料要求', '机印要求'].map(f => (
                  <Tag key={f} style={{ borderRadius: 6, fontSize: 12 }}>{f}</Tag>
                ))}
              </Space>
              <div style={{ fontWeight: 600, margin: '12px 0 8px', color: 'var(--text-secondary)' }}>
                不可修改字段
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                客户公司、单价、加工费、工艺配置 等
              </Text>
            </div>
          </Card>

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginTop: 16, borderRadius: 8 }}
          >
            返回
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ── 订单已加载，显示编辑界面 ──
  const productColor = PRODUCT_COLORS[order.product_type] || '#2563eb';
  const steps = order.steps || [];
  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setOrder(null)} style={{ borderRadius: 8 }}>
            返回搜索
          </Button>
          <Tag style={{
            background: `${productColor}15`, color: productColor,
            border: `1px solid ${productColor}40`, borderRadius: 20,
            fontSize: 13, padding: '2px 12px', fontWeight: 600,
          }}>
            {PRODUCT_MAP[order.product_type]}
          </Tag>
          <Text strong style={{ fontSize: 18, letterSpacing: 0.5 }}>{order.ddbh}</Text>
          <Tag style={{ fontSize: 12, borderRadius: 20, marginLeft: 'auto' }}>
            剩余 {allowedProducts.length === 4 ? '全部' : allowedProducts.join('/')} 产品线
          </Tag>
        </div>

        <Row gutter={[16, 16]}>
          {/* 左侧：可编辑字段 */}
          <Col span={11}>
            <Card
              title={
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  📝 可修改字段
                </span>
              }
              extra={
                <Popconfirm
                  title="确认保存修改？"
                  onConfirm={handleSave}
                  okText="保存"
                  cancelText="取消"
                  disabled={saving}
                >
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    style={{ borderRadius: 8, background: productColor }}
                  >
                    保存修改
                  </Button>
                </Popconfirm>
              }
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: '20px 20px' } }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>接单日期</div>
                  <DatePicker
                    style={{ width: '100%', borderRadius: 8 }}
                    value={editValues.prouddate}
                    onChange={v => setEditValues(p => ({ ...p, prouddate: v }))}
                    format="YYYY-MM-DD"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>交货日期</div>
                  <DatePicker
                    style={{ width: '100%', borderRadius: 8 }}
                    value={editValues.overdate}
                    onChange={v => setEditValues(p => ({ ...p, overdate: v }))}
                    format="YYYY-MM-DD"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>印刷数量</div>
                  <InputNumber
                    style={{ width: '100%', borderRadius: 8 }}
                    value={editValues.shuliang}
                    onChange={v => setEditValues(p => ({ ...p, shuliang: v }))}
                    formatter={v => Number(v || 0).toLocaleString()}
                    parser={v => Number(v.replace(/,/g, ''))}
                  />
                </div>
                {order.product_type === 'YS' && (
                  <>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>开料要求</div>
                      <Input.TextArea
                        rows={2}
                        value={editValues.klyaoqiu}
                        onChange={e => setEditValues(p => ({ ...p, klyaoqiu: e.target.value }))}
                        placeholder="开料要求"
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>机印要求</div>
                      <Input.TextArea
                        rows={2}
                        value={editValues.jyyaoqiu}
                        onChange={e => setEditValues(p => ({ ...p, jyyaoqiu: e.target.value }))}
                        placeholder="机印要求"
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                  </>
                )}
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>备注</div>
                  <Input.TextArea
                    rows={2}
                    value={editValues.beizhu}
                    onChange={e => setEditValues(p => ({ ...p, beizhu: e.target.value }))}
                    placeholder="备注"
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
            </Card>

            {/* 进度概览卡片 */}
            <Card
              style={{ borderRadius: 12, marginTop: 16, background: `${productColor}08`, border: `1px solid ${productColor}30` }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: productColor, lineHeight: 1 }}>
                  {completedCount}/{totalCount}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>工序进度</div>
              </div>
            </Card>
          </Col>

          {/* 右侧：只读信息 + JHK 工序 */}
          <Col span={13}>
            {/* 订单只读信息 */}
            <Card
              title={
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <InfoCircleOutlined style={{ marginRight: 6 }} />
                  订单信息（只读）
                </span>
              }
              style={{ borderRadius: 12, marginBottom: 16 }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Descriptions
                size="small"
                column={1}
                labelStyle={{ fontSize: 12, color: 'var(--text-muted)', width: 90, fontWeight: 400 }}
                contentStyle={{ fontSize: 13, color: 'var(--text-primary)' }}
              >
                <Descriptions.Item label="客户公司">{order.company || '-'}</Descriptions.Item>
                <Descriptions.Item label="花号/编号">{order.yjbhao || '-'}</Descriptions.Item>
                <Descriptions.Item label="成品规格">{order.cpgg || '-'}</Descriptions.Item>
                <Descriptions.Item label="款号">{order.kuanhao || '-'}</Descriptions.Item>
                <Descriptions.Item label="印数">{order.pingshu ? Number(order.pingshu).toLocaleString() : '-'}</Descriptions.Item>
                <Descriptions.Item label="单价">{order.danjia != null ? Number(order.danjia).toFixed(4) : '-'}</Descriptions.Item>
                <Descriptions.Item label="加工费">{order.jiagongfei || '-'}</Descriptions.Item>
                <Descriptions.Item label="订单总价">{order.yszj != null ? Number(order.yszj).toFixed(2) : '-'}</Descriptions.Item>
                <Descriptions.Item label="制单人">{order.zhidan || '-'}</Descriptions.Item>
                <Descriptions.Item label="业务员">{order.ywy_name || order.ywy || '-'}</Descriptions.Item>
                <Descriptions.Item label="发货单位">{order.fahuodanwei || '-'}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  {order.fahuo
                    ? <Tag color="green" style={{ borderRadius: 12 }}>✓ 已发货</Tag>
                    : <Tag color="warning" style={{ borderRadius: 12 }}>○ 进行中</Tag>
                  }
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* JHK 工序进度 */}
            <Card
              title={
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  🔧 JHK 流水线
                </span>
              }
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: '20px' } }}
            >
              <div style={{ position: 'relative' }}>
                {/* 背景线 */}
                <div style={{
                  position: 'absolute', top: 18, left: 18, right: 18, height: 3,
                  background: 'var(--color-border)', borderRadius: 2,
                }} />
                {/* 进度线 */}
                <div style={{
                  position: 'absolute', top: 18,
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  height: 3, background: productColor, borderRadius: 2,
                  transition: 'width 0.4s ease',
                }} />

                {/* 步骤节点 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {steps.map((s, i) => {
                    const isCompleted = s.completed;
                    const isCurrent = !isCompleted && (i === 0 || steps[i - 1]?.completed);
                    const nodeColor = isCompleted ? '#10b981' : isCurrent ? productColor : '#cbd5e1';

                    return (
                      <Popconfirm
                        key={s.field}
                        title={isCompleted ? `撤销「${s.label}」？` : `确认完成「${s.label}」？`}
                        onConfirm={() => handleStepToggle(s.field, s.completed)}
                        okText="确认"
                        cancelText="取消"
                        disabled={stepUpdating}
                      >
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          cursor: stepUpdating ? 'wait' : 'pointer',
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: isCompleted ? '#10b981' : isCurrent ? productColor : '#fff',
                            border: `3px solid ${nodeColor}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1, transition: 'all 0.2s',
                            boxShadow: (isCompleted || isCurrent) ? `0 0 0 3px ${nodeColor}22` : 'none',
                          }}>
                            {isCompleted
                              ? <CheckOutlined style={{ color: '#fff', fontSize: 13, fontWeight: 700 }} />
                              : <div style={{ width: 9, height: 9, borderRadius: '50%', background: isCurrent ? '#fff' : '#cbd5e1' }} />
                            }
                          </div>
                          <div style={{
                            marginTop: 8, fontSize: 10.5, fontWeight: isCompleted || isCurrent ? 600 : 400,
                            color: isCompleted ? '#10b981' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                            textAlign: 'center', maxWidth: 52, lineHeight: 1.3,
                          }}>
                            {s.label}
                          </div>
                          {s.time && (
                            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>
                              {new Date(s.time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </Popconfirm>
                    );
                  })}
                </div>
              </div>

              {/* 工序操作按钮 */}
              <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  快速操作（点击切换完成状态）
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {steps.map(s => (
                    <Button
                      key={s.field}
                      size="small"
                      icon={s.completed ? <UndoOutlined /> : <CheckOutlined />}
                      onClick={() => handleStepToggle(s.field, s.completed)}
                      loading={stepUpdating}
                      style={{
                        borderRadius: 6, fontSize: 12,
                        ...(s.completed
                          ? { color: '#10b981', borderColor: '#10b981', background: '#f0fdf4' }
                          : { color: productColor, borderColor: productColor, background: `${productColor}0a` }
                        ),
                      }}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}
