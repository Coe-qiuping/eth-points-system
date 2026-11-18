// frontend/src/components/BalanceCard.jsx
// 负责人：成员 C
// 职责：展示当前账户余额 + 三个全局指标。
// 注意：合约 decimals = 0，所有数量都用 formatUnits(v, 0)，不要用 18。

import React, { useEffect, useState } from "react";
import { formatUnits } from "ethers";

export default function BalanceCard({ account, token, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !account) return;
    let alive = true;

    (async () => {
      try {
        const [balance, issued, consumed, circulating] = await Promise.all([
          token.balanceOf(account),
          token.totalIssued(),
          token.totalConsumed(),
          token.circulatingSupply(),
        ]);
        if (!alive) return;
        setData({
          balance: formatUnits(balance, 0),
          issued: formatUnits(issued, 0),
          consumed: formatUnits(consumed, 0),
          circulating: formatUnits(circulating, 0),
        });
        setError("");
      } catch (e) {
        if (alive) setError(e.shortMessage || e.message || String(e));
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, account, refreshKey]);

  if (error) {
    return <div className="todo err">读取余额失败：{error}</div>;
  }

  if (!data) {
    return <div className="todo">正在读取余额…</div>;
  }

  return (
    <div className="grid">
      <div className="metric">
        <div className="label">我的积分</div>
        <div className="value">
          {data.balance}
          <span className="unit">CPT</span>
        </div>
      </div>
      <div className="metric">
        <div className="label">累计发行</div>
        <div className="value">{data.issued}</div>
      </div>
      <div className="metric">
        <div className="label">累计消耗（已销毁）</div>
        <div className="value">{data.consumed}</div>
      </div>
      <div className="metric">
        <div className="label">当前流通量</div>
        <div className="value">{data.circulating}</div>
      </div>
    </div>
  );
}
