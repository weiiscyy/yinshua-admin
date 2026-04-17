import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button, Tag, Typography, Space, message, Spin, Descriptions, Tooltip, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, UndoOutlined, PrinterOutlined } from '@ant-design/icons';
import { openOrderPrint } from '../utils/print';
import { useNavigate, useParams } from 'react-router-dom';
import { adminGetOrder, adminUpdateStep } from '../api';
import AppLayout from '../components/AppLayout';

const { Title, Text } = Typography;
const PRODUCT_MAP = { YS: '印刷', YM: '印刷面', ZM: '纸盒', DS: '模切' };
const PRODUCT_COLORS = { YS: '#2563eb', YM: '#06b6d4', ZM: '#10b981', DS: '#f59e0b' };

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { productType, ddId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const res = await adminGetOrder(productType, ddId);
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
      const res = await adminUpdateStep(productType, ddId, stepField, completed);
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
      {/* ===== Header ===== */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/orders')}
          style={{ borderRadius: 8 }}
        >
          返回订单列表
        </Button>

        <Tag className={`tag-${order.product_type.toLowerCase()}`} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
          {PRODUCT_MAP[order.product_type]}
        </Tag>

        <Text strong style={{ fontSize: 20, color: 'var(--text-primary)', letterSpacing: 1 }}>
          {order.ddbh}
        </Text>

        <Button
          icon={<PrinterOutlined />}
          onClick={() => openOrderPrint(order, productType)}
          style={{ borderRadius: 8 }}
        >
          打印订单
        </Button>

        <Tag
          className={order.fahuo ? 'tag-shipped' : 'tag-pending'}
          style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20 }}
        >
          {order.fahuo ? '✓ 已发货' : '○ 进行中'}
        </Tag>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: 20, alignItems: 'start' }}>
        {/* ===== 左侧：基本信息 ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            {/* 基本信息 - 双栏布局 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px' }}>
              <InfoRow label="订单编号" value={order.ddbh || '-'} />
              <InfoRow label="生成日期" value={order.prouddate ? new Date(order.prouddate).toLocaleDateString('zh-CN') : '-'} />
              <InfoRow label="交货日期" value={order.overdate ? new Date(order.overdate).toLocaleDateString('zh-CN') : '-'} />
              <InfoRow label="制单人" value={order.zhidan || '-'} />
              <InfoRow label="业务员" value={order.ywy || '-'} />
              <InfoRow label="订单类型" value={order.sclcClass === 2 ? '印刷单' : order.sclcClass === 3 ? '客户印' : order.sclcClass === 1 ? '纸盒单' : order.sclcClass === 4 ? '模切单' : order.sclcClass === 5 || order.sclcClass === 6 ? '印面单' : '-'} />
              <InfoRow label="客户公司" value={order.company || '-'} />
              <InfoRow label="委印单位" value={order.company || '-'} />
              <InfoRow label="发货单位" value={order.fahuodanwei || '-'} />
              <InfoRow label="款号" value={order.kuanhao || '-'} />
              <InfoRow label="印件编号" value={order.yjbhao || '-'} />
              <InfoRow label="产品规格" value={order.cpgg || '-'} />
              <InfoRow label="印刷数量" value={order.shuliang != null ? Number(order.shuliang).toLocaleString() : '-'} />
              <InfoRow label="拼数" value={order.pingshu || '-'} />
              {/* YS/YM 专用字段 */}
              {(productType === 'YS' || productType === 'YM') && <>
                <InfoRow label="印刷色数" value={order.ylzd || '-'} />
                <InfoRow label="成品尺寸" value={order.klcc || '-'} />
                <InfoRow label="开数" value={order.kaishu || '-'} />
                <InfoRow label="需开数量" value={order.xukaisl != null ? Number(order.xukaisl).toLocaleString() : '-'} />
                <InfoRow label="补充数量" value={order.bcsl != null ? Number(order.bcsl).toLocaleString() : '-'} />
                <InfoRow label="实印大张" value={order.sydazhang != null ? Number(order.sydazhang).toLocaleString() : '-'} />
                <InfoRow label="单价(元/张)" value={order.danjia != null ? Number(order.danjia).toFixed(4) : '-'} />
                <InfoRow label="实印金额" value={order.syMoney != null ? Number(order.syMoney).toFixed(2) : '-'} />
                <InfoRow label="订单总价" value={order.yszj != null ? Number(order.yszj).toFixed(2) : '-'} />
                <InfoRow label="客户要求" value={order.klyaoqiu || '-'} />
                <InfoRow label="印件要求" value={order.jyyaoqiu || '-'} />
                <InfoRow label="工艺要求" value={order.gyyq || '-'} />
                <InfoRow label="品名/货号" value={order.proudnumber || '-'} />
                <InfoRow label="来单日期" value={order.lldate ? new Date(order.lldate).toLocaleDateString('zh-CN') : '-'} />
              </>}
              {/* ZM 专用字段 */}
              {productType === 'ZM' && <>
                <InfoRow label="花号" value={order.huahao || '-'} />
                <InfoRow label="产品编号" value={order.proudnumber || '-'} />
                <InfoRow label="产品版别" value={order.proudbanbie || '-'} />
                <InfoRow label="纬数" value={order.weidu || '-'} />
                <InfoRow label="宽度" value={order.kuandu || '-'} />
                <InfoRow label="棵台数" value={order.kts || '-'} />
                <InfoRow label="长度" value={order.changdu || '-'} />
                <InfoRow label="花长" value={order.huachang || '-'} />
                <InfoRow label="基价" value={order.jijia != null ? Number(order.jijia).toFixed(4) : '-'} />
                <InfoRow label="加工费" value={order.jiagongfei || '-'} />
                <InfoRow label="缩件记录" value={order.soujianjl || '-'} />
                <InfoRow label="发货时间" value={order.sxdate ? new Date(order.sxdate).toLocaleDateString('zh-CN') : '-'} />
              </>}
              {/* DS 专用字段 */}
              {productType === 'DS' && <>
                <InfoRow label="单价" value={order.jiage != null ? Number(order.jiage).toFixed(2) : '-'} />
                <InfoRow label="发货人" value={order.fhr || '-'} />
                <InfoRow label="发货单位" value={order.fhdw || '-'} />
                <InfoRow label="发货日期" value={order.fhdate ? new Date(order.fhdate).toLocaleDateString('zh-CN') : '-'} />
              </>}
              {/* 共同字段 */}
              <InfoRow label="加工费" value={order.jiagongfei || '-'} />
              <InfoRow label="外发" value={order.waifa ? '是' : '否'} />
              <InfoRow label="备注" value={order.beizhuYS || order.beizhu || '-'} style={{ gridColumn: '1 / -1' }} />
            </div>
          </Card>

          {/* 统计卡片 */}
          <Card style={{ borderRadius: 12, background: `linear-gradient(135deg, ${productColor}08 0%, ${productColor}15 100%)`, border: `1px solid ${productColor}30` }} styles={{ body: { padding: '20px' } }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: productColor, lineHeight: 1, fontFeatureSettings: '"tnum"' }}>
                {completedCount}/{totalCount}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, letterSpacing: 1 }}>已完成工序</div>
            </div>
          </Card>
        </div>

        {/* ===== 右侧：工序流水线 ===== */}
        <Card
          title={
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 4, height: 16, background: productColor, borderRadius: 2, display: 'inline-block' }} />
              工序进度
            </span>
          }
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 120, height: 6, background: 'var(--progress-bg)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: progressPercent === 100
                    ? 'var(--success)'
                    : `linear-gradient(90deg, ${productColor}, ${productColor}aa)`,
                  borderRadius: 3,
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </div>
              <Text style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 40 }}>{Math.round(progressPercent)}%</Text>
            </div>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: '24px 24px 16px' } }}
        >
          {/* 流水线进度条 */}
          <div style={{ position: 'relative', marginBottom: 32 }}>
            {/* 背景线 */}
            <div style={{
              position: 'absolute',
              top: 20,
              left: 0,
              right: 0,
              height: 4,
              background: 'var(--progress-bg)',
              borderRadius: 2,
            }} />
            {/* 进度线 */}
            <div style={{
              position: 'absolute',
              top: 20,
              left: 0,
              width: `calc(${progressPercent}% - ${completedCount > 0 ? 0 : 0}px)`,
              maxWidth: 'calc(100% - 40px)',
              height: 4,
              background: progressPercent === 100
                ? 'var(--success)'
                : `linear-gradient(90deg, ${productColor}, ${productColor}88)`,
              borderRadius: 2,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />

            {/* 节点 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
            }}>
              {steps.map((s, i) => {
                const isCompleted = s.completed;
                const isCurrent = !isCompleted && (i === 0 || steps[i - 1]?.completed);
                const nodeColor = isCompleted ? 'var(--success)' : isCurrent ? productColor : '#cbd5e1';
                const isLast = i === steps.length - 1;

                return (
                  <Tooltip
                    key={s.field}
                    title={
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600 }}>{s.step}</div>
                        {s.time ? (
                          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                            {new Date(s.time).toLocaleString('zh-CN')}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>等待中</div>
                        )}
                      </div>
                    }
                    placement="top"
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      flex: isLast ? '0 0 auto' : '1',
                      minWidth: isLast ? 40 : 0,
                    }}>
                      {/* 节点圆 */}
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: isCompleted
                          ? 'var(--success)'
                          : isCurrent
                            ? productColor
                            : '#fff',
                        border: `3px solid ${nodeColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        boxShadow: isCompleted || isCurrent
                          ? `0 0 0 4px ${nodeColor}22`
                          : 'none',
                        zIndex: 1,
                      }}>
                        {isCompleted ? (
                          <CheckOutlined style={{ color: '#fff', fontSize: 14, fontWeight: 700 }} />
                        ) : (
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: isCurrent ? '#fff' : '#cbd5e1',
                          }} />
                        )}
                      </div>

                      {/* 工序名称 */}
                      <div style={{
                        marginTop: 10,
                        fontSize: 11,
                        fontWeight: isCompleted || isCurrent ? 600 : 400,
                        color: isCompleted
                          ? 'var(--success)'
                          : isCurrent
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        maxWidth: 70,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {s.step}
                      </div>

                      {/* 完成时间 */}
                      {s.time && (
                        <div style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                        }}>
                          {new Date(s.time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* 操作按钮行 */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            {steps.map((s) => (
              <Popconfirm
                key={s.field}
                title={s.completed ? `撤销「${s.step}」？` : `确认完成「${s.step}」？`}
                onConfirm={() => handleStep(s.field, !s.completed)}
                okText="确认"
                cancelText="取消"
                disabled={updating}
              >
                <Button
                  size="small"
                  icon={s.completed ? <UndoOutlined /> : <CheckOutlined />}
                  loading={updating}
                  style={{
                    borderRadius: 6,
                    fontSize: 12,
                    ...(s.completed
                      ? {
                          color: 'var(--success)',
                          borderColor: 'var(--success)',
                          background: '#f0fdf4',
                        }
                      : {
                          color: productColor,
                          borderColor: productColor,
                          background: `${productColor}0a`,
                        }),
                  }}
                >
                  {s.completed ? `撤销 ${s.step}` : `完成 ${s.step}`}
                </Button>
              </Popconfirm>
            ))}
          </div>
        </Card>

        {/* ZM 色卡明细 + 尺码明细（仅 ZM 显示） */}
        {productType === 'ZM' && (
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 色卡明细 */}
            <Card
              title={
                <span style={{ fontSize: 13, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎨 色卡明细
                </span>
              }
              style={{ borderRadius: 12, border: '1px solid #a7f3d0' }}
              styles={{ body: { padding: '14px 16px' } }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['序', '颜色', '色号', '备注'].map((h, i) => (
                      <th key={i} style={{ padding: '4px 8px', background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0', textAlign: 'center', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(idx => (
                    <tr key={idx}>
                      <td style={{ padding: '3px 6px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 11 }}>{idx}</td>
                      <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: 12 }}>{order[`qw${idx}`] || '-'}</td>
                      <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: 12 }}>{order[`ss${idx}`] || '-'}</td>
                      <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8' }}>{order[`bz${idx}`] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* 尺码明细 */}
            <Card
              title={
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📐 尺码明细
                </span>
              }
              style={{ borderRadius: 12, border: '1px solid #bfdbfe' }}
              styles={{ body: { padding: '14px 16px' } }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['序', '数量（sl）', '列数（lieshu）'].map((h, i) => (
                      <th key={i} style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', textAlign: 'center', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(idx => (
                    <tr key={idx}>
                      <td style={{ padding: '3px 6px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 11 }}>{idx}</td>
                      <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: 12 }}>{order[`sl${idx}`] || '-'}</td>
                      <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: 12 }}>{order[`lieshu${idx}`] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value, style }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, ...style }}>
      <Text style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</Text>
    </div>
  );
}
