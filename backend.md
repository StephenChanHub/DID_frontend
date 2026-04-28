DID_server/
├── src/
│ ├── config/
│ │ ├── db.ts # 数据库连接配置
│ │ └── redis.ts # Redis 连接配置
│ ├── controllers/
│ │ ├── authController.ts # 用户认证（注册/登录/更新信息/密码重置）
│ │ ├── adminAuthController.ts # 管理员登录
│ │ ├── adminController.ts # 管理员功能（素材CRUD/题目CRUD/用户管理）
│ │ ├── adminGameController.ts # 管理员游戏配置（items/collections/reward_configs CRUD）
│ │ ├── materialController.ts # 素材列表/详情（用户侧）
│ │ ├── practiceController.ts # 答题结算（体力消耗+掉落判定）
│ │ ├── gameController.ts # 游戏系统（出售/使用/购买/背包/收藏/用户统计）
│ │ ├── uploadController.ts # 文件上传/管理
│ │ └── favoriteController.ts # 用户收藏
│ ├── middleware/
│ │ ├── authMiddleware.ts # JWT 校验
│ │ ├── roleMiddleware.ts # 管理员权限检查（查库验证）
│ │ ├── staminaMiddleware.ts # 体力自动恢复（每5分钟+1，所有API请求前同步）
│ │ ├── uploadMiddleware.ts # 文件上传处理（类型/大小校验）
│ │ ├── validationMiddleware.ts # 输入验证（含游戏系统验证规则）
│ │ └── errorHandler.ts # 全局错误处理
│ ├── routes/
│ │ ├── authRoutes.ts # 认证路由 + 管理员用户管理
│ │ ├── materialRoutes.ts # 素材路由（含管理员素材/题目管理）
│ │ ├── practiceRoutes.ts # 练习路由（含体力同步中间件）
│ │ ├── gameRoutes.ts # 游戏路由（背包/商店/收藏/用户统计）
│ │ ├── adminGameRoutes.ts # 管理员游戏配置路由（items/collections/reward_configs）
│ │ ├── uploadRoutes.ts # 文件上传路由
│ │ └── favoriteRoutes.ts # 收藏路由
│ ├── types/
│ │ └── express.d.ts # Express 类型扩展
│ ├── utils/
│ │ ├── mailer.ts # 邮件发送工具
│ │ └── redis.ts # Redis 工具函数
│ └── index.ts # 应用入口
├── uploads/
│ ├── image/ # 存放图片资源
│ └── media/ # 存放音频/视频资源
├── .env # 环境变量
├── tsconfig.json # TypeScript 配置
├── package.json # 项目依赖
├── db.md # 数据库设计文档
├── web.md # 前端接口文档
├── information.md # 项目信息总览（本文件）
├── report.md # 安全审计报告
└── fix.md # 修复指南

## 1. 后端 API 接口清单 (API Inventory)

所有接口都采用 `JWT` 进行身份验证，管理员接口需要额外的管理员权限。

### A. 用户认证 (Auth)

**基础路由前缀：`/api/auth`**

| 路由                        | 方法   | 功能               | 认证要求     | 说明                                                               |
| :-------------------------- | :----- | :----------------- | :----------- | :----------------------------------------------------------------- |
| `/api/auth/send-code`       | `POST` | 发送邮箱验证码     | 无           | 生成6位验证码，存入 Redis（5分钟过期）并发送邮件                   |
| `/api/auth/register`        | `POST` | 用户注册           | 无           | 验证码校验 + 密码哈希 + 自动识别超级管理员（SUPER_ADMIN_EMAIL）    |
| `/api/auth/login`           | `POST` | 用户登录           | 无           | 返回 JWT Token 和用户信息（含 coins、stamina、total_questions 等） |
| `/api/auth/update`          | `POST` | 更新密码/昵称      | 用户 Token   | 根据 Token 身份验证后更新                                          |
| `/api/auth/send-reset-code` | `POST` | 发送重置密码验证码 | 无           | 向已注册邮箱发送重置验证码（Redis 5分钟过期）                      |
| `/api/auth/reset-password`  | `POST` | 重置密码           | 无           | 邮箱 + 验证码 + 新密码，验证码使用后立即失效                       |
| `/api/auth/test`            | `GET`  | 用户认证测试       | 用户 Token   | 验证用户 Token 有效性                                              |
| `/api/auth/admin/login`     | `POST` | 管理员登录         | 无           | 邮箱 + 密码，校验 role='ADMIN'                                     |
| `/api/auth/admin/test`      | `GET`  | 管理员认证测试     | 管理员 Token | 验证管理员 Token 和权限                                            |
| `/api/auth/admin/users`     | `GET`  | 用户列表管理       | 管理员 Token | 支持 keyword 搜索和 role 筛选                                      |

### B. 素材与题目 (Materials & Questions)

**基础路由前缀：`/api/materials`**

| 路由                                  | 方法     | 功能         | 认证要求     | 说明                                          |
| :------------------------------------ | :------- | :----------- | :----------- | :-------------------------------------------- |
| `/api/materials`                      | `GET`    | 获取素材列表 | 用户 Token   | 支持按 `level` 和 `type` 筛选                 |
| `/api/materials/:id`                  | `GET`    | 获取素材详情 | 用户 Token   | 返回素材内容 + 题目列表 + 练习记录 + 收藏状态 |
| `/api/materials/admin/create`         | `POST`   | 创建素材     | 管理员 Token | 管理员创建新素材                              |
| `/api/materials/admin/bulk-questions` | `POST`   | 批量录入题目 | 管理员 Token | 验证素材存在后批量添加题目                    |
| `/api/materials/admin/materials/:id`  | `PUT`    | 更新素材     | 管理员 Token | 自动清理被替换的旧文件                        |
| `/api/materials/admin/materials/:id`  | `DELETE` | 删除素材     | 管理员 Token | 级联删除关联题目 + 清理文件                   |
| `/api/materials/admin/questions/:id`  | `PUT`    | 更新题目     | 管理员 Token | 可选字段更新                                  |
| `/api/materials/admin/questions/:id`  | `DELETE` | 删除题目     | 管理员 Token | 仅删除题目，不影响素材                        |

### C. 答题系统 (Practice)

**基础路由前缀：`/api/practice`** | 中间件：`authenticateToken` + `staminaSync`

**体力机制**：每次答题消耗 10 体力，每 5 分钟自动恢复 1 点（所有 API 请求时自动同步），体力不足时返回 403。

| 路由                   | 方法   | 功能         | 认证要求   | 说明                                                                                                  |
| :--------------------- | :----- | :----------- | :--------- | :---------------------------------------------------------------------------------------------------- |
| `/api/practice/submit` | `POST` | 提交练习答案 | 用户 Token | 体力检查(≥10)→扣10体力→total_questions+1→判题→通过则按 material_reward_configs 掉落 items/collections |

### D. 游戏系统 (Game)

**基础路由前缀：`/api`** | 中间件：`authenticateToken` + `staminaSync`

| 路由                    | 方法   | 功能         | 认证要求   | 说明                                                                                 |
| :---------------------- | :----- | :----------- | :--------- | :----------------------------------------------------------------------------------- |
| `/api/user/stats`       | `GET`  | 获取用户统计 | 用户 Token | 返回 nickname、coins、level、total_questions、stamina、max_stamina                   |
| `/api/items/inventory`  | `GET`  | 查看背包     | 用户 Token | 返回用户持有的所有物品及其数量                                                       |
| `/api/items/sell`       | `POST` | 出售物品     | 用户 Token | 仅 item 类型可售（food 拦截），扣除背包物品 → 增加 coins                             |
| `/api/items/use`        | `POST` | 使用食物     | 用户 Token | 仅 food 类型可用，消耗物品 → 恢复 stamina（不超过 max_stamina）                      |
| `/api/shop/buy`         | `POST` | 商店购买     | 用户 Token | 支持 collectionId（购买收藏品）或 itemId+quantity（购买 food 物品），检查 coins 余额 |
| `/api/collections/mine` | `GET`  | 我的收藏品   | 用户 Token | 返回用户已购买的全部收藏品                                                           |

### E. 管理员游戏配置 (Admin Game)

**基础路由前缀：`/api/admin`** | 中间件：`authenticateToken` + `isAdmin`

| 路由                            | 方法     | 功能         | 认证要求     | 说明                                                                     |
| :------------------------------ | :------- | :----------- | :----------- | :----------------------------------------------------------------------- |
| `/api/admin/items`              | `GET`    | 物品列表     | 管理员 Token | 支持 type 筛选（food/item）                                              |
| `/api/admin/items`              | `POST`   | 创建物品     | 管理员 Token | name/emoji/type 必填                                                     |
| `/api/admin/items/:id`          | `GET`    | 物品详情     | 管理员 Token | 返回单个物品                                                             |
| `/api/admin/items/:id`          | `PUT`    | 更新物品     | 管理员 Token | 所有字段可选                                                             |
| `/api/admin/items/:id`          | `DELETE` | 删除物品     | 管理员 Token | 级联删除背包记录                                                         |
| `/api/admin/collections`        | `GET`    | 收藏品列表   | 管理员 Token | 支持 category 筛选                                                       |
| `/api/admin/collections`        | `POST`   | 创建收藏品   | 管理员 Token | name/category/buy_price 必填                                             |
| `/api/admin/collections/:id`    | `GET`    | 收藏品详情   | 管理员 Token | 返回单个收藏品                                                           |
| `/api/admin/collections/:id`    | `PUT`    | 更新收藏品   | 管理员 Token | 所有字段可选                                                             |
| `/api/admin/collections/:id`    | `DELETE` | 删除收藏品   | 管理员 Token | 级联删除用户收藏记录                                                     |
| `/api/admin/reward-configs`     | `GET`    | 奖励配置列表 | 管理员 Token | 支持 material_id 筛选                                                    |
| `/api/admin/reward-configs`     | `POST`   | 创建奖励配置 | 管理员 Token | material_id/reward_type/reward_id/drop_rate 必填；验证素材和奖励目标存在 |
| `/api/admin/reward-configs/:id` | `GET`    | 奖励配置详情 | 管理员 Token | 返回单个配置                                                             |
| `/api/admin/reward-configs/:id` | `PUT`    | 更新奖励配置 | 管理员 Token | 所有字段可选                                                             |
| `/api/admin/reward-configs/:id` | `DELETE` | 删除奖励配置 | 管理员 Token | 删除指定配置                                                             |

### F. 文件上传 (File Upload)

**基础路由前缀：`/api/upload`**

| 路由                 | 方法     | 功能     | 认证要求     | 说明                                     |
| :------------------- | :------- | :------- | :----------- | :--------------------------------------- |
| `/api/upload/`       | `POST`   | 上传文件 | 用户 Token   | 支持 image / audio / video，自动分类存储 |
| `/api/upload/list`   | `GET`    | 文件列表 | 管理员 Token | 遍历 uploads 目录返回所有文件            |
| `/api/upload/delete` | `DELETE` | 删除文件 | 管理员 Token | 按文件名和类型删除                       |

### G. 用户收藏 (Favorites)

**基础路由前缀：`/api/favorites`**

| 路由                               | 方法     | 功能         | 认证要求   | 说明                            |
| :--------------------------------- | :------- | :----------- | :--------- | :------------------------------ |
| `/api/favorites/add`               | `POST`   | 添加收藏     | 用户 Token | 验证素材存在，防重复收藏        |
| `/api/favorites/remove`            | `DELETE` | 取消收藏     | 用户 Token | 删除收藏记录                    |
| `/api/favorites`                   | `GET`    | 收藏列表     | 用户 Token | 返回用户收藏的全部素材          |
| `/api/favorites/check/:materialId` | `GET`    | 检查收藏状态 | 用户 Token | 返回 `{ isFavorited: boolean }` |

---

## 2. 安全特性说明

### ✅ 已实现的安全功能

1. **JWT 密钥管理** - 从环境变量加载
2. **输入验证** - 所有输入参数经过格式、长度、类型验证
3. **密码哈希** - 使用 bcrypt (salt rounds: 10) 哈希存储密码
4. **SQL 注入防护** - 所有查询使用参数化 (`db.execute`)
5. **文件上传限制** - 文件类型白名单 (jpg, jpeg, png, gif, mp3, wav, mp4)，大小限制 10MB
6. **错误处理** - 统一错误响应，不暴露内部信息
7. **管理员权限校验** - 双重验证：JWT 角色 + 数据库实时查询
8. **超级管理员机制** - 通过环境变量 SUPER_ADMIN_EMAIL 自动授予注册用户 ADMIN 角色

### 🔧 验证规则要点

- **注册**：邮箱格式、密码长度≥6、验证码6位数字
- **登录**：邮箱/密码必填
- **密码重置**：邮箱格式、验证码6位数字、新密码≥6
- **素材ID/题目ID**：必须是数字
- **练习提交**：materialId数字、answers数组格式（每项含 qId 和 val）
- **创建素材**：type/level/title/content 必填，country/topic 可选
- **出售物品**：itemId 正整数、quantity 正整数
- **使用食物**：itemId 正整数、quantity 正整数
- **商店购买**：collectionId 或 itemId 正整数（互斥），购买物品时 quantity 正整数
- **创建物品**：name/emoji 非空、type 为 food 或 item
- **创建收藏品**：name 非空、category 为 album/other/physical、buy_price ≥ 0
- **创建奖励配置**：material_id/reward_id 正整数、reward_type 为 item 或 collection、drop_rate 0~100
- **文件上传**：MIME 类型白名单 + 文件扩展名检查
