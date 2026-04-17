# 印刷订单管理系统 - 数据库 Schema 文档

> 数据库：SQL Server 2008（10.147.19.187），端口 1433
> 测试库：`yinshua_test`，生产库：`yinshua`
> 最后验证：2026-04-07（直接查询 INFORMATION_SCHEMA）

---

## 一、订单主表（四条产品线）

| 产品线 | 表名 | 主键 | 行数 | 订单号前缀 |
|--------|------|------|------|-----------|
| 印刷 | `YS` | DD_id (int) | - | 代码生成 |
| 印刷面 | `YM` | DD_id (int) | - | 代码生成 |
| 纸盒 | `ZM` | DD_id (bigint) | - | 代码生成 |
| 模切 | `DS` | DD_id (int) | - | 代码生成 |

---

## 二、通用字段（所有产品线）

| 中文字段 | 数据库字段 | 类型 | 说明 |
|----------|-----------|------|------|
| 订单编号 | `ddbh` | nvarchar(14) | 格式：yymmdd+4位序号 |
| 客户公司 | `company` | nvarchar(50) | |
| 接单日期 | `prouddate` | smalldatetime | |
| 交货日期 | `overdate` | smalldatetime | |
| 数量 | `shuliang` | nvarchar(10) | YS/YM/DS：nvarchar；ZM：int |
| 业务员ID | `ywy` | smallint | 关联 UserInfo.UserID |
| 制单人 | `zhidan` | nvarchar(10) | |
| 订单状态 | `ZT` | tinyint | 0=进行中，1=完成 |
| 业务状态码 | `BZ` | tinyint | 老系统字段 |
| 状态部门 | `BZBM` | nvarchar(2) | A/B/C/D |
| 发货标记 | `fahuo` | bit | 0/null=未发货，1=已发货 |
| 发货单位 | `fahuodanwei` | nvarchar(50) | |

---

## 三、JHK 流水线工序字段

> 注意：`jhkdd` 是 tinyint（0/1/2），不是 bit！其他步骤是 bit。
> `jhkdd` 无对应 Time 字段（第一步不需要时间戳）。

| 工序 | 状态字段 | 类型 | 时间字段 | 说明 |
|------|---------|------|---------|------|
| 接单 | `jhkddClass` | tinyint | **无** | 0/1/2 状态 |
| 打印/晒版 | `jhkprint` | bit | `jhkprintTime` | |
| 车间接收 | `sccjjs` | bit | `sccjjsTime` | |
| 预领料 | `sccjyl` | bit | `sccjylTime` | |
| 电脑制版 | `sccjdn` | bit | `sccjdnTime` | |
| 生产 | `sccjsc` | bit | `sccjscTime` | |
| 完成 | `sccjwc` | bit | `sccjwcTime` | |
| 汇总 | `hzljs` | bit | `hzljsTime` | |
| 发货 | `fahuo` | bit | `fahuoTime` | |

**进度判断逻辑：** `jhkddClass === 1` 且其他 bit 字段 = 1 表示已完成

---

## 四、YS 印刷（吊牌）完整字段

### 4.1 通用字段（见第二章）

### 4.2 YS 专用字段

| 中文字段 | 数据库字段 | 类型 | 说明 |
|----------|-----------|------|------|
| 料号 | `yjbhao` | nvarchar(30) | |
| 款号 | `kuanhao` | nvarchar(50) | |
| 产品规格 | `cpgg` | nvarchar(30) | |
| 品名 | `pingshu` | nvarchar(10) | |
| 开料尺寸 | `klcc` | nvarchar(20) | |
| 开数 | `kaishu` | nvarchar(10) | |
| 印类/联数 | `ylzd` | nvarchar(50) | |
| 需开数量 | `xukaisl` | nvarchar(10) | |
| 损耗数量 | `bcsl` | nvarchar(10) | |
| 开料要求 | `klyaoqiu` | nvarchar(50) | |
| 经验要求 | `jyyaoqiu` | nvarchar(50) | |
| 整烫 | `zhengli` | nvarchar(150) | |
| 大张数 | `sydazhang` | int | |
| 单价 | `danjia` | money | |
| 大张金额 | `syMoney` | money | |
| 总价 | `yszj` | money | **订单总价** |
| 印刷备注 | `beizhuYS` | nvarchar(50) | |
| 加工费 | `jiagongfei` | nvarchar(50) | |
| 外发 | `waifa` | int | 0/1 |
| 外发打印 | `waifaprint` | nchar(10) | |
| 文件 | `UpFile` | nvarchar(30) | |

### 4.3 YS 印刷色数明细（核心！）

**结构说明：**
- `yssl1-9`：第1~9色的**色数**（int）
- `ysdw1-9`：第1~9色的**颜色名**（nvarchar(2)，如"黑"、"红"、"蓝"）
- `ysyl1-9`：第1~9色的**印数**（int）
- `yss20`：UV色**色数**（int）
- `ysdw10`：UV**颜色名**（nchar(2)）
- `ysy20`：UV**印数**（int）
- `jine1-9`：第1~9色**金额**（money）
- `jine10`：UV**金额**（money）

| 色序 | 色数字段 | 颜色名字段 | 印数字段 | 金额字段 |
|------|---------|-----------|---------|---------|
| 色1 | `yssl1` | `ysdw1` | `ysyl1` | `jine1` |
| 色2 | `yssl2` | `ysdw2` | `ysyl2` | `jine2` |
| 色3 | `yssl3` | `ysdw3` | `ysyl3` | `jine3` |
| 色4 | `yssl4` | `ysdw4` | `ysyl4` | `jine4` |
| 色5 | `yssl5` | `ysdw5` | `ysyl5` | `jine5` |
| 色6 | `yssl6` | `ysdw6` | `ysyl6` | `jine6` |
| 色7 | `yssl7` | `ysdw7` | `ysyl7` | `jine7` |
| 色8 | `yssl8` | `ysdw8` | `ysyl8` | `jine8` |
| 色9 | `yssl9` | `ysdw9` | `ysyl9` | `jine9` |
| UV | `yss20` | `ysdw10` | `ysy20` | `jine10` |

**打印示例：**
| 色序 | 颜色 | 色数 | 金额 |
|------|------|------|------|
| 色1 | 黑 | 2 | 150.00 |
| 色2 | 红 | 1 | 75.00 |

---

## 五、YM 印刷面（印唛）完整字段

### 5.1 通用字段（见第二章）

### 5.2 YM 专用字段

| 中文字段 | 数据库字段 | 类型 | 说明 |
|----------|-----------|------|------|
| 料号 | `yjbhao` | nvarchar(30) | |
| 产品规格 | `cpgg` | nvarchar(30) | |
| 品名 | `pingshu` | nvarchar(10) | |
| 印类/联数 | `ylzd` | nvarchar(20) | |
| 大张数 | `sydazhang` | bigint | |
| 单价 | `danjia` | money | |
| 大张金额 | `syMoney` | money | |
| 经验要求 | `jyyaoqiu` | nvarchar(50) | |
| 整烫 | `zhengli` | nvarchar(150) | |
| 工艺要求 | `gyyq` | nvarchar(100) | |
| 品名 | `proudnumber` | nvarchar(30) | |
| 发料日期 | `lldate` | smalldatetime | |
| 备注 | `beizhuYM` | nvarchar(50) | |
| 款号 | `kuanhao` | nvarchar(50) | |
| 加工费 | `jiagongfei` | nvarchar(50) | |
| 外发 | `waifa` | tinyint | 0/1 |
| 外发打印 | `waifaprint` | nchar(10) | |

### 5.3 YM 色数字段

与 YS **完全相同结构**：`yssl1-9 / ysdw1-9 / ysyl1-9 / yss20 / ysdw10 / ysy20 / jine1-9 / jine10`

---

## 六、ZM 纸盒（织唛）完整字段

### 6.1 通用字段（见第二章）

### 6.2 ZM 专用字段（不在其他表出现）

| 中文字段 | 数据库字段 | 类型 | 说明 |
|----------|-----------|------|------|
| 产品编号 | `proudnumber` | nvarchar(30) | |
| 花号 | `huahao` | nvarchar(30) | YS/YM的yjbhao对应对应ZM的huahao |
| 刺绣号 | `cidiehao` | nvarchar(30) | |
| 款号 | `kuanhao` | nvarchar(20) | |
| 成品宽 | `kuandu` | nvarchar(10) | |
| 成品长 | `changdu` | nvarchar(10) | |
| 花长 | `huachang` | nvarchar(10) | |
| 纬度/纬度 | `weidu` | nvarchar(10) | |
| 成品尺寸 | `chenpingcc` | nvarchar(50) | |
| 加工费 | `jiagongfei` | nvarchar(50) | |
| 工艺要求 | `gyyq` | nvarchar(100) | |
| 基价 | `jijia` | nvarchar(50) | 注意：ZM用jijia，不是danjia |
| 送检记录 | `soujianjl` | nvarchar(50) | |
| 整烫 | `zhengli` | nvarchar(150) | |
| 发货单位 | `fhdw` | nvarchar(50) | |
| 发货日期 | `fhdate` | smalldatetime | |
| 发货人 | `fhr` | nvarchar(10) | |
| 发货单单位 | `dhdw` | nvarchar(1) | |
| 纸盒质检 | `zm_zhijian` | ntext | |
| 首件数量 | `allcount` | nvarchar(10) | |
| 送货日期 | `sxdate` | nvarchar(10) | |
| 品种别 | `proudbanbie` | nvarchar(50) | |
| 外发 | `waifa` | int | 0/1 |

### 6.3 ZM 色卡明细（三组 × 12格）

| 字段组 | 用途 | 字段 |
|--------|------|------|
| QW色卡 | QW组颜色 | `qw1` ~ `qw12` (nvarchar20) |
| SS色卡 | SS组颜色 | `ss1` ~ `ss12` (nvarchar20) |
| BZ备注 | BZ组备注 | `bz1` ~ `bz12` (nvarchar30) |

### 6.4 ZM 尺码明细（双列 × 10行）

| 字段组 | 用途 | 字段 |
|--------|------|------|
| 尺码 | 尺码规格 | `sl1` ~ `sl10` (nvarchar6) |
| 件数 | 对应件数 | `lieshu1` ~ `lieshu10` (nvarchar15) |

### 6.5 ZM 尺寸码（cmh1-10）

| 字段 | 类型 | 说明 |
|------|------|------|
| `cmh1` ~ `cmh10` | nvarchar(15) | 尺寸码序列 |

---

## 七、DS 模切（丝网印）完整字段

### 7.1 通用字段（见第二章）

### 7.2 DS 专用字段

| 中文字段 | 数据库字段 | 类型 | 说明 |
|----------|-----------|------|------|
| 料号 | `yjbhao` | nvarchar(30) | |
| 单价 | `jiage` | nvarchar(16) | |
| 整烫 | `zhengli` | nvarchar(20) | |
| 发货单位 | `fhdw` | nvarchar(50) | |
| 发货日期 | `fhdate` | smalldatetime | |
| 发货人 | `fhr` | nvarchar(10) | |
| 款号 | `kuanhao` | nvarchar(50) | |
| 加工费 | `jiagongfei` | nvarchar(50) | |
| 发货单单位 | `dhdw` | nvarchar(1) | |
| 外发 | `waifa` | int | 0/1 |

**注意：DS 表没有 hzl 工艺字段，没有 jiagongfei 以外的金额字段**

---

## 八、发货单表（FaHuoDan）

> 表名：`FaHuoDan`（生产库 `yinshua`，`yinshua_test` 中不存在该表）

| 中文字段 | 数据库字段 | 类型 | 说明 |
|----------|-----------|------|------|
| ID | `ID` | int | **主键，自增** |
| 客户 | `company` | nvarchar(50) | |
| 录入时间 | `RegTime` | smalldatetime | |
| 快递公司 | `kdgs` | nvarchar(20) | |
| 快递单号 | `kdhao` | nvarchar(30) | |
| 发货人 | `fhr` | nvarchar(10) | |
| 业务员ID | `ywy` | smallint | |

**明细行（每单最多9行）：**
| 字段 | 类型 | 说明 |
|------|------|------|
| `pingming1-9` | nvarchar(15) | 品名 |
| `khao1-9` | nvarchar(30) | 款号 |
| `dnbh1-9` | nvarchar(12) | 订单编号（内部） |
| `shuliang1-9` | nvarchar(15) | 数量 |
| `beizhu1-9` | nvarchar(20) | 备注 |

---

## 九、用户表（UserInfo）

| 字段 | 类型 | 说明 |
|------|------|------|
| `UserID` | smallint | 主键 |
| `UserName` | nvarchar(10) | 登录用户名 |
| `PassWord` | nvarchar(20) | 密码（MD5特殊截断版） |
| `Department` | nvarchar(2) | S=系统/A=销售/B=车间/C=车间 |
| `Dep_cj` | nvarchar(15) | 车间名称 |
| `IsDel` | bit | 删除标记 |

---

## 十、 GX 工序工艺配置表（独立表）

> 这些字段存储在 **YSGX / YMGX / ZMGX / DSGX** 表中，不在主订单表里。
> 工艺配置通过 DD_id 与主订单关联。

**YSGX**（YS 工艺配置）：
- `hzlA1-6`：贴膜选项
- `hzlB3-15`：常规工艺选项
- `hzlC1/3-10`：特殊工艺选项

**YMGX**（YM 工艺配置）：
- `hzl1-7`：工序（晒版→印刷→过油→磨光→烫金→压线→打包）

**ZMGX**（ZM 工艺配置）：
- `hzl1-16`：工序（开料→印刷→...→覆膜→打包）

**DSGX**（DS 工艺配置）：
- `hzl1-2`：工序（设计→生产）

---

## 十一、字段速查

### YS/YM 颜色字段
```
yssl1~9 (int)     → 各色色数（数量）
ysdw1~9 (nv2)     → 各色颜色名（如 黑、红、蓝）
ysyl1~9 (int)     → 各色印数
yss20 (int)       → UV色数
ysdw10 (nchar2)  → UV颜色名
ysy20 (int)       → UV印数
jine1~9 (money)  → 各色金额
jine10 (money)    → UV金额
yszj (money)      → 订单总价
```

### ZM 色卡
```
qw1~12   → QW色卡颜色 (nvarchar20)
ss1~12   → SS色卡颜色 (nvarchar20)
bz1~12   → BZ备注    (nvarchar30)
sl1~10   → 尺码      (nvarchar6)
lieshu1~10 → 件数    (nvarchar15)
cmh1~10  → 尺寸码    (nvarchar15)
```

### DS 金额
```
jiage     → 单价 (nvarchar16)
jiagongfei → 加工费 (nvarchar50)
```

---

*文档版本：v1.1（2026-04-07），直接查询数据库 INFORMATION_SCHEMA 验证，建议以数据库实际结构为准。*

---

## 十二、发货单表（FaHuoDan）- 生产库确认

> 数据库：生产库 `yinshua`，表名 `FaHuoDan`（`yinshua_test` 中不存在）

| 中文字段 | 数据库字段 | 类型 | 说明 |
|----------|-----------|------|------|
| ID | `ID` | int | **主键，自增** |
| 客户 | `company` | nvarchar(50) | |
| 录入时间 | `RegTime` | smalldatetime | |
| 快递公司 | `kdgs` | nvarchar(20) | |
| 快递单号 | `kdhao` | nvarchar(30) | |
| 发货人 | `fhr` | nvarchar(10) | |
| 业务员ID | `ywy` | smallint | |

**明细行（每单最多9行）：**
| 字段 | 类型 | 说明 |
|------|------|------|
| `pingming1-9` | nvarchar(15) | 品名 |
| `khao1-9` | nvarchar(30) | 款号 |
| `dnbh1-9` | nvarchar(12) | 订单编号 |
| `shuliang1-9` | nvarchar(15) | 数量 |
| `beizhu1-9` | nvarchar(20) | 备注 |

---

## 十三、问题反馈表（wenti）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 主键 |
| `username` | nvarchar(10) | 提交人 |
| `wenti` | text | 问题内容 |
| `datetime` | datetime | 提交时间 |

---

## 十四、花号表（HuaHao）

| 字段 | 类型 |
|------|------|
| `huahao` | nvarchar |
| `weidu` | nvarchar |
| `kts` | nvarchar |

---

## 十五、生产库完整表清单

```
DS, DSGX, dtproperties, FaHuoDan, HuaHao,
UserInfo, wenti, YM, YMGX, YS, YSGX, ZM, ZMGX
```

注意：`yinshua_test` 库与生产库 `yinshua` 结构和表数量均有差异，开发测试请以生产库为准。

