import React, { useEffect, useState } from 'react';
import { Spin, Button } from 'antd';
import { PrinterOutlined, BugOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { adminGetOrder } from '../api';
import JsBarcode from 'jsbarcode';
import dayjs from 'dayjs';
import './PrintYsPageDev.css';

const ZM_GX_LABELS = [
  '切折', '三角折', '对折', '切割', '超声波', '热切粘衬', '包边', '卷装',
  '留样', '热切', '划口', '充棉', '打汽眼', '踩线', '烫钻', '盒装',
];

export default function PrintZmPageDev() {
  const { ddId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ddId) return;
    adminGetOrder('ZM', ddId).then(res => {
      setOrder(res);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [ddId]);

  useEffect(() => {
    if (!order || !order.ddbh) return;
    try {
      JsBarcode('#barcode-' + order.ddbh, String(order.ddbh), {
        format: 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 11,
        margin: 0,
        lineColor: '#000',
      });
    } catch (e) { console.error('barcode error', e); }
  }, [order]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) return null;

  const o = order;
  const waifaPrint = o.waifa === 1 ? '是' : '否';

  // 尺码明细：收集有值的列
  const sizeCols = Array.from({ length: 10 }, (_, i) => i + 1)
    .filter(i => o[`cmh${i}`] || o[`sl${i}`] || o[`lieshu${i}`]);

  // 尺码表行标签（数量/列数）
  const sizeRowLabels = ['数量', '列数'];

  return (
    <div className="ys-dev-page">
      {/* 工具栏 */}
      <div className="ys-toolbar">
        <span className="ys-dev-badge"><BugOutlined /> DEV 测试版</span>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>🖨️ 打印订单</Button>
        <Button onClick={() => window.close()}>关闭</Button>
      </div>

      {/* A4 打印纸 */}
      <div className="ys-a4">

        {/* === 标题区 === */}
        <div className="ys-title-row">
          <div className="ys-title-left">
            <div className="ys-company">嘉兴亚欣商标印务有限公司</div>
            <div className="ys-doc-title">订货生产单（纸盒）</div>
            <div className="ys-title-meta">
              <span className="ys-meta-pair">
                <span className="ys-mlabel">花号</span>
                <span className="ys-mvalue">{o.huahao || '—'}</span>
              </span>
              <span className="ys-meta-pair">
                <span className="ys-mlabel">下单公司</span>
                <span className="ys-mvalue">{o.company || '—'}</span>
              </span>
              <span className="ys-meta-pair">
                <span className="ys-mlabel">外发</span>
                <span className="ys-mvalue">{waifaPrint || '—'}</span>
              </span>
            </div>
          </div>
          <svg id={"barcode-" + o.ddbh} className="ys-barcode" />
        </div>

        {/* === 基本信息 4列 === */}
        <div className="ys-base-grid">
          <div className="ys-base-cell">
            <span className="ys-cell-label">交货日期</span>
            <span className="ys-cell-value ys-cell-strong">{o.overdate ? dayjs(o.overdate).format('YYYY-MM-DD') : '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">款号</span>
            <span className="ys-cell-value">{o.kuanhao || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">生产机号</span>
            <span className="ys-cell-value">{o.proudnumber || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">发货单位</span>
            <span className="ys-cell-value">{o.fahuodanwei || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">卷送生产班别</span>
            <span className="ys-cell-value">{o.proudbanbie || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">印刷数量/单位</span>
            <span className="ys-cell-value ys-cell-strong">{o.shuliang != null ? Number(o.shuliang).toLocaleString() : '—'}{o.dhdw ? `/${o.dhdw}` : ''}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">基价</span>
            <span className="ys-cell-value">{o.jijia != null ? fmtMoney(o.jijia, 4) : '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">加工费</span>
            <span className="ys-cell-value">{o.jiagongfei != null ? fmtMoney(o.jiagongfei, 4) : '—'}</span>
          </div>
        </div>

        {/* === 8字段独立表格 === */}
        <table className="ys-specs-tbl">
          <tbody>
            <tr>
              <td><span className="ys-cell-label">总千纬</span><span className="ys-cell-value">{o.allcount || '—'}</span></td>
              <td><span className="ys-cell-label">纬密</span><span className="ys-cell-value">{o.weidu || '—'}</span></td>
              <td><span className="ys-cell-label">宽度</span><span className="ys-cell-value">{o.kuandu || '—'}</span></td>
              <td><span className="ys-cell-label">开条数</span><span className="ys-cell-value">{o.kts || '—'}</span></td>
            </tr>
            <tr>
              <td><span className="ys-cell-label">总长</span><span className="ys-cell-value">{o.changdu || '—'}</span></td>
              <td><span className="ys-cell-label">花长</span><span className="ys-cell-value">{o.huachang || '—'}</span></td>
              <td><span className="ys-cell-label">成品尺寸</span><span className="ys-cell-value">{o.chenpingcc || '—'}</span></td>
              <td><span className="ys-cell-label">首检记录</span><span className="ys-cell-value">{o.soujianjl || '—'}</span></td>
            </tr>
          </tbody>
        </table>

        {/* === 要求说明 === */}
        <div className="ys-req-panel" style={{ width: '100%', border: '1px solid #000' }}>
          <div className="ys-panel-hd">要求说明</div>
          <div className="ys-req-row"><span className="ys-cell-label">工艺要求</span><span className="ys-req-val">{o.gyyq || '—'}</span></div>
          <div className="ys-req-row"><span className="ys-cell-label">整理工序</span><span className="ys-req-val">{ZM_GX_LABELS.map((lbl, i) => o[`hzl${i+1}`] ? lbl : null).filter(Boolean).join(' / ') || '—'}</span></div>
          <div className="ys-req-row"><span className="ys-cell-label">质检</span><span className="ys-req-val">{o.zm_zhijian || '—'}</span></div>
        </div>

        {/* === 色卡明细：2列布局，左列放1-12行，右列留白 === */}
        <div className="ys-req-panel" style={{ width: '100%', border: '1px solid #000', marginTop: 8 }}>
          <div className="ys-panel-hd">色卡明细</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* 左列：1-12 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, borderRight: '1px solid #e2e8f0' }}>
              <thead>
                <tr>
                  <th style={{ padding: '3px 6px', background: '#f5f5f5', color: '#000', border: '1px solid #000', textAlign: 'center', width: '10%' }}>#</th>
                  <th style={{ padding: '3px 6px', background: '#f5f5f5', color: '#000', border: '1px solid #000', textAlign: 'left', width: '30%' }}>千纬(QW)</th>
                  <th style={{ padding: '3px 6px', background: '#f5f5f5', color: '#000', border: '1px solid #000', textAlign: 'left', width: '30%' }}>色纱(SS)</th>
                  <th style={{ padding: '3px 6px', background: '#f5f5f5', color: '#000', border: '1px solid #000', textAlign: 'left' }}>备注(BZ)</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                  <tr key={i}>
                    <td style={{ padding: '2px 4px', textAlign: 'center', color: '#666', border: '1px solid #000', background: '#f5f5f5', fontSize: 11 }}>{i}</td>
                    <td style={{ padding: '2px 4px', border: '1px solid #000', fontSize: 12 }}>{o[`qw${i}`] || '-'}</td>
                    <td style={{ padding: '2px 4px', border: '1px solid #000', fontSize: 12 }}>{o[`ss${i}`] || '-'}</td>
                    <td style={{ padding: '2px 4px', border: '1px solid #000', fontSize: 12, color: '#666' }}>{o[`bz${i}`] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* 右列：空白 */}
            <div style={{ minHeight: 350 }} />
          </div>
        </div>

        {/* === 尺码明细 === */}
        {sizeCols.length > 0 && (
          <div className="ys-req-panel" style={{ width: '100%', border: '1px solid #000', marginTop: 8 }}>
            <div className="ys-panel-hd">尺码明细</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '3px 4px', background: '#f5f5f5', color: '#000', border: '1px solid #000', textAlign: 'center', minWidth: 60 }}>尺码号</th>
                  {sizeCols.map(i => (
                    <th key={i} style={{ padding: '3px 4px', background: '#f5f5f5', color: '#000', border: '1px solid #000', textAlign: 'center', fontSize: 11 }}>{o[`cmh${i}`] || '-'}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['sl', 'lieshu'].map((field, idx) => (
                  <tr key={field}>
                    <td style={{ padding: '2px 4px', background: '#f5f5f5', color: '#000', border: '1px solid #000', textAlign: 'center', fontSize: 10 }}>
                      {sizeRowLabels[idx]}
                    </td>
                    {sizeCols.map(i => (
                      <td key={i} style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontSize: 12 }}>
                        {o[`${field}${i}`] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === 底部信息 === */}
        <div className="ys-footer">
          <span className="ys-footer-item">
            <span className="ys-footer-label">客户联系人：</span>
            <span className="ys-footer-value">{o.ywy_name || '—'}</span>
          </span>
          <span className="ys-f-sep">|</span>
          <span className="ys-footer-item">
            <span className="ys-footer-label">制单：</span>
            <span className="ys-footer-value">{o.zhidan || '—'}</span>
          </span>
          <span className="ys-f-sep">|</span>
          <span className="ys-footer-item">
            <span className="ys-footer-label">生成日期：</span>
            <span className="ys-footer-value">{o.prouddate ? dayjs(o.prouddate).format('YYYY-MM-DD') : '—'}</span>
          </span>
          <span className="ys-f-sep">|</span>
          <span className="ys-footer-item">
            <span className="ys-footer-label">DD编号：</span>
            <span className="ys-footer-value">{o.ddbh || '—'}</span>
          </span>
        </div>

      </div>
    </div>
  );
}

function fmtMoney(val, decimals) {
  if (val == null || val === '') return '';
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  return n.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

