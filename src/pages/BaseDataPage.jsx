import { useState, useEffect } from 'react';
import {
  Layout, Table, Button, Modal, Form, Input, Select, Tabs, message, Space, Popconfirm, Checkbox
} from 'antd';
import {
  UserAddOutlined, BankOutlined, EnvironmentOutlined, SyncOutlined
} from '@ant-design/icons';
const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

async function apiFetch(url, options = {}) {
  const auth = authHeaders();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: auth.Authorization,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export default function BaseDataPage() {
  const [activeTab, setActiveTab] = useState('salespersons');

  // 业务员
  const [salespersons, setSalespersons] = useState([]);
  const [salespersonModal, setSalespersonModal] = useState(false);
  const [salespersonForm] = Form.useForm();
  const [editingSalesperson, setEditingSalesperson] = useState(null);

  // 公司
  const [companies, setCompanies] = useState([]);
  const [companyModal, setCompanyModal] = useState(false);
  const [companyForm] = Form.useForm();
  const [editingCompany, setEditingCompany] = useState(null);

  // 发货地址
  const [addresses, setAddresses] = useState([]);
  const [addressModal, setAddressModal] = useState(false);
  const [addressForm] = Form.useForm();
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    await Promise.all([loadSalespersons(), loadCompanies(), loadAddresses()]);
  }

  // ===== 业务员 =====
  async function loadSalespersons() {
    try {
      const data = await apiFetch(`${API}/base-data/salespersons`);
      setSalespersons(data);
    } catch (e) {
      message.error('加载业务员失败: ' + e.message);
    }
  }

  async function syncSalespersons() {
    try {
      await apiFetch(`${API}/base-data/sync-salespersons`, { method: 'POST' });
      message.success('同步完成');
      await loadSalespersons();
    } catch (e) {
      message.error('同步失败: ' + e.message);
    }
  }

  async function saveSalesperson(values) {
    try {
      if (editingSalesperson) {
        await apiFetch(`${API}/base-data/salespersons/${editingSalesperson.id}`, {
          method: 'PUT', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await apiFetch(`${API}/base-data/salespersons`, {
          method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' }
        });
      }
      setSalespersonModal(false);
      salespersonForm.resetFields();
      await loadSalespersons();
    } catch (e) {
      message.error(e.message);
    }
  }

  async function deleteSalesperson(id) {
    try {
      await apiFetch(`${API}/base-data/salespersons/${id}`, { method: 'DELETE' });
      await loadSalespersons();
    } catch (e) {
      message.error(e.message);
    }
  }

  // ===== 公司 =====
  async function loadCompanies() {
    try {
      const data = await apiFetch(`${API}/base-data/companies`);
      setCompanies(data);
    } catch (e) {
      message.error('加载公司失败: ' + e.message);
    }
  }

  async function saveCompany(values) {
    try {
      if (editingCompany) {
        await apiFetch(`${API}/base-data/companies/${editingCompany.id}`, {
          method: 'PUT', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await apiFetch(`${API}/base-data/companies`, {
          method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' }
        });
      }
      setCompanyModal(false);
      companyForm.resetFields();
      await loadCompanies();
    } catch (e) {
      message.error(e.message);
    }
  }

  async function deleteCompany(id) {
    try {
      await apiFetch(`${API}/base-data/companies/${id}`, { method: 'DELETE' });
      await loadCompanies();
    } catch (e) {
      message.error(e.message);
    }
  }

  // ===== 发货地址 =====
  async function loadAddresses() {
    try {
      const data = await apiFetch(`${API}/base-data/shipping-addresses`);
      setAddresses(data);
    } catch (e) {
      message.error('加载发货地址失败: ' + e.message);
    }
  }

  async function saveAddress(values) {
    try {
      if (editingAddress) {
        await apiFetch(`${API}/base-data/shipping-addresses/${editingAddress.id}`, {
          method: 'PUT', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await apiFetch(`${API}/base-data/shipping-addresses`, {
          method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' }
        });
      }
      setAddressModal(false);
      addressForm.resetFields();
      await loadAddresses();
    } catch (e) {
      message.error(e.message);
    }
  }

  async function deleteAddress(id) {
    try {
      await apiFetch(`${API}/base-data/shipping-addresses/${id}`, { method: 'DELETE' });
      await loadAddresses();
    } catch (e) {
      message.error(e.message);
    }
  }

  // ===== 表格列定义 =====
  const salespersonColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name' },
    { title: '部门', dataIndex: 'department', width: 80 },
    {
      title: '操作', width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => {
            setEditingSalesperson(r);
            salespersonForm.setFieldsValue(r);
            setSalespersonModal(true);
          }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteSalesperson(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const companyColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '公司名称', dataIndex: 'name' },
    { title: '地址', dataIndex: 'address' },
    { title: '联系人', dataIndex: 'contact' },
    { title: '电话', dataIndex: 'phone' },
    {
      title: '操作', width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => {
            setEditingCompany(r);
            companyForm.setFieldsValue(r);
            setCompanyModal(true);
          }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteCompany(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const addressColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '所属公司', dataIndex: 'company_name', width: 150 },
    { title: '收货地址', dataIndex: 'address' },
    { title: '联系人', dataIndex: 'contact', width: 100 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    { title: '默认', dataIndex: 'isDefault', width: 70, render: v => v ? '✓' : '' },
    {
      title: '操作', width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => {
            setEditingAddress(r);
            addressForm.setFieldsValue({ ...r, isDefault: !!r.isDefault });
            setAddressModal(true);
          }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteAddress(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // ===== Tab items（antd v6 用 items 数组代替 TabPane） =====
  const tabItems = [
    {
      label: <span><UserAddOutlined /> 业务员</span>,
      key: 'salespersons',
      children: (
        <div>
          <Button type="primary" onClick={() => {
            setEditingSalesperson(null);
            salespersonForm.resetFields();
            setSalespersonModal(true);
          }}>+ 新增业务员</Button>
          <Table columns={salespersonColumns} dataSource={salespersons} rowKey="id" pagination={{ pageSize: 10 }} style={{ marginTop: 12 }} />
        </div>
      )
    },
    {
      label: <span><BankOutlined /> 公司</span>,
      key: 'companies',
      children: (
        <div>
          <Button type="primary" onClick={() => {
            setEditingCompany(null);
            companyForm.resetFields();
            setCompanyModal(true);
          }}>+ 新增公司</Button>
          <Table columns={companyColumns} dataSource={companies} rowKey="id" pagination={{ pageSize: 10 }} style={{ marginTop: 12 }} />
        </div>
      )
    },
    {
      label: <span><EnvironmentOutlined /> 发货地址</span>,
      key: 'addresses',
      children: (
        <div>
          <Button type="primary" onClick={() => {
            setEditingAddress(null);
            addressForm.resetFields();
            setAddressModal(true);
          }}>+ 新增地址</Button>
          <Table columns={addressColumns} dataSource={addresses} rowKey="id" pagination={{ pageSize: 10 }} style={{ marginTop: 12 }} />
        </div>
      )
    }
  ];

  return (
    <Content className="base-data-page">
      <div className="page-header">
        <h2>🏢 基础数据管理</h2>
        <Button icon={<SyncOutlined />} onClick={syncSalespersons}>从生产库同步业务员</Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 业务员弹窗 */}
      <Modal
        title={editingSalesperson ? '编辑业务员' : '新增业务员'}
        open={salespersonModal}
        onOk={() => salespersonForm.submit()}
        onCancel={() => { setSalespersonModal(false); salespersonForm.resetFields(); }}
        okText="保存"
        cancelText="取消"
      >
        <Form form={salespersonForm} layout="vertical" onFinish={saveSalesperson}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="输入业务员姓名" />
          </Form.Item>
          <Form.Item name="department" label="部门" initialValue="A">
            <Select>
              <Option value="A">销售部</Option>
              <Option value="B">生产部</Option>
              <Option value="S">系统管理</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 公司弹窗 */}
      <Modal
        title={editingCompany ? '编辑公司' : '新增公司'}
        open={companyModal}
        onOk={() => companyForm.submit()}
        onCancel={() => { setCompanyModal(false); companyForm.resetFields(); }}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={companyForm} layout="vertical" onFinish={saveCompany}>
          <Form.Item name="name" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input placeholder="输入公司名称" />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="输入联系人" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <TextArea rows={2} placeholder="输入公司地址" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 发货地址弹窗 */}
      <Modal
        title={editingAddress ? '编辑地址' : '新增发货地址'}
        open={addressModal}
        onOk={() => addressForm.submit()}
        onCancel={() => { setAddressModal(false); addressForm.resetFields(); }}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={addressForm} layout="vertical" onFinish={saveAddress}>
          <Form.Item name="company_id" label="所属公司" rules={[{ required: true, message: '请选择公司' }]}>
            <Select placeholder="选择公司" showSearch optionFilterProp="children">
              {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="address" label="收货地址" rules={[{ required: true, message: '请输入收货地址' }]}>
            <TextArea rows={2} placeholder="输入详细收货地址" />
          </Form.Item>
          <Form.Item name="contact" label="收货人">
            <Input placeholder="输入收货人" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="输入联系电话" />
          </Form.Item>
          <Form.Item name="isDefault" label="设为默认地址" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Form>
      </Modal>
    </Content>
  );
}
