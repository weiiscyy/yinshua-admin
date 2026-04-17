import React, { useEffect, useState } from 'react';
import {
  Table, Card, Input, DatePicker, Button, Space, Typography, Row, Col,
  message, Tag, Modal, Select, Popconfirm
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  PrinterOutlined, ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fahuoList, fahuoGet, fahuoCreate, fahuoUpdate, fahuoDelete, adminListUsers } from '../api';
import { openFahuoPrint } from '../utils/print';
import AppLayout from '../components/AppLayout';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function FahuoListPage() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState({ keyword: '', ywy: '', date1: '', date2: '', kdgs: '', kdhao: '' });
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initForm());
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);

  function initForm() {
    return {
      company: '', kdgs: '', kdhao: '', ywy: null,
      items: [{ pingming: '', khao: '', dnbh: '', shuliang: '', beizhu: '' }],
    };
  }

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

  const handleEdit = async (id) => {
    try {
      const res = await fahuoGet(id);
      const r = res;
      const items = [];
      for (let i = 1; i <= 9; i++) {
        if (r[`pingming${i}`] || r[`khao${i}`] || r[`shuliang${i}`]) {
          items.push({
            pingming: r[`pingming${i}`] || '',
            khao: r[`khao${i}`] || '',
            dnbh: r[`dnbh${i}`] || '',
            shuliang: r[`shuliang${i}`] || '',
            beizhu: r[`beizhu${i}`] || '',
          });
        }
      }
      if (!items.length) items.push({ pingming: '', khao: '', dnbh: '', shuliang: '', beizhu: '' });
      setForm({ company: r.company || '', kdgs: r.kdgs || '', kdhao: r.kdhao || '', ywy: r.ywy || null, items });
      setEditId(id);
    } catch {
      message.error('加载详情失败');
    }
  };

  const handleNew = () => { setEditId(null); setForm(initForm()); };

  const handleSave = async () => {
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
      setForm(initForm());
      setEditId(null);
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

  const updateItem = (idx, key, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: val };
    setForm({ ...form, items });
  };

  const addItem = () => {
    if (form.items.length >= 9) return;
    setForm({ ...form, items: [...form.items, { pingming: '', khao: '', dnbh: '', shuliang: '', beizhu: '' }] });
  };

  const removeItem = (idx) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'ID',
      width: 60,
      render: id => <Tag>{id}</Tag>,
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
      width: 120,
      ellipsis: true,
    },
    {
      title: '快递单号',
      dataIndex: 'kdhao',
      width: 150,
    },
    {
      title: '发货人',
      dataIndex: 'fhr',
      width: 80,
    },
    {
      title: '操作',
      width: 150,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(r.ID)}>打印</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r.ID)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.ID)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout title="发货单管理">
      <Row gutter={16}>
        {/* 左侧：搜索 + 列表 */}
        <Col span={14}>
          <Card
            title={<Space><SearchOutlined /> 发货单查询</Space>}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>新建发货单</Button>}
            style={{ marginBottom: 16 }}
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
              rowKey="ID"
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

        {/* 右侧：表单 */}
        <Col span={10}>
          <Card
            title={editId ? <><EditOutlined /> 编辑发货单 #{editId}</> : <><PlusOutlined /> 新建发货单</>}
            extra={editId && <Button size="small" onClick={handleNew}>新建</Button>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Row gutter={8}>
                <Col span={24}>
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
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>快递公司
                    <Input value={form.kdgs} onChange={e => setForm({ ...form, kdgs: e.target.value })} style={{ marginTop: 4 }} />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>快递单号
                    <Input value={form.kdhao} onChange={e => setForm({ ...form, kdhao: e.target.value })} style={{ marginTop: 4 }} />
                  </div>
                </Col>
                <Col span={12}>
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

              {/* 明细表头 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 1fr 40px', gap: 4, fontWeight: 600, fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>品名</span><span>款号</span><span>订单编号</span><span>数量</span><span>备注</span><span></span>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 1fr 40px', gap: 4, marginBottom: 4 }}>
                  <Input size="small" value={item.pingming} onChange={e => updateItem(idx, 'pingming', e.target.value)} placeholder="品名" />
                  <Input size="small" value={item.khao} onChange={e => updateItem(idx, 'khao', e.target.value)} placeholder="款号" />
                  <Input size="small" value={item.dnbh} onChange={e => updateItem(idx, 'dnbh', e.target.value)} placeholder="单号" />
                  <Input size="small" value={item.shuliang} onChange={e => updateItem(idx, 'shuliang', e.target.value)} placeholder="数量" />
                  <Input size="small" value={item.beizhu} onChange={e => updateItem(idx, 'beizhu', e.target.value)} placeholder="备注" />
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(idx)} disabled={form.items.length <= 1} />
                </div>
              ))}
              {form.items.length < 9 && (
                <Button size="small" onClick={addItem} style={{ marginTop: 4 }}>+ 添加明细</Button>
              )}

              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                style={{ marginTop: 16 }}
                block
              >
                {editId ? '保存修改' : '创建发货单'}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
