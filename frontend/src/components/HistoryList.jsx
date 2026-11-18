// frontend/src/components/HistoryList.jsx
// 负责人：成员 D
// 职责：把 4 类事件合并成一条按区块排序的时间线。
//
// 取数方式（ethers v6）：
//   const [out, inn, redeem] = await Promise.all([
//     token.queryFilter(token.filters.Transfer(account, null), 0, "latest"),
//     token.queryFilter(token.filters.Transfer(null, account), 0, "latest"),
//     store.queryFilter(store.filters.Redeemed(account), 0, "latest"),
//   ]);
//
// 类型判定（必须按这张表，和分工文档一致）：
//   Transfer(0x0 → me)  → issue
//   Transfer(me → 0x0)  → consume
//   Transfer(me → x)    → transferOut
//   Transfer(x → me)    → transferIn
//   Redeemed(me, ...)   → redeem
//
// 统一条目结构：
//   { type, amount, counterparty, txHash, blockNumber, time, note }
//   amount 取绝对值；counterparty 发行/消耗为 null；note 用 Redeemed 的商品名。
//
// 排序：按 blockNumber 降序（最新的在最上面）。
// 去重：Transfer 与 Redeemed 是两笔不同事件，同一笔兑换会出现两条（consume + redeem），
//       如果需要合并展示，可按 txHash 归并成一条「兑换 -100（10元券）」。

import React from "react";

export default function HistoryList({ account, token, store, refreshKey }) {
  return (
    <div className="todo">
      <strong>待实现（成员 D）</strong>
      <div style={{ marginTop: 6 }}>
        需要实现：
        <br />① 用 <code>queryFilter</code> 拉取 <code>Transfer</code> 的转入/转出/销毁与 <code>Redeemed</code>
        <br />② 按上方判定表转换 type，合并后按 <code>blockNumber</code> 降序
        <br />③ 每条显示：类型徽标、数量（+/-）、对手方地址、TxHash 前 10 位、区块号、时间
        <br />④ <code>refreshKey</code> 变化时重新拉取；无数据时显示空状态
      </div>
    </div>
  );
}
