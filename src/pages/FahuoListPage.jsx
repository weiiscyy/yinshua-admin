import React, { useEffect, useState, useRef } from 'react';;
import {
  Table, Card, Input, DatePicker, Button, Space, Typography, Row, Col,
  message, Tag, Modal, Select, Popconfirm, Tabs, Checkbox, Divider
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  PrinterOutlined, ReloadOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fahuoList, fahuoGet, fahuoCreate, fahuoUpdate, fahuoDelete, fahuoGetPending, fahuoCancelOrder, adminListUsers } from '../api';
import { openFahuoPrint } from '../utils/print';
import { PRODUCT_LABELS } from '../utils/productColors';
import AppLayout from '../components/AppLayout';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// 手工录入初始值
function initManualForm() {
  return {
    company: '', kdgs: '', kdhao: '', ywy: null,
    items: [{ pingming: '', khao: '', dnbh: '', shuliang: '', beizhu: '' }],
  };
}

// 订单选择模式初始值
function initOrderForm() {
  return {
    company: '', kdgs: '', kdhao: '', ywy: null,
    selectedOrders: [], // [{dd_id, product_type, ddbh, company, proudnumber, shuliang, overdate, zhidan, total_sent}]
  };
}


function PendingOrderModal({ open, onClose, onSelect, formSelectedOrders, loading, orders, onSearch, searchProps, onSearchChange }) {
  const [selectedKeys, setSelectedKeys] = useState([]);
  // Track previous keys to diff add vs remove
  const prevKeysRef = useRef([]);
  const keyFor = (o) => String(o.dd_id) + '_' + o.product_type;

  // Sync when modal opens
  useEffect(() => {
    if (!open) {
      setSelectedKeys([]);
      return;
    }
    const keys = (formSelectedOrders || []).map(o => keyFor(o));
    setSelectedKeys(keys);
    prevKeysRef.current = keys;
  }, [open, formSelectedOrders]);

  const pendingColumns = [
    {
      title: '产品',
      dataIndex: 'product_type',
      width: 70,
      filter: null,
      render: pt => <Tag color={{ YS: 'blue', YM: 'cyan', ZM: 'orange', DS: 'purple' }[pt] || 'default'}>{PRODUCT_LABELS[pt] || pt}</Tag>,
    },
    {
      title: '订单号',
      dataIndex: 'ddbh',
      width: 140,
      ellipsis: true,
      filter: null,
    },
    {
      title: '客户',
      dataIndex: 'company',
      ellipsis: true,
      filter: null,
    },
    {
      title: '品名',
      dataIndex: 'proudnumber',
      ellipsis: true,
      filter: null,
    },
    {
      title: '订单数量',
      dataIndex: 'shuliang',
      width: 80,
      align: 'right',
      filter: null,
    },
    {
      title: '已发',
      dataIndex: 'total_sent',
      width: 70,
      align: 'right',
      filter: null,
      render: v => v || 0,
    },
    {
      title: '待发',
      width: 70,
      align: 'right',
      filter: null,
      render: (_, r) => {
        const remain = (r.shuliang || 0) - (r.total_sent || 0);
        return remain > 0 ? <span style={{ color: '#52c41a', fontWeight: 600 }}>{remain}</span> : <span style={{ color: '#999' }}>已完</span>;
      },
    },
    {
      title: '交货日期',
      dataIndex: 'overdate',
      width: 100,
      filter: null,
      render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-',
    },
  ];;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      title="选择订单"
      footer={null}
      centered
      destroyOnClose
      styles={{ body: { padding: '12px' } }}
    >
      <Space wrap style={{ marginBottom: 12 }}>
        <Input
          placeholder="客户名称"
          value={searchProps.company}
          onChange={e => onSearchChange('company', e.target.value)}
          style={{ width: 160 }}
          allowClear
        />
        <Select
          placeholder="产品线"
          value={searchProps.product_type || undefined}
          onChange={v => onSearchChange('product_type', v || '')}
          allowClear
          style={{ width: 120 }}
          options={[
            { label: '全部', value: '' },
            { label: PRODUCT_LABELS.YS, value: 'YS' },
            { label: PRODUCT_LABELS.YM, value: 'YM' },
            { label: PRODUCT_LABELS.ZM, value: 'ZM' },
            { label: PRODUCT_LABELS.DS, value: 'DS' },
          ]}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>搜索</Button>
        <span style={{ color: '#888', fontSize: 12 }}>
          共 {orders.length} 条待发货订单
        </span>
      </Space>
      <Table
        columns={pendingColumns}
        dataSource={orders}
        loading={loading}
        rowKey={r => keyFor(r)}
        size="small"
        scroll={{ y: 400 }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (newKeys) => {
            const prevKeys = prevKeysRef.current;
            const prevSet = new Set(prevKeys);
            const nextSet = new Set(newKeys);
            // For each key in prev but not in next → deselected
            for (const pk of prevKeys) {
              if (!nextSet.has(pk)) {
                const order = (formSelectedOrders || []).find(o => keyFor(o) === pk);
                if (order) onSelect(order);
              }
            }
            // For each key in next but not in prev → newly selected
            for (const nk of newKeys) {
              if (!prevSet.has(nk)) {
                const order = (orders || []).find(o => keyFor(o) === nk);
                if (order) onSelect(order);
              }
            }
            prevKeysRef.current = newKeys;
            setSelectedKeys(newKeys);
          },
        }}
      />
    </Modal>
  );
}



export default function FahuoListPage() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState({ keyword: '', ywy: '', date1: '', date2: '', kdgs: '', kdhao: '' });
  const [editId, setEditId] = useState(null);
  const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'orders'
  const [form, setForm] = useState(initManualForm());
  // Ref to always have current selectedOrders (avoids stale closure in onChange)
  const selectedOrdersRef = useRef([]);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'new'

  // 待选订单相关
  const [pendingVisible, setPendingVisible] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingSearch, setPendingSearch] = useState({ company: '', product_type: '' });

  const fetchUsers = async () => {
    try {
      const res = await adminListUsers();
      const sales = (res || []).filter(u => u.Department === 'E');
      setUsers(sales);
    } catch { /* ignore */ }
  };

  const fetchList = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, page_size: pageSize };
      if (search.keyword) params.keyword = search.keyword;
      if (search.ywy) params.ywy = search.ywy;
      if (search.date1) params.date1 = search.date1;
      if (search.date2) params.date2 = search.date2;
      if (search.kdgs) params.kdgs = search.kdgs;
      if (search.kdhao) params.kdhao = search.kdhao;

      const res = await fahuoList(params);
      setList(res.items || []);
      setTotal(res.total || 0);
      setPage(p);
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); fetchUsers(); }, []);

  const handleSearch = () => { setPage(1); fetchList(1); };

  const handleReset = () => {
    setSearch({ keyword: '', ywy: '', date1: '', date2: '', kdgs: '', kdhao: '' });
    setPage(1);
    fetchList(1);
  };

  // 编辑模式加载数据
  const handleEdit = async (id) => {
    try {
      const res = await fahuoGet(id);
      const r = res;
      // 如果有关联订单，切换到订单模式
      if (r.orders && r.orders.length > 0) {
        const selectedOrders = r.orders.map(o => ({
          dd_id: o.dd_id,
          product_type: o.product_type,
          ddbh: o.ddbh || '',
          company: r.company || '',
          proudnumber: o.proudnumber || '',
          kuanhao: o.kuanhao || '',
          shuliang: o.shuliang_total || 0,
          shuliang_sent: o.shuliang_sent,
          total_sent: o.total_sent || o.shuliang_sent,
          beizhu: o.beizhu || '',
        }));
        setForm({ company: r.company || '', kdgs: r.kdgs || '', kdhao: r.kdhao || '', ywy: r.ywy || null, selectedOrders });
        setInputMode('orders');
      } else {
        // 手工模式
        const items = [];
        for (let i = 1; i <= 9; i++) {
          if (r['pingming' + i] || r['khao' + i] || r['shuliang' + i]) {
            items.push({
              pingming: r['pingming' + i] || '',
              khao: r['khao' + i] || '',
              dnbh: r['dnbh' + i] || '',
              shuliang: r['shuliang' + i] || '',
              beizhu: r['beizhu' + i] || '',
            });
          }
        }
        if (!items.length) items.push({ pingming: '', khao: '', dnbh: '', shuliang: '', beizhu: '' });
        setForm({ company: r.company || '', kdgs: r.kdgs || '', kdhao: r.kdhao || '', ywy: r.ywy || null, items });
        setInputMode('manual');
      }
      setEditId(id);
      setActiveTab('new');
    } catch {
      message.error('加载详情失败');
    }
  };

  const handleNew = () => {
    setEditId(null);
    setForm(initManualForm());
    setInputMode('manual');
    setActiveTab('new');
  };

  // 保存（手工模式）
  const handleSaveManual = async () => {
    if (!form.company) { message.error('收货单位不能为空'); return; }
    setSaving(true);
    try {
      const payload = {
        company: form.company,
        kdgs: form.kdgs,
        kdhao: form.kdhao,
        ywy: form.ywy,
        pingming: form.items.map(i => i.pingming),
        khao: form.items.map(i => i.khao),
        dnbh: form.items.map(i => i.dnbh),
        shuliang: form.items.map(i => i.shuliang),
        beizhu: form.items.map(i => i.beizhu),
      };
      if (editId) {
        await fahuoUpdate(editId, payload);
        message.success('修改成功');
      } else {
        await fahuoCreate(payload);
        message.success('创建成功');
      }
      setForm(initManualForm());
      setEditId(null);
      setActiveTab('list');
      fetchList(page);
    } catch (e) {
      message.error(e?.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存（订单模式）
  const handleSaveOrders = async () => {
    if (!form.company) { message.error('收货单位不能为空'); return; }
    if ((form.selectedOrders || []).length === 0) { message.error('请先选择订单'); return; }
    // 检查是否所有发货数量都填了
    for (const o of form.selectedOrders) {
      if (!o.shuliang_sent || o.shuliang_sent <= 0) {
        message.error('每笔发货数量必须大于0');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        company: form.company,
        kdgs: form.kdgs,
        kdhao: form.kdhao,
        ywy: form.ywy,
        orders: (form.selectedOrders || []).map(o => ({
          dd_id: o.dd_id,
          product_type: o.product_type,
          shuliang_sent: o.shuliang_sent,
          proudnumber: o.proudnumber,
          kuanhao: o.kuanhao,
          shuliang_total: o.shuliang,
          beizhu: o.beizhu || '',
        })),
      };
      if (editId) {
        // 编辑时：先删掉旧关联再重建（简化处理）
        await fahuoUpdate(editId, payload);
        message.success('修改成功');
      } else {
        await fahuoCreate(payload);
        message.success('创建成功');
      }
      setForm(initOrderForm());
      setEditId(null);
      setActiveTab('list');
      fetchList(page);
    } catch (e) {
      message.error(e?.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async (id) => {
    try {
      const res = await fahuoGet(id);
      openFahuoPrint(res);
    } catch { message.error('加载数据失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await fahuoDelete(id);
      message.success('删除成功');
      fetchList(page);
    } catch {
      message.error('删除失败');
    }
  };

  // 手工模式表单操作
  const updateItem = (idx, key, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: val };
    setForm({ ...form, items });
  };

  const addItem = () => {
    if ((form.items || []).length >= 9) return;
    setForm({ ...form, items: [...form.items, { pingming: '', khao: '', dnbh: '', shuliang: '', beizhu: '' }] });
  };

  const removeItem = (idx) => {
    if ((form.items || []).length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  // 打开待选订单弹窗
  const openPendingModal = async () => {
    setPendingVisible(true);
    setPendingLoading(true);
    setPendingSearch({ company: '', product_type: '' });
    try {
      const res = await fahuoGetPending({ page_size: 300 });
      setPendingOrders(Array.isArray(res?.items) ? res.items : []);
    } catch {
      message.error('加载待发货订单失败');
    } finally {
      setPendingLoading(false);
    }
  };

  // 搜索待选订单
  const searchPendingOrders = async () => {
    setPendingLoading(true);
    try {
      const params = { page_size: 300 };
      if (pendingSearch.company) params.company = pendingSearch.company;
      if (pendingSearch.product_type) params.product_type = pendingSearch.product_type;
      const res = await fahuoGetPending(params);
      setPendingOrders(Array.isArray(res?.items) ? res.items : []);
    } catch {
      message.error('搜索失败');
    } finally {
      setPendingLoading(false);
    }
  };

  // 从待选列表勾选订单
  const togglePendingOrder = (order) => {
    // Add or remove based on form.selectedOrders (the actual displayed list)
    const existing = (form.selectedOrders || []).find(o => o.dd_id === order.dd_id && o.product_type === order.product_type);
    if (existing) {
      // Remove it
      const key = keyFor(order);
      const next = (form.selectedOrders || []).filter(o => !(o.dd_id === order.dd_id && o.product_type === order.product_type));
      selectedOrdersRef.current = next;
      setForm({ ...form, selectedOrders: next });
      setSelectedKeys(prev => prev.filter(k => k !== key));
    } else {
      // Add it
      const next = [...(form.selectedOrders || []), {
        ...order,
        shuliang_sent: order.shuliang - order.total_sent || order.shuliang,
        beizhu: '',
      }];
      selectedOrdersRef.current = next;
      setForm({ ...form, selectedOrders: next });
      setSelectedKeys(prev => [...prev, keyFor(order)]);
    }
  };

  // 更新订单模式中某个订单的发货数量
  const updateOrderItem = (ddId, productType, field, value) => {
    if (!form || !form.selectedOrders) return;
    const selectedOrders = (form.selectedOrders || []).map(o => {
      if (o.dd_id === ddId && o.product_type === productType) {
        return { ...o, [field]: value };
      }
      return o;
    });
    setForm({ ...form, selectedOrders });
  };

  // 移除已选订单
  const removeSelectedOrder = (ddId, productType) => {
    if (!form || !form.selectedOrders) return;
        const next = (form.selectedOrders || []).filter(o => !(o.dd_id === ddId && o.product_type === productType));
    selectedOrdersRef.current = next;
    setForm({ ...form, selectedOrders: next });
  };

  // 判断某待选订单是否已选
  const isOrderSelected = (order) => {
    if (!form || !form.selectedOrders) return false;
    return form.selectedOrders.some(o => o.dd_id === order.dd_id && o.product_type === order.product_type);
  };

  // 发货单列表列
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      render: id => <Tag color="blue">{id}</Tag>,
    },
    {
      title: '日期',
      dataIndex: 'regtime',
      width: 100,
      render: t => dayjs(t).format('YYYY-MM-DD'),
    },
    {
      title: '收货单位',
      dataIndex: 'company',
      ellipsis: true,
    },
    {
      title: '快递公司',
      dataIndex: 'kdgs',
      width: 100,
      ellipsis: true,
    },
    {
      title: '快递单号',
      dataIndex: 'kdhao',
      width: 140,
    },
    {
      title: '发货人',
      dataIndex: 'fhr',
      width: 80,
    },
    {
      title: '关联订单',
      width: 80,
      render: (_, r) => r.orders && r.orders.length > 0
        ? <Tag color="green">{r.orders.length}笔</Tag>
        : <Tag>手工</Tag>,
    },
    {
      title: '操作',
      width: 160,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(r.id)}>打印</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r.id)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 待选订单列
  const pendingColumns = [
    {
      title: '勾选',
      width: 50,
      render: (_, r) => (
        <Checkbox
          checked={isOrderSelected(r)}
          onChange={() => togglePendingOrder(r)}
        />
      ),
    },
    {
      title: '产品',
      dataIndex: 'product_type',
      width: 70,
      render: pt => <Tag color={{ YS: 'blue', YM: 'cyan', ZM: 'orange', DS: 'purple' }[pt] || 'default'}>{PRODUCT_LABELS[pt] || pt}</Tag>,
    },
    {
      title: '订单号',
      dataIndex: 'ddbh',
      width: 140,
      ellipsis: true,
    },
    {
      title: '客户',
      dataIndex: 'company',
      ellipsis: true,
    },
    {
      title: '品名',
      dataIndex: 'proudnumber',
      ellipsis: true,
    },
    {
      title: '订单数量',
      dataIndex: 'shuliang',
      width: 80,
      align: 'right',
    },
    {
      title: '已发',
      dataIndex: 'total_sent',
      width: 70,
      align: 'right',
      render: v => v || 0,
    },
    {
      title: '待发',
      width: 70,
      align: 'right',
      render: (_, r) => {
        const sent = r.total_sent || 0;
        const total = r.shuliang || 0;
        const remain = total - sent;
        return remain > 0 ? <span style={{ color: '#52c41a', fontWeight: 600 }}>{remain}</span> : <span style={{ color: '#999' }}>已完</span>;
      },
    },
    {
      title: '交货日期',
      dataIndex: 'overdate',
      width: 100,
      render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-',
    },
  ];

  return (
    <AppLayout title="发货单管理">
      <Tabs
        activeKey={activeTab}
        onChange={key => {
          if (key === 'list') {
            setEditId(null);
            setForm(initManualForm());
            setInputMode('manual');
          }
          setActiveTab(key);
        }}
        style={{ marginBottom: 0 }}
        items={[
          {
            key: 'list',
            label: <span><UnorderedListOutlined /> 发货单列表</span>,
            children: (
              <Row gutter={16}>
                <Col span={24}>
                  <Card
                    extra={
                      <Space>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>新建发货单</Button>
                      </Space>
                    }
                  >
                    <Space wrap style={{ marginBottom: 12 }}>
                      <Input.Search
                        placeholder="收货单位 / 快递单号"
                        value={search.keyword}
                        onChange={e => setSearch({ ...search, keyword: e.target.value })}
                        onSearch={handleSearch}
                        style={{ width: 200 }}
                        allowClear
                      />
                      <Input
                        placeholder="快递公司"
                        value={search.kdgs}
                        onChange={e => setSearch({ ...search, kdgs: e.target.value })}
                        style={{ width: 120 }}
                        allowClear
                      />
                      <Input
                        placeholder="快递单号"
                        value={search.kdhao}
                        onChange={e => setSearch({ ...search, kdhao: e.target.value })}
                        style={{ width: 140 }}
                        allowClear
                      />
                      <RangePicker
                        onChange={(dates) => setSearch({
                          ...search,
                          date1: dates?.[0]?.format('YYYY-MM-DD') || '',
                          date2: dates?.[1]?.format('YYYY-MM-DD') || '',
                        })}
                        style={{ width: 220 }}
                      />
                      <Select
                        placeholder="业务员"
                        value={search.ywy || undefined}
                        onChange={v => setSearch({ ...search, ywy: v || '' })}
                        allowClear
                        style={{ width: 120 }}
                        options={users.map(u => ({ label: u.UserName, value: u.UserID }))}
                      />
                      <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                      <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                    </Space>

                    <Table
                      columns={columns}
                      dataSource={list}
                      loading={loading}
                      rowKey="id"
                      size="small"
                      pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: t => `共 ${t} 条`,
                        onChange: (p, ps) => { setPageSize(ps); fetchList(p); },
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'new',
            label: <span><PlusOutlined /> 新建发货单</span>,
            children: (
              <Row gutter={16}>
                {/* 左侧：录入表单 */}
                <Col span={24}>
                  <Card
                    title={editId ? <><EditOutlined /> 编辑发货单 #{editId}</> : <><PlusOutlined /> 新建发货单</>}
                    extra={
                      <Space>
                        <span style={{ fontSize: 12, color: '#888' }}>
                          模式：
                          <Button size="small" type={inputMode === 'manual' ? 'primary' : 'default'} onClick={() => setInputMode('manual')} style={{ marginLeft: 8 }}>手工录入</Button>
                          <Button size="small" type={inputMode === 'orders' ? 'primary' : 'default'} onClick={() => setInputMode('orders')}>从订单选择</Button>
                        </span>
                      </Space>
                    }
                  >
                    <Row gutter={12}>
                      {/* 基本信息 */}
                      <Col span={24} style={{ marginBottom: 16 }}>
                        <Row gutter={8}>
                          <Col span={12}>
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ color: '#f5222d', marginRight: 4 }}>*</span>收货单位
                              <Input
                                value={form.company}
                                onChange={e => setForm({ ...form, company: e.target.value })}
                                placeholder="必填"
                                style={{ marginTop: 4 }}
                              />
                            </div>
                          </Col>
                          <Col span={6}>
                            <div style={{ marginBottom: 8 }}>快递公司
                              <Input value={form.kdgs} onChange={e => setForm({ ...form, kdgs: e.target.value })} style={{ marginTop: 4 }} />
                            </div>
                          </Col>
                          <Col span={6}>
                            <div style={{ marginBottom: 8 }}>快递单号
                              <Input value={form.kdhao} onChange={e => setForm({ ...form, kdhao: e.target.value })} style={{ marginTop: 4 }} />
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ marginBottom: 8 }}>业务员
                              <Select
                                value={form.ywy || undefined}
                                onChange={v => setForm({ ...form, ywy: v || null })}
                                style={{ marginTop: 4, width: '100%' }}
                                allowClear
                                placeholder="选择业务员"
                                options={users.map(u => ({ label: u.UserName, value: u.UserID }))}
                              />
                            </div>
                          </Col>
                        </Row>
                      </Col>

                      {/* 手工录入模式 */}
                      {inputMode === 'manual' && (
                        <Col span={24}>
                          <Divider orientation="left" plain style={{ fontSize: 13 }}>明细（手工录入）</Divider>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 1fr 40px', gap: 4, fontWeight: 600, fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
                            <span>品名</span><span>款号</span><span>订单编号</span><span>数量</span><span>备注</span><span></span>
                          </div>
                          {form.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 1fr 40px', gap: 4, marginBottom: 4 }}>
                              <Input size="small" value={item.pingming} onChange={e => updateItem(idx, 'pingming', e.target.value)} placeholder="品名" />
                              <Input size="small" value={item.khao} onChange={e => updateItem(idx, 'khao', e.target.value)} placeholder="款号" />
                              <Input size="small" value={item.dnbh} onChange={e => updateItem(idx, 'dnbh', e.target.value)} placeholder="单号" />
                              <Input size="small" value={item.shuliang} onChange={e => updateItem(idx, 'shuliang', e.target.value)} placeholder="数量" />
                              <Input size="small" value={item.beizhu} onChange={e => updateItem(idx, 'beizhu', e.target.value)} placeholder="备注" />
                              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(idx)} disabled={(form.items || []).length <= 1} />
                            </div>
                          ))}
                          {((form.items || []).length < 9) && (
                            <Button size="small" onClick={addItem} style={{ marginTop: 4 }}>+ 添加明细</Button>
                          )}
                          <Button type="primary" onClick={handleSaveManual} loading={saving} style={{ marginTop: 16 }} block>
                            {editId ? '保存修改' : '创建发货单'}
                          </Button>
                        </Col>
                      )}

                      {/* 订单选择模式 */}
                      {inputMode === 'orders' && (
                        <Col span={24}>
                          <Divider orientation="left" plain style={{ fontSize: 13 }}>
                            关联订单
                            <Button size="small" onClick={openPendingModal} style={{ marginLeft: 12 }}>+ 从待发货订单选择</Button>
                          </Divider>

                          {((form.selectedOrders || []).length === 0) ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: '#888', border: '1px dashed #d9d9d9', borderRadius: 8 }}>
                              <div style={{ fontSize: 14, marginBottom: 8 }}>暂无关联订单</div>
                              <Button type="primary" onClick={openPendingModal}>+ 选择订单</Button>
                            </div>
                          ) : (
                            <>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f0f4f8' }}>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'center', width: 32 }}>#</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'left' }}>产品</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'left' }}>订单号</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'left' }}>客户</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'left' }}>品名</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'right' }}>订单数</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'right' }}>已发</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'center', width: 100 }}>本次发货数</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'left' }}>备注</th>
                                    <th style={{ padding: '6px 8px', border: '1px solid #d0dce8', textAlign: 'center', width: 48 }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {form.selectedOrders.map((o, idx) => (
                                    <tr key={o.dd_id + '_' + o.product_type}>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8', textAlign: 'center', background: '#f0f4f8' }}>{idx + 1}</td>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8' }}>
                                        <Tag color={{ YS: 'blue', YM: 'cyan', ZM: 'orange', DS: 'purple' }[o.product_type] || 'default'}>{PRODUCT_LABELS[o.product_type] || o.product_type}</Tag>
                                      </td>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8', fontSize: 12 }}>{o.ddbh}</td>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.company}>{o.company}</td>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8' }}>{o.proudnumber}</td>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8', textAlign: 'right' }}>{o.shuliang}</td>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8', textAlign: 'right', color: '#52c41a' }}>{o.total_sent || 0}</td>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8' }}>
                                        <Input
                                          size="small"
                                          type="number"
                                          min={1}
                                          value={o.shuliang_sent}
                                          onChange={e => updateOrderItem(o.dd_id, o.product_type, 'shuliang_sent', parseInt(e.target.value) || 0)}
                                          style={{ textAlign: 'right' }}
                                        />
                                      </td>
                                      <td style={{ padding: '4px 8px', border: '1px solid #d0dce8' }}>
                                        <Input size="small" value={o.beizhu} onChange={e => updateOrderItem(o.dd_id, o.product_type, 'beizhu', e.target.value)} placeholder="备注" />
                                      </td>
                                      <td style={{ padding: '4px 4px', border: '1px solid #d0dce8', textAlign: 'center' }}>
                                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeSelectedOrder(o.dd_id, o.product_type)} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <Space style={{ marginTop: 12 }}>
                                <Button size="small" onClick={openPendingModal}>+ 继续添加订单</Button>
                              </Space>
                              <Button type="primary" onClick={handleSaveOrders} loading={saving} style={{ marginTop: 16 }} block>
                                {editId ? '保存修改' : '创建发货单'}（{(form.selectedOrders || []).length}笔订单）
                              </Button>
                            </>
                          )}
                        </Col>
                      )}
                    </Row>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {/* 待选订单弹窗 */}
      <PendingOrderModal
        open={pendingVisible}
        onClose={() => setPendingVisible(false)}
        onSelect={(order) => togglePendingOrder(order)}
        formSelectedOrders={form?.selectedOrders || []}
        loading={pendingLoading}
        orders={pendingOrders || []}
        onSearch={searchPendingOrders}
        searchProps={{ company: pendingSearch.company, product_type: pendingSearch.product_type }}
        onSearchChange={(k, v) => setPendingSearch(s => ({ ...s, [k]: v }))}
      />

      <style>{`
        .ant-table-row-selected td { background: #e6f7ff !important; }
      `}</style>
    </AppLayout>
  );
}
