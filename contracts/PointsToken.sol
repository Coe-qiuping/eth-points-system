// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ChainPoint
 * @notice 平台通用积分代币：支持平台方发行、用户间转账、授权兑换合约消耗（销毁）。
 * @dev 积分精度为 0（整数积分），便于业务侧按“分”记账，避免小数误差。
 *
 * 权限模型：
 *  - owner：最高管理员，可增删发行方、设置兑换合约、暂停系统；
 *  - issuer：被授权的发行方（运营账户 / 活动合约），只能增发积分；
 *  - redemptionStore：唯一被允许调用 consume() 的兑换合约，负责在用户兑换商品时销毁积分。
 */
contract PointsToken is ERC20, Ownable, Pausable {
    /// @notice 兑换商城合约地址（唯一有权销毁用户积分的地址）
    address public redemptionStore;

    /// @notice 累计发行量（不含转账，仅统计 mint）
    uint256 public totalIssued;

    /// @notice 累计消耗量（仅统计 burn）
    uint256 public totalConsumed;

    /// @notice 发行方白名单
    mapping(address => bool) public isIssuer;

    event IssuerUpdated(address indexed issuer, bool allowed);
    event RedemptionStoreUpdated(address indexed store);
    event PointsIssued(address indexed to, uint256 amount, string reason);
    event PointsConsumed(address indexed from, uint256 amount, string reason);

    error NotIssuer();
    error NotRedemptionStore();
    error ZeroAddress();
    error ZeroAmount();
    error LengthMismatch();

    constructor(address initialOwner) ERC20("ChainPoint", "CPT") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        isIssuer[initialOwner] = true;
        emit IssuerUpdated(initialOwner, true);
    }

    /// @dev 积分是整数计数单位，不使用 18 位小数
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    modifier onlyIssuer() {
        if (!isIssuer[msg.sender]) revert NotIssuer();
        _;
    }

    // ---------------------------------------------------------------------
    // 管理函数（onlyOwner）
    // ---------------------------------------------------------------------

    /// @notice 设置/取消某个地址的发行权限
    function setIssuer(address issuer, bool allowed) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddress();
        isIssuer[issuer] = allowed;
        emit IssuerUpdated(issuer, allowed);
    }

    /// @notice 绑定兑换商城合约，绑定后旧商城自动失去消耗权限
    function setRedemptionStore(address store) external onlyOwner {
        if (store == address(0)) revert ZeroAddress();
        redemptionStore = store;
        emit RedemptionStoreUpdated(store);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ---------------------------------------------------------------------
    // 发行（issuer）
    // ---------------------------------------------------------------------

    /**
     * @notice 向单个地址发行积分
     * @param to 接收地址
     * @param amount 积分数（整数）
     * @param reason 发行备注，如“新人注册奖励”，会永久写入链上事件
     */
    function issue(address to, uint256 amount, string calldata reason) external onlyIssuer whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _mint(to, amount);
        totalIssued += amount;

        emit PointsIssued(to, amount, reason);
    }

    /// @notice 批量发行，用于活动空投；数组长度必须一致
    function batchIssue(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyIssuer whenNotPaused {
        if (recipients.length != amounts.length) revert LengthMismatch();

        uint256 total;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();

            _mint(recipients[i], amounts[i]);
            total += amounts[i];

            emit PointsIssued(recipients[i], amounts[i], reason);
        }
        totalIssued += total;
    }

    // ---------------------------------------------------------------------
    // 消耗（仅兑换合约）
    // ---------------------------------------------------------------------

    /**
     * @notice 销毁用户积分，仅可由已绑定的兑换合约调用
     * @dev 采用“先授权、后扣减”的 ERC20 allowance 模型：
     *      用户在商城页面对兑换合约 approve 额度，兑换时合约才能扣款，
     *      避免合约任意划走用户资产。
     * @param from 积分被扣除的用户
     * @param amount 扣除数量
     * @param reason 消耗备注（商品名）
     */
    function consume(address from, uint256 amount, string calldata reason) external whenNotPaused {
        if (msg.sender != redemptionStore) revert NotRedemptionStore();
        if (amount == 0) revert ZeroAmount();

        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        totalConsumed += amount;

        emit PointsConsumed(from, amount, reason);
    }

    /// @notice 当前流通量 = 累计发行 - 累计消耗
    function circulatingSupply() external view returns (uint256) {
        return totalIssued - totalConsumed;
    }
}
