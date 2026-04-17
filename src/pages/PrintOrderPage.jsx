import React, { useEffect, useState } from 'react';
import { Spin, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { adminGetOrder, adminUpdateStep } from '../api';
import dayjs from 'dayjs';
import './PrintPage.css';

const PRODUCT_LABELS = { YS: '印刷', YM: '印刷面', ZM: '纸盒', DS: '模切' };

export default function PrintOrderPage({ productType, ddId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productType || !ddId) return;
    adminGetOrder(productType, ddId).then(res => {
      setOrder(res);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [productType, ddId]);

  useEffect(() => {
    if (!loading && order) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, order]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  if (!order) return null;

  const o = order;
  const steps = o.steps || [];

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>🖨️ 打印订单</Button>
        <Button onClick={() => window.close()}>关闭</Button>
      </div>

      <div className="print-content">
        {/* 标题 */}
        <div className="print-header">
          <div className="print-company">兰花印刷包装有限公司</div>
          <div className="print-title">订  单  明  细  单</div>
          <div className="print-subtitle">
            <span style={{ marginRight: 24 }}>NO: <strong>{o.ddbh}</strong></span>
            <span>产品线: {PRODUCT_LABELS[productType] || productType}</span>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="print-order-section">
          <div className="print-order-section-title">基本信息</div>
          <div className="print-order-grid">
            <div><span className="label">客户：</span><span className="value">{o.company}</span></div>
            <div><span className="label">品名：</span><span className="value">{o.pingshu || o.proudnumber || ''}</span></div>
            <div><span className="label">订单日期：</span><span className="value">{o.prouddate ? dayjs(o.prouddate).format('YYYY-MM-DD') : ''}</span></div>
            <div><span className="label">交货日期：</span><span className="value">{o.overdate ? dayjs(o.overdate).format('YYYY-MM-DD') : ''}</span></div>
            <div><span className="label">数量：</span><span className="value">{o.shuliang}</span></div>
            <div><span className="label">业务员：</span><span className="value">{o.ywy_name || ''}</span></div>
            <div><span className="label">制单人：</span><span className="value">{o.zhidan || ''}</span></div>
            {o.jiagongfei ? <div><span className="label">加工费：</span><span className="value">{o.jiagongfei}</span></div> : null}
            {o.danjia ? <div><span className="label">单价：</span><span className="value">{o.danjia}</span></div> : null}
          </div>
        </div>

        {/* 工艺/规格 */}
        {(o.cpgg || o.gyyq || o.gyyq_ym) && (
          <div className="print-order-section">
            <div className="print-order-section-title">工艺要求</div>
            <div className="print-order-grid">
              {o.cpgg ? <div><span className="label">产品规格：</span><span className="value">{o.cpgg}</span></div> : null}
              {o.gyyq ? <div><span className="label">工艺要求：</span><span className="value" style={{gridColumn: 'span 2'}}>{o.gyyq}</span></div> : null}
              {o.gyyq_ym ? <div><span className="label">工艺要求：</span><span className="value" style={{gridColumn: 'span 2'}}>{o.gyyq_ym}</span></div> : null}
            </div>
          </div>
        )}

        {/* 工序进度 */}
        <div className="print-order-section">
          <div className="print-order-section-title">工序进度</div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{width: '45%'}}>工序</th>
                <th style={{width: '20%'}}>状态</th>
                <th style={{width: '35%'}}>完成时间</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'left', paddingLeft: 8 }}>{step.label}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      color: step.completed ? '#10b981' : '#999',
                      fontWeight: step.completed ? 'bold' : 'normal',
                    }}>
                      {step.completed ? '✓ 已完成' : '○ 进行中'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{step.time ? dayjs(step.time).format('MM-DD HH:mm') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 底部 */}
        <div className="print-footer">
          <div className="print-footer-row" style={{ justifyContent: 'flex-end' }}>
            <span>打印时间：{dayjs().format('YYYY-MM-DD HH:mm')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
