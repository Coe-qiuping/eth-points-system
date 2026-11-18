// frontend/src/App.jsx
// 负责人：成员 A（组长）
// 职责：连接本地链、管理全局状态（当前账户 / 合约实例 / 刷新计数），装配 4 个子组件。
// 约定：子组件不直接改全局状态，交易成功后调用 onDone() 通知本组件刷新。

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { JsonRpcProvider, Contract } from "ethers";
import cfg from "./contracts.json";
import BalanceCard from "./components/BalanceCard";
import TransferForm from "./components/TransferForm";
import StoreList from "./components/StoreList";
import HistoryList from "./components/HistoryList";

const ZERO = "0x0000000000000000000000000000000000000000";

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [token, setToken] = useState(null);
  const [store, setStore] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const deployed = cfg.token !== ZERO && cfg.store !== ZERO;

  // 1) 连接本地链，取回 hardhat 内置的 20 个已解锁账户
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const provider = new JsonRpcProvider(cfg.rpcUrl);
        const list = await provider.send("eth_accounts", []);
        if (!alive) return;
        if (!list.length) {
          throw new Error("本地链没有可用账户，请确认已执行 npm run node");
        }
        setAccounts(list);
        setAccount(list[2] || list[0]);
      } catch (e) {
        if (alive) setError(e.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 2) 账户切换时重建 signer 与合约实例
  useEffect(() => {
    if (!account || !deployed) return;
    let alive = true;
    (async () => {
      try {
        const provider = new JsonRpcProvider(cfg.rpcUrl);
        const s = await provider.getSigner(account);
        if (!alive) return;
        setSigner(s);
        setToken(new Contract(cfg.token, cfg.tokenAbi, s));
        setStore(new Contract(cfg.store, cfg.storeAbi, s));
        setError("");
      } catch (e) {
        if (alive) setError(e.message || String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [account, deployed]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const shortAddr = useMemo(
    () => (account ? `${account.slice(0, 6)}…${account.slice(-4)}` : ""),
    [account]
  );

  if (loading) {
    return (
      <div className="app">
        <div className="banner">正在连接本地链 {cfg.rpcUrl} …</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="banner error">
          连接失败：{error}
          <br />
          请确认已经执行 <code>npm run node</code> 启动本地链（端口 8545）。
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>以太坊通用积分系统</h1>
          <div className="sub">
            ChainPoint (CPT) · 发行 / 转账 / 兑换 · chainId {cfg.chainId}
          </div>
        </div>
        <div className="row">
          <select value={account} onChange={(e) => setAccount(e.target.value)}>
            {accounts.map((a, i) => (
              <option key={a} value={a}>
                账户{i} · {a.slice(0, 6)}…{a.slice(-4)}
              </option>
            ))}
          </select>
          <button className="ghost" onClick={refresh}>
            刷新数据
          </button>
        </div>
      </div>

      {!deployed && (
        <div className="banner">
          合约地址还是空的。请先执行 <code>npm run deploy</code> 部署合约，
          然后执行 <code>npm run gen:config</code> 生成地址，再刷新本页。
        </div>
      )}

      {deployed && (
        <>
          <div className="panel">
            <h2>
              当前账户 <span className="tag mono">{shortAddr}</span>
            </h2>
            <BalanceCard
              account={account}
              token={token}
              refreshKey={refreshKey}
            />
          </div>

          <div className="panel">
            <h2>
              积分转账 <span className="tag">成员 C 负责</span>
            </h2>
            <TransferForm
              account={account}
              accounts={accounts}
              token={token}
              onDone={refresh}
            />
          </div>

          <div className="panel">
            <h2>
              积分商城 <span className="tag">成员 D 负责</span>
            </h2>
            <StoreList
              account={account}
              token={token}
              store={store}
              onDone={refresh}
            />
          </div>

          <div className="panel">
            <h2>
              交易历史 <span className="tag">成员 D 负责</span>
            </h2>
            <HistoryList
              account={account}
              token={token}
              store={store}
              refreshKey={refreshKey}
            />
          </div>
        </>
      )}
    </div>
  );
}
