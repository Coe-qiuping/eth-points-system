// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./PointsToken.sol";

/**
 * @title PointsStore
 * @notice 积分兑换商城：平台方上架虚拟商品（优惠券等），用户支付积分兑换。
 * @dev 兑换时调用 PointsToken.consume() 销毁积分，因此积分是“真消耗”而不是
 *      转入平台账户，链上流通量会随兑换下降，账目可自证。
 */
contract PointsStore is Ownable, Pausable {
    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 price; // 所需积分
        uint256 stock; // 剩余库存
        bool active; // 是否上架
    }

    struct Redemption {
        uint256 productId;
        string productName;
        uint256 price;
        uint256 timestamp;
        uint256 blockNumber;
    }

    PointsToken public immutable points;

    mapping(uint256 => Product) private _products;
    mapping(address => Redemption[]) private _redemptions;

    uint256 public productCount;
    uint256 public totalRedemptions;
    mapping(address => uint256) public totalSpent;

    event ProductCreated(uint256 indexed productId, string name, uint256 price, uint256 stock);
    event ProductUpdated(uint256 indexed productId, uint256 price, uint256 stock, bool active);
    event Redeemed(
        address indexed user,
        uint256 indexed productId,
        string productName,
        uint256 price,
        uint256 timestamp
    );

    error InvalidProduct();
    error ProductNotActive();
    error OutOfStock();
    error InsufficientPoints(uint256 balance, uint256 required);

    constructor(address initialOwner, address token) Ownable(initialOwner) {
        require(token != address(0), "token=0");
        points = PointsToken(token);
    }

    // ---------------------------------------------------------------------
    // 商品管理（onlyOwner）
    // ---------------------------------------------------------------------

    function createProduct(
        string calldata name,
        string calldata description,
        uint256 price,
        uint256 stock
    ) external onlyOwner returns (uint256 productId) {
        require(bytes(name).length > 0, "empty name");
        require(price > 0, "price=0");

        productId = ++productCount;
        _products[productId] = Product({
            id: productId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            active: true
        });

        emit ProductCreated(productId, name, price, stock);
    }

    /// @notice 调整价格、补货或上下架；stock 传 0 表示下架前清空库存
    function updateProduct(
        uint256 productId,
        uint256 price,
        uint256 stock,
        bool active
    ) external onlyOwner {
        Product storage p = _products[productId];
        if (p.id == 0) revert InvalidProduct();
        require(price > 0, "price=0");

        p.price = price;
        p.stock = stock;
        p.active = active;

        emit ProductUpdated(productId, price, stock, active);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ---------------------------------------------------------------------
    // 兑换
    // ---------------------------------------------------------------------

    /**
     * @notice 用户支付积分兑换一件虚拟商品
     * @dev 前置条件：用户已对本站 approve 足够额度；本站再调用 token.consume 销毁积分
     */
    function redeem(uint256 productId) external whenNotPaused returns (uint256) {
        Product storage p = _products[productId];
        if (p.id == 0 || !p.active) revert ProductNotActive();
        if (p.stock == 0) revert OutOfStock();

        uint256 balance = points.balanceOf(msg.sender);
        if (balance < p.price) revert InsufficientPoints(balance, p.price);

        p.stock -= 1;

        // 销毁积分：只有本合约（被 owner 绑定为 redemptionStore）有权限
        points.consume(msg.sender, p.price, p.name);

        _redemptions[msg.sender].push(
            Redemption({
                productId: productId,
                productName: p.name,
                price: p.price,
                timestamp: block.timestamp,
                blockNumber: block.number
            })
        );
        totalSpent[msg.sender] += p.price;
        totalRedemptions += 1;

        emit Redeemed(msg.sender, productId, p.name, p.price, block.timestamp);
        return productId;
    }

    // ---------------------------------------------------------------------
    // 查询
    // ---------------------------------------------------------------------

    function getProduct(uint256 productId) external view returns (Product memory) {
        return _products[productId];
    }

    function getProducts() external view returns (Product[] memory list) {
        list = new Product[](productCount);
        for (uint256 i = 1; i <= productCount; i++) {
            list[i - 1] = _products[i];
        }
    }

    function getUserRedemptions(address user) external view returns (Redemption[] memory) {
        return _redemptions[user];
    }

    function getUserRedemptionCount(address user) external view returns (uint256) {
        return _redemptions[user].length;
    }
}
