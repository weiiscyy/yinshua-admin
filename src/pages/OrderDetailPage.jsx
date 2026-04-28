import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Typography, message, Spin, Tooltip, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, UndoOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import { openOrderPrint } from '../utils/print';
import { useNavigate, useParams } from 'react-router-dom';
import { adminGetOrder, adminUpdateStep } from '../api';
import AppLayout from '../components/AppLayout';
import { PRODUCT_MAP, PRODUCT_COLORS } from '../utils/productColors';

const { Text } = Typography;

// ============== 辅助函数 ==============
function fmtDate(v) {
  if (!v) return null;
  try { return new Date(v).toLocaleDateString('zh-CN'); } catch { return null; }
}
function fmtNum(v, decimals) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (isNaN(n)) return null;
  return decimals != null ? n.toFixed(decimals) : n.toLocaleString();
}
function hasValue(order, fields) {
  return fields.some(f => { const v = order[f]; return v != null && v !== '' && v !== 0; });
}

// ============== 通用组件 ==============
function FieldRow({ label, value, unit }) {
  if (value == null || value === '' || value === 0) value = '-';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
      <Text style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#333', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}{unit ? <span style={{ color: '#888', fontWeight: 400 }}> {unit}</span> : null}</Text>
    </div>
  );
}
function SectionTitle({ color, children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: color || '#2b6cb0', marginBottom: 6, marginTop: 14, paddingBottom: 4, borderBottom: `1px solid ${color || '#2b6cb0'}30` }}>
      {children}
    </div>
  );
}
function FieldGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px' }}>
      {children}
    </div>
  );
}
function FieldRow2({ label, value }) {
  if (!value) value = '-';
  return (
    <div style={{ padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
      <Text style={{ fontSize: 12, color: '#666' }}>{label}：</Text>
      <Text style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>{value}</Text>
    </div>
  );
}
function ReadOnlyCheckboxGroup({ options, order }) {
  const checked = options.filter(opt => order[opt.value]);
  if (checked.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
      {checked.map(opt => <Tag key={opt.value} style={{ borderRadius: 4, fontSize: 12 }}>{opt.label}</Tag>)}
    </div>
  );
}

// ============== YS 详情 ==============
// 来源: 旧系统 YSinput_Add.asp
// 贴膜: hzlA1-6 + hzlC3(外加工上光)
const TIEMO_OPTIONS = [
  { label: '单面光膜', value: 'hzlA1' }, { label: '单面亚膜', value: 'hzlA2' },
  { label: '双面光膜', value: 'hzlA3' }, { label: '双面亚膜', value: 'hzlA4' },
  { label: '单面专用膜', value: 'hzlA5' }, { label: '双面专用膜', value: 'hzlA6' },
  { label: '外加工上光', value: 'hzlC3' },
];
// 常规工艺: hzlB3-8/11-15
const CHANGGUI_OPTIONS = [
  { label: '烫金', value: 'hzlB3' }, { label: '压钢刀', value: 'hzlB4' },
  { label: '穿线', value: 'hzlB5' }, { label: '糊纸粘合', value: 'hzlB6' },
  { label: '打汽眼', value: 'hzlB7' }, { label: '凹凸', value: 'hzlB8' },
  { label: '激光切割', value: 'hzlB11' }, { label: '穿别针', value: 'hzlB12' },
  { label: '路线', value: 'hzlB13' }, { label: '敲柳钉', value: 'hzlB14' },
  { label: '包边', value: 'hzlB15' },
];
// 特殊工艺: hzlC1/4-10
const TESHU_OPTIONS = [
  { label: '局部丝网印', value: 'hzlC1' },
  { label: '绣花', value: 'hzlC4' }, { label: '烫钻', value: 'hzlC5' },
  { label: '胶印上光', value: 'hzlC6' }, { label: '粘备用袋', value: 'hzlC7' },
  { label: '揉皱', value: 'hzlC8' }, { label: '敲毛边', value: 'hzlC9' },
  { label: '其它', value: 'hzlC10' },
];
const YSS_ANALYSIS = [
  { label: '软片', sl: 'yssl1', je: 'jine1' },
  { label: '印工', sl: 'yssl2', je: 'jine2' },
  { label: 'PS版', sl: 'yssl3', je: 'jine3' },
  { label: '铜锌版', sl: 'yssl4', je: 'jine4' },
  { label: '电化铝', sl: 'yssl5', je: 'jine5' },
  { label: '钢刀', sl: 'yssl6', je: 'jine6' },
  { label: '轧钢刀', sl: 'yssl7', je: 'jine7' },
  { label: '贴塑双(单)面', sl: 'yssl8', je: 'jine8' },
  { label: '切刀打洞/圆角穿线/整理包扎', sl: 'yssl9', je: 'jine9' },
];

function yssAnalysisRowHasValue(order, item) {
  const v1 = order[item.sl]; const v2 = order[item.je];
  return (v1 != null && v1 !== '') || (v2 != null && v2 !== '');
}

function YSOrderDetail({ order, productColor }) {
  // YSGX 表字段：hzlA1-6 / hzlB3-15(缺几个) / hzlC1-10(缺几个)，不在 YS 主表
  const hasAnyCraft = hasValue(order, [
    'hzlA1','hzlA2','hzlA3','hzlA4','hzlA5','hzlA6',
    'hzlB3','hzlB4','hzlB5','hzlB6','hzlB7','hzlB8','hzlB9','hzlB10','hzlB11','hzlB12','hzlB13','hzlB14','hzlB15',
    'hzlC1','hzlC3','hzlC4','hzlC5','hzlC6','hzlC7','hzlC8','hzlC9','hzlC10',
    // ts*/cg*/tm* 是前端误用字段，仅作兼容（数据库不存在这些列）
    'tsJS','tsWX','tsZS','tsJY','tsOT',
  ]);
  const hasAnyAnalysis = YSS_ANALYSIS.some(r => yssAnalysisRowHasValue(order, r));
  const hasAnyRequire = hasValue(order, ['klyaoqiu', 'jyyaoqiu']);
  const hasAnyPrice = hasValue(order, ['sydazhang', 'danjia', 'syMoney', 'yszj']);

  return (
    <div>
      <SectionTitle color={productColor}>基本信息</SectionTitle>
      <FieldGrid>
        <FieldRow label="订单编号" value={order.ddbh} />
        <FieldRow label="生成日期" value={fmtDate(order.prouddate)} />
        <FieldRow label="交货日期" value={fmtDate(order.overdate)} />
        <FieldRow label="制单" value={order.zhidan} />
        <FieldRow label="委印单位" value={order.company} />
        <FieldRow label="发货单位" value={order.fahuodanwei} />
        <FieldRow label="款号" value={order.kuanhao} />
        <FieldRow label="印件编号" value={order.yjbhao} />
        <FieldRow label="品名" value={order.proudnumber} />
        <FieldRow label="所属车间" value={['', '纸盒', '印刷单', '客户印'][order.sclcClass] || '-'} />
        <FieldRow label="业务员" value={order.ywy} />
        <FieldRow label="外发" value={order.waifa ? '是' : '否'} />
      </FieldGrid>

      <SectionTitle color={productColor}>用料与规格</SectionTitle>
      <FieldGrid>
        <FieldRow label="用料质地" value={order.ylzd} />
        <FieldRow label="成品规格" value={order.cpgg} />
        <FieldRow label="印刷数量" value={fmtNum(order.shuliang)} />
        <FieldRow label="拼数" value={fmtNum(order.pingshu)} />
        <FieldRow label="开料尺寸" value={order.klcc} />
        <FieldRow label="开数" value={fmtNum(order.kaishu)} />
        <FieldRow label="需开数量" value={fmtNum(order.xukaisl)} />
        <FieldRow label="备次数量" value={fmtNum(order.bcsl)} />
      </FieldGrid>

      {hasAnyPrice && (
        <>
          <SectionTitle color={productColor}>纸张用量及价格</SectionTitle>
          <FieldGrid>
            <FieldRow label="实印大张" value={fmtNum(order.sydazhang)} />
            <FieldRow label="单价(元/张)" value={fmtNum(order.danjia, 4)} />
            <FieldRow label="实印金额" value={fmtNum(order.syMoney, 2)} />
            <FieldRow label="订单总价" value={fmtNum(order.yszj, 2)} />
          </FieldGrid>
        </>
      )}

      {hasAnyRequire && (
        <>
          <SectionTitle color={productColor}>要求</SectionTitle>
          <FieldRow2 label="开料要求" value={order.klyaoqiu} />
          <FieldRow2 label="机印要求" value={order.jyyaoqiu} />
        </>
      )}

      {hasAnyCraft && (
        <>
          <SectionTitle color={productColor}>工艺配置</SectionTitle>
          <div style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: '#888' }}>贴膜：</Text>
            <ReadOnlyCheckboxGroup options={TIEMO_OPTIONS} order={order} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: '#888' }}>常规工艺：</Text>
            <ReadOnlyCheckboxGroup options={CHANGGUI_OPTIONS} order={order} />
          </div>
          <div>
            <Text style={{ fontSize: 11, color: '#888' }}>特殊工艺：</Text>
            <ReadOnlyCheckboxGroup options={TESHU_OPTIONS} order={order} />
          </div>
        </>
      )}

      {hasAnyAnalysis && (
        <>
          <SectionTitle color={productColor}>印件总价分析</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 4 }}>
            <thead>
              <tr style={{ background: '#f0f4f8' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #d0dce8', width: '40%' }}>类别</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #d0dce8' }}>印量</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #d0dce8' }}>金额</th>
              </tr>
            </thead>
            <tbody>
              {YSS_ANALYSIS.filter(r => yssAnalysisRowHasValue(order, r)).map(r => (
                <tr key={r.label}>
                  <td style={{ padding: '3px 6px', border: '1px solid #e8e8e8', fontSize: 11 }}>{r.label}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e8e8e8', textAlign: 'right', fontSize: 12 }}>{order[r.sl] ?? '-'}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e8e8e8', textAlign: 'right', fontSize: 12 }}>{fmtNum(order[r.je], 2) ?? '-'}</td>
                </tr>
              ))}
              <tr style={{ background: '#e8f4fd', fontWeight: 600 }}>
                <td style={{ padding: '4px 6px', border: '1px solid #d0dce8' }}>总价 元/只</td>
                <td colSpan="2" style={{ padding: '4px 6px', border: '1px solid #d0dce8', textAlign: 'right', fontSize: 13 }}>{fmtNum(order.yszj, 3) ?? '-'}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {order.beizhu && (
        <>
          <SectionTitle color={productColor}>备注</SectionTitle>
          <div style={{ padding: '4px 0', fontSize: 12, color: '#555' }}>{order.beizhu}</div>
        </>
      )}
    </div>
  );
}

// ============== YM 详情 ==============
const YM_HZL_OPTIONS = [
  { label: '烘色牢度', value: 'hzl1' }, { label: '切割', value: 'hzl2' },
  { label: '超声波切割', value: 'hzl3' }, { label: '三角折', value: 'hzl7' },
  { label: '手工切折', value: 'hzl4' }, { label: '手工对折', value: 'hzl5' },
  { label: '其它', value: 'hzl6' },
];
const YM_ANALYSIS = [
  { label: '软片', sl: 'yssl1', je: 'jine1' },
  { label: '印工', sl: 'yssl2', je: 'jine2' },
  { label: 'PS版', sl: 'yssl3', je: 'jine3' },
  { label: '铜锌版', sl: 'yssl4', je: 'jine4' },
  { label: '电化铝', sl: 'yssl5', je: 'jine5' },
  { label: '钢刀', sl: 'yssl6', je: 'jine6' },
  { label: '轧钢刀', sl: 'yssl7', je: 'jine7' },
  { label: '贴塑双(单)面', sl: 'yssl8', je: 'jine8' },
  { label: '切刀打洞/圆角穿线/整理包扎', sl: 'yssl9', je: 'jine9' },
];

function ymAnalysisRowHasValue(order, item) {
  const v1 = order[item.sl]; const v2 = order[item.je];
  if (item.yl) { const v3 = order[item.yl]; return v3 != null && v3 !== ''; }
  return (v1 != null && v1 !== '') || (v2 != null && v2 !== '');
}

function YMOrderDetail({ order, productColor }) {
  const hasAnyCraft = hasValue(order, ['hzl1','hzl2','hzl3','hzl4','hzl5','hzl6','hzl7']);
  const hasAnyAnalysis = YM_ANALYSIS.some(r => ymAnalysisRowHasValue(order, r));
  const hasAnyRequire = hasValue(order, ['jyyaoqiu', 'gyyq']);
  const hasAnyPrice = hasValue(order, ['sydazhang', 'danjia', 'syMoney']);

  return (
    <div>
      <SectionTitle color={productColor}>基本信息</SectionTitle>
      <FieldGrid>
        <FieldRow label="订单编号" value={order.ddbh} />
        <FieldRow label="生成日期" value={fmtDate(order.prouddate)} />
        <FieldRow label="交货日期" value={fmtDate(order.overdate)} />
        <FieldRow label="制单" value={order.zhidan} />
        <FieldRow label="委印单位" value={order.company} />
        <FieldRow label="发货单位" value={order.fahuodanwei} />
        <FieldRow label="印件编号" value={order.yjbhao} />
        <FieldRow label="印刷数量" value={fmtNum(order.shuliang)} />
        <FieldRow label="拼数" value={fmtNum(order.pingshu)} />
        <FieldRow label="成品规格" value={order.cpgg} />
        <FieldRow label="所属车间" value={['', '纸盒', '印刷单', '客户印'][order.sclcClass] || '-'} />
        <FieldRow label="用料质地" value={order.ylzd} />
        <FieldRow label="业务员" value={order.ywy} />
        <FieldRow label="款号" value={order.kuanhao} />
        <FieldRow label="品名" value={order.proudnumber} />
        <FieldRow label="外发" value={order.waifa ? '是' : '否'} />
      </FieldGrid>

      {hasAnyPrice && (
        <>
          <SectionTitle color={productColor}>纸张用量及价格</SectionTitle>
          <FieldGrid>
            <FieldRow label="实用米数" value={fmtNum(order.sydazhang)} />
            <FieldRow label="单价(元/米)" value={fmtNum(order.danjia, 4)} />
            <FieldRow label="金额" value={fmtNum(order.syMoney, 2)} />
          </FieldGrid>
        </>
      )}

      {hasAnyRequire && (
        <>
          <SectionTitle color={productColor}>要求</SectionTitle>
          <FieldRow2 label="机印要求" value={order.jyyaoqiu} />
          <FieldRow2 label="工艺要求" value={order.gyyq} />
        </>
      )}

      {hasAnyCraft && (
        <>
          <SectionTitle color={productColor}>后整理工艺</SectionTitle>
          <ReadOnlyCheckboxGroup options={YM_HZL_OPTIONS} order={order} />
        </>
      )}

      {hasAnyAnalysis && (
        <>
          <SectionTitle color={productColor}>印件总价分析</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 4 }}>
            <thead>
              <tr style={{ background: '#f0f4f8' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #d0dce8', width: '30%' }}>类别</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #d0dce8', width: '20%' }}>数量</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #d0dce8', width: '15%' }}>单位</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #d0dce8' }}>金额</th>
              </tr>
            </thead>
            <tbody>
              {YM_ANALYSIS.filter(r => ymAnalysisRowHasValue(order, r)).map(r => (
                <tr key={r.label}>
                  <td style={{ padding: '3px 6px', border: '1px solid #e8e8e8', fontSize: 11 }}>{r.label}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e8e8e8', textAlign: 'right', fontSize: 12 }}>{order[r.sl] ?? '-'}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e8e8e8', textAlign: 'center', fontSize: 11, color: '#888' }}>米/只</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e8e8e8', textAlign: 'right', fontSize: 12 }}>{fmtNum(order[r.je], 2) ?? '-'}</td>
                </tr>
              ))}
              <tr style={{ background: '#e8f4fd', fontWeight: 600 }}>
                <td style={{ padding: '4px 6px', border: '1px solid #d0dce8' }}>总价 元/只</td>
                <td colSpan="3" style={{ padding: '4px 6px', border: '1px solid #d0dce8', textAlign: 'right', fontSize: 13 }}>{fmtNum(order.yszj, 3) ?? '-'}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <SectionTitle color={productColor}>其他</SectionTitle>
      <FieldGrid>
        <FieldRow label="印机型号" value={order.beizhu8} />
        <FieldRow label="发料日期" value={fmtDate(order.lldate)} />
        <FieldRow label="附件" value={order.upfile ? '有' : '-'} />
      </FieldGrid>
      {(order.beizhuYM || order.beizhu) && (
        <div style={{ padding: '4px 0', fontSize: 12, color: '#555', marginTop: 4 }}>备注：{order.beizhuYM || order.beizhu}</div>
      )}
    </div>
  );
}

// ============== ZM 详情 ==============
const ZM_HZL_OPTIONS = [
  { label: '切折', value: 'hzl1' }, { label: '三角折', value: 'hzl2' },
  { label: '对折', value: 'hzl3' }, { label: '切割', value: 'hzl4' },
  { label: '超声波', value: 'hzl5' }, { label: '热切粘衬', value: 'hzl6' },
  { label: '包边', value: 'hzl7' }, { label: '卷装', value: 'hzl8' },
  { label: '留样', value: 'hzl9' }, { label: '热切', value: 'hzl10' },
  { label: '划口', value: 'hzl11' }, { label: '充棉', value: 'hzl12' },
  { label: '打汽眼', value: 'hzl13' }, { label: '踩线', value: 'hzl14' },
  { label: '烫钻', value: 'hzl15' }, { label: '盒装', value: 'hzl16' },
];

function ZMOrderDetail({ order, productColor }) {
  const hasAnyCraft = hasValue(order, ['hzl1','hzl2','hzl3','hzl4','hzl5','hzl6','hzl7','hzl8','hzl9','hzl10','hzl11','hzl12','hzl13','hzl14','hzl15','hzl16']);
  const colorRows = Array.from({ length: 12 }, (_, i) => i + 1).filter(idx =>
    order[`qw${idx}`] || order[`ss${idx}`] || order[`bz${idx}`]
  );
  const sizeCols = Array.from({ length: 10 }, (_, i) => i + 1).filter(idx =>
    order[`cmh${idx}`] || order[`sl${idx}`] || order[`lieshu${idx}`]
  );

  return (
    <div>
      <SectionTitle color={productColor}>基本信息</SectionTitle>
      <FieldGrid>
        <FieldRow label="订单编号" value={order.ddbh} />
        <FieldRow label="生成日期" value={fmtDate(order.prouddate)} />
        <FieldRow label="交货日期" value={fmtDate(order.overdate)} />
        <FieldRow label="制单" value={order.zhidan} />
        <FieldRow label="花号" value={order.huahao} />
        <FieldRow label="订货数量" value={fmtNum(order.shuliang)} unit={order.dhdw} />
        <FieldRow label="所需时间" value={fmtDate(order.sxdate)} />
        <FieldRow label="业务员" value={order.ywy} />
        <FieldRow label="下单公司" value={order.company} />
        <FieldRow label="发货单位" value={order.fahuodanwei} />
        <FieldRow label="款号" value={order.kuanhao} />
      </FieldGrid>

      <SectionTitle color={productColor}>生产规格</SectionTitle>
      <FieldGrid>
        <FieldRow label="卷送生产班别" value={order.proudbanbie} />
        <FieldRow label="生产机型" value={order.proudnumber} />
        <FieldRow label="基价" value={fmtNum(order.jijia, 4)} />
        <FieldRow label="总干纬" value={fmtNum(order.allcount)} />
        <FieldRow label="纬密" value={order.weidu} />
        <FieldRow label="宽度" value={order.kuandu} />
        <FieldRow label="开条数" value={fmtNum(order.kts)} />
        <FieldRow label="总长" value={order.changdu} />
        <FieldRow label="花长" value={order.huachang} />
        <FieldRow label="成品尺寸" value={order.chenpingcc} />
        <FieldRow label="加工费" value={fmtNum(order.jiagongfei, 4)} />
        <FieldRow2 label="首检记录" value={order.soujianjl} />
      </FieldGrid>

      {colorRows.length > 0 && (
        <>
          <SectionTitle color="#059669">色卡明细</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 }}>
            <thead>
              <tr>
                {['序', '千纬(QW)', '色纱(SS)', '备注(BZ)'].map((h, i) => (
                  <th key={i} style={{ padding: '3px 6px', background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0', textAlign: 'center', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colorRows.map(idx => (
                <tr key={idx}>
                  <td style={{ padding: '2px 4px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 11 }}>{idx}</td>
                  <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: 12 }}>{order[`qw${idx}`] || '-'}</td>
                  <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: 12 }}>{order[`ss${idx}`] || '-'}</td>
                  <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8' }}>{order[`bz${idx}`] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {sizeCols.length > 0 && (
        <>
          <SectionTitle color="#2563eb">尺码明细</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={{ padding: '3px 4px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', textAlign: 'center', fontSize: 11 }}>尺码号</th>
                {sizeCols.map(n => (
                  <th key={n} style={{ padding: '3px 4px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', textAlign: 'center', fontSize: 11 }}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['cmh', 'sl', 'lieshu'].map((prefix, pi) => (
                <tr key={prefix}>
                  <td style={{ padding: '2px 4px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', textAlign: 'center', fontSize: 10 }}>{['尺码', '数量', '列数'][pi]}</td>
                  {sizeCols.map(n => (
                    <td key={n} style={{ padding: '2px 4px', border: '1px solid #bfdbfe', textAlign: 'center', fontSize: 12 }}>{order[`${prefix}${n}`] || '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {hasAnyCraft && (
        <>
          <SectionTitle color={productColor}>整理工序</SectionTitle>
          <ReadOnlyCheckboxGroup options={ZM_HZL_OPTIONS} order={order} />
        </>
      )}

      <SectionTitle color={productColor}>其他信息</SectionTitle>
      <FieldRow label="外发" value={order.waifa ? '是' : '否'} />
      <FieldRow2 label="工艺要求" value={order.gyyq} />
      <FieldRow2 label="质检" value={order.zm_zhijian} />
    </div>
  );
}

// ============== DS 详情 ==============
const DS_CRAFT = [{ label: '制版', value: 'hzl1' }, { label: '生产', value: 'hzl2' }];

function DSOrderDetail({ order, productColor }) {
  const hasAnyCraft = hasValue(order, ['hzl1', 'hzl2']);

  return (
    <div>
      <SectionTitle color={productColor}>基本信息</SectionTitle>
      <FieldGrid>
        <FieldRow label="订单编号" value={order.ddbh} />
        <FieldRow label="印件编号" value={order.yjbhao} />
        <FieldRow label="交货日期" value={fmtDate(order.overdate)} />
        <FieldRow label="生产日期" value={fmtDate(order.prouddate)} />
        <FieldRow label="委印单位" value={order.company} />
        <FieldRow label="款号" value={order.kuanhao} />
        <FieldRow label="价格" value={fmtNum(order.jiage, 2)} />
        <FieldRow label="发货" value={order.dhdw} />
        <FieldRow label="品名" value={order.proudnumber} />
      </FieldGrid>

      {hasAnyCraft && (
        <>
          <SectionTitle color={productColor}>整理环节</SectionTitle>
          <ReadOnlyCheckboxGroup options={DS_CRAFT} order={order} />
        </>
      )}

      <SectionTitle color={productColor}>其他信息</SectionTitle>
      <FieldGrid>
        <FieldRow label="制单人" value={order.zhidan} />
        <FieldRow label="发货日期" value={fmtDate(order.fhdate)} />
        <FieldRow label="业务员" value={order.ywy} />
        <FieldRow label="发货人" value={order.fhr} />
        <FieldRow label="发货单位" value={order.fahuodanwei} />
        <FieldRow label="整烫" value={order.zhengli} />
        <FieldRow label="外发" value={order.waifa ? '是' : '否'} />
        <FieldRow label="加工费" value={fmtNum(order.jiagongfei, 4)} />
      </FieldGrid>
      {order.upfile && <div style={{ padding: '4px 0', fontSize: 12, color: '#555' }}>附件：有</div>}
    </div>
  );
}

// ============== 主组件 ==============
export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { productType: rawProductType, ddId } = useParams();
  const productType = rawProductType.toUpperCase();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const res = await adminGetOrder(rawProductType, ddId);
      setOrder(res);
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [productType, ddId]);

  const handleStep = async (stepField, completed) => {
    setUpdating(true);
    try {
      const res = await adminUpdateStep(rawProductType, ddId, stepField, completed);
      message.success(res.message);
      setOrder(res.data);
    } catch (e) {
      message.error('操作失败');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Spin size="large" />
    </div>
  );
  if (!order) return null;

  const steps = order.steps || [];
  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const productColor = PRODUCT_COLORS[order.product_type] || '#2563eb';

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ borderRadius: 8 }}>
          返回订单列表
        </Button>
        <Tag className={`tag-${order.product_type.toLowerCase()}`} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
          {PRODUCT_MAP[order.product_type]}
        </Tag>
        <Text strong style={{ fontSize: 20, color: 'var(--text-primary)', letterSpacing: 1 }}>{order.ddbh}</Text>
        <Button icon={<PrinterOutlined />} onClick={() => openOrderPrint(order, productType)} style={{ borderRadius: 8 }}>
          打印订单
        </Button>
        {(!order.jhkprint || !order.jhkprintTime) && (
          <Button icon={<EditOutlined />} onClick={() => navigate('/orders/edit/' + productType + '/' + ddId)} style={{ borderRadius: 8 }}>
            编辑订单
          </Button>
        )}
        <Tag className={order.fahuo ? 'tag-shipped' : 'tag-pending'} style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>
          {order.fahuo ? '✓ 已发货' : '○ 进行中'}
        </Tag>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20, alignItems: 'start' }}>
        {/* 左侧：基本信息（按录入页分组） */}
        <Card
          title={
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 4, height: 16, background: productColor, borderRadius: 2, display: 'inline-block' }} />
              基本信息
            </span>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: '20px 20px' } }}
        >
          {productType === 'YS' && <YSOrderDetail order={order} productColor={productColor} />}
          {productType === 'YM' && <YMOrderDetail order={order} productColor={productColor} />}
          {productType === 'ZM' && <ZMOrderDetail order={order} productColor={productColor} />}
          {productType === 'DS' && <DSOrderDetail order={order} productColor={productColor} />}
        </Card>

        {/* 右侧：工序进度（竖排紧凑） */}
        <Card
          title={
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 4, height: 16, background: productColor, borderRadius: 2, display: 'inline-block' }} />
              工序进度
            </span>
          }
          extra={
            <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{Math.round(progressPercent)}%</Text>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: '16px' } }}
        >
          {/* 进度条 */}
          <div style={{ height: 6, background: 'var(--progress-bg)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: progressPercent === 100 ? 'var(--success)' : productColor,
              borderRadius: 3,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>

          {/* 竖排工序列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((s, i) => {
              const isCompleted = s.completed;
              const isCurrent = !isCompleted && (i === 0 || steps[i - 1]?.completed);
              return (
                <Popconfirm key={s.field} title={s.completed ? `撤销「${s.step}」？` : `确认完成「${s.step}」？`} onConfirm={() => handleStep(s.field, !s.completed)} okText="确认" cancelText="取消" disabled={updating}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isCompleted ? '#f0fdf4' : isCurrent ? `${productColor}0a` : 'var(--bg-page)',
                    border: `1px solid ${isCompleted ? 'var(--success)' : isCurrent ? productColor : 'var(--border)'}`,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: isCompleted ? 'var(--success)' : isCurrent ? productColor : '#fff',
                      border: `2px solid ${isCompleted ? 'var(--success)' : isCurrent ? productColor : '#cbd5e1'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isCompleted ? (
                        <CheckOutlined style={{ color: '#fff', fontSize: 12, fontWeight: 700 }} />
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isCurrent ? '#fff' : '#cbd5e1' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: isCompleted || isCurrent ? 600 : 400,
                        color: isCompleted ? 'var(--success)' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {s.step}
                      </div>
                      {s.time && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          {new Date(s.time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                </Popconfirm>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
