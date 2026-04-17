import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, Card, Tabs, Checkbox, message } from 'antd';
import { Plus } from 'lucide-react';
import dayjs from 'dayjs';
import AppLayout from '../components/AppLayout';
import { adminListUsers } from '../api';

const { Option } = Select;

const LabelWithStar = ({ children, required }) => (
  <span style={{ color: required ? '#e53e3e' : 'inherit' }}>{children}{required && <span style={{ color: '#e53e3e' }}> *</span>}</span>
);

// 贴膜选项
const TIEMO_OPTIONS = [
  { label: '光膜', value: 'tmG' },
  { label: '哑膜', value: 'tmM' },
  { label: '单面', value: 'tmD' },
  { label: '双面', value: 'tmS' },
  { label: '镀铝', value: 'tmDH' },
  { label: '其他', value: 'tmQT' },
];

// 常规工艺选项
const CHANGGUI_OPTIONS = [
  { label: '烫金', value: 'cgJG' },
  { label: '压痕', value: 'cgYG' },
  { label: '模切', value: 'cgMK' },
  { label: '糊盒', value: 'cgHK' },
  { label: '穿线', value: 'cgCX' },
  { label: '敲钉', value: 'cgQND' },
  { label: '激光', value: 'cgJG2' },
  { label: '其他', value: 'cgOT' },
];

// 特殊工艺选项
const TESHU_OPTIONS = [
  { label: '局部丝印', value: 'tsJS' },
  { label: '绣花', value: 'tsWX' },
  { label: '烫钻', value: 'tsZS' },
  { label: '胶印上光', value: 'tsJY' },
  { label: '其他', value: 'tsOT' },
];

const STEPS_MAP_YSS = {
  hzlA1: '贴膜', hzlA2: '折页', hzlA3: '压线', hzlA4: 'UV',
  hzlA5: '烫金', hzlA6: '凹凸',
  hzlB3: '模切', hzlB4: '糊盒', hzlB5: '钉箱', hzlB6: '打包',
  hzlB7: '复膜', hzlB8: '折页', hzlB9: '压痕', hzlB10: '打孔',
  hzlB11: '激光', hzlB12: '切成品', hzlB13: '表面整饰', hzlB14: '局部UV', hzlB15: '其他',
  hzlC1: '磨光', hzlC3: '过油磨光', hzlC4: '烫金', hzlC5: '凹凸',
  hzlC6: '压纹', hzlC7: 'UV', hzlC8: '植绒', hzlC9: '复膜', hzlC10: '模切',
};

const STEPS_MAP_YMGX = {
  hzl1: '晒版', hzl2: '显影', hzl3: '烘版', hzl4: '拼版', hzl5: '擦版',
  hzl6: '贴膜', hzl7: '打包',
};

const YM_PROCESS_LIST = ['晒版', '显影', '烘版', '拼版', '擦版', '贴膜', '打包'];

const ZM_PROCESS_LIST = ['开料', '印刷', '裱纸', '模切', '冲孔', '钉粘', '打包'];
const ZM_PROCESS_FIELDS = ['hzl1','hzl2','hzl3','hzl4','hzl5','hzl6','hzl7'];

const DS_PROCESS_LIST = ['设计', '生产'];
const DS_PROCESS_FIELDS = ['hzl1','hzl2'];

const YSS_PROCESS_LIST = Object.values(STEPS_MAP_YSS);
const YSS_PROCESS_FIELDS = Object.keys(STEPS_MAP_YSS);

export default function OrderEntryPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState('YS');
  const [stepsMap, setStepsMap] = useState({});
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [ysSteps, setYsSteps] = useState({});

  // Decode JWT to get current user for zhidan field
  useEffect(function() {
    try {
      var token = localStorage.getItem('token');
      if (!token) return;
      var parts = token.split('.');
      if (parts.length !== 3) return;
      var payload = JSON.parse(atob(parts[1]));
      setCurrentUser(payload);
      form.setFieldValue('zhidan', payload.username || payload.UserName || '');
      form.setFieldValue('prouddate', payload.prouddate || null);
    } catch (e) {}
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
    } else if (product === 'ZM') {
      const updated = { ...zmSteps };
      if (updated[field]) { delete updated[field]; } else { updated[field] = true; }
      setZmSteps(updated);
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
    if (activeProduct === 'YS') setStepsMap(ysSteps);
    else if (activeProduct === 'YM') setStepsMap(ymSteps);
    else if (activeProduct === 'ZM') setStepsMap(zmSteps);
    else if (activeProduct === 'DS') setStepsMap(dsSteps);
  }, [activeProduct, ymSteps, zmSteps, dsSteps]);

  function handleCreate() {
    var requiredFields = ['ddbh', 'prouddate'];
    if (activeProduct === 'YS' || activeProduct === 'YM') {
      requiredFields = requiredFields.concat(['company', 'ylzd', 'cpgg', 'shuliang']);
    } else if (activeProduct === 'ZM') {
      requiredFields = requiredFields.concat(['huahao', 'proudnumber', 'shuliang']);
    } else if (activeProduct === 'DS') {
      requiredFields = requiredFields.concat(['yjbhao', 'shuliang']);
    }

    form.validateFields(requiredFields).then(function() {
      var values = form.getFieldsValue();
      console.log('[OrderEntry] product_type:', activeProduct, 'company:', values.company, 'overdate:', values.overdate);

      var sclcSteps = Object.keys(stepsMap).map(function(field) {
        if (activeProduct === 'YS') return field;
        if (activeProduct === 'ZM') {
          var idx = ZM_PROCESS_LIST.indexOf(field);
          return idx >= 0 ? 'hzl' + (idx + 1) + '-' + field : field;
        }
        if (activeProduct === 'YM') {
          var idx = YM_PROCESS_LIST.indexOf(field);
          return idx >= 0 ? 'hzl' + (idx + 1) + '-' + field : field;
        }
        if (activeProduct === 'DS') {
          var idx = DS_PROCESS_LIST.indexOf(field);
          return idx >= 0 ? 'hzl' + (idx + 1) + '-' + field : field;
        }
        return field;
      });

      var fmtDate = function(v) {
        if (!v) return null;
        if (typeof v.format === 'function') return v.format('YYYY-MM-DD');
        return v;
      };

      // Convert all checkbox fields (tmG/tmM/cgJG/tsJS etc.) from boolean to 0/1
      var checkboxFields = [
        'tmG','tmM','tmD','tmS','tmDH','tmQT',
        'cgJG','cgYG','cgMK','cgHK','cgCX','cgQND','cgJG2','cgOT',
        'tsJS','tsWX','tsZS','tsJY','tsOT',
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
          <h2 style={{ margin: 0, fontSize: 16 }}>新建订单</h2>
          <Button type="primary" icon={<Plus size={15} />} onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', borderRadius: 6 }}>提交订单</Button>
        </div>

        <Form form={form} layout="vertical" labelAlign="right">
          <Tabs
            activeKey={activeProduct}
            onChange={setActiveProduct}
            items={[
              {
                key: 'YS',
                label: '📄 印刷(YS)',
                children: (
                  <div>
                    {/* 基本信息 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 8 }}>| 基本信息</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 12px' }}>
                        <Form.Item label="订单编号" name="ddbh" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                        <Form.Item label="生成日期" name="prouddate" style={{ marginBottom: 4 }}><DatePicker disabled style={{ width: '100%' }} /></Form.Item>
                        <Form.Item label="交货日期" name="overdate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                        <Form.Item label="制单" name="zhidan" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                        <Form.Item label={<LabelWithStar required>委印单位</LabelWithStar>} name="company" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="客户公司名称" /></Form.Item>
                        <Form.Item label="发货单位" name="fahuodanwei" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                        <Form.Item label="款号" name="kuanhao" style={{ marginBottom: 4 }}><Input placeholder="款号" /></Form.Item>
                        <Form.Item label="印件编号" name="yjbhao" style={{ marginBottom: 4 }}><Input placeholder="印件编号" /></Form.Item>
                        <Form.Item label="品名" name="proudnumber" style={{ marginBottom: 4 }}><Input placeholder="品名" /></Form.Item>
                        <Form.Item label="所属车间" name="sclcClass" style={{ marginBottom: 4 }}>
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
                        <Form.Item label="单价(元/张)" name="danjia" style={{ marginBottom: 4 }}><Input placeholder="单价" type="number" step="0.01" /></Form.Item>
                        <Form.Item label="实印金额" name="syMoney" style={{ marginBottom: 4 }}><Input placeholder="实印金额" type="number" step="0.01" /></Form.Item>
                        <Form.Item label="订单总价" name="yszj" style={{ marginBottom: 4 }}><Input placeholder="订单总价" type="number" step="0.01" /></Form.Item>
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
                            <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d0dce8', width: '20%' }}>数量</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d0dce8', width: '20%' }}>单价(元)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d0dce8', width: '20%' }}>金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: '软片', sl: 'rpban_sl1', dj: 'rpban_dj1', je: 'rpban_je1' },
                            { label: '印工', sl: 'yingong_sl', dj: 'yingong_dj', je: 'yingong_je' },
                            { label: 'PS版', sl: 'psban_sl', dj: 'psban_dj', je: 'psban_je' },
                            { label: '铜锌版', sl: 'tongxin_sl', dj: 'tongxin_dj', je: 'tongxin_je' },
                            { label: '电化铝', sl: 'dianhua_sl', dj: 'dianhua_dj', je: 'dianhua_je' },
                            { label: '钢刀', sl: 'gangdao_sl', dj: 'gangdao_dj', je: 'gangdao_je' },
                            { label: '轧钢刀', sl: 'zhagang_sl', dj: 'zhagang_dj', je: 'zhagang_je' },
                            { label: '贴塑', sl: 'tiesu_sl', dj: 'tiesu_dj', je: 'tiesu_je' },
                            { label: 'UV', sl: 'uv_sl', dj: 'uv_dj', je: 'uv_je' },
                            { label: '切折', sl: 'qiezhe_sl', dj: 'qiezhe_dj', je: 'qiezhe_je' },
                            { label: '打包', sl: 'dabao_sl', dj: 'dabao_dj', je: 'dabao_je' },
                            { label: '其他', sl: 'qita_sl', dj: 'qita_dj', je: 'qita_je' },
                          ].map(function(item) {
                            return React.createElement('tr', { key: item.label },
                              React.createElement('td', { style: { padding: '4px 8px', border: '1px solid #d0dce8' } }, item.label),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: item.sl, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', type: 'number', placeholder: '-', style: { textAlign: 'right' } })
                                )
                              ),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: item.dj, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', type: 'number', placeholder: '-', step: '0.01', style: { textAlign: 'right' } })
                                )
                              ),
                              React.createElement('td', { style: { padding: '2px 4px', border: '1px solid #d0dce8' } },
                                React.createElement(Form.Item, { name: item.je, style: { marginBottom: 0 } },
                                  React.createElement(Input, { size: 'small', type: 'number', placeholder: '-', step: '0.01', style: { textAlign: 'right' } })
                                )
                              )
                            );
                          })}
                          <tr style={{ background: '#e8f4fd', fontWeight: 600 }}>
                            <td style={{ padding: '6px 8px', border: '1px solid #d0dce8' }}>总计 元/只</td>
                            <td colSpan="3" style={{ padding: '2px 4px', border: '1px solid #d0dce8', textAlign: 'right' }}>
                              <Form.Item name="total_je" style={{ marginBottom: 0 }}>
                                <Input size="small" type="number" placeholder="自动计算" step="0.01" style={{ textAlign: 'right', fontWeight: 600 }} disabled />
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
                children: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Form.Item label="订单编号" name="ddbh" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                    <Form.Item label="生产日期" name="prouddate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="交货日期" name="overdate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="业务员" name="ywy" style={{ marginBottom: 4 }}><Select allowClear>{users.map(u => <Option key={u.UserID || u.userId} value={u.UserID || u.userId}>{u.UserName || u.username}</Option>)}</Select></Form.Item>
                    <Form.Item label={<LabelWithStar required>委印单位</LabelWithStar>} name="company" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="委印单位" /></Form.Item>
                    <Form.Item label="发货单位" name="fahuodanwei" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                    <Form.Item label="款号" name="kuanhao" style={{ marginBottom: 4 }}><Input placeholder="款号" /></Form.Item>
                    <Form.Item label="外发" name="waifa" valuePropName="checked" style={{ marginBottom: 4 }}><Checkbox /></Form.Item>
                    <Form.Item label={<LabelWithStar required>用料质地</LabelWithStar>} name="ylzd" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="如128G双铜" /></Form.Item>
                    <Form.Item label={<LabelWithStar required>成品尺寸</LabelWithStar>} name="cpgg" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="成品尺寸" /></Form.Item>
                    <Form.Item label={<LabelWithStar required>印刷数量</LabelWithStar>} name="shuliang" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="数量" type="number" /></Form.Item>
                    <Form.Item label="拼数" name="pingshu" style={{ marginBottom: 4 }}><Input placeholder="拼数" type="number" /></Form.Item>
                    <Form.Item label="整烫" name="zhengli" style={{ marginBottom: 4 }}><Input placeholder="整烫" /></Form.Item>
                    <Form.Item label="工艺要求" name="gyyq" style={{ marginBottom: 4 }}><Input.TextArea placeholder="工艺要求" rows={1} /></Form.Item>
                    <Form.Item label="品名" name="proudnumber" style={{ marginBottom: 4 }}><Input placeholder="品名" /></Form.Item>
                    <Form.Item label="发料日期" name="lldate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="备注" name="beizhu" style={{ marginBottom: 4 }}><Input.TextArea placeholder="备注" rows={1} /></Form.Item>
                  </div>
                ),
              },
              {
                key: 'ZM',
                label: '📦 纸盒(ZM)',
                children: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Form.Item label="订单编号" name="ddbh" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                    <Form.Item label="生产日期" name="prouddate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="交货日期" name="overdate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="业务员" name="ywy" style={{ marginBottom: 4 }}><Select allowClear>{users.map(u => <Option key={u.UserID || u.userId} value={u.UserID || u.userId}>{u.UserName || u.username}</Option>)}</Select></Form.Item>
                    <Form.Item label={<LabelWithStar>花号</LabelWithStar>} name="huahao" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="花号" /></Form.Item>
                    <Form.Item label={<LabelWithStar>产品编号</LabelWithStar>} name="proudnumber" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="产品编号" /></Form.Item>
                    <Form.Item label="委印单位" name="company" style={{ marginBottom: 4 }}><Input placeholder="委印单位" /></Form.Item>
                    <Form.Item label="发货单位" name="fahuodanwei" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                    <Form.Item label="款号" name="kuanhao" style={{ marginBottom: 4 }}><Input placeholder="款号" /></Form.Item>
                    <Form.Item label={<LabelWithStar>数量</LabelWithStar>} name="shuliang" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="数量" type="number" /></Form.Item>
                    <Form.Item label="成品尺寸" name="cpgg" style={{ marginBottom: 4 }}><Input placeholder="成品尺寸" /></Form.Item>
                    <Form.Item label="单价(元/张)" name="danjia" style={{ marginBottom: 4 }}><Input placeholder="单价" type="number" step="0.01" /></Form.Item>
                    <Form.Item label="总金额" name="yszj" style={{ marginBottom: 4 }}><Input placeholder="总金额" type="number" step="0.01" /></Form.Item>
                    <Form.Item label="工艺要求" name="gyyq" style={{ marginBottom: 4 }}><Input.TextArea placeholder="工艺要求" rows={1} /></Form.Item>
                    <Form.Item label="备注" name="beizhu" style={{ marginBottom: 4 }}><Input.TextArea placeholder="备注" rows={1} /></Form.Item>
                  </div>
                ),
              },
              {
                key: 'DS',
                label: '🃏 模切(DS)',
                children: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Form.Item label="订单编号" name="ddbh" style={{ marginBottom: 4 }}><Input disabled /></Form.Item>
                    <Form.Item label="生产日期" name="prouddate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="交货日期" name="overdate" style={{ marginBottom: 4 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="业务员" name="ywy" style={{ marginBottom: 4 }}><Select allowClear>{users.map(u => <Option key={u.UserID || u.userId} value={u.UserID || u.userId}>{u.UserName || u.username}</Option>)}</Select></Form.Item>
                    <Form.Item label="委印单位" name="company" style={{ marginBottom: 4 }}><Input placeholder="委印单位" /></Form.Item>
                    <Form.Item label="发货单位" name="fhdw" style={{ marginBottom: 4 }}><Input placeholder="发货单位" /></Form.Item>
                    <Form.Item label="发货人" name="fhr" style={{ marginBottom: 4 }}><Input placeholder="发货人" /></Form.Item>
                    <Form.Item label="款号" name="kuanhao" style={{ marginBottom: 4 }}><Input placeholder="款号" /></Form.Item>
                    <Form.Item label={<LabelWithStar>印件编号</LabelWithStar>} name="yjbhao" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="印件编号" /></Form.Item>
                    <Form.Item label="外发" name="waifa" valuePropName="checked" style={{ marginBottom: 4 }}><Checkbox /></Form.Item>
                    <Form.Item label={<LabelWithStar>数量</LabelWithStar>} name="shuliang" rules={[{ required: true, message: ' ' }]} style={{ marginBottom: 4 }}><Input placeholder="数量" type="number" /></Form.Item>
                    <Form.Item label="成品尺寸" name="cpgg" style={{ marginBottom: 4 }}><Input placeholder="成品尺寸" /></Form.Item>
                    <Form.Item label="单价" name="jiage" style={{ marginBottom: 4 }}><Input placeholder="单价" type="number" step="0.01" /></Form.Item>
                    <Form.Item label="整烫" name="zhengli" style={{ marginBottom: 4 }}><Input placeholder="整烫" /></Form.Item>
                    <Form.Item label="总金额" name="yszj" style={{ marginBottom: 4 }}><Input placeholder="总金额" type="number" step="0.01" /></Form.Item>
                    <Form.Item label="备注" name="beizhu" style={{ marginBottom: 4 }}><Input.TextArea placeholder="备注" rows={1} /></Form.Item>
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
