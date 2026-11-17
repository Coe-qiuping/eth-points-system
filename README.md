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

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 编译合约
npm run compile

# 3. 启动本地链（终端 A，保持运行）
npm run node

# 4. 部署合约并初始化数据（终端 B）
#    部署 PointsToken → PointsStore → 绑定 → 上架 3 个商品 → 给 5 个地址各发 1000 分
npm run deploy

# 5. 运行测试
npm test

# 6. 启动前端
npm run dev
# 浏览器打开 http://localhost:5173
```

> 如果 `npx hardhat` 提示找不到命令（`node_modules/.bin` 为空），用
> `node node_modules/hardhat/internal/cli/cli.js <命令>` 直接调用，效果相同。

### 关于 `deployments.json`

部署脚本会在项目根目录生成 `deployments.json`（合约地址、测试账户等），该文件**不提交到仓库**。
每次重启本地链，链上状态清空、合约地址会变，需要重新执行 `npm run deploy` 并重新生成前端的合约配置。

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
