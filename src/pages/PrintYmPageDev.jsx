import React, { useEffect, useState } from 'react';
import { Spin, Button } from 'antd';
import { PrinterOutlined, BugOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { adminGetOrder } from '../api';
import JsBarcode from 'jsbarcode';
import dayjs from 'dayjs';
import './PrintYsPageDev.css';

export default function PrintYmPageDev() {
  const { ddId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ddId) return;
    adminGetOrder('YM', ddId).then(res => {
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

        {/* === 标题区 === */}
        <div className="ys-title-row">
          <div className="ys-title-left">
            <div className="ys-company">嘉兴亚欣商标印务有限公司</div>
            <div className="ys-doc-title">订货生产单（印唛）</div>
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
            <span className="ys-cell-label">拼数</span>
            <span className="ys-cell-value">{o.pingshu || '—'}</span>
          </div>
        </div>

        {/* === 价格 + 要求说明 2列 === */}
        <div className="ys-2col-row">
          {/* 价格小表 */}
          <div className="ys-price-panel">
            <div className="ys-panel-hd">价格汇总</div>
            <table className="ys-price-tbl">
              <tbody>
                <tr><td>实用米数</td><td className="ys-tbl-num">{fmtMoney(o.sydazhang, 0)}</td></tr>
                <tr><td>单价（元/米）</td><td className="ys-tbl-num">{fmtMoney(o.danjia, 3)}</td></tr>
                <tr><td>金额（元）</td><td className="ys-tbl-num">{fmtMoney(o.syMoney, 3)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 要求说明 + 备注 */}
          <div className="ys-req-panel">
            <div className="ys-panel-hd">要求说明</div>
            <div className="ys-req-row"><span className="ys-cell-label">机印要求</span><span className="ys-req-val">{o.jyyaoqiu || '—'}</span></div>
            <div className="ys-req-row"><span className="ys-cell-label">工艺要求</span><span className="ys-req-val">{o.gyyq || '—'}</span></div>
            <div className="ys-req-row"><span className="ys-cell-label">备注</span><span className="ys-req-val">{o.beizhu || '—'}</span></div>
          </div>
        </div>

        {/* === 后整理工艺 === */}
        {(o.hzl1 || o.hzl2 || o.hzl3 || o.hzl4 || o.hzl5 || o.hzl6 || o.hzl7) && (
          <div className="ys-gongyi-block">
            <div className="ys-gy-left">
              <div className="ys-panel-hd">后整理工艺</div>
              <div className="ys-gy-row">
                {o.hzl1 && <span className="ys-gy-group"><b>烘色牢度</b></span>}
                {o.hzl2 && <span className="ys-gy-group"><b>切割</b></span>}
                {o.hzl3 && <span className="ys-gy-group"><b>超声波切割</b></span>}
                {o.hzl4 && <span className="ys-gy-group"><b>三角折</b></span>}
                {o.hzl5 && <span className="ys-gy-group"><b>手工切折</b></span>}
                {o.hzl6 && <span className="ys-gy-group"><b>手工对折</b></span>}
                {o.hzl7 && <span className="ys-gy-group"><b>其它</b></span>}
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
