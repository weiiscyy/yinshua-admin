import React, { useEffect, useState } from 'react';
import {
  Table, Card, Input, Select, Button, Space, Typography, Row, Col,
  message, Tag, Modal, Popconfirm, Badge, Tooltip, Checkbox, Segmented
} from 'antd';
import {
  ReloadOutlined, ScanOutlined, ExportOutlined, CheckCircleOutlined,
  ClockCircleOutlined, WarningOutlined, ExclamationCircleOutlined, SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AppLayout from '../components/AppLayout';
import { processList, processAdvance, processBatchAdvance } from '../api';

const { Title } = Typography;

// 工序步骤定义
const STEPS = [
  { field: 'jhkdd',    label: '接单',     color: '#52c41a' },
  { field: 'jhkprint', label: '打印/晒版', color: '#1890ff' },
  { field: 'sccjjs',   label: '车间接收', color: '#722ed1' },
  { field: 'sccjyl',   label: '缺料',     color: '#fa8c16' },
  { field: 'sccjdn',   label: '电脑',     color: '#13c2c2' },
  { field: 'sccjsc',   label: '生产',     color: '#faad14' },
  { field: 'sccjwc',   label: '完成',     color: '#52c41a' },
];

const PRODUCT_SEGMENTS = [
  { value: '', label: '全部' },
  { value: 'YS', label: 'YS' },
  { value: 'YM', label: 'YM' },
  { value: 'ZM', label: 'ZM' },
  { value: 'DS', label: 'DS' },
];

export default function ProcessPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [search, setSearch] = useState({
    product_type: '',
    sccjyl: '',
    keyword: '',
    date_from: '',
    date_to: '',
    bz_max: '69',  // 默认排除已完成订单(sccjwc=1 → bz=70)
  });
  const [actionModal, setActionModal] = useState(null); // { action, label, selectedOrders }
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchData(); }, [page, pageSize, search]);

  // 产品线切换 → 重置到第一页
  function handleProductChange(v) {
    setSearch(s => ({ ...s, product_type: v }));
    setPage(1);
  }

  async function fetchData() {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize, ...search };
      // 去掉空值
      Object.keys(params).forEach(k => { if (params[k] === '') delete params[k]; });
      // cache-bust 避免浏览器缓存
      params._t = Date.now();
      const res = await processList(params);
      setData(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      message.error('加载失败: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  // 点击单个格子操作
  async function handleCellClick(order, step) {
    const isCompleted = order[step.field];
    const isCurrentStep = order.current_step === step.label;
    const isSccjyl = step.field === 'sccjyl';

    let action = step.field;
    let confirmTitle = '';
    let actionType = 'advance';

    if (isCompleted && !isSccjyl) {
      // 已完成工序 → 询问是否回退（暂不实现回退，提示）
      message.info('该工序已完成，如需回退请联系管理员');
      return;
    }

    if (isSccjyl) {
      // 缺料：切换状态
      confirmTitle = isCompleted
        ? `解除「${order.ddbh}」的缺料状态？`
        : `标记「${order.ddbh}」为缺料？`;
      actionType = 'toggle_sccjyl';
    } else {
      confirmTitle = `确认「${order.ddbh}」推进到「${step.label}」？`;
    }

    Modal.confirm({
      title: confirmTitle,
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        try {
          let res;
          if (actionType === 'toggle_sccjyl') {
            res = await processAdvance({
              ddbh: order.ddbh,
              product_type: order.product_type,
              action: 'sccjyl',
              value: isCompleted ? 0 : 1,
            });
          } else {
            res = await processAdvance({
              ddbh: order.ddbh,
              product_type: order.product_type,
              action,
            });
          }
          if (res.success) {
            message.success(`「${order.ddbh}」已更新`);
            fetchData();
          }
        } catch (e) {
          message.error('操作失败: ' + (e.message || e));
        }
      },
    });
  }

  // 批量操作：先弹框确认
  function handleBatchAction(action, label) {
    if (!selectedRowKeys.length) {
      message.warning('请先勾选订单');
      return;
    }
    const selectedOrders = data.filter(o => selectedRowKeys.includes(o.DD_id));
    setActionModal({ action, label, selectedOrders });
  }

  async function confirmBatchAction() {
    const { action, label, selectedOrders } = actionModal;
    setActionLoading(true);
    try {
      const res = await processBatchAdvance({
        items: selectedOrders.map(o => ({ ddbh: o.ddbh, product_type: o.product_type })),
        action,
      });
      if (res.success) {
        message.success(`已批量推进「${label}」，成功 ${res.processed} 条`);
        setSelectedRowKeys([]);
        setActionModal(null);
        fetchData();
      } else {
        message.error('部分失败: ' + JSON.stringify(res.failed));
      }
    } catch (e) {
      message.error('操作失败: ' + (e.message || e));
    } finally {
      setActionLoading(false);
    }
  }

  // 工序格子渲染
  function renderStepCell(order, step) {
    const completed = order[step.field];
    const isSccjyl = step.field === 'sccjyl';
    const isCurrentStep = order.current_step === step.label;
    const timeField = step.field + 'Time';
    const time = order[timeField];

    let icon, color, bg;
    if (completed) {
      icon = <CheckCircleOutlined />;
      color = '#52c41a';
      bg = 'rgba(82,196,26,0.08)';
    } else if (isSccjyl && order.sccjyl) {
      icon = <ExclamationCircleOutlined />;
      color = '#fa8c16';
      bg = 'rgba(250,140,22,0.12)';
    } else {
      icon = <ClockCircleOutlined />;
      color = '#d9d9d9';
      bg = 'transparent';
    }

    return (
      <Tooltip title={completed ? (time ? dayjs(time).format('MM/DD HH:mm') : '已完成') : (isSccjyl ? '标记/解除缺料' : '点击推进')}>
        <div
          onClick={() => handleCellClick(order, step)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', padding: '4px 2px',
            borderRadius: 6, background: bg, minWidth: 52,
            border: isCurrentStep ? `2px solid ${color}` : '2px solid transparent',
            fontSize: 11, gap: 2,
          }}
        >
          <span style={{ color, fontSize: 14 }}>{icon}</span>
          <span style={{ color: completed ? color : '#999', fontSize: 10 }}>{step.label}</span>
        </div>
      </Tooltip>
    );
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'ddbh',
      width: 130,
      fixed: 'left',
      render: ddbh => <Tag color="blue">{ddbh}</Tag>,
    },
    {
      title: '单位',
      dataIndex: 'company',
      ellipsis: true,
      width: 160,
    },
    {
      title: '产品',
      dataIndex: 'product_name',
      width: 80,
      render: pt => <Tag>{pt}</Tag>,
    },
    {
      title: '接单',
      dataIndex: 'jhkddTime',
      width: 70,
      render: (_, r) => r.jhkddTime ? dayjs(r.jhkddTime).format('MM/DD HH:mm') : '—',
    },
    {
      title: '数量',
      dataIndex: 'shuliang',
      width: 60,
      align: 'right',
    },
    {
      title: '发货',
      dataIndex: 'fahuo',
      width: 90,
      render: (_, r) => {
        if (r.fahuo && r.fahuoQty) return <Tag color="green" icon={<SendOutlined />}>{r.fahuoQty}件</Tag>;
        if (r.fahuo) return <Tag color="green" icon={<SendOutlined />}>已发货</Tag>;
        return <Tag icon={<ClockCircleOutlined />}>进行中</Tag>;
      },
    },
    // 工序格子列
    ...STEPS.map(step => ({
      title: step.label,
      key: step.field,
      width: 68,
      align: 'center',
      render: (_, r) => renderStepCell(r, step),
    })),
    {
      title: '当前工序',
      dataIndex: 'current_step',
      width: 90,
      fixed: 'right',
      render: step => {
        if (step === '缺料中') return <Tag color="orange" icon={<WarningOutlined />}>{step}</Tag>;
        if (step === '已完成') return <Tag color="green" icon={<CheckCircleOutlined />}>{step}</Tag>;
        return <Tag icon={<ClockCircleOutlined />}>{step}</Tag>;
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <AppLayout title="工序管理台">
      <style>{`
        .process-table .ant-table-cell { padding: 8px 4px !important; }
      `}</style>

      {/* 顶部产品线切换 */}
      <Segmented
        style={{ marginBottom: 12 }}
        value={search.product_type}
        onChange={handleProductChange}
        options={PRODUCT_SEGMENTS}
      />

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={12} align="middle">
          <Col>
            <Select size="small" style={{ width: 100 }} value={search.sccjyl}
              onChange={v => setSearch(s => ({ ...s, sccjyl: v }))}
              options={[
                { value: '', label: '全部状态' },
                { value: '1', label: '缺料' },
                { value: '0', label: '正常' },
              ]} />
          </Col>
          <Col>
            <Checkbox
              size="small"
              checked={!search.bz_max}
              onChange={e => setSearch(s => ({ ...s, bz_max: e.target.checked ? '' : '69' }))}
            >
              显示完成
            </Checkbox>
          </Col>
          <Col>
            <Input size="small" placeholder="订单号/单位" style={{ width: 140 }}
              value={search.keyword}
              onChange={e => setSearch(s => ({ ...s, keyword: e.target.value }))} />
          </Col>
          <Col>
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          </Col>
          <Col style={{ marginLeft: 'auto' }}>
            <span style={{ color: '#888', fontSize: 12 }}>
              已选 {selectedRowKeys.length} 条 | 共 {total} 条
            </span>
          </Col>
        </Row>

        {/* 批量操作按钮条 */}
        {selectedRowKeys.length > 0 && (
          <Row gutter={8} style={{ marginTop: 10 }}>
            <Col>
              <span style={{ fontSize: 12, color: '#666' }}>批量推进：</span>
            </Col>
            {STEPS.filter(s => s.field !== 'sccjyl').map(step => (
              <Col key={step.field}>
                <Button size="small" type="primary" ghost
                  style={{ borderColor: step.color, color: step.color }}
                  onClick={() => handleBatchAction(step.field, step.label)}>
                  {step.label}
                </Button>
              </Col>
            ))}
            <Col>
              <Button size="small" danger onClick={() => handleBatchAction('sccjyl', '缺料')}>
                ⚠️ 缺料
              </Button>
            </Col>
          </Row>
        )}
      </Card>

      {/* 工序步骤说明条 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 11, color: '#666' }}>
        <span style={{ fontWeight: 600 }}>工序流程：</span>
        {STEPS.map((s, i) => (
          <span key={s.field}>
            {i > 0 && <span style={{ margin: '0 4px', color: '#ddd' }}>→</span>}
            <Badge color={s.color} text={s.label} />
          </span>
        ))}
      </div>

      {/* 列表 */}
      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Table
          className="process-table"
          rowKey="DD_id"
          size="small"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      {/* 批量操作确认弹框 */}
      <Modal
        title={`批量推进「${actionModal?.label}」`}
        open={!!actionModal}
        onOk={confirmBatchAction}
        onCancel={() => setActionModal(null)}
        confirmLoading={actionLoading}
        okText="确认推进"
        cancelText="取消"
      >
        <p>共选中 <strong>{actionModal?.selectedOrders?.length}</strong> 条订单，确认全部推进到「{actionModal?.label}」？</p>
        <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 12 }}>
          {actionModal?.selectedOrders?.map(o => (
            <Tag key={o.DD_id} style={{ margin: 3 }}>
              {o.ddbh} / {o.company} / {o.product_name}
            </Tag>
          ))}
        </div>
      </Modal>
    </AppLayout>
  );
}