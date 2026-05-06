import React, { useEffect, useState } from 'react';
import { Spin, Button } from 'antd';
import { PrinterOutlined, BugOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { adminGetOrder } from '../api';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import dayjs from 'dayjs';
import './PrintYsPageDev.css';

// ── P0-2: 工序二维码 URL 生成 ────────────────────────────────────────────────
function buildScanUrl(ddId, productType, stepField) {
  // 扫码 URL 指向 /production 页面（ProductionPage 从 URL 参数 dd_id/product_type/step 读取）
  return `${window.location.origin}/production?dd_id=${ddId}&product_type=${productType}&step=${stepField}`;
}

export default function PrintYsPageDev() {
  const { ddId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState({}); // { [field]: dataUrl }

  useEffect(() => {
    if (!ddId) return;
    adminGetOrder('YS', ddId).then(res => {
      setOrder(res);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [ddId]);

  useEffect(() => {
    if (!order || !order.ddbh) return;

    // 条码
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

    // P0-2: 工序二维码（只生成未完成工序）
    if (order.steps && order.steps.length > 0) {
      const unfinished = order.steps.filter(s => !s.completed);
      if (unfinished.length > 0) {
        Promise.all(
          unfinished.map(s =>
            QRCode.toDataURL(buildScanUrl(order.DD_id, 'YS', s.field), {
              width: 80,
              margin: 1,
              color: { dark: '#000000', light: '#ffffff' },
            }).catch(() => '')
          )
        ).then(results => {
          const map = {};
          unfinished.forEach((s, i) => { map[s.field] = results[i]; });
          setQrCodes(map);
        });
      }
    }
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
  const waifaPrint = o.waifaprint || (o.waifa === 1 ? '是' : o.waifa === 0 ? '否' : '');

  const gyxnA = [
    o.hzlA1 && '单面光膜', o.hzlA2 && '单面亚膜', o.hzlA3 && '双面光膜',
    o.hzlA4 && '双面亚膜', o.hzlA5 && '单面专用膜', o.hzlA6 && '双面专用膜',
    o.hzlC3 && '外加工上光',
  ].filter(Boolean);
  const gyxnB = [
    o.hzlB3 && '烫金', o.hzlB4 && '压钢刀', o.hzlB5 && '穿线',
    o.hzlB6 && '糊纸粘合', o.hzlB7 && '打汽眼', o.hzlB8 && '凹凸',
    o.hzlB11 && '激光切割', o.hzlB12 && '穿别针', o.hzlB13 && '路线',
    o.hzlB14 && '敲柳钉', o.hzlB15 && '包边',
  ].filter(Boolean);
  const gyxnC = [
    o.hzlC1 && '局部丝网印', o.hzlC4 && '绣花', o.hzlC5 && '烫钻',
    o.hzlC6 && '胶印上光', o.hzlC7 && '粘备用袋', o.hzlC8 && '揉皱',
    o.hzlC9 && '敲毛边', o.hzlC10 && '其它',
  ].filter(Boolean);

  const detailRows = [
    { label: '软片', qty: o.yssl1, amt: o.jine1 },
    { label: '印工', qty: o.yssl2, amt: o.jine2 },
    { label: 'PS版', qty: o.yssl3, amt: o.jine3 },
    { label: '铜锌版', qty: o.yssl4, amt: o.jine4 },
    { label: '电化铝', qty: o.yssl5, amt: o.jine5 },
    { label: '钢刀', qty: o.yssl6, amt: o.jine6 },
    { label: '轧钢刀', qty: o.yssl7, amt: o.jine7 },
    { label: '贴塑双(单)面', qty: o.yssl8, amt: o.jine8 },
    { label: 'UV', qty: o.yss20, amt: o.jine10 },
    { label: '切刀打洞/圆角穿线/整理包扎', qty: o.yssl9, amt: o.jine9 },
  ];

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

        {/* === 标题区（与生产版一致：relative + absolute定位） === */}
        <div className="ys-title-row">
          <div className="ys-title-left">
            <div className="ys-company">嘉兴亚欣商标印务有限公司</div>
            <div className="ys-doc-title">订货生产单（印刷）</div>
            <div className="ys-title-meta">
              <span className="ys-meta-pair">
                <span className="ys-mlabel">印件编号</span>
                <span className="ys-mvalue">{o.yjbhao || '—'}</span>
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
            <span className="ys-cell-label">品名</span>
            <span className="ys-cell-value">{o.jiagongfei || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">发货单位</span>
            <span className="ys-cell-value">{o.fahuodanwei || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">用料质地</span>
            <span className="ys-cell-value">{o.ylzd || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">印刷数量</span>
            <span className="ys-cell-value ys-cell-strong">{o.shuliang != null ? Number(o.shuliang).toLocaleString() : '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">成品规格</span>
            <span className="ys-cell-value">{o.cpgg || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">开料尺寸</span>
            <span className="ys-cell-value">{o.klcc || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">拼数</span>
            <span className="ys-cell-value">{o.pingshu || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">开数</span>
            <span className="ys-cell-value">{o.kaishu || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">需开数量</span>
            <span className="ys-cell-value">{o.xukaisl || '—'}</span>
          </div>
          <div className="ys-base-cell">
            <span className="ys-cell-label">备次数量</span>
            <span className="ys-cell-value">{o.bcsl || '—'}</span>
          </div>
        </div>

        {/* === 价格 + 要求说明(含备注) 2列 === */}
        <div className="ys-2col-row">

          {/* 价格小表 */}
          <div className="ys-price-panel">
            <div className="ys-panel-hd">价格汇总</div>
            <table className="ys-price-tbl">
              <tbody>
                <tr><td>实用大张</td><td className="ys-tbl-num">{fmtMoney(o.sydazhang, 0)}</td></tr>
                <tr><td>单价（元/张）</td><td className="ys-tbl-num">{fmtMoney(o.danjia, 3)}</td></tr>
                <tr><td>金额（元）</td><td className="ys-tbl-num">{fmtMoney(o.syMoney, 3)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 要求说明 + 备注 */}
          <div className="ys-req-panel">
            <div className="ys-panel-hd">要求说明</div>
            <div className="ys-req-row"><span className="ys-cell-label">开料要求</span><span className="ys-req-val">{o.klyaoqiu || '—'}</span></div>
            <div className="ys-req-row"><span className="ys-cell-label">机印要求</span><span className="ys-req-val">{o.jyyaoqiu || '—'}</span></div>
            <div className="ys-req-row"><span className="ys-cell-label">备注</span><span className="ys-req-val">{o.beizhuYS || '—'}</span></div>
          </div>
        </div>

        {/* === 工艺说明（2列：左内容，右空白） === */}
        {(gyxnA.length > 0 || gyxnB.length > 0 || gyxnC.length > 0) && (
          <div className="ys-gongyi-block">
            <div className="ys-gy-left">
              <div className="ys-panel-hd">工艺说明</div>
              <div className="ys-gy-row">
                {gyxnA.length > 0 && <span className="ys-gy-group"><b>贴膜：</b>{gyxnA.join(' · ')}</span>}
                {gyxnB.length > 0 && <span className="ys-gy-group"><b>常规工艺：</b>{gyxnB.join(' · ')}</span>}
                {gyxnC.length > 0 && <span className="ys-gy-group"><b>特殊工艺：</b>{gyxnC.join(' · ')}</span>}
              </div>
            </div>
            <div className="ys-gy-right" />
          </div>
        )}

        {/* === 价格明细（2列：左内容，右空白） === */}
        <div className="ys-detail-block">
          <div className="ys-detail-left">
            <div className="ys-panel-hd">印件总价分析</div>
            <table className="ys-detail-tbl">
              <thead>
                <tr>
                  <th className="ys-th-left">类　别</th>
                  <th className="ys-th-right">数　量</th>
                  <th className="ys-th-right">金　额</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((r, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'ys-row-alt' : ''}>
                    <td>{r.label}</td>
                    <td className="ys-td-right">{fmtMoney(r.qty, 0)}</td>
                    <td className="ys-td-right">{fmtMoney(r.amt, 3)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2" className="ys-tfoot-left">总　计　元/只</td>
                  <td className="ys-tfoot-right">{fmtMoney(o.yszj, 3)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="ys-detail-right" />
        </div>

        {/* === 工序二维码（扫码报工入口）P0-2 === */}
        {order.steps && order.steps.length > 0 && (
          <div className="ys-qr-section">
            <div className="ys-panel-hd">🔄 工序扫码报工</div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
              扫描下方二维码，工人可快速报工（手机扫码 → 直接填表）
            </div>
            <div className="ys-qr-grid">
              {order.steps.map((s, i) => {
                const qr = qrCodes[s.field];
                return (
                  <div key={s.field} className="ys-qr-item">
                    <div className="ys-qr-step">
                      {s.completed
                        ? <span style={{ color: '#10b981', fontWeight: 600 }}>✓ {s.step}</span>
                        : <span style={{ color: s.can_report ? '#f59e0b' : '#333', fontWeight: s.can_report ? 700 : 400 }}>
                            {s.can_report ? '▶ ' : '○ '}{s.step}
                          </span>
                      }
                    </div>
                    <div style={{ height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', border: '1px solid #eee', borderRadius: 4 }}>
                      {qr
                        ? <img src={qr} alt={s.step} style={{ width: 80, height: 80 }} />
                        : s.completed
                          ? <span style={{ fontSize: 20, color: '#10b981' }}>✓</span>
                          : <span style={{ fontSize: 11, color: '#ccc' }}>未完成</span>
                      }
                    </div>
                    <div style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 2 }}>
                      {s.completed ? (s.time ? dayjs(s.time).format('MM/DD HH:mm') : '已完成') : s.can_report ? '待报工' : '等待中'}
                    </div>
                  </div>
                );
              })}
            </div>
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
  return Number(val).toFixed(decimals);
}
