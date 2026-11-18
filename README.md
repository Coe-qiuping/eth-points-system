# 以太坊通用积分系统（eth-points-system）

基于以太坊智能合约的积分体系：平台方发行积分、用户之间转账、用户支付积分兑换虚拟商品（优惠券等），前端实时展示余额与交易历史。

## 技术栈

- 合约：Solidity 0.8.24 + OpenZeppelin 5.0.2（ERC20 / Ownable / Pausable）
- 开发框架：Hardhat 2.28
- 前端：React 18 + Vite 5 + ethers v6
- 本地链：Hardhat Network（chainId 31337）

## 合约职责

| 合约 | 职责 | 关键函数 |
|---|---|---|
| `PointsToken.sol` | 积分代币（CPT，`decimals = 0`） | `issue` / `batchIssue`（发行）、`transfer`（转账）、`consume`（仅兑换合约可调用，直接销毁） |
| `PointsStore.sol` | 积分商城 | `createProduct` / `updateProduct`（上架）、`redeem`（兑换） |

## 权限模型

| 角色 | 权限 | 约束 |
|---|---|---|
| owner | 设置发行方、绑定兑换合约、商品上下架、暂停系统 | **不能直接修改用户余额** |
| issuer | 发行积分 | 只能增发，且必须带 `reason` 事件留痕 |
| 用户 | 转账、授权、兑换 | 不能发行，不能销毁他人积分 |
| PointsStore | 扣减并销毁用户积分 | 仅能扣用户已 `approve` 的额度 |

兑换采用 ERC20 标准授权模型：用户先 `approve(store, price)`，商城再 `consume` 扣减，避免合约任意划走用户资产。

## 从零跑起来（新成员必读）

### 0. 环境要求

| 需要 | 版本 | 检查命令 |
|---|---|---|
| Node.js | 18 以上（推荐 20 LTS / 22） | `node -v` |
| npm | 随 Node 自带 | `npm -v` |

**不需要** Docker、不需要 WSL、不需要装 MetaMask（前端默认直连本地链）。

### 1. 克隆并安装依赖

```bash
git clone https://github.com/Coe-qiuping/eth-points-system.git
cd eth-points-system
npm install
```

安装很慢时换国内源：

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

> `node_modules` 不在仓库里，**每个人必须自己装一次**。装完大约 400 多个包、300MB 左右。

### 2. 启动本地链（终端 A，保持运行）

```bash
npm run node
```

成功标志：

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
Accounts
========
Account #0: 0xf39Fd6... (10000 ETH)
...
Account #19: ...
```

**这个窗口不要关、不要按 Ctrl+C**，它就是你的"以太坊节点"。后面的操作全部另开一个终端。

### 3. 部署合约并初始化数据（终端 B）

```bash
npm run deploy
```

- 第一次会自动编译合约，Hardhat 需要下载 solc 0.8.24 编译器（约 30MB），等 1～2 分钟
- 成功标志：最后打印 `部署信息已写入 deployments.json`，并列出 3 个商品、5 个账户各 1000 分

### 4. 把地址同步到前端（终端 B）

```bash
npm run gen:config
```

这一步读取 `deployments.json`，生成 `frontend/src/contracts.json`。**跳过了这步，前端会提示"合约地址还是空的"。**

### 5. 启动前端（终端 B）

```bash
npm run dev
```

浏览器打开 **http://localhost:5175**

### 验收标准

页面上应该看到：

- 账户下拉框有 20 个账户（默认选中账户2）
- **我的积分：1000 CPT**、累计发行 5000、累计消耗 0、流通量 5000
- 积分商城出现 3 个商品
- 交易历史显示一条"发行 +1000"

三项都对，说明环境全部就绪，可以开始写代码。

### 日常启动（环境装好之后）

以后每次开发只需要两个终端：

```bash
# 终端 A
npm run node

# 终端 B（链起来之后）
npm run deploy && npm run gen:config && npm run dev
```

## 常见问题

| 现象 | 原因 | 解决 |
|---|---|---|
| `npm run node` 报 EADDRINUSE | 8545 端口被占（上次的链没关） | 关掉旧窗口，或 `netstat -ano \| findstr 8545` 找到 PID 后 kill |
| `npm run dev` 打开了 5176 端口 | 5175 被占 | 看终端实际输出的端口，用那个 |
| 页面提示"合约地址还是空的" | 没执行 `npm run deploy` 或没跑 `gen:config` | 按第 3、4 步补上 |
| 页面提示"连接失败" | 本地链没起，或窗口被关了 | 终端 A 重新 `npm run node` |
| `could not decode result data` | 链重启过，前端还拿着旧地址 | 重跑 `npm run deploy` + `npm run gen:config`，刷新页面 |
| `Cannot find module @esbuild/linux-x64` | 在 WSL 里跑了这个项目 | **必须用 Windows 终端**，`node_modules` 是 win32 平台的 |
| `npm install` 卡在 idealTree | 网络问题 | 换 npmmirror 源重试（见第 1 步） |
| 兑换时报 `ERC20InsufficientAllowance` | 忘记先 `approve` | 兑换必须两步：`approve` → `redeem` |

### 关于 `deployments.json`

部署脚本会在项目根目录生成 `deployments.json`（合约地址、测试账户等），该文件**不提交到仓库**，每人本地生成。

每次重启本地链，链上状态清空、合约地址会变，必须重新执行 `npm run deploy` 并重新 `npm run gen:config`。

## 目录结构

```
eth-points-system/
├── contracts/           # Solidity 合约
├── scripts/             # 部署与初始化脚本
├── test/                # Hardhat 单元测试
├── frontend/            # React 前端
├── hardhat.config.js
└── package.json
```

## 积分生命周期

```
发行 issue()          → Transfer(0x0 → user) + PointsIssued
转账 transfer()       → Transfer(user → user)
授权 approve()        → Approval
兑换 redeem()         → Transfer(user → 0x0) + PointsConsumed + Redeemed
```

每一次积分的「生」与「死」都对应一条 `Transfer` 事件（`from` 或 `to` 为零地址），
因此 `totalIssued - totalConsumed` 恒等于链上流通量，任何人可独立验证平台没有超发。

## 团队分工

| 成员 | 负责 |
|---|---|
| 组长 | 接口契约、架构图、报告统稿、答辩 |
| 成员 2 | 合约测试、部署脚本、链上数据验证 |
| 成员 3 | 前端连接层、余额卡片、转账 |
| 成员 4 | 商城列表、交易历史 |
| 成员 5 | 报告正文与图表 |

## 分支约定

- `main` 只接受组长的合并
- 组员分支命名：`feat/模块名`，如 `feat/frontend-balance`
- 每日至少推送一次自己的分支
