import React, { useEffect, useState } from 'react';
import { Spin, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { adminGetOrder } from '../api';
import dayjs from 'dayjs';
import './PrintPage.css';

const PRODUCT_LABELS = { YS: '印刷', YM: '印刷面', ZM: '纸盒', DS: '模切' };
const COMPANY_NAME = '兰花印刷包装有限公司';

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

  // 计算总价
  const shuliang = parseFloat(o.shuliang) || 0;
  const danjia = parseFloat(o.danjia) || 0;
  const jiagongfei = parseFloat(o.jiagongfei) || 0;
  const jiage = parseFloat(o.jiage) || 0;
  const totalPrice = (shuliang * danjia + shuliang * jiagongfei) || (shuliang * jiage) || 0;

  // YS 色数信息
  const ysColors = [];
  for (let i = 1; i <= 9; i++) {
    if (o['yssl' + i] || o['jine' + i]) {
      ysColors.push({ label: '色' + i, color: o['ysdw' + i] || '', cnt: o['yssl' + i] || '', amt: o['jine' + i] || '' });
    }
  }
  if (o.yss20 || o.jine10) {
    ysColors.push({ label: 'UV', color: o['ysdw10'] || '', cnt: o.yss20 || '', amt: o.jine10 || '' });
  }

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>🖨️ 打印订单</Button>
        <Button onClick={() => window.close()}>关闭</Button>
      </div>

      <div className="print-content">
        {/* 标题 */}
        <div className="print-header">
          <div className="print-company">{COMPANY_NAME}</div>
          <div className="print-title">订 单 明 细 单</div>
          <div className="print-subtitle">
            <span style={{ marginRight: 24 }}>NO: <strong>{o.ddbh}</strong></span>
            <span>产品线: {PRODUCT_LABELS[productType] || productType}</span>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="print-order-section">
          <div className="print-order-section-title">📋 基本信息</div>
          <div className="print-order-grid">
            <div><span className="label">客户：</span><span className="value">{o.company}</span></div>
            <div><span className="label">订单日期：</span><span className="value">{o.prouddate ? dayjs(o.prouddate).format('YYYY-MM-DD') : ''}</span></div>
            <div><span className="label">交货日期：</span><span className="value">{o.overdate ? dayjs(o.overdate).format('YYYY-MM-DD') : ''}</span></div>
            <div><span className="label">数量：</span><span className="value">{o.shuliang}</span></div>
            <div><span className="label">业务员：</span><span className="value">{o.ywy_name || ''}</span></div>
            <div><span className="label">制单人：</span><span className="value">{o.zhidan || ''}</span></div>
            {o.yjbhao ? <div><span className="label">料号/花号：</span><span className="value">{o.yjbhao}</span></div> : null}
            {o.kuanhao ? <div><span className="label">款号：</span><span className="value">{o.kuanhao}</span></div> : null}
            {o.fahuodanwei ? <div><span className="label">发货单位：</span><span className="value">{o.fahuodanwei}</span></div> : null}
            {o.waifa ? <div><span className="label">外发：</span><span className="value">是</span></div> : null}
          </div>
        </div>

        {/* 价格信息 */}
        {(o.danjia || o.jiagongfei || o.jiage) && (
          <div className="print-order-section">
            <div className="print-order-section-title">💰 价格信息</div>
            <div className="print-order-grid">
              {o.danjia ? <div><span className="label">单价：</span><span className="value">{o.danjia}</span></div> : null}
              {o.jiagongfei ? <div><span className="label">加工费：</span><span className="value">{o.jiagongfei}</span></div> : null}
              {o.jiage ? <div><span className="label">单价(DS)：</span><span className="value">{o.jiage}</span></div> : null}
              {totalPrice > 0 ? <div><span className="label">总价：</span><span className="value" style={{ fontWeight: 'bold' }}>{totalPrice.toFixed(2)}</span></div> : null}
            </div>
          </div>
        )}

        {/* 工艺/规格 */}
        {(o.cpgg || o.gyyq || o.gyyq_ym || o.pingshu || o.proudnumber) && (
          <div className="print-order-section">
            <div className="print-order-section-title">📝 规格与工艺</div>
            <div className="print-order-grid">
              {o.pingshu ? <div><span className="label">品名/印刷品名：</span><span className="value">{o.pingshu}</span></div> : null}
              {o.proudnumber ? <div><span className="label">品名/ ProudNumber：</span><span className="value">{o.proudnumber}</span></div> : null}
              {o.cpgg ? <div style={{ gridColumn: 'span 2' }}><span className="label">产品规格：</span><span className="value">{o.cpgg}</span></div> : null}
              {o.gyyq ? <div style={{ gridColumn: 'span 2' }}><span className="label">工艺要求：</span><span className="value">{o.gyyq}</span></div> : null}
              {o.gyyq_ym ? <div style={{ gridColumn: 'span 2' }}><span className="label">工艺要求(印面)：</span><span className="value">{o.gyyq_ym}</span></div> : null}
            </div>
          </div>
        )}

        {/* YS 印刷特有字段 */}
        {productType === 'YS' && (o.ylzd || o.klcc || o.kaishu || o.xukaisl || o.bcsl || o.klyaoqiu || o.jyyaoqiu) && (
          <div className="print-order-section">
            <div className="print-order-section-title">🖨️ 印刷特有信息</div>
            <div className="print-order-grid">
              {o.ylzd ? <div><span className="label">印刷内容：</span><span className="value">{o.ylzd}</span></div> : null}
              {o.klcc ? <div><span className="label">开料尺寸：</span><span className="value">{o.klcc}</span></div> : null}
              {o.kaishu ? <div><span className="label">开数：</span><span className="value">{o.kaishu}</span></div> : null}
              {o.xukaisl ? <div><span className="label">需开数量：</span><span className="value">{o.xukaisl}</span></div> : null}
              {o.bcsl ? <div><span className="label">白参数量：</span><span className="value">{o.bcsl}</span></div> : null}
              {o.klyaoqiu ? <div><span className="label">开料要求：</span><span className="value">{o.klyaoqiu}</span></div> : null}
              {o.jyyaoqiu ? <div style={{ gridColumn: 'span 2' }}><span className="label">经验要求：</span><span className="value">{o.jyyaoqiu}</span></div> : null}
            </div>
          </div>
        )}

        {/* YM 特有字段 */}
        {productType === 'YM' && (o.zhengli || o.yssj) && (
          <div className="print-order-section">
            <div className="print-order-section-title">🏷️ 印面特有信息</div>
            <div className="print-order-grid">
              {o.zhengli ? <div><span className="label">整烫：</span><span className="value">{o.zhengli}</span></div> : null}
              {o.yssj ? <div><span className="label">样色色价：</span><span className="value">{o.yssj}</span></div> : null}
            </div>
          </div>
        )}

        {/* ZM 特有字段 */}
        {productType === 'ZM' && (o.huahao || o.cidiehao || o.zm_zhijian || o.allcount || o.weidu || o.kuandu || o.changdu) && (
          <div className="print-order-section">
            <div className="print-order-section-title">📦 纸盒特有信息</div>
            <div className="print-order-grid">
              {o.huahao ? <div><span className="label">花号：</span><span className="value">{o.huahao}</span></div> : null}
              {o.cidiehao ? <div><span className="label">刺绣号：</span><span className="value">{o.cidiehao}</span></div> : null}
              {o.zm_zhijian ? <div><span className="label">纸盒质检：</span><span className="value">{o.zm_zhijian}</span></div> : null}
              {o.allcount ? <div><span className="label">总数量：</span><span className="value">{o.allcount}</span></div> : null}
              {o.weidu ? <div><span className="label">纬度：</span><span className="value">{o.weidu}</span></div> : null}
              {o.kuandu ? <div><span className="label">宽度：</span><span className="value">{o.kuandu}</span></div> : null}
              {o.changdu ? <div><span className="label">长度：</span><span className="value">{o.changdu}</span></div> : null}
              {o.huachang ? <div><span className="label">花长：</span><span className="value">{o.huachang}</span></div> : null}
              {o.chenpingcc ? <div><span className="label">陈平尺寸：</span><span className="value">{o.chenpingcc}</span></div> : null}
            </div>
          </div>
        )}

        {/* DS 特有字段 */}
        {productType === 'DS' && (o.fhdw || o.fhdate || o.fhr) && (
          <div className="print-order-section">
            <div className="print-order-section-title">📦 模切特有信息</div>
            <div className="print-order-grid">
              {o.fhdw ? <div><span className="label">发货单位：</span><span className="value">{o.fhdw}</span></div> : null}
              {o.fhdate ? <div><span className="label">发货日期：</span><span className="value">{o.fhdate ? dayjs(o.fhdate).format('YYYY-MM-DD') : ''}</span></div> : null}
              {o.fhr ? <div><span className="label">发货人：</span><span className="value">{o.fhr}</span></div> : null}
            </div>
          </div>
        )}

        {/* YS 印刷色数明细 */}
        {productType === 'YS' && ysColors.length > 0 && (
          <div className="print-order-section">
            <div className="print-order-section-title">🎨 印刷色数明细</div>
            <table className="print-table" style={{ fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>色序</th>
                  <th style={{ width: '25%' }}>颜色</th>
                  <th style={{ width: '20%' }}>色数</th>
                  <th style={{ width: '40%' }}>金额</th>
                </tr>
              </thead>
              <tbody>
                {ysColors.map((c, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}>{c.label}</td>
                    <td style={{ textAlign: 'center' }}>{c.color}</td>
                    <td style={{ textAlign: 'center' }}>{c.cnt}</td>
                    <td style={{ textAlign: 'right' }}>{c.amt}</td>
                  </tr>
                ))}
              </tbody>
              {o.yszj ? (
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>总价合计：</td>
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{o.yszj}</td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        )}

        {/* 备注 */}
        {(o.beizhu || o.beizhuYS || o.beizhuZM) && (
          <div className="print-order-section">
            <div className="print-order-section-title">📌 备注</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              {o.beizhu ? <p>{o.beizhu}</p> : null}
              {o.beizhuYS ? <p>印刷备注: {o.beizhuYS}</p> : null}
              {o.beizhuZM ? <p>纸盒备注: {o.beizhuZM}</p> : null}
            </div>
          </div>
        )}

        {/* 工序进度 */}
        {steps.length > 0 && (
          <div className="print-order-section">
            <div className="print-order-section-title">🔄 订单进度</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>工序</th>
                  <th style={{ width: '25%' }}>状态</th>
                  <th style={{ width: '35%' }}>完成时间</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', paddingLeft: 8 }}>{step.step}</td>
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
        )}

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
