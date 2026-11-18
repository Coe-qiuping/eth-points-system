// frontend/src/components/StoreList.jsx
// 负责人：成员 D
// 职责：读取 store.getProducts() 渲染商品卡片，支持兑换。
//
// 兑换是两步，顺序不能反：
//   1) await (await token.approve(store.target, product.price)).wait();
//   2) await (await store.redeem(product.id)).wait();
//   成功后调用 onDone()。
//
// Product 结构（全部是 bigint）：
//   { id, name, description, price, stock, active }
// 注意：price / stock / id 都是 bigint，参与比较或展示前先用 formatUnits(x, 0) 或 Number(x)。
//
// 需要处理的异常：
//   InsufficientPoints       积分不足
//   OutOfStock               库存为 0
//   ProductNotActive         已下架
//   ERC20InsufficientAllowance  忘记 approve

import React from "react";

export default function StoreList({ account, token, store, onDone }) {
  return (
    <div className="todo">
      <strong>待实现（成员 D）</strong>
      <div style={{ marginTop: 6 }}>
        需要实现：
        <br />① 挂载时执行 <code>store.getProducts()</code>，渲染成卡片（名称 / 描述 / 价格 / 库存）
        <br />② 每张卡片一个「兑换」按钮，点击后依次执行 <code>approve</code> → <code>redeem</code>
        <br />③ 库存为 0 或已下架的按钮置灰，余额不足时提示
        <br />④ 兑换成功后调用 <code>onDone()</code> 让父组件刷新余额与历史
      </div>
    </div>
  );
}
