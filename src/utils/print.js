// 打印工具 - 生成打印页面 HTML，在新窗口中打开并打印
import dayjs from 'dayjs';
import QRCode from 'qrcode';

const COMPANY_NAME = '兰花印刷包装有限公司';

// ── 共享 CSS ────────────────────────────────────────────────────────────────
const PRINT_CSS = `
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "SimSun", "宋体", serif; font-size: 13px; color: #000; background: #fff; padding: 16px; }
.print-toolbar { display: flex; gap: 12px; padding: 14px 16px; background: #f5f5f5; border-bottom: 2px solid #ddd; margin: -16px -16px 16px -16px; position: sticky; top: 0; }
.print-toolbar button { padding: 7px 14px; font-size: 13px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #fff; }
.print-toolbar button:hover { background: #f0f0f0; }
.print-content { max-width: 720px; margin: 0 auto; }
.print-header { text-align: center; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #000; }
.print-company { font-size: 15px; font-weight: bold; margin-bottom: 3px; }
.print-title { font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 5px 0; }
.print-subtitle { font-size: 12px; color: #555; }
.print-id { font-weight: bold; font-size: 14px; }
.print-info { margin-bottom: 12px; }
.print-info-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 13px; align-items: center; }
.print-label { font-weight: bold; white-space: nowrap; }
.print-field { flex: 1; border-bottom: 1px solid #000; padding: 2px 4px; min-height: 18px; display: inline-block; }
.print-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
.print-table th { background: #f0f0f0; border: 1px solid #000; padding: 6px 4px; font-weight: bold; text-align: center; }
.print-table td { border: 1px solid #000; padding: 5px 4px; text-align: center; height: 28px; vertical-align: middle; }
.print-table td.l { text-align: left; padding-left: 6px; }
.empty-row td { height: 28px; }
.print-footer { margin-top: 12px; }
.print-footer-row { display: flex; justify-content: space-between; font-size: 12px; }
.print-field-sm { border-bottom: 1px solid #000; padding: 1px 16px 1px 3px; display: inline-block; min-width: 70px; }
.print-section { margin-bottom: 14px; }
.print-section-title { font-size: 12px; font-weight: bold; color: #444; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
.print-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px 12px; font-size: 12px; }
.print-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px 12px; font-size: 12px; }
.print-grid .label { color: #666; }
.print-grid .value { border-bottom: 1px solid #ccc; padding: 1px 4px; min-height: 18px; }
@media print {
  body { padding: 0; margin: 0; }
  .print-toolbar { display: none !important; }
  .print-content { padding: 12mm 18mm; max-width: 100%; }
  .print-header { margin-bottom: 10px; padding-bottom: 6px; }
  .print-title { font-size: 20pt; letter-spacing: 3pt; }
  .print-table th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
  @page { size: A4; margin: 8mm; }
}
</style>`;

// ── 工具函数 ─────────────────────────────────────────────────────────────────
function bool(v) { return v === true || v === 1 || v === '1' || v === 'true'; }

function fmtDate(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fmtDatetime(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return String(d.getMonth() + 1) + '/' + String(d.getDate()) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// ── YS/YM 印刷色数明细 ───────────────────────────────────────────────────────
function ysColorsHtml(o) {
  const slots = [
    { color: 'yssl1', name: 'ysdw1', amount: 'jine1', label: '色1' },
    { color: 'yssl2', name: 'ysdw2', amount: 'jine2', label: '色2' },
    { color: 'yssl3', name: 'ysdw3', amount: 'jine3', label: '色3' },
    { color: 'yssl4', name: 'ysdw4', amount: 'jine4', label: '色4' },
    { color: 'yssl5', name: 'ysdw5', amount: 'jine5', label: '色5' },
    { color: 'yssl6', name: 'ysdw6', amount: 'jine6', label: '色6' },
    { color: 'yssl7', name: 'ysdw7', amount: 'jine7', label: '色7' },
    { color: 'yssl8', name: 'ysdw8', amount: 'jine8', label: '色8' },
    { color: 'yssl9', name: 'ysdw9', amount: 'jine9', label: '色9' },
    { color: 'yss20', name: 'ysdw10', amount: 'jine10', label: 'UV' },
  ];
  const rows = [];
  for (const s of slots) {
    const cnt = o[s.color];
    const name = (o[s.name] || '').trim();
    const amt = o[s.amount];
    if (cnt || name) {
      rows.push('<tr><td class="l">' + s.label + '</td><td>' + name + '</td><td>' + (cnt != null ? cnt : '-') + '</td><td>' + (amt != null ? amt : '-') + '</td></tr>');
    }
  }
  if (rows.length === 0) return '';
  const foot = o.yszj ? '<tfoot><tr><td colspan="3" style="text-align:right;font-weight:bold">总价合计：</td><td style="font-weight:bold">' + o.yszj + '</td></tr></tfoot>' : '';
  return '<div class="print-section"><div class="print-section-title">📋 印刷色数明细</div><table class="print-table"><thead><tr><th style="width:18%">色序</th><th style="width:22%">颜色</th><th style="width:20%">色数</th><th style="width:40%">金额</th></tr></thead><tbody>' + rows.join('') + '</tbody>' + foot + '</table></div>';
}

// ── ZM 色卡尺码 ─────────────────────────────────────────────────────────────
function zmColorSizeHtml(o) {
  const qw = [], ss = [], bz = [];
  for (let i = 1; i <= 12; i++) {
    if (o['qw' + i]) qw.push(o['qw' + i]);
    if (o['ss' + i]) ss.push(o['ss' + i]);
    if (o['bz' + i]) bz.push(o['bz' + i]);
  }
  const sls = [], lies = [];
  for (let i = 1; i <= 10; i++) {
    if (o['sl' + i]) sls.push(o['sl' + i]);
    if (o['lieshu' + i]) lies.push(o['lieshu' + i]);
  }
  let html = '';
  if (qw.length > 0 || ss.length > 0 || bz.length > 0) {
    const makeRow = function(cells, label) {
      const filled = cells.filter(Boolean);
      if (filled.length === 0) return '';
      var tds = filled.map(function(v) { return '<td>' + v + '</td>'; }).join('');
      return '<tr><td style="width:60px;font-weight:bold">' + label + '</td>' + tds + '</tr>';
    };
    html += '<div class="print-section"><div class="print-section-title">🎨 色卡明细</div><table class="print-table"><tbody>';
    html += makeRow(qw, 'QW') + makeRow(ss, 'SS') + makeRow(bz, 'BZ');
    html += '</tbody></table></div>';
  }
  if (sls.length > 0 || lies.length > 0) {
    var maxLen = Math.max(sls.length, lies.length);
    var sizeRows = [];
    for (var i = 0; i < maxLen; i++) {
      sizeRows.push('<tr><td style="width:60px;font-weight:bold">' + (i === 0 ? '尺码' : '') + '</td><td>' + (sls[i] || '') + '</td><td style="width:60px;font-weight:bold">' + (i === 0 ? '件数' : '') + '</td><td>' + (lies[i] || '') + '</td></tr>');
    }
    html += '<div class="print-section"><div class="print-section-title">📐 尺码明细</div><table class="print-table"><tbody>' + sizeRows.join('') + '</tbody></table></div>';
  }
  return html;
}

// ── JHK 工序进度（含二维码）──────────────────────────────────────────────────
function jhkStepsHtml(steps, qrUrls) {
  if (!steps || steps.length === 0) return '';
  var rows = steps.map(function(s) {
    var time = s.time ? fmtDatetime(s.time) : '';
    var statusHtml = '<span style="color:' + (s.completed ? '#10b981' : '#ccc') + ';font-weight:' + (s.completed ? 'bold' : 'normal') + '">' + (s.completed ? '✓' : '○') + ' ' + (s.completed ? '已完成' : '进行中') + '</span>';
    var qrHtml = '';
    if (!s.completed && qrUrls && qrUrls[s.field]) {
      qrHtml = '<img src="' + qrUrls[s.field] + '" width="60" height="60" style="display:block;margin:0 auto" />';
    }
    return '<tr><td class="l">' + s.step + '</td><td>' + statusHtml + '</td><td>' + time + '</td><td style="text-align:center;width:70px">' + qrHtml + '</td></tr>';
  });
  return '<div class="print-section"><div class="print-section-title">🔄 订单进度（扫码枪报工）</div><table class="print-table"><thead><tr><th style="width:30%">工序</th><th style="width:20%">状态</th><th style="width:25%">完成时间</th><th style="width:25%">扫码报工</th></tr></thead><tbody>' + rows.join('') + '</tbody></table><div style="font-size:10px;color:#999;margin-top:4px">📱 扫描工序二维码，工人可快速报工（手机扫码 → 直接填表）</div></div>';
}

// ── 生成发货单打印 HTML ─────────────────────────────────────────────────────
function printFahuoHtml(data) {
  var r = data;
  var items = [];
  // 支持两种数据来源：orders数组（订单模式） 或 pingming1-9老字段（手工模式）
  if (r.orders && r.orders.length > 0) {
    items = r.orders.map(function(o) {
      return {
        pingming: o.proudnumber || '',
        khao: o.kuanhao || '',
        dnbh: o.ddbh || '',
        shuliang: o.shuliang_sent || o.shuliang_total || '',
        beizhu: o.beizhu || '',
      };
    });
  } else {
    for (var i = 1; i <= 9; i++) {
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
  var printDate = r.regtime ? fmtDate(r.regtime) : '';
  var rowsHtml = items.map(function(item) {
    return '<tr><td>' + item.pingming + '</td><td>' + item.khao + '</td><td>' + item.dnbh + '</td><td>' + item.shuliang + '</td><td>' + item.beizhu + '</td></tr>';
  }).join('');
  var emptyRows = '';
  for (var j = 0; j < Math.max(0, 6 - items.length); j++) {
    emptyRows += '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
  }
  var now = new Date();
  var printTime = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>发货单打印 - NO:' + r.id + '</title>' + PRINT_CSS + '</head><body><div class="print-toolbar"><button onclick="window.print()">🖨️ 打印</button><button onclick="window.close()">关闭</button></div><div class="print-content"><div class="print-header"><div class="print-company">' + COMPANY_NAME + '</div><div class="print-title">装 箱 发 货 单</div><div class="print-subtitle">NO: <span class="print-id">' + r.id + '</span></div></div><div class="print-info"><div class="print-info-row"><span class="print-label">收货单位：</span><span class="print-field">' + (r.company || '') + '</span><span class="print-label">日  期：</span><span class="print-field" style="flex:0.8">' + printDate + '</span></div><div class="print-info-row"><span class="print-label">快递公司：</span><span class="print-field">' + (r.kdgs || '') + '</span><span class="print-label">快递单号：</span><span class="print-field">' + (r.kdhao || '') + '</span></div></div><table class="print-table"><thead><tr><th>品名</th><th>款号</th><th>订单编号</th><th>数量</th><th>备注</th></tr></thead><tbody>' + rowsHtml + emptyRows + '</tbody></table><div class="print-footer"><div class="print-footer-row"><span>发货人：<span class="print-field-sm">' + (r.fhr || '') + '</span></span></div></div></div><script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };<\/script></body></html>';
}

// ── 生成订单打印 HTML（异步，含二维码）──────────────────────────────────────
async function buildPrintHtml(order, productType) {
  var o = order;
  var PRODUCT_LABELS = { YS: '印刷', YM: '印刷面', ZM: '纸盒', DS: '模切' };
  var ptLabel = PRODUCT_LABELS[productType] || productType;

  // 扫码报工 URL（使用当前页面 origin，方便部署）
  var baseUrl = window.location.origin + '/production/report';

  // 生成未完成工序的二维码
  var qrUrls = {};
  var steps = o.steps || [];
  for (var si = 0; si < steps.length; si++) {
    var s = steps[si];
    if (!s.completed) {
      var scanUrl = baseUrl + '?dd_id=' + o.DD_id + '&product_type=' + productType + '&step=' + s.field;
      try {
        qrUrls[s.field] = await QRCode.toDataURL(scanUrl, { width: 120, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
      } catch (e) {
        qrUrls[s.field] = '';
      }
    }
  }

  // 基本信息
  var baseInfoItems = [
    { label: '客户', value: o.company || '' },
    { label: '品名', value: o.pingshu || o.proudnumber || '' },
    { label: '料号/花号', value: o.yjbhao || o.huahao || '' },
    { label: '订单日期', value: fmtDate(o.prouddate) },
    { label: '交货日期', value: fmtDate(o.overdate) },
    { label: '数量', value: o.shuliang || '' },
    { label: '业务员', value: o.ywy_name || '' },
    { label: '制单人', value: o.zhidan || '' },
  ];
  if (o.danjia) baseInfoItems.push({ label: '单价', value: o.danjia });
  if (o.jiage) baseInfoItems.push({ label: '单价(DS)', value: o.jiage });
  if (o.jijia) baseInfoItems.push({ label: '基价', value: o.jijia });
  if (o.yszj) baseInfoItems.push({ label: '总价', value: o.yszj });
  if (o.jiagongfei) baseInfoItems.push({ label: '加工费', value: o.jiagongfei });
  if (o.kuanhao) baseInfoItems.push({ label: '款号', value: o.kuanhao });
  if (o.fahuodanwei) baseInfoItems.push({ label: '发货单位', value: o.fahuodanwei });
  if (o.waifa) baseInfoItems.push({ label: '外发', value: '是' });

  var baseInfoGrid = '';
  for (var bi = 0; bi < baseInfoItems.length; bi++) {
    var item = baseInfoItems[bi];
    baseInfoGrid += '<div><span class="label">' + item.label + '：</span><span class="value">' + item.value + '</span></div>';
  }

  // 规格备注
  var specRows = [];
  if (o.cpgg) specRows.push('<div style="grid-column:span 2"><span class="label">产品规格：</span><span class="value">' + o.cpgg + '</span></div>');
  if (o.gyyq) specRows.push('<div style="grid-column:span 2"><span class="label">工艺要求：</span><span class="value">' + o.gyyq + '</span></div>');
  if (o.gyyq_ym) specRows.push('<div style="grid-column:span 2"><span class="label">工艺要求(印面)：</span><span class="value">' + o.gyyq_ym + '</span></div>');
  if (o.ylzd) specRows.push('<div style="grid-column:span 2"><span class="label">印刷内容：</span><span class="value">' + o.ylzd + '</span></div>');
  if (o.klcc) specRows.push('<div style="grid-column:span 2"><span class="label">开料尺寸：</span><span class="value">' + o.klcc + '</span></div>');
  if (o.kaishu) specRows.push('<div><span class="label">开数：</span><span class="value">' + o.kaishu + '</span></div>');
  if (o.xukaisl) specRows.push('<div><span class="label">需开数量：</span><span class="value">' + o.xukaisl + '</span></div>');
  if (o.bcsl) specRows.push('<div><span class="label">白参数量：</span><span class="value">' + o.bcsl + '</span></div>');
  if (o.klyaoqiu) specRows.push('<div style="grid-column:span 2"><span class="label">开料要求：</span><span class="value">' + o.klyaoqiu + '</span></div>');
  if (o.jyyaoqiu) specRows.push('<div style="grid-column:span 2"><span class="label">经验要求：</span><span class="value">' + o.jyyaoqiu + '</span></div>');
  if (o.zhengli) specRows.push('<div><span class="label">整烫：</span><span class="value">' + o.zhengli + '</span></div>');
  if (o.yssj) specRows.push('<div><span class="label">样色色价：</span><span class="value">' + o.yssj + '</span></div>');
  if (o.cidiehao) specRows.push('<div><span class="label">刺绣号：</span><span class="value">' + o.cidiehao + '</span></div>');
  if (o.zm_zhijian) specRows.push('<div><span class="label">纸盒质检：</span><span class="value">' + o.zm_zhijian + '</span></div>');
  if (o.allcount) specRows.push('<div><span class="label">总数量：</span><span class="value">' + o.allcount + '</span></div>');
  if (o.weidu) specRows.push('<div><span class="label">纬度：</span><span class="value">' + o.weidu + '</span></div>');
  if (o.kuandu) specRows.push('<div><span class="label">宽度：</span><span class="value">' + o.kuandu + '</span></div>');
  if (o.changdu) specRows.push('<div><span class="label">长度：</span><span class="value">' + o.changdu + '</span></div>');
  if (o.huachang) specRows.push('<div><span class="label">花长：</span><span class="value">' + o.huachang + '</span></div>');
  if (o.chenpingcc) specRows.push('<div><span class="label">陈平尺寸：</span><span class="value">' + o.chenpingcc + '</span></div>');
  if (o.beizhu) specRows.push('<div style="grid-column:span 2"><span class="label">备注：</span><span class="value">' + o.beizhu + '</span></div>');
  if (o.beizhuYS) specRows.push('<div style="grid-column:span 2"><span class="label">印刷备注：</span><span class="value">' + o.beizhuYS + '</span></div>');
  if (o.beizhuZM) specRows.push('<div style="grid-column:span 2"><span class="label">纸盒备注：</span><span class="value">' + o.beizhuZM + '</span></div>');

  var gongyiHtml = '';
  if (specRows.length > 0) {
    gongyiHtml = '<div class="print-section"><div class="print-section-title">📝 规格与备注</div><div class="print-grid" style="grid-template-columns:repeat(2,1fr)">' + specRows.join('') + '</div></div>';
  }

  // 产品线特定区块
  var productSectionHtml = '';
  if (productType === 'YS' || productType === 'YM') {
    productSectionHtml = ysColorsHtml(o) || '';
  } else if (productType === 'ZM') {
    productSectionHtml = zmColorSizeHtml(o) || '';
  } else if (productType === 'DS') {
    var dsItems = [];
    if (o.jiage) dsItems.push('<div><span class="label">单价：</span><span class="value">' + o.jiage + '</span></div>');
    if (o.zhengli) dsItems.push('<div><span class="label">整烫：</span><span class="value">' + o.zhengli + '</span></div>');
    if (o.fhdw) dsItems.push('<div><span class="label">发货单位：</span><span class="value">' + o.fhdw + '</span></div>');
    if (o.fhdate) dsItems.push('<div><span class="label">发货日期：</span><span class="value">' + fmtDate(o.fhdate) + '</span></div>');
    if (o.fhr) dsItems.push('<div><span class="label">发货人：</span><span class="value">' + o.fhr + '</span></div>');
    if (o.waifa) dsItems.push('<div><span class="label">外发：</span><span class="value">' + (o.waifa == 1 ? '是' : '否') + '</span></div>');
    if (dsItems.length > 0) {
      productSectionHtml = '<div class="print-section"><div class="print-section-title">📦 模切信息</div><div class="print-grid-2">' + dsItems.join('') + '</div></div>';
    }
  }

  // JHK 进度（含二维码）
  var stepsHtml = jhkStepsHtml(o.steps, qrUrls) || '';

  // 打印时间
  var now2 = new Date();
  var printTime = now2.getFullYear() + '-' + String(now2.getMonth() + 1).padStart(2, '0') + '-' + String(now2.getDate()).padStart(2, '0') + ' ' + String(now2.getHours()).padStart(2, '0') + ':' + String(now2.getMinutes()).padStart(2, '0');

  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>订单打印 - ' + (o.ddbh || '') + '</title>' + PRINT_CSS + '</head><body><div class="print-toolbar"><button onclick="window.print()">🖨️ 打印</button><button onclick="window.close()">关闭</button></div><div class="print-content"><div class="print-header"><div class="print-company">' + COMPANY_NAME + '</div><div class="print-title">订 单 明 细 单</div><div class="print-subtitle"><span style="margin-right:20px">NO: <strong>' + (o.ddbh || '') + '</strong></span><span>产品线: ' + ptLabel + '</span></div></div><div class="print-section"><div class="print-section-title">📋 基本信息</div><div class="print-grid">' + baseInfoGrid + '</div></div>' + gongyiHtml + productSectionHtml + stepsHtml + '<div class="print-footer"><div class="print-footer-row" style="justify-content:flex-end"><span>打印时间：' + printTime + '</span></div></div></div><script>window.onload = function() { setTimeout(function() { window.print(); }, 600); };<\/script></body></html>';
}

// ── 打开发货单打印窗口 ───────────────────────────────────────────────────────
export function openFahuoPrint(data) {
  var html = printFahuoHtml(data);
  var win = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
  if (win) { win.document.write(html); win.document.close(); }
}

// ── 打开订单打印窗口 ─────────────────────────────────────────────────────────
export async function openOrderPrint(order, productType) {
  var html = await buildPrintHtml(order, productType);
  var win = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
  if (win) { win.document.write(html); win.document.close(); }
}
