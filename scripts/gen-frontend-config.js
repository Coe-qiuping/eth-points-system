// scripts/gen-frontend-config.js
// 作用：把「合约编译产物里的 ABI」+「部署脚本产出的地址」合并成前端可用的 contracts.json
// 用法：npm run gen:config   （部署完再跑一次，地址就更新了）

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

function abiOf(contractName) {
  const p = path.join(root, "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`找不到 ${p}\n请先执行编译：npm run compile`);
  }
  return readJson(p).abi;
}

const ZERO = "0x0000000000000000000000000000000000000000";
let token = ZERO;
let store = ZERO;
let chainId = "31337";

const deployPath = path.join(root, "deployments.json");
if (fs.existsSync(deployPath)) {
  const d = readJson(deployPath);
  token = d.token;
  store = d.store;
  chainId = d.chainId ?? chainId;
  console.log("[ok] 已从 deployments.json 读取真实合约地址");
} else {
  console.warn("[warn] 未找到 deployments.json，先写入全零占位地址");
  console.warn("       部署完成后重新执行本脚本即可自动更新");
}

const out = {
  _comment: "本文件由 scripts/gen-frontend-config.js 自动生成，请勿手改",
  chainId,
  rpcUrl: "http://127.0.0.1:8545",
  token,
  store,
  tokenAbi: abiOf("PointsToken"),
  storeAbi: abiOf("PointsStore"),
};

const dest = path.join(root, "frontend", "src", "contracts.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2));

console.log(`[ok] 已生成 ${path.relative(root, dest)}`);
console.log(`     token = ${token}`);
console.log(`     store = ${store}`);
console.log(`     ABI   = PointsToken ${out.tokenAbi.length} 项 / PointsStore ${out.storeAbi.length} 项`);
