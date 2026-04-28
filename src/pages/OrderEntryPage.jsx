import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, Card, Tabs, Checkbox, message } from 'antd';
import { Plus, Pencil } from 'lucide-react';
import dayjs from 'dayjs';
import AppLayout from '../components/AppLayout';
import { adminCreateOrder, adminGetOrder, adminUpdateOrder, adminListUsers } from '../api';

const { Option } = Select;

const LabelWithStar = ({ children, required }) => (
  <span style={{ color: required ? '#e53e3e' : 'inherit' }}>{children}{required && <span style={{ color: '#e53e3e' }}> *</span>}</span>
);

// 贴膜选项
// 贴膜选项 (hzlA1-6 + hzlC3外加工上光)
// 来源: 旧系统 YSinput_Add.asp
const TIEMO_OPTIONS = [
  { label: '单面光膜', value: 'hzlA1' },
  { label: '单面亚膜', value: 'hzlA2' },
  { label: '双面光膜', value: 'hzlA3' },
  { label: '双面亚膜', value: 'hzlA4' },
  { label: '单面专用膜', value: 'hzlA5' },
  { label: '双面专用膜', value: 'hzlA6' },
  { label: '外加工上光', value: 'hzlC3' },
];

// 常规工艺选项 (hzlB3-8/11-15)
// 来源: 旧系统 YSinput_Add.asp
const CHANGGUI_OPTIONS = [
  { label: '烫金', value: 'hzlB3' },
  { label: '压钢刀', value: 'hzlB4' },
  { label: '穿线', value: 'hzlB5' },
  { label: '糊纸粘合', value: 'hzlB6' },
  { label: '打汽眼', value: 'hzlB7' },
  { label: '凹凸', value: 'hzlB8' },
  { label: '激光切割', value: 'hzlB11' },
  { label: '穿别针', value: 'hzlB12' },
  { label: '路线', value: 'hzlB13' },
  { label: '敲柳钉', value: 'hzlB14' },
  { label: '包边', value: 'hzlB15' },
];

// 特殊工艺选项 (hzlC1/4-10)
// 来源: 旧系统 YSinput_Add.asp
const TESHU_OPTIONS = [
  { label: '局部丝网印', value: 'hzlC1' },
  { label: '绣花', value: 'hzlC4' },
  { label: '烫钻', value: 'hzlC5' },
  { label: '胶印上光', value: 'hzlC6' },
  { label: '粘备用袋', value: 'hzlC7' },
  { label: '揉皱', value: 'hzlC8' },
  { label: '敲毛边', value: 'hzlC9' },
  { label: '其它', value: 'hzlC10' },
];

// STEPS_MAP_YSS 仅用于详情页显示标签，key与YSGX表列名一致
const STEPS_MAP_YSS = {
  hzlA1: '单面光膜', hzlA2: '单面亚膜', hzlA3: '双面光膜',
  hzlA4: '双面亚膜', hzlA5: '单面专用膜', hzlA6: '双面专用膜',
  hzlB3: '烫金', hzlB4: '压钢刀', hzlB5: '穿线', hzlB6: '糊纸粘合',
  hzlB7: '打汽眼', hzlB8: '凹凸', hzlB11: '激光切割',
  hzlB12: '穿别针', hzlB13: '路线', hzlB14: '敲柳钉', hzlB15: '包边',
  hzlC1: '局部丝网印', hzlC3: '外加工上光', hzlC4: '绣花',
  hzlC5: '烫钻', hzlC6: '胶印上光', hzlC7: '粘备用袋',
  hzlC8: '揉皱', hzlC9: '敲毛边', hzlC10: '其它',
};

const STEPS_MAP_YMGX = {
  hzl1: '晒版', hzl2: '显影', hzl3: '烘版', hzl4: '拼版', hzl5: '擦版',
  hzl6: '贴膜', hzl7: '打包',
};

const STEPS_MAP_ZM = {
  jhkddClass: '接单', jhkprint: '打印/晒版', sccjjs: '车间接收',
  sccjyl: '预领料', sccjdn: '电脑制版', sccjsc: '生产', sccjwc: '完成',
  hzljs: '质检', fahuo: '发货',
};

const STEPS_MAP_DS = {
  jhkddClass: '接单', jhkprint: '打印/晒版', sccjjs: '车间接收',
  sccjyl: '预领料', sccjdn: '电脑制版', sccjsc: '生产', sccjwc: '完成',
  hzljs: '质检', fahuo: '发货',
};

const YM_PROCESS_LIST = ['烘色牢度', '切割', '超声波切割', '三角折', '手工切折', '手工对折', '其它'];

const ZM_PROCESS_LIST = ['开料', '印刷', '裱纸', '模切', '冲孔', '钉粘', '打包'];
const ZM_PROCESS_FIELDS = ['hzl1','hzl2','hzl3','hzl4','hzl5','hzl6','hzl7'];

const DS_PROCESS_LIST = ['设计', '生产'];
const DS_PROCESS_FIELDS = ['hzl1','hzl2'];

const YSS_PROCESS_LIST = Object.values(STEPS_MAP_YSS);
const YSS_PROCESS_FIELDS = Object.keys(STEPS_MAP_YSS);

export default function OrderEntryPage() {
  const [form] = Form.useForm();
  const [activeProduct, setActiveProduct] = useState('YS');
  const [stepsMap, setStepsMap] = useState({});
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editDdId, setEditDdId] = useState(null);
  const [editProductType, setEditProductType] = useState(null);

  const navigate = useNavigate();
  const params = useParams();

  const [ysSteps, setYsSteps] = useState({});
  const [priceMode, setPriceMode] = useState('calc'); // YS/YM 总价模式: 'calc' | 'edit'
  const [yszjManual, setYszjManual] = useState(null); // YS 手动输入值

  // Decode JWT to get current user for zhidan field (使用 base64url 解码，兼容 JWT)
  useEffect(function() {
    try {
      var token = localStorage.getItem('token');
      if (!token) return;
      var parts = token.split('.');
      if (parts.length !== 3) return;
      // 标准 base64url 解码（JWT 使用 URL-safe base64）
      var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      setCurrentUser(payload);
      form.setFieldValue('zhidan', payload.username || payload.UserName || '');
      form.setFieldValue('prouddate', payload.prouddate || null);
    } catch (e) {
      console.error('[OrderEntry] JWT decode failed:', e);
    }
  }, []);

  // 编辑模式：从 URL 参数判断，加载订单数据
  useEffect(function() {
    if (!params.productType || !params.ddId) return;
    setIsEdit(true);
    setEditDdId(params.ddId);
    setEditProductType(params.productType);
    setActiveProduct(params.productType);

    var token = localStorage.getItem('token');
    fetch('/api/admin/orders/' + params.productType.toUpperCase() + '/' + params.ddId, {
      headers: { 'Authorization': 'Bearer ' + (token || '') }
    }).then(function(r) { return r.json(); })
    .then(function(result) {
      var d = result && result.data ? result.data : (result || {});
      if (!d || (result && result.error)) { message.error('加载订单数据失败'); return; }
      // 填充表单字段
      var setFields = {};
      ['ddbh','prouddate','overdate','company','fahuodanwei','yjbhao','cpgg','pingshu','shuliang','dhdw',
       'kuanhao','proudnumber','ywy','zhengli','jiagongfei','klyaoqiu','jyyaoqiu','gyyq',
       'beizhu','beizhuYS','beizhuYM','beizhuZM','beizhu8',
       'danjia','sydazhang','syMoney','yszj',
       'lldate','sclcClass','ylzd','klcc','kaishu','xukaisl','bcsl',
       'hzl1','hzl2','hzl3','hzl4','hzl5','hzl6','hzl7','hzl8','hzl9','hzl10','hzl11','hzl12','hzl13','hzl14','hzl15','hzl16',
       'huahao','jijia','allcount','weidu','soujianjl','sxdate','zm_zhijian','proudbanbie',
       'jiage','fhdw','fhdate','fhr','cidiehao',
       'UpFile','beizhu1','beizhu2','beizhu3','beizhu4','beizhu5',
       'jine1','jine2','jine3','jine4','jine5','jine6','jine7','jine8','jine9','jine10',
       'yssl1','yssl2','yssl3','yssl4','yssl5','yssl6','yssl7','yssl8','yssl9',
       'yss20','ysdw1','ysdw2','ysdw3','ysdw4','ysdw5','ysdw6','ysdw7','ysdw8','ysdw9','ysdw10',
       'ysyl1','ysyl2','ysyl3','ysyl4','ysyl5','ysyl6','ysyl7','ysyl8','ysyl9',
       'ysy20',
       // ZM 特有字段（buildProgress ZM 返回的）
       'chenpingcc','kuandu','changdu','huachang','kts',
       // ZM 色卡明细（qw/ss/bz 各1-12）
       'qw1','qw2','qw3','qw4','qw5','qw6','qw7','qw8','qw9','qw10','qw11','qw12',
       'ss1','ss2','ss3','ss4','ss5','ss6','ss7','ss8','ss9','ss10','ss11','ss12',
       'bz1','bz2','bz3','bz4','bz5','bz6','bz7','bz8','bz9','bz10','bz11','bz12',
       // ZM 尺码明细（cmh/sl/lieshu 各1-10）
       'cmh1','cmh2','cmh3','cmh4','cmh5','cmh6','cmh7','cmh8','cmh9','cmh10',
       'sl1','sl2','sl3','sl4','sl5','sl6','sl7','sl8','sl9','sl10',
       'lieshu1','lieshu2','lieshu3','lieshu4','lieshu5','lieshu6','lieshu7','lieshu8','lieshu9','lieshu10',
       // ZM 工序状态
       'jhkddClass','jhkprint','sccjjs','sccjyl','sccjdn','sccjsc','sccjwc','hzljs','fahuo',
       'waifa',
      ].forEach(function(k) {
        if (d[k] !== undefined && d[k] !== null) {
          if (k === 'prouddate' || k === 'overdate' || k === 'lldate' || k === 'fhdate' || k === 'sxdate') {
            setFields[k] = d[k] ? dayjs(d[k]) : null;
          } else {
            setFields[k] = d[k];
          }
        }
      });
      form.setFieldsValue(setFields);

      // 恢复工序勾选状态
      if (params.productType === 'YS') {
        var ysMap = {};
        YSS_PROCESS_FIELDS.forEach(function(f) { if (d[f] === 1 || d[f] === true) ysMap[f] = true; });
        setYsSteps(ysMap);
        setStepsMap(ysMap);
        // 同步到 form，让 Checkbox 默认显示勾选
        Object.keys(ysMap).forEach(function(f) { form.setFieldValue(f, true); });
      } else if (params.productType === 'YM') {
        var ymMap = {};
        for (var i = 1; i <= 7; i++) { if (d['hzl' + i] === 1 || d['hzl' + i] === true) ymMap['hzl' + i] = true; }
        setYmSteps(ymMap);
        setStepsMap(ymMap);
      } else if (params.productType === 'ZM') {
        var zmMap = {};
        for (var i = 1; i <= 16; i++) { if (d['hzl' + i] === 1 || d['hzl' + i] === true) zmMap['hzl' + i] = true; }
        setZmSteps(zmMap);
        setStepsMap(zmMap);
      } else if (params.productType === 'DS') {
        var dsMap = {};
        Object.keys(STEPS_MAP_DS).forEach(function(f) { if (d[f] === 1 || d[f] === true) dsMap[f] = true; });
        setDsSteps(dsMap);
      }
    }).catch(function(err) {
      console.error('[OrderEntry] load order error:', err);
      message.error('加载订单数据失败');
    });
  }, []);

  // Auto-set prouddate to today
  useEffect(function() {
    if (!form.getFieldValue('prouddate')) {
      form.setFieldValue('prouddate', dayjs());
    }
  }, []);
  const [ymSteps, setYmSteps] = useState({});
  const [zmSteps, setZmSteps] = useState({});
  const [dsSteps, setDsSteps] = useState({});

  const [ymGXVisible, setYmGXVisible] = useState(false);
  const [ysgxVisible, setYSGXVisible] = useState(false);
  const [zmgxVisible, setZmgxVisible] = useState(false);
  const [dsgxVisible, setDsgxVisible] = useState(false);

  const handleStepToggle = (product, field) => {
    if (product === 'YS') {
      const updated = { ...ysSteps };
      if (updated[field]) { delete updated[field]; } else { updated[field] = true; }
      setYsSteps(updated);
      setStepsMap(updated);
    } else if (product === 'YM') {
      const updated = { ...ymSteps };
      if (updated[field]) { delete updated[field]; } else { updated[field] = true; }
      setYmSteps(updated);
      setStepsMap(updated);
    } else if (product === 'ZM') {
      const updated = { ...zmSteps };
      if (updated[field]) { delete updated[field]; } else { updated[field] = true; }
      setZmSteps(updated);
      setStepsMap(updated);
    } else if (product === 'DS') {
      const updated = { ...dsSteps };
      if (updated[field]) { delete updated[field]; } else { updated[field] = true; }
      setDsSteps(updated);
    }
  };

  useEffect(() => {
    adminListUsers().then(u => { if (u) setUsers(u); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeProduct === 'YS') { setStepsMap(ysSteps); calcTotal(form, 'YS'); }
    else if (activeProduct === 'YM') { setStepsMap(ymSteps); calcTotal(form, 'YM'); }
    else if (activeProduct === 'ZM') setStepsMap(zmSteps);
    else if (activeProduct === 'DS') setStepsMap(dsSteps);
  }, [activeProduct, ysSteps, ymSteps, zmSteps, dsSteps]);

  // 计算 YS 总计 元/只 = (软片+印工+PS版+铜锌版+电化铝+钢刀+轧钢刀+单价) / 印刷数量 + 贴塑 + UV + 切折
  // 计算 YM 总计 元/只 = (软片+PS版) / 印刷数量 + 单价 + 印工 + 切刀打洞/圆角穿线/整理包扎
  function calcTotal(f, product) {
    if (priceMode === 'edit') return; // 编辑模式下不自动计算
    var v = f.getFieldsValue();
    var n = function(x){ return Number(x)||0; };
    var shuliang = n(v.shuliang);
    if (product === 'YS') {
      var part1 = n(v.jine1) + n(v.jine2) + n(v.jine3) + n(v.jine4) + n(v.jine5) + n(v.jine6) + n(v.jine7) + n(v.danjia);
      var part2 = n(v.jine8) + n(v.jine10) + n(v.jine9);
      var total = shuliang ? part1 / shuliang + part2 : 0;
      if (!isNaN(total) && isFinite(total)) f.setFieldsValue({ yszj: Math.round(total * 1000) / 1000 });
    } else if (product === 'YM') {
      var total = shuliang ? (n(v.jine1) + n(v.jine3)) / shuliang + n(v.danjia) + n(v.jine2) + n(v.jine9) : 0;
      if (!isNaN(total) && isFinite(total)) f.setFieldsValue({ yszj: Math.round(total * 1000) / 1000 });
    }
  }

  function handleCreate() {
    var requiredFields = ['ddbh', 'prouddate'];
    if (activeProduct === 'YS') {
      requiredFields = requiredFields.concat(['company', 'ylzd', 'cpgg', 'shuliang', 'yjbhao']);
    } else if (activeProduct === 'YM') {
      requiredFields = requiredFields.concat(['company', 'ylzd', 'cpgg', 'shuliang', 'yjbhao']);
    } else if (activeProduct === 'ZM') {
      requiredFields = requiredFields.concat(['huahao', 'proudnumber', 'shuliang']);
    } else if (activeProduct === 'DS') {
      requiredFields = requiredFields.concat(['yjbhao', 'shuliang', 'company', 'ywy']);
    }

    form.validateFields(requiredFields).then(function() {
      var values = form.getFieldsValue();
      console.log('[OrderEntry] product_type:', activeProduct, 'company:', values.company, 'overdate:', values.overdate);

      // YS 工艺配置：直接从 form 取 hzl* 字段值，忽略 stepsMap（stepsMap 在 YS 没有 onChange 同步）
      var sclcSteps = [];
      if (activeProduct === 'YS') {
        var ysHzlFields = ['hzlA1','hzlA2','hzlA3','hzlA4','hzlA5','hzlA6',
          'hzlB3','hzlB4','hzlB5','hzlB6','hzlB7','hzlB8',
          'hzlB11','hzlB12','hzlB13','hzlB14','hzlB15',
          'hzlC1','hzlC3','hzlC4','hzlC6','hzlC7','hzlC8','hzlC9','hzlC10'];
        ysHzlFields.forEach(function(f) {
          if (values[f] === 1 || values[f] === true) sclcSteps.push(f);
        });
      } else {
        sclcSteps = Object.keys(stepsMap).map(function(field) {
          if (activeProduct === 'ZM') {
            // stepsMap key 格式为 'hzl1'/'hzl2'... 直接提取编号
            var num = field.replace(/[^0-9]/g, '');
            return num ? 'hzl' + num : field;
          }
          if (activeProduct === 'YM') {
          // stepsMap key 是 hzl1/hzl2...，通过 STEPS_MAP_YMGX 反查索引
          var idx = Object.keys(STEPS_MAP_YMGX).indexOf(field);
          return idx >= 0 ? 'hzl' + (idx + 1) + '-' + STEPS_MAP_YMGX[field] : field;
        }
        if (activeProduct === 'DS') {
          var idx = DS_PROCESS_LIST.indexOf(field);
          return idx >= 0 ? 'hzl' + (idx + 1) + '-' + field : field;
        }
        return field;
        });
      }

      // dayjs: { $y:2026, $M:3, $D:28, format:f }
      // Luxon: { $L:obj, $u:undefined, $d:Date, $y:2026, $M:3, c:[...], isLuxon:true }
      var fmtDate = function(v) {
        if (!v || v === 'undefined' || v === 'null') return null;
        // dayjs: isDayjsObject:true, 有 $y/$M/$D, format 是 fn
        if (v && v.isDayjsObject === true && typeof v.format === 'function') return v.format('YYYY-MM-DD');
        // 其他有 format 的对象（兜底）
        if (typeof v.format === 'function') return v.format('YYYY-MM-DD');
        // 已是字符串或原始值，直接返回
        return v;
      };

      // Convert all checkbox fields (tmG/tmM/cgJG/tsJS etc.) from boolean to 0/1
      var checkboxFields = [
        'tmG','tmM','tmD','tmS','tmDH','tmQT',
        'cgJG','cgYG','cgMK','cgHK','cgCX','cgQND','cgJG2','cgOT',
        'tsJS','tsWX','tsZS','tsJY','tsOT',
        'hzl1','hzl2','hzl3','hzl4','hzl5','hzl6','hzl7','hzl8','hzl9','hzl10','hzl11','hzl12','hzl13','hzl14','hzl15','hzl16',
        'hzlA1','hzlA2','hzlA3','hzlA4','hzlA5','hzlA6',
        'hzlB3','hzlB4','hzlB5','hzlB6','hzlB7','hzlB8','hzlB11','hzlB12','hzlB13','hzlB14','hzlB15',
        'hzlC1','hzlC3','hzlC4','hzlC6','hzlC7','hzlC8','hzlC9','hzlC10',
        'waifa'
      ];
      checkboxFields.forEach(function(f) {
        if (values[f] === undefined || values[f] === null) values[f] = 0;
        else if (values[f] === true) values[f] = 1;
        else if (values[f] === false) values[f] = 0;
      });

      var data = Object.assign({}, values, {
        product_type: activeProduct,
        prouddate: fmtDate(values.prouddate),
        overdate: fmtDate(values.overdate),
        lldate: fmtDate(values.lldate),
        fhdate: fmtDate(values.fhdate),
        sxdate: fmtDate(values.sxdate),
        sclcClass: values.sclcClass ? parseInt(values.sclcClass) : null,
        sclcSteps: sclcSteps,
        beizhu: values.beizhu || '',
        danjia: values.jijia || values.danjia || null,
      });

      var token = localStorage.getItem('token');

      // 编辑模式：调用 PATCH 更新接口
      if (isEdit) {
        var token = localStorage.getItem('token') || '';
        console.log('[OrderEntry] PATCH token:', token.substring(0, 20) + '...');
        console.log('[OrderEntry] PATCH body:', JSON.stringify(data).substring(0, 200));
        fetch('/api/admin/orders/' + activeProduct + '/' + editDdId, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify(data),
        }).then(function(r) { return r.text().then(function(text) { console.log('[OrderEntry] PATCH response status:', r.status, 'body:', text.substring(0, 300)); return { ok: r.ok, status: r.status, data: text }; }); })
        .then(function(result) {
          try { result.data = JSON.parse(result.data); } catch(e) {}
          if (result.data.success) {
            message.success('修改成功');
            setTimeout(function() {
              navigate('/orders/' + activeProduct + '/' + editDdId);
            }, 1200);
          } else {
            message.error(result.data.message || result.data.error || '修改失败');
          }
        }).catch(function(err) {
          console.error('[OrderEntry] update error:', err);
          message.error('修改失败');
        });
        return;
      }

      // 新建模式
      fetch('/api/order-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (token || ''),
        },
        body: JSON.stringify(data),
      }).then(function(r) { return r.json().then(function(json) { return { ok: r.ok, status: r.status, data: json }; }); })
      .then(function(result) {
        if (result.data.success) {
          message.success('创建成功，单号：' + result.data.ddbh);
          setTimeout(function() {
            navigate('/orders/' + activeProduct + '/' + result.data.DD_id);
          }, 1200);
        } else {
          message.error(result.data.message || result.data.error || '创建失败');
        }
      }).catch(function(err) {
        console.error('[OrderEntry] error:', err);
        var errMsg = err.message || '创建失败';
        if (err.errorFields) errMsg = '请检查：' + err.errorFields.map(function(f) { return f.name; }).join(', ');
        message.error(errMsg);
      });
  }).catch(function(err) {
      var errMsg = err.errorFields ? '请检查必填字段：' + err.errorFields.map(function(f) { return f.name; }).join(', ') : (err.message || '验证失败');
      message.error(errMsg);
    });
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>{isEdit ? '编辑订单' : '新建订单'}</h2>
          <Button type="primary" icon={isEdit ? <Pencil size={15} /> : <Plus size={15} />} onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', borderRadius: 6 }}>{isEdit ? '保存修改' : '提交订单'}</Button>
        </div>

        <Form form={form} layout="vertical" labelAlign="right" onValuesChange={function() { calcTotal(form, activeProduct); }}>
          <Tabs
            activeKey={activeProduct}
            onChange={isEdit ? () => {} : setActiveProduct}
            items={[
              {
                key: 'YS',
                label: '📄 印刷(YS)',
                disabled: isEdit,
                children: (
                  <div>
                    {/* 基本信息 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 基本信息</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px' }}>
                        <Form.Item label="订单编号" name="ddbh" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                        <Form.Item label="生成日期" name="prouddate" style={{ marginBottom: 4 }}><DatePicker disabled style={{ width: '100%' }} /></Form.Item>
                        <Form.Item label="交货日期" name="overdate" rules={[{ validator: function(_, value) {
                          if (!value) return Promise.resolve();
                          var pd = form.getFieldValue('prouddate');
                          if (pd && value && value.isBefore) {
                            if (value.isBefore(pd, 'day') || value.isSame(pd, 'day')) {
                              return Promise.reject('交货日期不能早于生成日期');
                            }
                          }
                          return Promise.resolve();
                        } }]} style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                        <Form.Item label="制单" name="zhidan" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                        <Form.Item label={<LabelWithStar required>委印单位</LabelWithStar>} name="company" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="客户公司名称" /></Form.Item>
                        <Form.Item label="发货单位" name="fahuodanwei" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                        <Form.Item label="款号" name="kuanhao" style={{ marginBottom: 4 }}><Input placeholder="款号" /></Form.Item>
                        <Form.Item label={<LabelWithStar required>印件编号</LabelWithStar>} name="yjbhao" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="印件编号" /></Form.Item>
                        <Form.Item label="品名" name="proudnumber" style={{ marginBottom: 4 }}><Input placeholder="品名" /></Form.Item>
                        <Form.Item label={<LabelWithStar required>所属车间</LabelWithStar>} name="sclcClass" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}>
                          <Select placeholder="请选择" allowClear>
                            <Option value={1}>纸盒</Option>
                            <Option value={2}>印刷单</Option>
                            <Option value={3}>客户印</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item label="业务员" name="ywy" style={{ marginBottom: 4 }}>
                          <Select placeholder="选择业务员" allowClear>
                            {users.map(u => <Option key={u.UserID || u.userId} value={u.UserID || u.userId}>{u.UserName || u.username}</Option>)}
                          </Select>
                        </Form.Item>
                        <Form.Item label="外发" name="waifa" valuePropName="checked" style={{ marginBottom: 4 }}><Checkbox /></Form.Item>
                      </div>
                    </div>

                    {/* 用料与规格 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 用料与规格</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px' }}>
                        <Form.Item label={<LabelWithStar required>用料质地</LabelWithStar>} name="ylzd" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="如128G双铜" /></Form.Item>
                        <Form.Item label={<LabelWithStar required>成品规格</LabelWithStar>} name="cpgg" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="如210*285" /></Form.Item>
                        <Form.Item label={<LabelWithStar required>印刷数量</LabelWithStar>} name="shuliang" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="数量" type="number" /></Form.Item>
                        <Form.Item label="拼数" name="pingshu" style={{ marginBottom: 4 }}><Input placeholder="拼数" type="number" /></Form.Item>
                        <Form.Item label="开料尺寸" name="klcc" style={{ marginBottom: 4 }}><Input placeholder="如22.2*29.8" /></Form.Item>
                        <Form.Item label="开数" name="kaishu" style={{ marginBottom: 4 }}><Input placeholder="开数" type="number" /></Form.Item>
                        <Form.Item label="需开数量" name="xukaisl" style={{ marginBottom: 4 }}><Input placeholder="需开数量" type="number" /></Form.Item>
                        <Form.Item label="备次数量" name="bcsl" style={{ marginBottom: 4 }}><Input placeholder="备次数量" type="number" /></Form.Item>
                      </div>
                    </div>

                    {/* 纸张用量及价格 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 纸张用量及价格</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px' }}>
                        <Form.Item label="实印大张" name="sydazhang" style={{ marginBottom: 4 }}><Input placeholder="实印大张" type="number" /></Form.Item>
                        <Form.Item label="单价(元/张)" name="danjia" style={{ marginBottom: 4 }}><Input placeholder="单价" type="number" step="0.0001" /></Form.Item>
                        <Form.Item label="实印金额" name="syMoney" style={{ marginBottom: 4 }}><Input placeholder="实印金额" type="number" step="0.0001" /></Form.Item>
                        <Form.Item label="订单总价" name="yszj" style={{ marginBottom: 4 }}><Input placeholder="订单总价" type="number" step="0.0001" /></Form.Item>
                      </div>
                    </div>

                    {/* 要求 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 要求</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                        <Form.Item label="开料要求" name="klyaoqiu" style={{ marginBottom: 4 }}><Input.TextArea placeholder="开料要求" rows={1} /></Form.Item>
                        <Form.Item label="机印要求" name="jyyaoqiu" style={{ marginBottom: 4 }}><Input.TextArea placeholder="机印要求" rows={1} /></Form.Item>
                      </div>
                    </div>

                    {/* 贴膜 / 常规工艺 / 特殊工艺 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 工艺配置</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 12px' }}>
                        <div>
                          <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>贴膜</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {TIEMO_OPTIONS.map(opt => (
                              <Form.Item key={opt.value} name={opt.value} valuePropName="checked" style={{ marginBottom: 4 }}>
                                <Checkbox>{opt.label}</Checkbox>
                              </Form.Item>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>常规工艺</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {CHANGGUI_OPTIONS.map(opt => (
                              <Form.Item key={opt.value} name={opt.value} valuePropName="checked" style={{ marginBottom: 4 }}>
                                <Checkbox>{opt.label}</Checkbox>
                              </Form.Item>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>特殊工艺</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {TESHU_OPTIONS.map(opt => (
                              <Form.Item key={opt.value} name={opt.value} valuePropName="checked" style={{ marginBottom: 4 }}>
                                <Checkbox>{opt.label}</Checkbox>
                              </Form.Item>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 印件总价分析 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 印件总价分析</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f0f4f8' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d0dce8', width: '40%' }}>类别</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d0dce8', width: '30%' }}>数量</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d0dce8', width: '30%' }}>金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: '软片', sl: 'yssl1', je: 'jine1' },
                            { label: '印工', sl: 'yssl2', je: 'jine2' },
                            { label: 'PS版', sl: 'yssl3', je: 'jine3' },
                            { label: '铜锌版', sl: 'yssl4', je: 'jine4' },
                            { label: '电化铝', sl: 'yssl5', je: 'jine5' },
                            { label: '钢刀', sl: 'yssl6', je: 'jine6' },
                            { label: '轧钢刀', sl: 'yssl7', je: 'jine7' },
                            { label: '贴塑', sl: 'yssl8', je: 'jine8' },
                            { label: 'UV', sl: 'yss20', je: 'jine10' },
                            { label: '切折', sl: 'yssl9', je: 'jine9' },
                          ].map(function(item) {
                            return React.createElement('tr', { key: item.label },
                              React.createElement('td', { style: { padding: '4px 8px', border: '1px solid #d0dce8' } }, item.label),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: item.sl, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', type: 'number', placeholder: '-', style: { textAlign: 'right' } })
                                )
                              ),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: item.je, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', type: 'number', placeholder: '-', step: '0.0001', style: { textAlign: 'right' } })
                                )
                              )
                            );
                          })}
                          <tr style={{ background: '#e8f4fd', fontWeight: 600 }}>
                            <td style={{ padding: '6px 8px', border: '1px solid #d0dce8' }}>
                              总计 元/只
                              <Button
                                type="text"
                                size="small"
                                onClick={function() {
                                  if (priceMode === 'calc') {
                                    setPriceMode('edit');
                                  } else {
                                    setPriceMode('calc');
                                    // 切回计算模式时，重新计算总价
                                    calcTotal(form, 'YS');
                                  }
                                }}
                                style={{ marginLeft: 6, fontSize: 10, height: 20, padding: '0 4px', color: priceMode === 'edit' ? '#e55' : '#2563eb' }}
                              >{priceMode === 'calc' ? '计算' : '编辑'}</Button>
                            </td>
                            <td colSpan="2" style={{ padding: '2px 4px', border: '1px solid #d0dce8', textAlign: 'right' }}>
                              <Form.Item name="yszj" style={{ marginBottom: 0 }}>
                                <Input
                                  size="small"
                                  type="number"
                                  placeholder={priceMode === 'calc' ? '自动计算' : '手动输入'}
                                  step="0.0001"
                                  style={{ textAlign: 'right', fontWeight: 600 }}
                                  disabled={priceMode === 'calc'}
                                  onChange={function(e) { setYszjManual(e.target.value); }}
                                />
                              </Form.Item>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <Form.Item label="备注" name="beizhu" style={{ marginBottom: 4 }}>
                        <Input.TextArea placeholder="备注" rows={2} />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                                key: 'YM',
                label: '📄 印刷面(YM)',
                disabled: isEdit,
                children: (
                  <div>
                    {/* 基本信息 - 按老系统顺序 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 基本信息</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px' }}>
                        <Form.Item label="订单编号" name="ddbh" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                        <Form.Item label="生成日期" name="prouddate" style={{ marginBottom: 4 }}><DatePicker disabled style={{ width: '100%' }} /></Form.Item>
                        <Form.Item label="交货日期" name="overdate" rules={[{ validator: function(_, value) {
                          if (!value) return Promise.resolve();
                          var pd = form.getFieldValue('prouddate');
                          if (pd && value && value.isBefore) {
                            if (value.isBefore(pd, 'day') || value.isSame(pd, 'day')) {
                              return Promise.reject('交货日期不能早于生成日期');
                            }
                          }
                          return Promise.resolve();
                        } }]} style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                        <Form.Item label="制单" name="zhidan" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                        <Form.Item label={<LabelWithStar required>委印单位</LabelWithStar>} name="company" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="客户公司名称" /></Form.Item>
                        <Form.Item label="发货单位" name="fahuodanwei" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                        <Form.Item label={<LabelWithStar required>印件编号</LabelWithStar>} name="yjbhao" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="印件编号" /></Form.Item>
                        <Form.Item label={<LabelWithStar required>印刷数量</LabelWithStar>} name="shuliang" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="数量" type="number" /></Form.Item>
                        <Form.Item label="拼数" name="pingshu" style={{ marginBottom: 4 }}><Input placeholder="拼数" type="number" /></Form.Item>
                        <Form.Item label={<LabelWithStar required>成品规格</LabelWithStar>} name="cpgg" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="成品规格" /></Form.Item>
                        <Form.Item label="所属车间" name="sclcClass" style={{ marginBottom: 4 }}>
                          <Select placeholder="请选择" allowClear>
                            <Option value={1}>纸盒</Option>
                            <Option value={2}>印刷单</Option>
                            <Option value={3}>客户印</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item label={<LabelWithStar required>用料质地</LabelWithStar>} name="ylzd" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="如128G双铜" /></Form.Item>
                        <Form.Item label="业务员" name="ywy" style={{ marginBottom: 4 }}>
                          <Select placeholder="选择业务员" allowClear>
                            {users.map(u => <Option key={u.UserID || u.userId} value={u.UserID || u.userId}>{u.UserName || u.username}</Option>)}
                          </Select>
                        </Form.Item>
                        <Form.Item label="款号" name="kuanhao" style={{ marginBottom: 4 }}><Input placeholder="款号" /></Form.Item>
                        <Form.Item label="加工费" name="jiagongfei" style={{ marginBottom: 4 }}><Input placeholder="加工费" type="number" step="0.01" /></Form.Item>
                        <Form.Item label="品名" name="proudnumber" style={{ marginBottom: 4 }}><Input placeholder="品名" /></Form.Item>
                        <Form.Item label="外发" name="waifa" valuePropName="checked" style={{ marginBottom: 4 }}><Checkbox /></Form.Item>
                      </div>
                    </div>

                    {/* 纸张用量及价格 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 纸张用量及价格</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 12px' }}>
                        <Form.Item label="实用米数" name="sydazhang" style={{ marginBottom: 4 }}><Input placeholder="实用米数" type="number" step="0.0001" /></Form.Item>
                        <Form.Item label="单价(元/米)" name="danjia" style={{ marginBottom: 4 }}><Input placeholder="单价" type="number" step="0.0001" /></Form.Item>
                        <Form.Item label="金额" name="syMoney" style={{ marginBottom: 4 }}><Input placeholder="金额" type="number" step="0.0001" /></Form.Item>
                      </div>
                    </div>

                    {/* 要求 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 要求</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                        <Form.Item label="机印要求" name="jyyaoqiu" style={{ marginBottom: 4 }}><Input.TextArea placeholder="机印要求" rows={1} /></Form.Item>
                        <Form.Item label="工艺要求" name="gyyq" style={{ marginBottom: 4 }}><Input.TextArea placeholder="工艺要求" rows={1} /></Form.Item>
                      </div>
                    </div>

                    {/* 后整理工艺 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 后整理工艺</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {[ // 后整理工艺 - YM
                          { label: '烘色牢度', value: 'hzl1' },
                          { label: '切割', value: 'hzl2' },
                          { label: '超声波切割', value: 'hzl3' },
                          { label: '三角折', value: 'hzl7' },
                          { label: '手工切折', value: 'hzl4' },
                          { label: '手工对折', value: 'hzl5' },
                          { label: '其它', value: 'hzl6' },
                        ].map(function(opt) {
                          return React.createElement(Form.Item, { key: opt.value, name: opt.value, valuePropName: 'checked', style: { marginBottom: 4 } },
                            React.createElement(Checkbox, { onChange: function() { handleStepToggle('YM', opt.value); } }, opt.label)
                          );
                        })}
                      </div>
                    </div>

                    {/* 印件总价分析 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 印件总价分析</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f0f4f8' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d0dce8', width: '25%' }}>类别</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d0dce8', width: '15%' }}>数量</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #d0dce8', width: '10%' }}>单位</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d0dce8', width: '20%' }}>印量</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d0dce8', width: '30%' }}>金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: '软片', sl: 'yssl1', yl: 'ysyl1', je: 'jine1' },
                            { label: '印工', sl: 'yssl2', yl: 'ysyl2', je: 'jine2' },
                            { label: 'PS版', sl: 'yssl3', yl: 'ysyl3', je: 'jine3' },
                            { label: '铜锌版', sl: 'yssl4', yl: 'ysyl4', je: 'jine4' },
                            { label: '电化铝', sl: 'yssl5', yl: 'ysyl5', je: 'jine5' },
                            { label: '钢刀', sl: 'yssl6', yl: 'ysyl6', je: 'jine6' },
                            { label: '轧钢刀', sl: 'yssl7', yl: 'ysyl7', je: 'jine7' },
                            { label: '贴塑双(单)面', sl: 'yssl8', yl: 'ysyl8', je: 'jine8' },
                            { label: '切刀打洞/圆角穿线/整理包扎', sl: 'yssl9', yl: 'ysyl9', je: 'jine9' },
                          ].map(function(item) {
                            return React.createElement('tr', { key: item.label },
                              React.createElement('td', { style: { padding: '4px 8px', border: '1px solid #d0dce8', fontSize: 11 } }, item.label),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: item.sl, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', type: 'number', placeholder: '-', style: { textAlign: 'right' } })
                                )
                              ),
                              React.createElement('td', { style: { padding: '4px 8px', border: '1px solid #d0dce8', textAlign: 'center', fontSize: 11, color: '#666' } }, '米/只'),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: item.yl, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', type: 'number', placeholder: '-', style: { textAlign: 'right' } })
                                )
                              ),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: item.je, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', type: 'number', placeholder: '-', step: '0.0001', style: { textAlign: 'right' } })
                                )
                              )
                            );
                          })}
                          <tr style={{ background: '#e8f4fd', fontWeight: 600 }}>
                            <td style={{ padding: '6px 8px', border: '1px solid #d0dce8' }}>
                              总计 元/只
                              <Button
                                type="text"
                                size="small"
                                onClick={function() {
                                  if (priceMode === 'calc') {
                                    setPriceMode('edit');
                                  } else {
                                    setPriceMode('calc');
                                    calcTotal(form, 'YM');
                                  }
                                }}
                                style={{ marginLeft: 6, fontSize: 10, height: 20, padding: '0 4px', color: priceMode === 'edit' ? '#e55' : '#0891b2' }}
                              >{priceMode === 'calc' ? '计算' : '编辑'}</Button>
                            </td>
                            <td colSpan="4" style={{ padding: '2px 4px', border: '1px solid #d0dce8', textAlign: 'right' }}>
                              <Form.Item name="yszj" style={{ marginBottom: 0 }}>
                                <Input
                                  size="small"
                                  type="number"
                                  placeholder={priceMode === 'calc' ? '自动计算' : '手动输入'}
                                  step="0.001"
                                  style={{ textAlign: 'right', fontWeight: 600 }}
                                  disabled={priceMode === 'calc'}
                                  onChange={function(e) { setYszjManual(e.target.value); }}
                                />
                              </Form.Item>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 备注及附件 */}
                    <div style={{ marginBottom: 8 }}>
                      <Form.Item label="备注" name="beizhuYM" style={{ marginBottom: 4 }}>
                        <Input.TextArea placeholder="备注" rows={3} />
                      </Form.Item>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 12px' }}>
                      <Form.Item label="印机型号" name="beizhu8" style={{ marginBottom: 4 }}><Input placeholder="印机型号" /></Form.Item>
                      <Form.Item label="发料日期" name="lldate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                      <Form.Item label="附件" name="upfile" style={{ marginBottom: 4 }}><Input placeholder="附件" /></Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                                key: 'ZM',
                label: '📦 纸盒(ZM)',
                disabled: isEdit,
                children: (
                  <div>
                    {/* 基本信息 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 基本信息</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px' }}>
                        <Form.Item label="订单编号" name="ddbh" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                        <Form.Item label="生成日期" name="prouddate" style={{ marginBottom: 4 }}><DatePicker disabled style={{ width: '100%' }} /></Form.Item>
                        <Form.Item label="交货日期" name="overdate" rules={[{ validator: function(_, value) {
                          if (!value) return Promise.resolve();
                          var pd = form.getFieldValue('prouddate');
                          if (pd && value && value.isBefore) {
                            if (value.isBefore(pd, 'day') || value.isSame(pd, 'day')) {
                              return Promise.reject('交货日期不能早于生成日期');
                            }
                          }
                          return Promise.resolve();
                        } }]} style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                        <Form.Item label="制单" name="zhidan" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                        <Form.Item label={<LabelWithStar required>花号</LabelWithStar>} name="huahao" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="花号" /></Form.Item>
                        <Form.Item label="订货数量" style={{ marginBottom: 4 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Form.Item name="shuliang" style={{ marginBottom: 0, flex: 2 }}>
                              <Input placeholder="数量" type="number" />
                            </Form.Item>
                            <Form.Item name="dhdw" style={{ marginBottom: 0, flex: 1 }}>
                              <Select placeholder="单位">
                                <Option value="只">只</Option>
                                <Option value="米">米</Option>
                              </Select>
                            </Form.Item>
                          </div>
                        </Form.Item>
                        <Form.Item label="所需时间" name="sxdate" style={{ marginBottom: 4 }}><Input placeholder="所需时间" /></Form.Item>
                        <Form.Item label="业务员" name="ywy" style={{ marginBottom: 4 }}>
                          <Select placeholder="选择业务员" allowClear>
                            {users.map(u => <Option key={u.UserID || u.userId} value={u.UserID || u.userId}>{u.UserName || u.username}</Option>)}
                          </Select>
                        </Form.Item>
                        <Form.Item label="下单公司" name="company" style={{ marginBottom: 4 }}><Input placeholder="下单公司" /></Form.Item>
                        <Form.Item label="发货单位" name="fahuodanwei" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                        <Form.Item label="款号" name="kuanhao" style={{ marginBottom: 4 }}><Input placeholder="款号" /></Form.Item>
                        <Form.Item label="外发" name="waifa" valuePropName="checked" style={{ marginBottom: 4 }}><Checkbox /></Form.Item>

                      </div>
                    </div>

                    {/* 生产规格 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 生产规格</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px' }}>
                        <Form.Item label="卷送生产班别" name="proudbanbie" style={{ marginBottom: 4 }}><Input placeholder="卷送生产班别" /></Form.Item>
                        <Form.Item label="生产机型" name="proudnumber" style={{ marginBottom: 4 }}><Input placeholder="生产机型" /></Form.Item>
                        <Form.Item label="基价" name="jijia" style={{ marginBottom: 4 }}><Input placeholder="基价" type="number" step="0.01" /></Form.Item>
                        <Form.Item label="总干纬" name="allcount" style={{ marginBottom: 4 }}><Input placeholder="总干纬" type="number" /></Form.Item>
                        <Form.Item label="纬密" name="weidu" style={{ marginBottom: 4 }}><Input placeholder="纬密" /></Form.Item>
                        <Form.Item label="宽度" name="kuandu" style={{ marginBottom: 4 }}><Input placeholder="宽度" /></Form.Item>
                        <Form.Item label="开条数" name="kts" style={{ marginBottom: 4 }}><Input placeholder="开条数" type="number" /></Form.Item>
                        <Form.Item label="总长" name="changdu" style={{ marginBottom: 4 }}><Input placeholder="总长" /></Form.Item>
                        <Form.Item label="花长" name="huachang" style={{ marginBottom: 4 }}><Input placeholder="花长" /></Form.Item>
                        <Form.Item label="成品尺寸" name="chenpingcc" style={{ marginBottom: 4 }}><Input placeholder="成品尺寸" /></Form.Item>
                        <Form.Item label="加工费" name="jiagongfei" style={{ marginBottom: 4 }}><Input placeholder="加工费" type="number" step="0.0001" /></Form.Item>
                        <Form.Item label="首检记录" name="soujianjl" style={{ marginBottom: 4 }}><Input placeholder="首检记录" /></Form.Item>
                      </div>
                    </div>

                    {/* 色卡明细表 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 色卡明细表</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f0f4f8' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #d0dce8', width: '10%' }}>#</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d0dce8', width: '30%' }}>千纬(QW)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d0dce8', width: '30%' }}>色纱(SS)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d0dce8', width: '30%' }}>备注(BZ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(function(n) {
                            var qw = 'qw' + n;
                            var ss = 'ss' + n;
                            var bz = 'bz' + n;
                            return React.createElement('tr', { key: n },
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8', textAlign: 'center', background: '#f0f4f8' } }, n),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: qw, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', placeholder: '-' })
                                )
                              ),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: ss, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', placeholder: '-' })
                                )
                              ),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: bz, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', placeholder: '-' })
                                )
                              )
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 尺码明细表 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 尺码明细表</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f0f4f8' }}>
                            <th style={{ padding: '6px 4px', textAlign: 'center', border: '1px solid #d0dce8' }}>尺码号</th>
                            {[1,2,3,4,5,6,7,8,9,10].map(function(n) {
                              return React.createElement('th', { key: n, style: { padding: '6px 4px', textAlign: 'center', border: '1px solid #d0dce8', minWidth: 60 } }, n);
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '2px 4px', border: '1px solid #d0dce8', background: '#f0f4f8', textAlign: 'center', fontSize: 11 }}>尺码</td>
                            {[1,2,3,4,5,6,7,8,9,10].map(function(n) {
                              return React.createElement('td', { key: n, style: { padding: '2px 2px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: 'cmh' + n, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', placeholder: '-', style: { textAlign: 'center' } })
                                )
                              );
                            })}
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 4px', border: '1px solid #d0dce8', background: '#f0f4f8', textAlign: 'center', fontSize: 11 }}>数量</td>
                            {[1,2,3,4,5,6,7,8,9,10].map(function(n) {
                              return React.createElement('td', { key: n, style: { padding: '2px 2px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: 'sl' + n, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', placeholder: '-', type: 'number', style: { textAlign: 'center' } })
                                )
                              );
                            })}
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 4px', border: '1px solid #d0dce8', background: '#f0f4f8', textAlign: 'center', fontSize: 11 }}>列数</td>
                            {[1,2,3,4,5,6,7,8,9,10].map(function(n) {
                              return React.createElement('td', { key: n, style: { padding: '2px 2px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: 'lieshu' + n, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', placeholder: '-', type: 'number', style: { textAlign: 'center' } })
                                )
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 整理工序 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 整理工序</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {[
                          { label: '切折', value: 'hzl1' },
                          { label: '三角折', value: 'hzl2' },
                          { label: '对折', value: 'hzl3' },
                          { label: '切割', value: 'hzl4' },
                          { label: '超声波', value: 'hzl5' },
                          { label: '热切粘衬', value: 'hzl6' },
                          { label: '包边', value: 'hzl7' },
                          { label: '卷装', value: 'hzl8' },
                          { label: '留样', value: 'hzl9' },
                          { label: '热切', value: 'hzl10' },
                          { label: '划口', value: 'hzl11' },
                          { label: '充棉', value: 'hzl12' },
                          { label: '打汽眼', value: 'hzl13' },
                          { label: '踩线', value: 'hzl14' },
                          { label: '烫钻', value: 'hzl15' },
                          { label: '盒装', value: 'hzl16' },
                        ].map(function(opt) {
                          return React.createElement(Form.Item, { key: opt.value, name: opt.value, valuePropName: 'checked', style: { marginBottom: 4 } },
                            React.createElement(Checkbox, null, opt.label)
                          );
                        })}
                      </div>
                    </div>

                    {/* 工艺要求 */}
                    <div style={{ marginBottom: 16 }}>
                      <Form.Item label="工艺要求" name="gyyq" style={{ marginBottom: 4 }}>
                        <Input.TextArea placeholder="工艺要求" rows={2} />
                      </Form.Item>
                    </div>

                    {/* 质检 */}
                    <div style={{ marginBottom: 16 }}>
                      <Form.Item label="质检" name="zm_zhijian" style={{ marginBottom: 4 }}>
                        <Input.TextArea placeholder="质检记录" rows={2} />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                                key: 'DS',
                label: '🃏 模切(DS)',
                disabled: isEdit,
                children: (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px', marginBottom: 12 }}>
                      <Form.Item label="订单编号" name="ddbh" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                      <Form.Item label={<LabelWithStar required>印件编号</LabelWithStar>} name="yjbhao" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="印件编号" /></Form.Item>
                      <Form.Item label="交货日期" name="overdate" rules={[{ validator: function(_, value) {
                          if (!value) return Promise.resolve();
                          var pd = form.getFieldValue('prouddate');
                          if (pd && value && value.isBefore) {
                            if (value.isBefore(pd, 'day') || value.isSame(pd, 'day')) {
                              return Promise.reject('交货日期不能早于生成日期');
                            }
                          }
                          return Promise.resolve();
                        } }]} style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                      <Form.Item label="生产日期" name="prouddate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                      <Form.Item label={<LabelWithStar required>委印单位</LabelWithStar>} name="company" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="委印单位" /></Form.Item>
                      <Form.Item label="款号" name="kuanhao" style={{ marginBottom: 4 }}><Input placeholder="款号" /></Form.Item>
                      <Form.Item label="价格" name="jiage" style={{ marginBottom: 4 }}><Input placeholder="价格" type="number" step="0.01" /></Form.Item>
                      <Form.Item label="发货" name="fahuodanwei" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                      <Form.Item label="生产机型" name="proudnumber" style={{ marginBottom: 4 }}><Input placeholder="生产机型" /></Form.Item>
                    </div>

                    <div style={{ marginBottom: 12, padding: '8px 12px', border: '1px solid #d0dce8', borderRadius: 4 }}>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>请选择整理环节</div>
                      <div style={{ display: 'flex', gap: 24 }}>
                        <Form.Item name="hzl1" valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Checkbox>制版</Checkbox>
                        </Form.Item>
                        <Form.Item name="hzl2" valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Checkbox>生产</Checkbox>
                        </Form.Item>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px', marginBottom: 12 }}>
                      <Form.Item label="制单人" name="zhidan" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                      <Form.Item label="发货日期" name="fhdate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                      <Form.Item label={<LabelWithStar required>业务员</LabelWithStar>} name="ywy" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}>
                        <Select placeholder="选择业务员" allowClear>
                          {users.map(function(u) { return React.createElement(Option, { key: u.UserID || u.userId, value: u.UserID || u.userId }, u.UserName || u.username); })}
                        </Select>
                      </Form.Item>
                      <Form.Item label="发货人" name="fhr" style={{ marginBottom: 4 }}><Input placeholder="发货人" /></Form.Item>
                      <Form.Item label="发货单位" name="fahuodanwei" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                      <Form.Item label="整烫" name="zhengli" style={{ marginBottom: 4 }}><Input placeholder="整烫" /></Form.Item>
                      <Form.Item label="外发" name="waifa" valuePropName="checked" style={{ marginBottom: 4 }}><Checkbox /></Form.Item>
                      <Form.Item label="加工费" name="jiagongfei" style={{ marginBottom: 4 }}><Input placeholder="加工费" type="number" step="0.0001" /></Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 12px' }}>
                      <Form.Item label="附件" name="upfile" style={{ marginBottom: 4 }}><Input placeholder="附件" /></Form.Item>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </div>
    </AppLayout>
  );
}
