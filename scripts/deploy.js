// scripts/deploy.js
// 负责人：成员 B
// 作用：部署 PointsToken + PointsStore → 绑定兑换合约 → 上架 3 个商品 → 给 5 个测试账户各发 1000 积分
// 运行：npm run deploy   （需先 npm run node 启动本地链）
// 产物：项目根目录 deployments.json（不提交仓库）

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const INITIAL_POINTS = 1000n; // 每个测试账户的初始积分
const USER_COUNT = 5;         // 发行对象个数

async function main() {
  const signers = await ethers.getSigners();
  const [owner, ...others] = signers;

  console.log("=".repeat(56));
  console.log("部署账户（owner）:", owner.address);
  console.log("=".repeat(56));

  // 1) 部署积分代币
  const Token = await ethers.getContractFactory("PointsToken");
  const token = await Token.deploy(owner.address);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("[1/6] PointsToken 已部署: ", tokenAddr);

  // 2) 部署积分商城
  const Store = await ethers.getContractFactory("PointsStore");
  const store = await Store.deploy(owner.address, tokenAddr);
  await store.waitForDeployment();
  const storeAddr = await store.getAddress();
  console.log("[2/6] PointsStore 已部署: ", storeAddr);

  // 3) 绑定兑换合约（只有它有权调用 consume 销毁积分）
  const bindTx = await token.setRedemptionStore(storeAddr);
  await bindTx.wait();
  console.log("[3/6] 已绑定兑换合约（redemptionStore）");

  // 4) 上架商品
  const products = [
    { name: "10 元优惠券", desc: "全场通用，有效期 30 天", price: 100n, stock: 100n },
    { name: "会员月卡", desc: "免运费 + 双倍积分", price: 500n, stock: 50n },
    { name: "100 元礼品卡", desc: "限量发售，先兑先得", price: 2000n, stock: 10n },
  ];

  for (const p of products) {
    const tx = await store.createProduct(p.name, p.desc, p.price, p.stock);
    await tx.wait();
    console.log(`[4/6] 已上架: ${p.name}（${p.price} 积分 / 库存 ${p.stock}）`);
  }

  // 5) 批量发行初始积分
  const recipients = others.slice(0, USER_COUNT).map((s) => s.address);
  const amounts = recipients.map(() => INITIAL_POINTS);
  const issueTx = await token.batchIssue(recipients, amounts, "新人注册礼包");
  const issueReceipt = await issueTx.wait();
  console.log(
    `[5/6] 已向 ${USER_COUNT} 个账户各发行 ${INITIAL_POINTS} 积分（batchIssue gas: ${issueReceipt.gasUsed}）`
  );
  recipients.forEach((addr, i) => console.log(`      #${i + 2} ${addr}`));

  // 6) 落盘部署信息，供前端读取
  const network = await ethers.provider.getNetwork();
  const info = {
    chainId: network.chainId.toString(),
    token: tokenAddr,
    store: storeAddr,
    owner: owner.address,
    users: recipients,
    deployedAt: new Date().toISOString(),
  };
  const dest = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(dest, JSON.stringify(info, null, 2));
  console.log("[6/6] 部署信息已写入 deployments.json");

  // 汇总
  console.log("-".repeat(56));
  console.log("累计发行:", (await token.totalIssued()).toString());
  console.log("当前流通:", (await token.circulatingSupply()).toString());
  console.log("商品数量:", (await store.productCount()).toString());
  console.log("=".repeat(56));
  console.log("下一步：npm run gen:config   （把地址写进前端配置）");
  console.log("然后：  npm run dev          （启动前端 http://localhost:5175）");
}

main().catch((err) => {
  console.error("\n部署失败：");
  console.error(err);
  process.exitCode = 1;
});
