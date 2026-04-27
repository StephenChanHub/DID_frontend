## 游戏机制的后端核心引擎与全量 API (Backend)

**核心目标**：实现自动化体力恢复、答题掉落算法、双轨制经济系统以及管理员权限校验。

**开发环境**：Node.js (Express), MySQL, Redis (可选), TypeScript。

### 1. 核心中间件：体力同步 (`staminaSync`)

- **触发机制**：在所有客户端 API 请求前执行。
- **计算逻辑**：
  - 读取用户的 `stamina` 和 `last_stamina_update`。
  - 计算当前时间与上次更新的时间差（分钟）。
  - **恢复公式**：每 5 分钟回复 1 点。
  - **更新规则**：新体力值 = $min(max\_stamina, current + \text{gap}/5)$。
  - **写入**：若有变动，更新数据库中的 `stamina` 和 `last_stamina_update` 为当前时间。

### 2. 核心业务接口

- **`POST /api/practice/submit` (答题结算)**：
  1.  **体力检查**：校验 `stamina >= 10`。不足则返回 `403`。
  2.  **统计更新**：无论对错，`total_questions` 字段自增 1。
  3.  **判定奖励**：
      - 仅在 `isCorrect === true` 时触发。
      - 根据 `material_id` 查询 `material_reward_configs`。
      - 执行概率碰撞：生成随机数对比 `drop_rate`。
      - 若中奖，计算 `quantity` 并更新 `user_inventory`（使用 `ON DUPLICATE KEY UPDATE`）。
  4.  **返回**：体力余量、是否中奖、中奖物品的 Emoji 和名称。

- **`POST /api/items/sell` (物品变现)**：
  - 校验物品 `type` 必须为 `item`。若是 `food` 则拦截并报错。
  - 执行数据库事务：销毁指定数量物品 $\rightarrow$ 增加用户 `coins`。

- **`POST /api/items/use` (食用补给)**：
  - 校验物品 `type` 必须为 `food`。
  - 逻辑：消耗物品 $\rightarrow$ 增加 `stamina`（不可超过 `max_stamina`）。

- **`POST /api/shop/buy` (收藏品购买)**：
  - 检查 `coins` 余额。
  - 检查 `user_collections` 是否已拥有该 `collection_id`（唯一性校验）。
  - 逻辑：扣钱 $\rightarrow$ 写入收藏记录。

### 3. 管理员 (Admin) 接口

- **基础内容管理**：提供对 `materials`、`questions` 的全量 CRUD。
- **奖励系统管理**：
  - **`items` CRUD**：配置 Emoji 字符、售卖价格（Food 默认为 0 且不可售）。
  - **`collections` CRUD**：配置 `image_url`、`media_url` 和买入价格。
  - **`reward_configs` CRUD**：为特定素材配置掉落物品及其百分比概率。

---
