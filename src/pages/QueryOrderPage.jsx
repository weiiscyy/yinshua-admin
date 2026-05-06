import React, { useState, useEffect } from 'react';
import { Table, Card, Input, DatePicker, Button, Select, Row, Col, Space, message } from 'antd';
import { PRODUCT_LABELS } from '../utils/productColors';
import AppLayout from '../components/AppLayout';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function QueryOrderPage() {
  const [company, setCompany] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [productType, setProductType] = useState('YS');
  const [yjbhao, setYjbhao] = useState('');
  const [kuanhao, setKuanhao] = useState('');
  const [huahao, setHuahao] = useState('');
  const [proudnumber, setProudnumber] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = function() {
    var params = { product_type: productType };
    if (company) params.company = company;
    if (dateRange && dateRange[0]) params.start_date = dateRange[0].format('YYYY-MM-DD');
    if (dateRange && dateRange[1]) params.end_date = dateRange[1].format('YYYY-MM-DD');
    if (productType === 'YS' || productType === 'YM') {
      if (yjbhao) params.yjbhao = yjbhao;
      if (kuanhao) params.kuanhao = kuanhao;
    }
    if (productType === 'ZM') {
      if (huahao) params.huahao = huahao;
      if (proudnumber) params.proudnumber = proudnumber;
    }
    setLoading(true);
    var token = localStorage.getItem('token') || '';
    fetch('/api/order-entry/copy-list?' + new URLSearchParams(params), {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function(r) { return r.json(); }).then(function(res) {
      var items = (res.items || []).map(function(item) {
        return Object.assign({}, item, { product_type: res.product_type });
      });
      setData(items);
      setSearched(true);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  };

  // 初始加载一次
  useEffect(function() {
    doSearch();
  }, []);

  const handleRowClick = function(record) {
    return {
      onClick: function() {
        window.location.href = '/orders/new?copyFrom=' + record.DD_id + '&productType=' + record.product_type;
      },
      style: { cursor: 'pointer' }
    };
  };

  // 根据产品类型动态列
  var yjbhaoCol = (productType === 'YS' || productType === 'YM') ? { title: '印件编号', dataIndex: 'yjbhao', width: 110, render: function(v) { return v || '-'; } } : null;
  var kuanhaoCol = (productType === 'YS' || productType === 'YM') ? { title: '款号', dataIndex: 'kuanhao', width: 100, render: function(v) { return v || '-'; } } : null;
  var huahaoCol = productType === 'ZM' ? { title: '花号', dataIndex: 'huahao', width: 100, render: function(v) { return v || '-'; } } : null;
  var proudnumberCol = productType === 'ZM' ? { title: '生产机型', dataIndex: 'proudnumber', width: 100, render: function(v) { return v || '-'; } } : null;
  var dynamicCols = [yjbhaoCol, kuanhaoCol, huahaoCol, proudnumberCol].filter(Boolean);

  var companyWidth = (productType === 'YS' || productType === 'YM') ? 160 : 140;
  var fieldWidth = (productType === 'YS' || productType === 'YM') ? 120 : 120;

  return (
    <AppLayout title="查询下单">
      <Card style={{ marginBottom: 16 }}>
        {/* 第一行：产品类型、公司名称、印件编号/款号 或 花号/生产机型 */}
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Select value={productType} onChange={function(v) { setProductType(v); setYjbhao(''); setKuanhao(''); setHuahao(''); setProudnumber(''); }} style={{ width: 110 }}>
              <Option value="YS">YS {PRODUCT_LABELS.YS}</Option>
              <Option value="YM">YM {PRODUCT_LABELS.YM}</Option>
              <Option value="ZM">ZM {PRODUCT_LABELS.ZM}</Option>
              <Option value="DS">DS {PRODUCT_LABELS.DS}</Option>
            </Select>
          </Col>
          <Col>
            <Input placeholder="公司名称" value={company} onChange={function(e) { setCompany(e.target.value); }} style={{ width: companyWidth }} allowClear />
          </Col>
          {(productType === 'YS' || productType === 'YM') && (
            <Col>
              <Input placeholder="印件编号" value={yjbhao} onChange={function(e) { setYjbhao(e.target.value); }} style={{ width: fieldWidth }} allowClear />
            </Col>
          )}
          {(productType === 'YS' || productType === 'YM') && (
            <Col>
              <Input placeholder="款号" value={kuanhao} onChange={function(e) { setKuanhao(e.target.value); }} style={{ width: fieldWidth }} allowClear />
            </Col>
          )}
          {productType === 'ZM' && (
            <Col>
              <Input placeholder="花号" value={huahao} onChange={function(e) { setHuahao(e.target.value); }} style={{ width: fieldWidth }} allowClear />
            </Col>
          )}
          {productType === 'ZM' && (
            <Col>
              <Input placeholder="生产机型" value={proudnumber} onChange={function(e) { setProudnumber(e.target.value); }} style={{ width: fieldWidth }} allowClear />
            </Col>
          )}
        </Row>

        {/* 第二行：制单日期、查询按钮 */}
        <Row gutter={[12, 12]} align="middle" style={{ marginTop: 12 }}>
          <Col>
            <RangePicker value={dateRange} onChange={function(vals) { setDateRange(vals || []); }} placeholder={['开始日期', '结束日期']} />
          </Col>
          <Col>
            <Space>
              <Button type="primary" onClick={doSearch} loading={loading}>查询</Button>
            </Space>
          </Col>
          <Col>
            <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>选择订单后将跳转到录入页面，数据将从原单复制</span>
          </Col>
        </Row>
      </Card>

      <Card size="small" title={"查询结果" + (searched ? (data.length ? '（' + data.length + '条）' : '（无数据）') : '')}>
        <Table
          dataSource={data}
          rowKey="DD_id"
          size="small"
          loading={loading}
          pagination={{ pageSize: 10, size: 'small' }}
          onRow={handleRowClick}
          columns={[
            { title: '订单号', dataIndex: 'DD_id', width: 80, render: function(v) { return '#' + v; } },
            { title: '类型', dataIndex: 'product_type', width: 70 },
            { title: '公司名称', dataIndex: 'company', ellipsis: true },
            { title: '制单日期', dataIndex: 'prouddate', width: 100, render: function(v) { return v ? dayjs(v).format('YYYY-MM-DD') : '-'; } },
            ...dynamicCols,
            { title: '数量', dataIndex: 'shuliang', width: 80, render: function(v) { return v != null ? v : '-'; } },
            { title: productType === 'ZM' ? '基价' : '总价', dataIndex: productType === 'ZM' ? 'jijia' : 'yszj', width: 90, render: function(v) { return v != null ? '¥' + Number(v).toFixed(2) : '-'; } },
          ]}
        />
      </Card>
    </AppLayout>
  );
}
