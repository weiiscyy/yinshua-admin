import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Tag, Modal, Form, Input, Select,
  Popconfirm, message, Row, Col
} from 'antd';
import {
  UserAddOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
  SearchOutlined, ReloadOutlined
} from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import {
  getUsers, createUser, updateUser, deleteUser,
  resetUserPassword, getDeptOptions, getCjOptions
} from '../api';

const { Option } = Select;

export default function UserManagePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptOptions, setDeptOptions] = useState([]);
  const [cjOptions, setCjOptions] = useState([]);
  const [filters, setFilters] = useState({ department: undefined, isDel: undefined });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [modalLoading, setModalLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.Department === 'S';

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchOptions = async () => {
    try {
      const [depts, cjs] = await Promise.all([getDeptOptions(), getCjOptions()]);
      setDeptOptions(depts);
      setCjOptions(cjs);
    } catch (e) {
      // error handled by api interceptor
    }
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const rows = await getUsers(filters);
      setData(rows);
      setPagination(p => ({ ...p, total: rows.length }));
    } catch (e) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pag) => {
    setPagination(p => ({ ...p, current: pag.current }));
  };

  const openAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      UserName: record.UserName,
      Department: record.Department,
      Dep_cj: record.Dep_cj ? record.Dep_cj.split('') : [],
      IsDel: record.IsDel === 1,
    });
    setModalOpen(true);
  };

  const handleDeptChange = (dept) => {
    form.setFieldsValue({ Dep_cj: [] });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const payload = {
        UserName: values.UserName,
        Department: values.Department,
        Dep_cj: Array.isArray(values.Dep_cj) ? values.Dep_cj.join('') : (values.Dep_cj || ''),
        IsDel: values.IsDel ? 1 : 0,
      };

      if (editingUser) {
        await updateUser(editingUser.UserID, payload);
        message.success('更新成功');
      } else {
        await createUser({ ...payload, PassWord: values.PassWord });
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      if (!e.errorFields) {
        // business error already shown by interceptor
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPassword = async (user) => {
    try {
      await resetUserPassword(user.UserID);
      message.success(`已将 ${user.UserName} 的密码重置为 123456`);
    } catch (e) {
      // handled
    }
  };

  const handleDelete = async (user) => {
    try {
      await deleteUser(user.UserID);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      // handled
    }
  };

  const showCjSelect = () => {
    const dept = form.getFieldValue('Department');
    return dept === 'C1' || dept === 'C2';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'UserID',
      width: 60,
      fixed: 'left',
    },
    {
      title: '用户名',
      dataIndex: 'UserName',
      width: 120,
    },
    {
      title: '部门',
      dataIndex: 'departmentLabel',
      width: 140,
      render: (label, record) => (
        <Tag color={record.Department === 'S' ? 'red' : record.Department === 'A' ? 'blue' : 'green'}>
          {label}
        </Tag>
      ),
    },
    {
      title: '车间权限',
      dataIndex: 'Dep_cj',
      width: 180,
      render: (val) => {
        if (!val) return '-';
        return val.split('').map(c => {
          const opt = cjOptions.find(o => o.value === c);
          return opt ? <Tag key={c} style={{ marginBottom: 2 }}>{opt.label}</Tag> : null;
        });
      },
    },
    {
      title: '状态',
      dataIndex: 'IsDel',
      width: 80,
      render: (val) => val === 1 ? <Tag color="red">离职</Tag> : <Tag color="green">在职</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {isAdmin && (
            <>
              <Button size="small" icon={<KeyOutlined />} onClick={() => handleResetPassword(record)}>
                重置密码
              </Button>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title={`确认删除用户 ${record.UserName}？`}
                onConfirm={() => handleDelete(record)}
                okText="确认"
                cancelText="取消"
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (!isAdmin) {
    return (
      <AppLayout>
        <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
          仅系统管理员可访问用户管理页面
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: 16 }}>
        {/* 工具栏 */}
        <Row gutter={12} style={{ marginBottom: 12 }}>
          <Col>
            <Select
              placeholder="筛选部门"
              allowClear
              style={{ width: 160 }}
              value={filters.department}
              onChange={(v) => setFilters(f => ({ ...f, department: v }))}
            >
              {deptOptions.map(d => (
                <Option key={d.value} value={d.value}>{d.label}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 120 }}
              value={filters.isDel}
              onChange={(v) => setFilters(f => ({ ...f, isDel: v }))}
            >
              <Option value={0}>在职</Option>
              <Option value={1}>离职</Option>
            </Select>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>刷新</Button>
          </Col>
          <Col flex="auto" />
          <Col>
            <Button type="primary" icon={<UserAddOutlined />} onClick={openAdd}>
              新增用户
            </Button>
          </Col>
        </Row>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="UserID"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          size="small"
        />
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        open={modalOpen}
        title={editingUser ? '编辑用户' : '新增用户'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={modalLoading}
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onValuesChange={() => form.validateFields()}>
          <Form.Item
            name="UserName"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }, { max: 50, message: '最多50字符' }]}
          >
            <Input maxLength={50} placeholder="登录账号" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="PassWord"
              label="初始密码"
              rules={[{ required: true, message: '请输入初始密码' }, { min: 4, message: '至少4位' }, { max: 20, message: '最多20位' }]}
            >
              <Input.Password maxLength={20} placeholder="4-20位字符" />
            </Form.Item>
          )}

          <Form.Item
            name="Department"
            label="部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select placeholder="请选择部门" onChange={handleDeptChange}>
              {deptOptions.map(d => (
                <Option key={d.value} value={d.value}>{d.label}</Option>
              ))}
            </Select>
          </Form.Item>

          {showCjSelect() && (
            <Form.Item name="Dep_cj" label="车间权限" rules={[{ required: true, message: '请至少选择一个车间' }]}>
              <Select mode="multiple" placeholder="请选择车间权限（可多选）">
                {cjOptions.map(c => (
                  <Option key={c.value} value={c.value}>{c.label}</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="IsDel" label="状态" valuePropName="checked">
            <Select>
              <Option value={false}>在职</Option>
              <Option value={true}>离职</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
