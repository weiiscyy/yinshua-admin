import React, { useEffect, useState } from 'react';
import { Table, Card, Input, DatePicker, Button, Space, Typography, Row, Col, Checkbox, message, Tag } from 'antd';
import { SearchOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { queryOrders, exportOrders } from '../api';
import AppLayout from '../components/AppLayout';
import { PRODUCT_COLORS_CSS } from '../utils/productColors';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PRODUCT_OPTIONS = [
  { label: '印刷(吊牌)', value: 'YS' },
  { label: '印刷面(印唛)', value: 'YM' },
  { label: '纸盒(织唛)', value: 'ZM' },
  { label: '模切(丝网印)', value: 'DS' },
];

const PRODUCT_COLORS = { YS: 'blue', YM: 'cyan', ZM: 'green', DS: 'orange' };

export default function QueryPage() {
  const [form, setForm] = useState({
    company: '',
    huahao: '',
    product_types: ['YS', 'YM', 'ZM', 'DS'],
    dateRange: [],
  });
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [exportLoading, setExportLoading] = useState(false);

  const handleSearch = async (p = 1) => {
    setLoading(true);
    setPage(p);
    try {
      const params = {
        page: p,
        page_size: pageSize,
        product_types: form.product_types.join(','),
      };
      if (form.company) params.company = form.company.trim();
      if (form.huahao) params.huahao = form.huahao.trim();
      if (form.dateRange?.[0]) params.start_date = form.dateRange[0].format('YYYY-MM-DD');
      if (form.dateRange?.[1]) params.end_date = form.dateRange[1].format('YYYY-MM-DD');

      const res = await queryOrders(params);
      setData(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = {
        product_types: form.product_types.join(','),
      };
      if (form.company) params.company = form.company.trim();
      if (form.huahao) params.huahao = form.huahao.trim();
      if (form.dateRange?.[0]) params.start_date = form.dateRange[0].format('YYYY-MM-DD');
      if (form.dateRange?.[1]) params.end_date = form.dateRange[1].format('YYYY-MM-DD');

      const res = await exportOrders(params);
      const items = res.items || [];

      if (items.length === 0) {
        message.warning('没有可导出的数据');
        setExportLoading(false);
        return;
      }

      // 构建 Excel 数据
      const excelData = items.map(r => ({
        '日期': r.prouddate,
        '下单公司': r.company,
        '发货厂家': r.fahuodanwei,
        '款号': r.kuanhao,
        '花号': r.huahao,
        '数量': r.shuliang,
        '基价': r.jijia,
        '加工费': r.jiagongfei,
        '外发': r.waifa,
        '基价金额': r.jijia_amount?.toFixed(2),
        '加工费金额': r.jiagongfei_amount?.toFixed(2),
        '总金额': r.total_amount?.toFixed(2),
        '产品线': r.product_name,
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '订单查询');

      // 设置列宽
      ws['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      ];

      const fileName = `订单查询_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      message.success(`导出成功，共 ${items.length} 条`);
    } catch (e) {
      // error handled by interceptor
    } finally {
      setExportLoading(false);
    }
  };

  const columns = [
    {
      title: '产品',
      dataIndex: 'product_type',
      key: 'product_type',
      width: 100,
      render: (v) => (
        <Tag color={PRODUCT_COLORS[v]}>{v}</Tag>
      ),
    },
    {
      title: '日期',
      dataIndex: 'prouddate',
      key: 'prouddate',
      width: 110,
      sorter: (a, b) => (a.prouddate || '').localeCompare(b.prouddate || ''),
    },
    {
      title: '下单公司',
      dataIndex: 'company',
      key: 'company',
      width: 160,
      ellipsis: true,
    },
    {
      title: '发货厂家',
      dataIndex: 'fahuodanwei',
      key: 'fahuodanwei',
      width: 140,
      ellipsis: true,
    },
    {
      title: '款号',
      dataIndex: 'kuanhao',
      key: 'kuanhao',
      width: 130,
      ellipsis: true,
    },
    {
      title: '花号',
      dataIndex: 'huahao',
      key: 'huahao',
      width: 120,
      ellipsis: true,
    },
    {
      title: '数量',
      dataIndex: 'shuliang',
      key: 'shuliang',
      width: 100,
      align: 'right',
      render: (v) => v?.toLocaleString() ?? '-',
    },
    {
      title: '基价',
      dataIndex: 'jijia',
      key: 'jijia',
      width: 80,
      align: 'right',
      render: (v) => v != null && v !== 0 ? parseFloat(v).toFixed(4) : '-',
    },
    {
      title: '加工费',
      dataIndex: 'jiagongfei',
      key: 'jiagongfei',
      width: 80,
      align: 'right',
      render: (v) => v != null && v !== 0 ? parseFloat(v).toFixed(4) : '-',
    },
    {
      title: '外发',
      dataIndex: 'waifa',
      key: 'waifa',
      width: 60,
      align: 'center',
    },
    {
      title: '基价金额',
      dataIndex: 'jijia_amount',
      key: 'jijia_amount',
      width: 100,
      align: 'right',
      render: (v) => v != null ? parseFloat(v).toFixed(2) : '-',
    },
    {
      title: '加工费金额',
      dataIndex: 'jiagongfei_amount',
      key: 'jiagongfei_amount',
      width: 100,
      align: 'right',
      render: (v) => v != null ? parseFloat(v).toFixed(2) : '-',
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 110,
      align: 'right',
      render: (v) => v != null ? parseFloat(v).toFixed(2) : '-',
    },
  ];

  return (
    <AppLayout title="综合查询">
      <Title level={4} style={{ marginBottom: 16 }}>综合查询</Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <RangePicker
              value={form.dateRange}
              onChange={(vals) => setForm(f => ({ ...f, dateRange: vals || [] }))}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col>
            <Input
              placeholder="下单公司"
              value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              style={{ width: 160 }}
            />
          </Col>
          <Col>
            <Input
              placeholder="花号"
              value={form.huahao}
              onChange={e => setForm(f => ({ ...f, huahao: e.target.value }))}
              style={{ width: 140 }}
            />
          </Col>
          <Col>
            <Checkbox.Group
              options={PRODUCT_OPTIONS}
              value={form.product_types}
              onChange={vals => setForm(f => ({ ...f, product_types: vals }))}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => handleSearch(1)}>
                查询
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport} loading={exportLoading}>
                导出Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
          共 {total} 条{ total > 0 && pageSize < total ? `，显示 ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)}` : '' }
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(r) => `${r.product_type}-${r.DD_id}`}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            onChange: (p, ps) => {
              setPageSize(ps);
              handleSearch(p);
            },
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </AppLayout>
  );
}
