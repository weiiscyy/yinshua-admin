import React, { useEffect, useState } from 'react';
import { Spin, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { fahuoGet } from '../api';
import dayjs from 'dayjs';
import './PrintPage.css';

const COMPANY_NAME = '兰花印刷包装有限公司';

export default function PrintFahuoPage({ fahuoId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fahuoId) return;
    fahuoGet(fahuoId).then(res => {
      setData(res);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [fahuoId]);

  useEffect(() => {
    if (!loading && data) {
      // 自动触发打印（在新窗口中）
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  if (!data) return null;

  const r = data;

  // 优先使用 orders 数组（新的），其次用老字段 pingming1-9（兼容）
  let items = [];
  if (r.orders && r.orders.length > 0) {
    // 新订单模式：从 FahuoOrder 表取数据
    items = r.orders.map(function(o) {
      return {
        pingming: o.proudnumber || '',
        khao: o.kuanhao || '',
        dnbh: o.ddbh || '',
        shuliang: o.shuliang_sent !== undefined ? o.shuliang_sent : (o.shuliang_total || ''),
        beizhu: o.beizhu || '',
      };
    });
  } else {
    // 老手工模式：直接从 FaHuoDan 的 pingming1-9 取
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
  }

  const printDate = r.regtime ? dayjs(r.regtime).format('YYYY年MM月DD日') : '';

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>🖨️ 打印发货单</Button>
        <Button onClick={() => window.close()}>关闭</Button>
      </div>

      <div className="print-content">
        {/* 标题 */}
        <div className="print-header">
          <div className="print-company">{COMPANY_NAME}</div>
          <div className="print-title">装 箱 发 货 单</div>
          <div className="print-subtitle">NO: <span className="print-id">{r.id}</span></div>
        </div>

        {/* 基本信息 */}
        <div className="print-info">
          <div className="print-info-row">
            <span className="print-label">收货单位：</span>
            <span className="print-field">{r.company}</span>
            <span className="print-label">日  期：</span>
            <span className="print-field">{printDate}</span>
          </div>
          <div className="print-info-row">
            <span className="print-label">快递公司：</span>
            <span className="print-field">{r.kdgs || ''}</span>
            <span className="print-label">快递单号：</span>
            <span className="print-field">{r.kdhao || ''}</span>
          </div>
        </div>

        {/* 明细表 */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{width: '22%'}}>品名</th>
              <th style={{width: '22%'}}>款号</th>
              <th style={{width: '22%'}}>订单编号</th>
              <th style={{width: '14%'}}>数量</th>
              <th style={{width: '20%'}}>备注</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', color: '#999'}}>无明细</td></tr>
            ) : items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.pingming}</td>
                <td>{item.khao}</td>
                <td>{item.dnbh}</td>
                <td style={{textAlign: 'center'}}>{item.shuliang}</td>
                <td>{item.beizhu}</td>
              </tr>
            ))}
            {items.length < 9 && Array.from({ length: 9 - items.length }).map((_, idx) => (
              <tr key={'empty' + idx} className="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 底部信息 */}
        <div className="print-footer">
          <div className="print-footer-row">
            <span>发 货 人：<span className="print-field-sm">{r.fhr}</span></span>
            <span>业 务 员：<span className="print-field-sm">{r.ywy_name || ''}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
