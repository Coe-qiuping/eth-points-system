// frontend/src/components/TransferForm.jsx
// 负责人：成员 C
// 职责：输入收款地址 + 数量，调用 token.transfer，成功后调用 onDone() 通知父级刷新。
//
// 实现提示（照这个写即可）：
//   const amount = parseUnits(value, 0);          // decimals = 0，别用 18
//   const tx = await token.transfer(to, amount);
//   await tx.wait();                              // 等上链确认
//   onDone();
//
// 需要处理的异常：
//   - InsufficientBalance：余额不足
//   - 地址格式错误：ethers.isAddress(to) 先校验
//   - 转给自己：可直接禁止

import React, { useState } from "react";

export default function TransferForm({ account, accounts, token, onDone }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    // TODO(成员 C)：实现转账逻辑
    setMsg({ type: "err", text: "该模块待实现：请在此调用 token.transfer(to, amount)" });
  };

  return (
    <form onSubmit={submit}>
      <div className="todo" style={{ marginBottom: 12 }}>
        <strong>待实现（成员 C）</strong>
        <div style={{ marginTop: 6 }}>
          表单骨架已就位，需要补上：地址校验、数量解析（parseUnits(x, 0)）、
          调用 token.transfer、等待 tx.wait()、成功后调用 onDone()。
        </div>
      </div>

      <div className="row">
        <input
          style={{ minWidth: 320 }}
          placeholder="收款地址 0x…（可从右侧下拉快速填充）"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <select onChange={(e) => setTo(e.target.value)} value="">
          <option value="">— 选一个测试账户 —</option>
          {accounts
            .filter((a) => a.toLowerCase() !== (account || "").toLowerCase())
            .map((a, i) => (
              <option key={a} value={a}>
                账户{i} · {a.slice(0, 8)}…
              </option>
            ))}
        </select>
        <input
          style={{ maxWidth: 120 }}
          placeholder="数量"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "提交中…" : "确认转账"}
        </button>
      </div>

      {msg && (
        <div className={`banner ${msg.type === "err" ? "error" : ""}`} style={{ marginTop: 12 }}>
          {msg.text}
        </div>
      )}
    </form>
  );
}
