import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Select, Spin } from 'antd';
import { Pie, Line, Column } from '@ant-design/plots';
import dayjs from 'dayjs';
import { getStatsTrend, getStatsOverview, getStatsStatusDist, getStatsYwy } from '../api';
import { PRODUCT_LABELS, PRODUCT_COLORS } from '../utils/productColors';
import AppLayout from '../components/AppLayout';

const { Title } = Typography;
const PRODUCT_COLORS_ARR = Object.values(PRODUCT_COLORS); // ['#2563eb','#0891b2','#059669','#d97706']

export default function StatsPage() {
  const [trendDays, setTrendDays] = useState(30);
  const [trendData, setTrendData] = useState([]);
  const [overview, setOverview] = useState({});
  const [statusDist, setStatusDist] = useState({});
  const [ywyData, setYwyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatsTrend({ days: trendDays }).then(res => {
      const lines = [];
      Object.entries(res).forEach(([pt, rows]) => {
        rows.forEach(r => {
          lines.push({ date: r.date, product: PRODUCT_LABELS[pt], count: r.cnt, type: pt });
        });
      });
      setTrendData(lines);
    }).catch(() => {});
  }, [trendDays]);

  useEffect(() => {
    Promise.all([getStatsOverview(), getStatsStatusDist(), getStatsYwy()])
      .then(([ov, dist, ywy]) => {
        setOverview(ov);
        setStatusDist(dist);
        setYwyData(ywy || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalInProgress = Object.values(overview).reduce((s, v) => s + (v.in_progress || 0), 0);
  const totalCompleted = Object.values(overview).reduce((s, v) => s + (v.completed || 0), 0);
  const totalShipped = Object.values(overview).reduce((s, v) => s + (v.shipped || 0), 0);
  const grandTotal = totalInProgress + totalCompleted + totalShipped;

  const ringData = [
    { label: '已完成', value: totalCompleted, color: '#10b981' },
    { label: '已发货', value: totalShipped, color: '#2563eb' },
    { label: '进行中', value: totalInProgress, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const trendConfig = {
    data: trendData,
    xField: 'date',
    yField: 'count',
    seriesField: 'product',
    color: PRODUCT_COLORS_ARR,
    xAxis: { label: { formatter: v => dayjs(v).format('MM-DD') } },
    yAxis: { label: { formatter: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v } },
    legend: { position: 'top-right' },
    smooth: true,
    animation: { appear: { animation: 'path-in', duration: 1200 } },
    lineStyle: { lineWidth: 2 },
    point: { size: 3, shape: 'circle' },
  };

  const barData = Object.entries(overview).map(([k, v]) => ({
    product: PRODUCT_LABELS[k] || k,
    type: k,
    total: v.total || 0,
  }));

  const barConfig = {
    data: barData,
    xField: 'product',
    yField: 'total',
    seriesField: 'type',
    color: PRODUCT_COLORS_ARR,
    label: { position: 'top', formatter: v => v > 0 ? v : '' },
    legend: false,
    animation: { appear: { animation: 'scale-in', duration: 800 } },
  };

  const ringConfig = {
    data: ringData,
    angleField: 'value',
    colorField: 'label',
    color: ringData.map(d => d.color),
    radius: 0.9,
    innerRadius: 0.65,
    label: { text: 'value', style: { fontWeight: 'bold' } },
    legend: { position: 'bottom' },
    statistic: {
      title: { content: '总计', style: { fontSize: 13 } },
      value: { content: grandTotal, style: { fontSize: 18, fontWeight: 'bold' } },
    },
    animation: { appear: { animation: 'fade-in', duration: 1000 } },
  };

  const distData = [];
  Object.entries(statusDist).forEach(([pt, dist]) => {
    distData.push({ product: PRODUCT_LABELS[pt] || pt, 已完成: dist['1_0'] || 0, 已发货: dist['1_1'] || 0, 进行中: dist['0_0'] || 0, 待处理: dist['0_1'] || 0 });
  });

  const stackedConfig = {
    data: distData,
    xField: 'product',
    yField: 'value',
    seriesField: 'status',
    stack: true,
    color: ['#10b981', '#2563eb', '#f59e0b', '#ef4444'],
    xAxis: { label: {} },
    yAxis: { label: { formatter: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v } },
    legend: { position: 'top-right' },
    animation: { appear: { animation: 'scale-in', duration: 800 } },
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin size="large" /></div>;
  }

  return (
    <AppLayout title="数据统计">
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>📊 数据统计看板</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card title="📊 各产品线订单量对比">
            <Column {...barConfig} style={{ height: 220 }} />
          </Card>
        </Col>

        <Col span={10}>
          <Card title="🎯 订单状态分布">
            {ringData.length > 0 ? (
              <Pie {...ringConfig} style={{ height: 220 }} />
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>暂无数据</div>
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card title="📈 每日订单趋势" extra={
            <Select value={trendDays} onChange={v => setTrendDays(v)} style={{ width: 120 }}>
              <Select.Option value={7}>近7天</Select.Option>
              <Select.Option value={14}>近14天</Select.Option>
              <Select.Option value={30}>近30天</Select.Option>
              <Select.Option value={60}>近60天</Select.Option>
            </Select>
          }>
            <Line {...trendConfig} style={{ height: 260 }} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="📦 各产品线订单状态分布">
            <Column {...stackedConfig} style={{ height: 260 }} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="🏆 业务员业绩 TOP10">
            <Row gutter={[12, 12]}>
              {(ywyData || []).slice(0, 10).map((r, i) => (
                <Col span={4} key={r.ywy_name}>
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{i+1}. {r.ywy_name}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{r.order_count}</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>完成 {r.completed || 0}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
