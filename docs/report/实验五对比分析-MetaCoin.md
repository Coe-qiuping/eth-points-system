# 实验报告五分析：文档里的 MetaCoin 项目 vs 本项目

> 素材来源：`F:\需求分析\实验报告五（格式）.doc`（老师下发的实验报告格式模板）
> 用途：直接支撑课程报告要求 (1)「技术解析：对比本项目合约与 MetaCoin 的异同」，
> 以及实验报告五正文的第 1～3 部分。

---

## 一、这份文档是什么（先搞清楚再动笔）

这份 `.doc` 是**老师下发的实验报告格式模板**，结构如下：

| 部分 | 内容 |
|---|---|
| 封面 | 课程名称：区块链技术；实验项目名称：**MetaCoin 以太坊通证系统**；专业：大数据管理与应用；任课教师：张婧炜；实验日期：2026 年 11 月 19 日 |
| 评分表 | 8×5 表格（优/良/中/评分，教师填写） |
| 一、实验目的 | Truffle 安装/编译/部署/测试；Ganache 私链配置；MetaMask 网络添加与私钥导入 |
| 二、实验内容 | MetaCoin 项目介绍；Truffle + Ganache + MetaMask 技术栈协作关系；ERC-20 核心接口 |
| 三、实验原理 | "合约编写 → 编译 → 测试 → 部署 → 钱包交互"完整闭环；私钥安全注意事项 |
| 四、实验步骤 | 4.1 环境准备 → 4.2 Ganache 配置 → 4.3 合约编译测试部署 → 4.4 MetaMask 导入 → 4.5 前端交互与转账验证（含步骤截图） |
| 五、实验环境 | 截图（工具与版本） |
| 六、实验结果 | **空白 —— 需要我们自己填** |

**两个关键提醒：**

1. **实验报告五要按这个结构写**，不是我们之前规划的 10 章自由结构。封面、评分表原样保留，
   正文按「一、实验目的 / 二、实验内容 / 三、实验原理 / 四、实验步骤 / 五、实验环境 / 六、实验结果」六部分组织。
2. 文档封面日期写的是 **2026 年 11 月 19 日（今天）**，时间紧，正文可以直接以本项目
   （eth-points-system）的实际产物填充，把 MetaCoin 相关内容作为对比素材。

---

## 二、文档里的项目：MetaCoin 是什么

按文档描述拆解：

- **定位**：Truffle 官方提供的教学用代币示例项目
- **核心逻辑**：部署时向合约创建者账户**预铸 10000 MetaCoin**（数量写死在构造函数里），
  账户之间可以互相转账
- **技术栈分工**：
  - Truffle：合约编译、迁移部署（migration）、测试
  - Ganache：本地以太坊 JSON-RPC 节点 + 预置测试账户（GUI 图形界面）
  - MetaMask：浏览器钱包，通过**明文私钥导入** Ganache 账户
- **要求掌握的 ERC-20 接口**：`totalSupply` / `balanceOf` / `transfer` / `approve` /
  `transferFrom` / `allowance`，以及 `Transfer` / `Approval` 事件
- **实验闭环**：合约编写 → 编译 → 测试 → 部署 → 钱包交互
- **安全提醒（文档原文）**：明文私钥导入 MetaMask 仅适用于本地测试环境，生产环境私钥
  绝不能出现在前端代码或版本控制系统中

---

## 三、对比总表（报告第 1 部分「技术解析」的骨架）

| 维度 | MetaCoin（文档项目） | 本项目 eth-points-system |
|---|---|---|
| **代币标准** | 教学示例，自维护 `balances` mapping，提供 `getBalance()` / `sendCoin()`，**并未完整实现 ERC-20 接口**（文档要求"理解 ERC-20 接口"，但 MetaCoin 合约本身没有 `approve` / `transferFrom`） | 继承 OpenZeppelin **ERC20**，完整实现全部标准接口，任何钱包/交易所可直接识别 |
| **发行方式** | 构造函数一次性预挖 10000，**数量写死、无权限控制**，部署后无法再发行 | `issuer` 白名单 + `issue()` 单笔发行 + `batchIssue()` 批量空投，每次发行必须携带 `reason` 上链留痕 |
| **转账** | `sendCoin(amount, to)` 自定义函数 | 标准 `transfer()` + `approve()` / `transferFrom()` 授权体系 |
| **消耗 / 兑换** | **没有**。代币只能转来转去，流通量永不减少 | `PointsStore` 商城合约：商品上架、库存管理、`redeem()` 兑换，兑换时调用 `consume()` **真销毁**积分 |
| **权限控制** | 无。任何人只能操作自己的余额 | 三层最小权限：`onlyOwner`（管配置，**不能动用户余额**）→ `onlyIssuer`（管增发）→ `consume` 仅限被绑定的商城合约且需用户先 `approve` |
| **事件设计** | 自定义 `Sent` 事件（非标准） | 标准 `Transfer` / `Approval` + 业务事件 `PointsIssued` / `PointsConsumed` / `Redeemed`，全部带索引参数可检索 |
| **精度语义** | 无 decimals 概念，按 uint 默认处理 | `decimals() = 0`，积分是业务整数，避免小数误差 |
| **风控** | 无 | `Pausable` 熔断：异常时 owner 可暂停发行与兑换 |
| **总量自证** | 无法验证平台有没有偷偷发币 | `totalIssued - totalConsumed ≡ 链上流通量`，任何人可独立审计 |
| **单元测试** | Truffle 自带 2 个示例测试 | Hardhat 测试 10 条（权限 / 转账 / 授权 / 兑换 / 库存 / 熔断 / 总量守恒） |
| **前端** | Truffle 自带的 jQuery + web3.js 示例页 | React 18 + Vite + ethers v6：余额卡片、转账、商城、四类事件合并的溯源时间线 |
| **工具链** | Truffle + Ganache（**均已停止积极维护**，Ganache 已被官方标记弃用） | Hardhat 2.28（当前事实标准，活跃维护）+ 内置 Hardhat Network |

**一句话结论（可直接写进报告）：**

> MetaCoin 的定位是"让初学者跑通合约的编译、部署与转账闭环"，因此它刻意简化了权限、
> 标准与业务逻辑；本项目在 MetaCoin 的闭环之上，补齐了它缺失的三件事——**标准化的
> ERC-20 实现、分级权限控制、以及"消耗/兑换"这一业务闭环**，并用完整的测试与事件体系
> 保证发行与销毁全过程可审计。

---

## 四、对比展开：三个最有分析价值的差异（报告重点段落素材）

### 4.1 发行权限：从"写死的 10000"到"可治理的发行体系"

MetaCoin 的发行逻辑（伪代码）：

```solidity
constructor() {
    balances[msg.sender] = 10000;   // 部署者拿走全部，永远无法再发行
}
```

本项目的发行逻辑：

```solidity
function issue(address to, uint256 amount, string calldata reason)
    external onlyIssuer whenNotPaused
{
    _mint(to, amount);
    totalIssued += amount;
    emit PointsIssued(to, amount, reason);   // 发行原因永久上链
}
```

分析点：**"谁能发、发多少、为什么发"三个问题在 MetaCoin 里都不存在**，
在本项目里分别由 `isIssuer` 白名单、`amount` 参数、`reason` 事件回答。
这就是"教学示例"与"可运营系统"的差距。

### 4.2 消耗闭环：MetaCoin 根本没有"花积分"的概念

MetaCoin 的代币生命周期只有"生（预挖）"和"转"，**没有"死"**。
本项目引入 `PointsStore` 后形成了完整的四阶段生命周期：

```
发行 issue()     → Transfer(0x0 → user) + PointsIssued
转账 transfer()  → Transfer(user → user)
授权 approve()   → Approval
兑换 redeem()    → Transfer(user → 0x0) + PointsConsumed + Redeemed
```

关键设计：用户先 `approve(store, price)` 授权，商城再调 `consume()` 销毁——
**商城合约永远无法划走用户未授权的积分**，这是 ERC-20 `allowance` 模型的实际应用，
也正好呼应文档要求掌握的 `approve` / `transferFrom` / `allowance` 三个接口。

### 4.3 私钥管理：文档的警告 vs 本项目的两种模式

文档特别强调"明文私钥仅限本地测试"。本项目的处理：

- **演示模式**：`JsonRpcProvider` 直连本地链，使用 Hardhat 预置的已解锁账户，
  前端**完全接触不到私钥**（比 MetaMask 导明文私钥更安全）
- **钱包模式**：`BrowserProvider(window.ethereum)` 走 MetaMask 签名，
  私钥始终留在钱包内
- 生产环境则应使用 KMS / 托管钱包，前端永不持有私钥——与文档的警告完全一致

---

## 五、实验报告五的填写建议（按老师模板六部分）

| 模板部分 | 本项目对应内容 |
|---|---|
| 一、实验目的 | 掌握 Hardhat 框架的编译/测试/部署；理解 ERC-20 授权模型；掌握积分发行权限控制与兑换销毁设计；掌握 React + ethers 前端与合约交互 |
| 二、实验内容 | 本项目功能清单（发行/转账/兑换/溯源）+ 与 MetaCoin 的差异（引用本文第三、四节） |
| 三、实验原理 | ERC-20 标准、`allowance` 授权模型、事件索引、`totalIssued - totalConsumed` 总量守恒 |
| 四、实验步骤 | 4.1 环境准备（Node/Hardhat）→ 4.2 本地链启动 → 4.3 合约编译测试部署（贴 `npm test` 与 `deploy` 输出）→ 4.4 前端连接 → 4.5 发行/转账/兑换操作截图 |
| 五、实验环境 | Windows 11 / Node v22 / Hardhat 2.28 / Solidity 0.8.24 / OpenZeppelin 5.0.2 / React 18 / Vite 5 / ethers 6.15 / VS Code + Solidity 插件 |
| 六、实验结果 | 四个界面截图 + 测试全绿截图 + 交易哈希与区块号 |

**注意**：模板里 MetaCoin 的实验步骤（Ganache、MetaMask 导私钥）是老师给的示例，
我们写报告时应替换为本项目的对应步骤（Hardhat node、前端直连），
但**保留"钱包交互"环节**——可以用前端的 MetaMask 模式截图，正好呼应文档要求。

---

## 六、可直接引用的"异同小结"（报告收尾用）

**相同点：**
1. 同属以太坊生态，使用 Solidity 编写、运行在 EVM 上
2. 都实现了"部署 → 查询余额 → 账户间转账"的基础闭环
3. 都依赖本地开发链（Ganache / Hardhat Network）与测试账户体系
4. 都强调私钥安全边界（本地测试 vs 生产环境）

**不同点：**
1. **标准性**：MetaCoin 是非标准教学合约；本项目是完整 ERC-20
2. **权限**：MetaCoin 无权限设计；本项目三层最小权限 + 熔断
3. **业务闭环**：MetaCoin 只有发行与转账；本项目补齐消耗/兑换，形成完整生命周期
4. **可审计性**：MetaCoin 无法验证超发；本项目总量守恒可独立验证
5. **工具链**：Truffle/Ganache 已停止维护；Hardhat 是当前事实标准
6. **测试**：MetaCoin 附带 2 个示例测试；本项目 10 条针对权限与业务边界的用例
