# Bug 修复记录

## 问题：商店购买接口不支持购买物品

`POST /api/shop/buy` 接口只接受 `collectionId` 参数用于购买收藏品，没有支持购买 food 类型物品的逻辑。但 items 表有 `buy_price` 字段，说明 food 物品是可购买的。

## 交易规则

| 类型       | 可使用         | 可购买                 | 可出售          |
| ---------- | -------------- | ---------------------- | --------------- |
| food       | ✅（恢复体力） | ✅（商店用 coin 购买） | ❌              |
| item       | ❌             | ❌                     | ✅（换取 coin） |
| collection | ❌             | ✅（商店用 coin 购买） | ❌              |

## 修复内容

### 1. `src/middleware/validationMiddleware.ts`

- 将 `validateBuyCollection` 重命名为 `validateBuyFromShop`
- 扩展验证逻辑，同时接受两种请求格式：
  - `{ collectionId: number }` — 购买收藏品
  - `{ itemId: number, quantity: number }` — 购买食物物品
- 不允许同时提供 `collectionId` 和 `itemId`

### 2. `src/controllers/gameController.ts`

- 将 `buyCollection` 重命名为 `buyFromShop`
- 扩展为统一处理两种购买逻辑：
  - `collectionId` 存在 → 执行原有收藏品购买逻辑
  - `itemId` 存在 → 执行新增的物品购买逻辑：
    - 仅允许 `type === 'food'` 的物品被购买
    - `buy_price` 必须 > 0
    - 扣减用户 coins，物品写入 `user_inventory`（支持堆叠）

### 3. `src/routes/gameRoutes.ts`

- 更新 import 和路由绑定，使用新的 `validateBuyFromShop` 和 `buyFromShop`

## API 使用示例

购买收藏品（原有功能）：

```json
POST /api/shop/buy
{ "collectionId": 1 }
```

购买食物物品（新增功能）：

```json
POST /api/shop/buy
{ "itemId": 1, "quantity": 3 }
```
