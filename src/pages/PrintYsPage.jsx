import React, { useEffect, useState } from 'react';
import { Spin, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { adminGetOrder } from '../api';
import dayjs from 'dayjs';
import './PrintYsPage.css';

export default function PrintYsPage() {
  const { ddId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ddId) return;
    adminGetOrder('YS', ddId).then(res => {
      setOrder(res);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [ddId]);

  useEffect(() => {
    if (!loading && order) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, order]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) return null;

  const o = order;

  // 旧系统格式：yjbhao放在第一个input，overdate放在第二个，company放在第三个
  // 外发字段：优先取 waifaprint 原值，无则用 waifa=1 显示"是"
  const waifaPrint = o.waifaprint || (o.waifa === 1 ? '是' : o.waifa === 0 ? '否' : '');

  // hzl checkbox 合并为分类工艺文字
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

  return (
    <div className="ys-print-page">
      {/* 工具栏（打印时隐藏） */}
      <div className="ys-toolbar">
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>🖨️ 打印订单</Button>
        <Button onClick={() => window.close()}>关闭</Button>
      </div>

      <div className="ys-print-content">
        {/* 标题区 */}
        <div className="ys-top">
          <table className="ys-title-table" cellSpacing="0" cellPadding="0">
            <tr>
              <td align="center" valign="top">
                <div className="ys-company-title">嘉兴亚欣商标印务有限公司</div>
              </td>
            </tr>
          </table>
        </div>

        {/* 基本信息区 */}
        <div className="ys-info">
          <table className="ys-info-table" cellSpacing="0" cellPadding="0">
            <tr>
              <td>
                <p className="ys-info-line">
                  <span className="ys-label">印件编号：</span>
                  <input className="ys-input" type="text" value={o.yjbhao || ''} readOnly />
                  <span className="ys-label">交货日期：</span>
                  <input className="ys-input" type="text" value={o.overdate ? dayjs(o.overdate).format('YYYY-MM-DD') : ''} readOnly />
                  <span className="ys-label">下单公司：</span>
                  <input className="ys-input ys-input-long" type="text" value={o.company || ''} readOnly />
                </p>
                <p className="ys-info-line">
                  <span className="ys-label">用料质地：</span>
                  <input className="ys-input ys-input-long2" type="text" value={o.ylzd || ''} readOnly />
                  <span className="ys-label">发货：</span>
                  <input className="ys-input" type="text" value={o.fahuodanwei || ''} readOnly />
                  <span className="ys-label">款号：</span>
                  <input className="ys-input" type="text" value={o.kuanhao || ''} readOnly />
                </p>
                <p className="ys-info-line">
                  <span className="ys-label">拼　数：</span>
                  <input className="ys-input" type="text" value={o.pingshu || ''} readOnly />
                  <span className="ys-label">开料尺寸：</span>
                  <input className="ys-input" type="text" value={o.klcc || ''} readOnly />
                  <span className="ys-label">开　数：</span>
                  <input className="ys-input" type="text" value={o.kaishu || ''} readOnly />
                </p>
                <p className="ys-info-line">
                  <span className="ys-label">印刷数量：</span>
                  <input className="ys-input ys-input-short" type="text" value={o.shuliang || ''} readOnly />
                  <span className="ys-label">成品规格：</span>
                  <input className="ys-input" type="text" value={o.cpgg || ''} readOnly />
                  <span className="ys-label">品　名：</span>
                  <input className="ys-input ys-input-shorter" type="text" value={o.jiagongfei || ''} readOnly />
                  <span className="ys-label">外　发：</span>
                  <input className="ys-input ys-input-shortest" type="text" value={waifaPrint} readOnly />
                </p>
                <p className="ys-info-line">
                  <span className="ys-label">需开数量：</span>
                  <input className="ys-input ys-input-long2" type="text" value={o.xukaisl || ''} readOnly />
                </p>
                <p className="ys-info-line">
                  <span className="ys-label">备次数量：</span>
                  <input className="ys-input ys-input-long2" type="text" value={o.bcsl || ''} readOnly />
                </p>
              </td>
            </tr>
          </table>
        </div>

        {/* 左：价格表 | 右：要求表 */}
        <div className="ys-mid-row">
          {/* 价格小表 */}
          <div className="ys-price-table-wrap">
            <table className="ys-price-table" cellSpacing="0" cellPadding="0">
              <tr>
                <td align="center" className="ys-price-th">实单金额</td>
                <td align="center" className="ys-price-th">单价（元/张）</td>
                <td align="center" className="ys-price-th">金　额</td>
              </tr>
              <tr>
                <td align="center">{fmtMoney(o.sydazhang, 0)}</td>
                <td align="center">{fmtMoney(o.danjia, 3)}</td>
                <td align="center">{fmtMoney(o.syMoney, 3)}</td>
              </tr>
            </table>
          </div>

          {/* 要求表 */}
          <div className="ys-req-table-wrap">
            <table className="ys-req-table" cellSpacing="0" cellPadding="0">
              <tr>
                <td align="center" className="ys-req-th">开料要求</td>
                <td className="ys-req-content">　{o.klyaoqiu || ''}</td>
              </tr>
              <tr>
                <td align="center" className="ys-req-th">机印要求</td>
                <td className="ys-req-content">　{o.jyyaoqiu || ''}</td>
              </tr>
              <tr>
                <td align="center" className="ys-req-th">工艺分析</td>
                <td className="ys-req-content">
                  {gyxnA.length > 0 && <div>贴膜：{gyxnA.join('，')}</div>}
                  {gyxnB.length > 0 && <div>常规工艺：{gyxnB.join('，')}</div>}
                  {gyxnC.length > 0 && <div>特殊工艺：{gyxnC.join('，')}</div>}
                  {(gyxnA.length + gyxnB.length + gyxnC.length) === 0 && ''}
                </td>
              </tr>
            </table>
          </div>

          {/* 备注 */}
          <div className="ys-remark-wrap">
            <table className="ys-remark-table" cellSpacing="0" cellPadding="0">
              <tr>
                <td>备注：</td>
              </tr>
              <tr>
                <td className="ys-remark-content">{o.beizhuYS || ''}</td>
              </tr>
            </table>
          </div>
        </div>

        {/* 印刷明细标题 */}
        <div className="ys-detail-title">
          <table className="ys-detail-title-table" cellSpacing="0" cellPadding="0">
            <tr>
              <td align="center" className="ys-detail-title-text">印　刷　明　细　清　单</td>
            </tr>
          </table>
        </div>

        {/* 印刷色数明细 */}
        <div className="ys-detail-table-wrap">
          <table className="ys-detail-table" cellSpacing="0" cellPadding="0">
            <tr>
              <td align="center" className="ys-detail-th">色　序</td>
              <td align="center" className="ys-detail-th">数　量</td>
              <td align="center" className="ys-detail-th" colSpan="2">金　　额</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">色1</td>
              <td align="center">{fmtMoney(o.yssl1, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine1, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">印刷</td>
              <td align="center">{fmtMoney(o.yssl2, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine2, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">PS版</td>
              <td align="center">{fmtMoney(o.yssl3, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine3, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">覆膜开胶</td>
              <td align="center">{fmtMoney(o.yssl4, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine4, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">覆薄膜</td>
              <td align="center">{fmtMoney(o.yssl5, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine5, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">覆opp</td>
              <td align="center">{fmtMoney(o.yssl6, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine6, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">覆pe袋</td>
              <td align="center">{fmtMoney(o.yssl7, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine7, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">中　缝　双　面　印刷</td>
              <td align="center">{fmtMoney(o.yssl8, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine8, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label" style={{ fontSize: 11 }}>UV</td>
              <td align="center">{fmtMoney(o.yss20, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine10, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-row-label">中空圆孔带内托垫片等</td>
              <td align="center">{fmtMoney(o.yssl9, 0)}</td>
              <td align="center" colSpan="2">{fmtMoney(o.jine9, 3)}</td>
            </tr>
            <tr>
              <td align="center" className="ys-detail-total-label" colSpan="3">总　计　元/只</td>
              <td align="center" className="ys-detail-total-value">{fmtMoney(o.yszj, 3)}</td>
            </tr>
          </table>
        </div>

        {/* 底部信息 */}
        <div className="ys-bottom">
          <table className="ys-bottom-table" cellSpacing="0" cellPadding="0">
            <tr>
              <td>
                <p className="ys-info-line">
                  <span className="ys-label">订单编号：</span>
                  <input className="ys-input" type="text" value={o.ddbh || ''} readOnly />
                </p>
                <p className="ys-info-line">
                  <span className="ys-label">客户联系人：</span>
                  <input className="ys-input" type="text" value={o.ywy_name || ''} readOnly />
                  <span className="ys-label">制　单：</span>
                  <input className="ys-input" type="text" value={o.zhidan || ''} readOnly />
                  <span className="ys-label">生成日期：</span>
                  <input className="ys-input" type="text" value={o.prouddate ? dayjs(o.prouddate).format('YYYY-MM-DD') : ''} readOnly />
                </p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmtMoney(val, decimals) {
  if (val == null || val === '') return '';
  return Number(val).toFixed(decimals);
}
