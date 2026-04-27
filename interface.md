# DID服务器前端接口文档

## 📋 概述

### 基础信息

- **Base URL**: `http://192.168.64.2:3000/api` (开发环境)
- **Content-Type**: `application/json`
- **认证方式**: JWT (JSON Web Token)
- **响应格式**: 所有响应都包含 `message` 字段，成功时可能包含额外数据字段

### 认证机制

1. **用户认证**: 通过 `/api/auth/login` 获取 JWT Token
2. **Token使用**: 在请求头中添加 `Authorization: Bearer <token>`
3. **Token有效期**: Token有效期统一为7天
4. **权限区分**: 普通用户和管理员使用相同的密钥，管理员接口需要 `role: 'ADMIN'` 权限
5. **超级管理员**: 通过环境变量 `SUPER_ADMIN_EMAIL` 配置，使用该邮箱注册的用户自动获得 ADMIN 角色

### 通用响应格式

```json
// 成功响应
{
  "message": "操作成功",
  "data": { /* 可选数据 */ }
}

// 错误响应
{
  "message": "错误描述",
  "errors": ["具体错误1", "具体错误2"] // 可选，验证错误时使用
}
```

### 错误码说明

| 状态码 | 说明           | 常见场景                                     |
| ------ | -------------- | -------------------------------------------- |
| 200    | 成功           | 获取数据、登录成功                           |
| 201    | 创建成功       | 注册成功、创建素材成功                       |
| 400    | 请求错误       | 参数验证失败、格式错误                       |
| 401    | 未授权         | Token无效、过期、密码错误                    |
| 403    | 禁止访问       | 权限不足（非管理员访问管理员接口）、体力不足 |
| 404    | 资源不存在     | 素材ID不存在                                 |
| 500    | 服务器内部错误 | 数据库异常、未捕获错误                       |

---

## 👤 用户认证接口

### 1. 用户注册

**注册新用户账号**

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **认证**: 不需要
- **请求体**:

```json
{
  "username": "user@example.com 或 13800138000",
  "nickname": "用户昵称",
  "password": "password123",
  "security_answer": "ANSWER"
}
```

- **参数说明**:
  - `username`: 邮箱地址或手机号（中国大陆格式）
  - `nickname`: 用户昵称，长度不能超过10个字符
  - `password`: 密码，长度至少6个字符
  - `security_answer`: 密保答案，用于找回密码（将转换为大写存储）

- **验证规则**:
  - 邮箱格式：使用 `validator.isEmail()` 验证
  - 手机号格式：使用 `validator.isMobilePhone(username, 'zh-CN')` 验证
  - 昵称长度：≤10个字符，不能为空
  - 密码长度：≥6个字符
  - 账号唯一性：系统会检查是否已存在相同用户名

- **成功响应** (201):

```json
{
  "message": "账号创建成功"
}
```

- **错误响应**:
  - 400: 账号格式错误、密码太短、账号已存在、必填字段缺失
  - 500: 服务器内部错误

### 2. 用户登录

**获取用户认证Token**

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **认证**: 不需要
- **请求体**:

```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

- **成功响应** (200):

```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "nickname": "用户昵称",
    "coins": 150,
    "level": "B1",
    "total_questions": 42,
    "stamina": 85,
    "max_stamina": 100,
    "role": "user"
  }
}
```

- **字段说明**:
  - `token`: JWT Token，需要在后续请求的Header中携带
  - `user.nickname`: 用户昵称
  - `user.coins`: 用户当前 Coin 数量
  - `user.level`: 用户当前等级（A1, A2, B1, B2, C1, C2）
  - `user.total_questions`: 用户做题总数
  - `user.stamina`: 当前体力值
  - `user.max_stamina`: 体力上限
  - `user.role`: 用户角色（USER 或 ADMIN）

- **错误响应**:
  - 401: 账号或密码错误
  - 500: 服务器内部错误

### 3. 用户信息更新

**更新用户密码或昵称**

- **URL**: `/api/auth/update`
- **Method**: `POST`
- **认证**: 可选（见逻辑说明）
- **请求体**:

```json
{
  "username": "user@example.com", // 修改密码时必填，修改昵称且无token时必填
  "security_answer": "ANSWER", // 修改密码时必填，修改昵称且无token时必填
  "newPassword": "new_password123", // 可选，新密码（如果修改密码）
  "newNickname": "新昵称" // 可选，新昵称（如果修改昵称）
}
```

- **逻辑说明**:
  1. **修改密码**: 必须提供 `username` 和 `security_answer` 验证身份，`newPassword` 为新密码
  2. **修改昵称**:
     - **有有效Token**: 只需提供 `newNickname`（Token中已包含用户身份）
     - **无Token**: 必须提供 `username`、`security_answer` 和 `newNickname`
  3. **同时修改密码和昵称**: 按修改密码流程处理，昵称会一并更新

- **验证规则**:
  - 新密码长度：≥6个字符
  - 新昵称长度：≤10个字符，不能为空
  - 至少提供 `newPassword` 或 `newNickname` 中的一个
  - 密保答案验证：会转换为大写后比对哈希值

- **成功响应** (200):

```json
{
  "message": "密码更新成功" // 或 "昵称更新成功"，或 "密码更新成功，昵称已更新"
}
```

- **错误响应**:
  - 400: 参数验证失败（至少需要一个更新字段、密码太短、昵称太长等）
  - 401: 密保答案错误
  - 404: 用户不存在
  - 500: 服务器内部错误

### 4. 用户认证测试

**验证Token有效性**

- **URL**: `/api/auth/test`
- **Method**: `GET`
- **认证**: 需要用户Token
- **请求头**: `Authorization: Bearer <token>`

- **成功响应** (200):

```json
{
  "message": "认证成功",
  "user": {
    "id": 1,
    "username": "user@example.com"
  }
}
```

- **用途**: 用于检查Token是否有效，获取当前用户信息

### 5. 发送密码重置验证码

**用户忘记密码时，向注册邮箱发送验证码**

- **URL**: `/api/auth/send-reset-code`
- **Method**: `POST`
- **认证**: 不需要
- **请求体**:

```json
{
  "email": "user@example.com"
}
```

- **验证规则**:
  - 邮箱格式必须正确
  - 邮箱必须已注册

- **成功响应** (200):

```json
{
  "message": "验证码已发送，请检查邮箱"
}
```

- **错误响应**:
  - 400: 邮箱格式不正确
  - 404: 该邮箱未注册
  - 500: 服务器内部错误

### 6. 重置密码

**通过邮箱验证码重置密码**

- **URL**: `/api/auth/reset-password`
- **Method**: `POST`
- **认证**: 不需要
- **请求体**:

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "new_password123"
}
```

- **验证规则**:
  - 验证码为6位数字
  - 新密码长度至少6个字符
  - 验证码5分钟内有效
  - 验证码使用后立即失效（防止重复使用）

- **成功响应** (200):

```json
{
  "message": "密码重置成功"
}
```

- **错误响应**:
  - 400: 验证码错误或已过期、密码太短、参数格式不正确
  - 500: 服务器内部错误

---

## 📚 素材管理接口

### 1. 获取素材列表

**获取所有素材的简要信息**

- **URL**: `/api/materials`
- **Method**: `GET`
- **认证**: 需要用户Token
- **查询参数**:
  - `type` (可选): `reading` 或 `listening`
  - `level` (可选): `A1`, `A2`, `B1`, `B2`, `C1`, `C2`

- **示例请求**:

```
GET /api/materials?type=reading&level=B1
```

- **成功响应** (200):

```json
[
  {
    "id": 1,
    "type": "reading",
    "level": "B1",
    "title": "环境保护的重要性",
    "media_url": null,
    "image_url": "/uploads/image_12345.jpg",
    "country": "",
    "topic": "",
    "created_at": "2026-04-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "type": "listening",
    "level": "B1",
    "title": "日常对话练习",
    "media_url": "/uploads/audio_67890.mp3",
    "image_url": null,
    "country": "",
    "topic": "",
    "created_at": "2026-04-14T15:45:00.000Z"
  }
]
```

### 2. 获取素材详情

**获取指定素材的完整内容和题目**

- **URL**: `/api/materials/:id`
- **Method**: `GET`
- **认证**: 需要用户Token
- **路径参数**:
  - `id`: 素材ID（必须是数字）

- **示例请求**:

```
GET /api/materials/1
```

- **成功响应** (200):

```json
{
  "id": 1,
  "type": "reading",
  "level": "B1",
  "title": "环境保护的重要性",
  "content": "环境保护是当今社会面临的重要课题...",
  "media_url": null,
  "image_url": "/uploads/image_12345.jpg",
  "country": "",
  "topic": "",
  "full_analysis": "本文讨论了环境保护的多个方面...",
  "created_at": "2026-04-15T10:30:00.000Z",
  "questions": [
    {
      "id": 1,
      "q_type": "choice",
      "stem": "文章主要讨论了什么？",
      "options": ["环境保护", "经济发展", "政治体制", "科技创新"],
      "std_answer": "A"
    },
    {
      "id": 2,
      "q_type": "fill",
      "stem": "环境保护有助于维护生态______。",
      "options": null,
      "std_answer": "平衡"
    }
  ],
  "lastPractice": "2026-04-10T08:15:00.000Z" // 上次练习时间，null表示从未练习过
}
```

- **字段说明**:
  - `questions.q_type`: 题目类型，`choice`（选择题）、`bool`（判断题）或 `fill`（填空题）
  - `questions.options`: 选择题的选项数组，填空题为null
  - `lastPractice`: 用户上次练习该素材的时间，用于显示"3天前做过"等提示

- **错误响应**:
  - 400: 素材ID格式错误（非数字）
  - 404: 素材不存在
  - 500: 服务器内部错误

---

## 📝 练习提交接口

### 体力机制

- **消耗**：每次提交练习消耗 **10 体力**
- **恢复**：每 **5 分钟**自动恢复 1 点体力（所有 API 请求时自动同步）
- **上限**：体力不会超过 `max_stamina`
- **补給**：可使用 food 类物品恢复体力（参见游戏接口）

### 1. 提交练习答案

**提交用户对素材的练习答案并获取评分及掉落奖励**

- **URL**: `/api/practice/submit`
- **Method**: `POST`
- **认证**: 需要用户Token
- **请求体**:

```json
{
  "materialId": 1,
  "answers": [
    {
      "qId": 1,
      "val": "A"
    },
    {
      "qId": 2,
      "val": "平衡"
    }
  ]
}
```

- **参数说明**:
  - `materialId`: 素材ID（必须是数字）
  - `answers`: 答案数组，每个对象包含：
    - `qId`: 题目ID（对应素材详情中的题目ID）
    - `val`: 用户答案值

- **评分规则**:
  1. **体力检查**: 体力不足 10 时返回 403，不允许提交
  2. **体力扣减**: 每次提交消耗 10 体力
  3. **做题统计**: 每次提交 `total_questions` +1（无论对错）
  4. **正确率计算**: 对比用户答案和标准答案
  5. **通过标准**: ≥60% 正确率
  6. **掉落判定**（仅通过时触发）：根据 `material_reward_configs` 配置的概率掉落 items 或 collections

- **成功响应（通过并有掉落）** (200):

```json
{
  "isPassed": true,
  "correctCount": 5,
  "totalQuestions": 8,
  "stamina": 75,
  "message": "恭喜！获得 🍎 魔法苹果 x2、📀 爵士专辑",
  "drops": [
    {
      "rewardType": "item",
      "rewardId": 1,
      "name": "魔法苹果",
      "emoji": "🍎",
      "quantity": 2
    },
    {
      "rewardType": "collection",
      "rewardId": 1,
      "name": "爵士专辑",
      "quantity": 1
    }
  ],
  "answerDetails": [
    {
      "qId": 1,
      "qType": "choice",
      "stem": "以下哪个选项是正确的？",
      "options": ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"],
      "userAnswer": "B",
      "correctAnswer": "A",
      "isCorrect": false
    },
    {
      "qId": 2,
      "qType": "bool",
      "stem": "地球是平的。",
      "options": ["T", "F"],
      "userAnswer": "F",
      "correctAnswer": "F",
      "isCorrect": true
    },
    {
      "qId": 3,
      "qType": "fill",
      "stem": "中国的首都是______。",
      "options": null,
      "userAnswer": "北京",
      "correctAnswer": "北京",
      "isCorrect": true
    }
  ]
}
```

- **成功响应（通过但无掉落）** (200):

```json
{
  "isPassed": true,
  "correctCount": 5,
  "totalQuestions": 8,
  "stamina": 75,
  "message": "通过但未掉落物品，继续加油！",
  "drops": [],
  "answerDetails": [ ... ]
}
```

- **成功响应（未通过）** (200):

```json
{
  "isPassed": false,
  "correctCount": 3,
  "totalQuestions": 8,
  "stamina": 75,
  "message": "正确率未达标（3/8），无奖励",
  "drops": [],
  "answerDetails": [ ... ]
}
```

- **字段说明**:
  - `isPassed`: 是否通过（正确率≥60%）
  - `correctCount`: 答对题目数
  - `totalQuestions`: 总题目数
  - `stamina`: 剩余体力值
  - `message`: 详细结果信息（包含掉落情况）
  - `drops`: 掉落的奖励数组
    - `rewardType`: 奖励类型（`item` 或 `collection`）
    - `rewardId`: 奖励ID
    - `name`: 奖励名称
    - `emoji`: 物品 Emoji（仅 item 类型有此字段）
    - `quantity`: 获得数量
  - `answerDetails`: 题目答案详细对比数组
    - `qId`: 题目ID
    - `qType`: 题目类型（choice: 选择题, bool: 判断题, fill: 填空题）
    - `stem`: 题干内容
    - `options`: 选项数组（选择题为字符串数组，填空题为 null）
    - `userAnswer`: 用户提交的答案
    - `correctAnswer`: 标准答案
    - `isCorrect`: 用户答案是否正确

- **错误响应**:
  - 400: 参数验证失败（materialId非数字，answers格式错误）
  - 403: 体力不足（`stamina < 10`），响应包含当前体力值
  - 500: 服务器内部错误

- **体力不足响应** (403):

```json
{
  "message": "体力不足，请稍后再试",
  "stamina": 5
}
```

---

## ⭐ 用户收藏接口

### 1. 添加收藏

**用户收藏某个学习素材**

- **URL**: `/api/favorites/add`
- **Method**: `POST`
- **认证**: 需要用户Token
- **请求体**:

```json
{
  "materialId": 1
}
```

- **参数说明**:
  - `materialId`: 素材ID（必须是数字）

- **验证规则**:
  - 素材必须存在
  - 不能重复收藏同一素材

- **成功响应** (201):

```json
{
  "message": "收藏成功"
}
```

- **错误响应**:
  - 400: 已收藏该素材、参数验证失败
  - 404: 素材不存在
  - 500: 服务器内部错误

### 2. 取消收藏

**用户取消收藏某个学习素材**

- **URL**: `/api/favorites/remove`
- **Method**: `DELETE`
- **认证**: 需要用户Token
- **请求体**:

```json
{
  "materialId": 1
}
```

- **成功响应** (200):

```json
{
  "message": "取消收藏成功"
}
```

- **错误响应**:
  - 400: 未收藏该素材
  - 500: 服务器内部错误

### 3. 获取用户收藏列表

**获取当前用户收藏的所有素材列表**

- **URL**: `/api/favorites`
- **Method**: `GET`
- **认证**: 需要用户Token

- **成功响应** (200):

```json
[
  {
    "id": 1,
    "type": "reading",
    "level": "B1",
    "title": "环境保护的重要性",
    "content": "环境保护是当今社会面临的重要课题...",
    "media_url": null,
    "image_url": "/uploads/image_12345.jpg",
    "country": "",
    "topic": "",
    "created_at": "2026-04-15T10:30:00.000Z",
    "favorited_at": "2026-04-20T14:56:27.000Z"
  }
]
```

- **字段说明**:
  - `favorited_at`: 收藏时间
  - 其他字段同素材列表接口

### 4. 检查收藏状态

**检查用户是否收藏了某个素材**

- **URL**: `/api/favorites/check/:materialId`
- **Method**: `GET`
- **认证**: 需要用户Token
- **路径参数**:
  - `materialId`: 素材ID（必须是数字）

- **成功响应** (200):

```json
{
  "isFavorited": true
}
```

### 5. 素材详情新增字段

在素材详情接口（`GET /api/materials/:id`）的响应中新增了 `isFavorited` 字段，表示当前用户是否收藏了该素材。

**示例响应**:

```json
{
  "id": 1,
  "type": "reading",
  "level": "B1",
  "title": "环境保护的重要性",
  "content": "环境保护是当今社会面临的重要课题...",
  "media_url": null,
  "image_url": "/uploads/image_12345.jpg",
  "country": "",
  "topic": "",
  "full_analysis": "本文讨论了环境保护的多个方面...",
  "created_at": "2026-04-15T10:30:00.000Z",
  "questions": [ ... ],
  "lastPractice": "2026-04-10T08:15:00.000Z",
  "isFavorited": true
}
```

---

## 🎮 游戏接口

### 1. 获取用户状态

**获取用户统计信息（体力、Coins、做题数等）**

- **URL**: `/api/user/stats`
- **Method**: `GET`
- **认证**: 需要用户Token
- **说明**: 请求前自动同步体力恢复

- **成功响应** (200):

```json
{
  "nickname": "用户昵称",
  "coins": 150,
  "level": "B1",
  "totalQuestions": 42,
  "stamina": 85,
  "maxStamina": 100
}
```

---

### 2. 查看背包

**获取用户背包中的物品列表**

- **URL**: `/api/items/inventory`
- **Method**: `GET`
- **认证**: 需要用户Token

- **成功响应** (200):

```json
{
  "items": [
    {
      "item_id": 1,
      "quantity": 5,
      "name": "魔法苹果",
      "emoji": "🍎",
      "type": "food",
      "description": "回复体力的神奇苹果",
      "recovery_value": 20,
      "sell_price": 0
    },
    {
      "item_id": 2,
      "quantity": 3,
      "name": "金色羽毛",
      "emoji": "🪶",
      "type": "item",
      "description": "稀有的金色羽毛",
      "recovery_value": 0,
      "sell_price": 50
    }
  ]
}
```

- **字段说明**:
  - `type`: `food`（可食用恢复体力）或 `item`（可售卖换取 Coin）
  - `recovery_value`: 体力恢复值（仅 food 有效）
  - `sell_price`: 售卖获得的 Coin 数量

---

### 3. 出售物品

**出售背包中的物品换取 Coins**

- **URL**: `/api/items/sell`
- **Method**: `POST`
- **认证**: 需要用户Token
- **请求体**:

```json
{
  "itemId": 2,
  "quantity": 2
}
```

- **约束**:
  - `food` 类型物品不可售卖
  - `sell_price` 为 0 的物品不可售卖
  - 背包中数量必须足够

- **成功响应** (200):

```json
{
  "message": "成功卖出 2 个 金色羽毛，获得 100 Coins",
  "coins": 250,
  "soldQuantity": 2,
  "remainingQuantity": 1
}
```

- **错误响应**:
  - 400: 物品不存在、食物不可售卖、背包数量不足
  - 500: 服务器内部错误

---

### 4. 使用食物

**使用食物恢复体力**

- **URL**: `/api/items/use`
- **Method**: `POST`
- **认证**: 需要用户Token
- **请求体**:

```json
{
  "itemId": 1,
  "quantity": 2
}
```

- **约束**:
  - 仅 `food` 类型物品可使用
  - `recovery_value` > 0 才有效
  - 恢复后体力不会超过 `max_stamina`

- **成功响应** (200):

```json
{
  "message": "成功使用 2 个 魔法苹果，恢复 40 体力",
  "stamina": 100,
  "maxStamina": 100
}
```

- **错误响应**:
  - 400: 物品不存在、非食物无法食用、背包数量不足
  - 500: 服务器内部错误

---

### 5. 购买收藏品

**使用 Coins 购买收藏品**

- **URL**: `/api/shop/buy`
- **Method**: `POST`
- **认证**: 需要用户Token
- **请求体**:

```json
{
  "collectionId": 1
}
```

- **约束**:
  - Coins 余额必须足够
  - 不能重复购买已拥有的收藏品

- **成功响应** (200):

```json
{
  "message": "成功购买 爵士专辑",
  "coins": 50,
  "collection": {
    "id": 1,
    "name": "爵士专辑",
    "imageUrl": "/uploads/image/jazz_album.jpg",
    "mediaUrl": "/uploads/media/jazz_music.mp3"
  }
}
```

- **错误响应**:
  - 400: 收藏品不存在、已拥有该收藏品、Coins 不足
  - 500: 服务器内部错误

---

### 6. 查看我的收藏品

**获取用户已购买的收藏品列表**

- **URL**: `/api/collections/mine`
- **Method**: `GET`
- **认证**: 需要用户Token

- **成功响应** (200):

```json
{
  "collections": [
    {
      "collection_id": 1,
      "purchased_at": "2026-04-27T10:30:00.000Z",
      "name": "爵士专辑",
      "category": "album",
      "image_url": "/uploads/image/jazz_album.jpg",
      "media_url": "/uploads/media/jazz_music.mp3",
      "description": "经典爵士乐合辑"
    }
  ]
}
```

- **字段说明**:
  - `category`: 收藏品类别（`album`、`other`、`physical`）
  - `image_url`: 封面/预览图 URL
  - `media_url`: 核心资源（PDF/音频/动画）URL

---

## 👨‍💼 管理员接口

### 1. 管理员登录

**管理员专用登录接口**

- **URL**: `/api/auth/admin/login`
- **Method**: `POST`
- **认证**: 不需要
- **请求体**:

```json
{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

- **参数说明**:
  - `email`: 管理员邮箱（对应数据库中 role='ADMIN' 的用户）
  - `password`: 管理员密码

- **成功响应** (200):

```json
{
  "message": "管理员登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "adminInfo": {
    "nickname": "管理员昵称",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

- **注意**:
  - 管理员与普通用户使用相同的JWT密钥（JWT_SECRET）
  - Token有效期统一为7天
  - 管理员权限通过在数据库中将用户role字段设为'ADMIN'实现
  - 超级管理员通过注册时匹配 SUPER_ADMIN_EMAIL 自动获得 ADMIN 角色

### 2. 管理员认证测试

**验证管理员Token和权限**

- **URL**: `/api/auth/admin/test`
- **Method**: `GET`
- **认证**: 需要管理员Token
- **请求头**: `Authorization: Bearer <admin_token>`

- **成功响应** (200):

```json
{
  "message": "管理员认证成功",
  "user": {
    "userId": 1,
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### 3. 用户管理（管理员专用）

**获取用户列表，支持搜索和筛选**

- **URL**: `/api/auth/admin/users`
- **Method**: `GET`
- **认证**: 需要管理员Token
- **查询参数**:
  - `keyword` (可选): 搜索关键词，匹配邮箱或昵称
  - `role` (可选): 按角色筛选，`USER` 或 `ADMIN`

- **示例请求**:

```
GET /api/auth/admin/users?keyword=stephen&role=ADMIN
```

- **成功响应** (200):

```json
{
  "total": 1,
  "users": [
    {
      "id": 1,
      "email": "stephen@example.com",
      "nickname": "Stephen",
      "role": "ADMIN",
      "coins": 150,
      "level": "B1",
      "last_practice_date": "2026-04-24T10:30:00.000Z",
      "created_at": "2026-04-20T08:00:00.000Z"
    }
  ]
}
```

- **字段说明**:
  - `total`: 符合条件用户总数
  - `users`: 用户数组
    - `id`: 用户ID
    - `email`: 邮箱
    - `nickname`: 昵称
    - `role`: 角色（USER 或 ADMIN）
    - `coins`: 积分
    - `level`: 当前等级
    - `last_practice_date`: 上次练习时间（从未练习则为 null）
    - `created_at`: 注册时间

- **错误响应**:
  - 401: Token无效或过期
  - 403: 非管理员访问
  - 500: 服务器内部错误

### 3. 创建素材

**管理员创建新的学习素材**

- **URL**: `/api/materials/admin/create`
- **Method**: `POST`
- **认证**: 需要管理员Token
- **请求体**:

```json
{
  "type": "reading",
  "level": "B1",
  "title": "新素材标题",
  "content": "素材正文内容...",
  "full_analysis": "完整解析内容...",
  "media_url": "/uploads/audio_123.mp3", // 可选
  "image_url": "/uploads/image_456.jpg", // 可选
  "country": "", // 可选，国家/地区
  "topic": "" // 可选，主题分类
}
```

- **参数说明**:
  - `type`: 素材类型，`reading` 或 `listening`
  - `level`: 难度等级，`A1`, `A2`, `B1`, `B2`, `C1`, `C2`
  - `title`: 素材标题，不超过255字符
  - `content`: 素材正文内容
  - `full_analysis`: 完整解析（可选）
  - `media_url`: 音频文件URL（听力素材需要）
  - `image_url`: 图片文件URL（可选）
  - `country`: 国家/地区，不超过255字符（可选）
  - `topic`: 主题分类，不超过255字符（可选）

- **成功响应** (201):

```json
{
  "message": "素材创建成功",
  "materialId": 15
}
```

- **文件上传**: 文件需先通过上传接口上传，获取URL后再创建素材

### 4. 批量录入题目

**为指定素材批量添加题目**

- **URL**: `/api/materials/admin/bulk-questions`
- **Method**: `POST`
- **认证**: 需要管理员Token
- **请求体**:

```json
{
  "materialId": 15,
  "questions": [
    {
      "q_type": "choice",
      "stem": "问题题干",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "std_answer": "A"
    },

    {
      "q_type": "bool",
      "stem": "问题题干",
      "options": ["T", "F"],
      "std_answer": "F"
    },

    {
      "q_type": "fill",
      "stem": "填空题题干______。",
      "options": null,
      "std_answer": "答案"
    }
  ]
}
```

- **参数说明**:
  - `materialId`: 素材ID
  - `questions`: 题目数组，每个题目包含：
    - `q_type`: 题目类型，`choice`（选择题）、`bool`（判断题）或 `fill`（填空题）
    - `stem`: 题干
    - `options`: 选择题选项数组（JSON字符串化存储），填空题为null
    - `std_answer`: 标准答案

- **成功响应** (201):

````json
{
  "message": "题目批量录入成功"
}

### 5. 更新素材
**管理员更新已有学习素材**

- **URL**: `/api/materials/admin/materials/:id`
- **Method**: `PUT`
- **认证**: 需要管理员Token
- **路径参数**:
  - `id`: 素材ID（必须是数字）
- **请求体**:
```json
{
  "type": "reading",                         // 可选，素材类型：reading/listening
  "level": "B1",                            // 可选，难度等级：A1/A2/B1/B2/C1/C2
  "title": "更新后的素材标题",                // 可选，素材标题
  "content": "更新后的素材正文内容...",      // 可选，素材正文
  "full_analysis": "更新后的完整解析...",    // 可选，完整解析
  "media_url": "/uploads/updated_audio.mp3", // 可选，音频文件URL
  "image_url": "/uploads/updated_image.jpg",  // 可选，图片文件URL
  "country": "",  // 可选，国家/地区
  "topic": "",  // 可选，主题分类
}
````

- **参数说明**:
  - 至少需要提供一个更新字段
  - 所有字段均为可选，但至少提供一个
  - 类型和等级必须为有效值
  - 标题长度不超过255字符
  - 内容不能为空字符串

- **注意**:
  - 如果更新了 `media_url` 或 `image_url`，旧的对应文件会从服务器上删除（先更新数据库，再删旧文件）
  - 如果旧文件不存在于磁盘上，会自动跳过删除操作，不影响更新

- **成功响应** (200):

```json
{
  "message": "素材更新成功"
}
```

- **错误响应**:
  - 400: 参数验证失败（无更新字段、类型/等级无效、标题太长等）
  - 404: 素材未找到
  - 500: 服务器内部错误

### 6. 删除素材

**管理员删除学习素材及相关题目**

- **URL**: `/api/materials/admin/materials/:id`
- **Method**: `DELETE`
- **认证**: 需要管理员Token
- **路径参数**:
  - `id`: 素材ID（必须是数字）

- **注意**:
  - 删除素材会级联删除所有关联的题目（数据库外键约束）
  - 同时会删除用户收藏记录和练习历史记录
  - 素材关联的图片和音频文件会从服务器上同步删除（先删数据库记录，再删文件）

- **成功响应** (200):

```json
{
  "message": "素材删除成功"
}
```

- **错误响应**:
  - 404: 素材未找到
  - 500: 服务器内部错误

### 7. 更新题目

**管理员更新单个题目**

- **URL**: `/api/materials/admin/questions/:id`
- **Method**: `PUT`
- **认证**: 需要管理员Token
- **路径参数**:
  - `id`: 题目ID（必须是数字）
- **请求体**:

```json
{
  "q_type": "choice", // 可选，题目类型：choice/bool/fill
  "stem": "更新后的题干内容", // 可选，题干
  "options": ["选项A", "选项B", "选项C"], // 可选，选择题选项数组（填空题为null）
  "std_answer": "B" // 可选，标准答案
}
```

- **参数说明**:
  - 至少需要提供一个更新字段
  - 所有字段均为可选，但至少提供一个
  - 题目类型必须为有效值
  - 题干不能为空字符串
  - 选项必须是字符串数组（填空题为null）

- **成功响应** (200):

```json
{
  "message": "题目更新成功"
}
```

- **错误响应**:
  - 400: 参数验证失败（无更新字段、类型无效、选项格式错误等）
  - 404: 题目未找到
  - 500: 服务器内部错误

### 8. 删除题目

**管理员删除单个题目**

- **URL**: `/api/materials/admin/questions/:id`
- **Method**: `DELETE`
- **认证**: 需要管理员Token
- **路径参数**:
  - `id`: 题目ID（必须是数字）

- **注意**:
  - 删除题目不会影响素材本身
  - 用户已提交的练习记录中的答案可能会受到影响

- **成功响应** (200):

```json
{
  "message": "题目删除成功"
}
```

- **错误响应**:
  - 404: 题目未找到
  - 500: 服务器内部错误

### 9. 获取素材题目及答案（管理员专用）

**获取指定素材的完整题目列表，包含正确答案**

- **URL**: `/api/materials/admin/materials/:id/questions`
- **Method**: `GET`
- **认证**: 需要管理员Token
- **路径参数**:
  - `id`: 素材ID（必须是数字）

- **示例请求**:

```
GET /api/materials/admin/materials/1/questions
```

- **成功响应** (200):

```json
{
  "id": 1,
  "type": "reading",
  "level": "B1",
  "title": "环境保护的重要性",
  "content": "环境保护是当今社会面临的重要课题...",
  "media_url": null,
  "image_url": "/uploads/image_12345.jpg",
  "country": "",
  "topic": "",
  "full_analysis": "本文讨论了环境保护的多个方面...",
  "created_at": "2026-04-15T10:30:00.000Z",
  "questions": [
    {
      "id": 1,
      "q_type": "choice",
      "stem": "文章主要讨论了什么？",
      "options": ["环境保护", "经济发展", "政治体制", "科技创新"],
      "std_answer": "A"
    },
    {
      "id": 2,
      "q_type": "fill",
      "stem": "环境保护有助于维护生态______。",
      "options": null,
      "std_answer": "平衡"
    }
  ]
}
```

- **字段说明**:
  - `std_answer`: 标准答案（此字段仅在管理员接口返回，普通用户素材详情接口不返回）
  - 其他字段同普通素材详情接口

- **错误响应**:
  - 400: 素材ID格式错误（非数字）
  - 404: 素材未找到
  - 500: 服务器内部错误

---

### 10. 物品管理（Items CRUD）

#### 10.1 获取物品列表

- **URL**: `/api/admin/items`
- **Method**: `GET`
- **认证**: 需要管理员Token
- **查询参数**:
  - `type` (可选): `food` 或 `item`

- **成功响应** (200):

```json
{
  "items": [
    {
      "id": 1,
      "name": "魔法苹果",
      "emoji": "🍎",
      "type": "food",
      "description": "回复体力的神奇苹果",
      "recovery_value": 20,
      "sell_price": 0,
      "buy_price": 0,
      "created_at": "2026-04-27T10:00:00.000Z"
    }
  ]
}
```

#### 10.2 获取单个物品

- **URL**: `/api/admin/items/:id`
- **Method**: `GET`
- **认证**: 需要管理员Token

#### 10.3 创建物品

- **URL**: `/api/admin/items`
- **Method**: `POST`
- **认证**: 需要管理员Token
- **请求体**:

```json
{
  "name": "魔法苹果",
  "emoji": "🍎",
  "type": "food",
  "description": "回复体力的神奇苹果",
  "recovery_value": 20,
  "sell_price": 0,
  "buy_price": 0
}
```

- **参数说明**:
  - `name` (必填): 物品名称
  - `emoji` (必填): Emoji 字符
  - `type` (必填): `food`（恢复体力）或 `item`（可售卖）
  - `description` (可选): 物品描述
  - `recovery_value` (可选, 默认0): 体力恢复值（仅 food 有效）
  - `sell_price` (可选, 默认0): 售卖获得 Coin 数（food 不可售卖则设为 0）
  - `buy_price` (可选, 默认0): 商店买入价格

#### 10.4 更新物品

- **URL**: `/api/admin/items/:id`
- **Method**: `PUT`
- **认证**: 需要管理员Token
- **请求体**: 同创建，所有字段可选

#### 10.5 删除物品

- **URL**: `/api/admin/items/:id`
- **Method**: `DELETE`
- **认证**: 需要管理员Token

---

### 11. 收藏品管理（Collections CRUD）

#### 11.1 获取收藏品列表

- **URL**: `/api/admin/collections`
- **Method**: `GET`
- **认证**: 需要管理员Token
- **查询参数**:
  - `category` (可选): `album`、`other`、`physical`

- **成功响应** (200):

```json
{
  "collections": [
    {
      "id": 1,
      "name": "爵士专辑",
      "category": "album",
      "image_url": "/uploads/image/jazz_album.jpg",
      "media_url": "/uploads/media/jazz_music.mp3",
      "buy_price": 200,
      "description": "经典爵士乐合辑",
      "created_at": "2026-04-27T10:00:00.000Z"
    }
  ]
}
```

#### 11.2 获取单个收藏品

- **URL**: `/api/admin/collections/:id`
- **Method**: `GET`
- **认证**: 需要管理员Token

#### 11.3 创建收藏品

- **URL**: `/api/admin/collections`
- **Method**: `POST`
- **认证**: 需要管理员Token
- **请求体**:

```json
{
  "name": "爵士专辑",
  "category": "album",
  "image_url": "/uploads/image/jazz_album.jpg",
  "media_url": "/uploads/media/jazz_music.mp3",
  "buy_price": 200,
  "description": "经典爵士乐合辑"
}
```

- **参数说明**:
  - `name` (必填): 收藏品名称
  - `category` (必填): `album`、`other` 或 `physical`
  - `buy_price` (必填): 购买所需 Coin 数，≥0
  - `image_url` (可选): 封面/预览图 URL
  - `media_url` (可选): 核心资源 URL
  - `description` (可选): 描述

#### 11.4 更新收藏品

- **URL**: `/api/admin/collections/:id`
- **Method**: `PUT`
- **认证**: 需要管理员Token
- **请求体**: 同创建，所有字段可选

#### 11.5 删除收藏品

- **URL**: `/api/admin/collections/:id`
- **Method**: `DELETE`
- **认证**: 需要管理员Token

---

### 12. 奖励配置管理（Reward Configs CRUD）

**说明**: 为素材配置掉落物品/收藏品的概率和数量。

#### 12.1 获取奖励配置列表

- **URL**: `/api/admin/reward-configs`
- **Method**: `GET`
- **认证**: 需要管理员Token
- **查询参数**:
  - `material_id` (可选): 按素材 ID 筛选

- **成功响应** (200):

```json
{
  "configs": [
    {
      "id": 1,
      "material_id": 1,
      "reward_type": "item",
      "reward_id": 2,
      "drop_rate": 30.5,
      "min_quantity": 1,
      "max_quantity": 3
    }
  ]
}
```

#### 12.2 获取单个奖励配置

- **URL**: `/api/admin/reward-configs/:id`
- **Method**: `GET`
- **认证**: 需要管理员Token

#### 12.3 创建奖励配置

- **URL**: `/api/admin/reward-configs`
- **Method**: `POST`
- **认证**: 需要管理员Token
- **请求体**:

```json
{
  "material_id": 1,
  "reward_type": "item",
  "reward_id": 2,
  "drop_rate": 30.5,
  "min_quantity": 1,
  "max_quantity": 3
}
```

- **参数说明**:
  - `material_id` (必填): 关联的素材 ID（素材必须存在）
  - `reward_type` (必填): `item` 或 `collection`
  - `reward_id` (必填): 对应的 items 或 collections 的 ID（必须存在）
  - `drop_rate` (必填): 掉落概率 0-100（支持小数）
  - `min_quantity` (可选, 默认1): 最小掉落数量
  - `max_quantity` (可选, 默认1): 最大掉落数量
- **掉落逻辑**: 生成 0-100 随机数，若小于 `drop_rate` 则中奖，实际数量在 `min_quantity` 到 `max_quantity` 之间随机

#### 12.4 更新奖励配置

- **URL**: `/api/admin/reward-configs/:id`
- **Method**: `PUT`
- **认证**: 需要管理员Token
- **请求体**: 同创建，所有字段可选

#### 12.5 删除奖励配置

- **URL**: `/api/admin/reward-configs/:id`
- **Method**: `DELETE`
- **认证**: 需要管理员Token

---

## 🔧 文件上传接口

### 1. 文件上传

**上传图片或音频文件到服务器**

- **URL**: `/api/upload/`
- **Method**: `POST`
- **认证**: 需要用户Token（普通用户和管理员都可以上传）
- **请求格式**: `multipart/form-data`
- **表单字段**:
  - `file`: 文件字段（必须）

- **请求头**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

- **文件限制**:
  - **允许类型**: jpg, jpeg, png, gif, mp3, wav, mp4
  - **大小限制**: 单个文件≤10MB
  - **存储位置**:
    - 图片: `uploads/image/` (MIME类型: image/\*)
    - 音频/视频: `uploads/media/` (MIME类型: audio/_, video/_)
  - **访问方式**: `http://localhost:3000/uploads/{image|media}/filename.ext`

- **成功响应** (201):

```json
{
  "message": "文件上传成功",
  "fileInfo": {
    "filename": "1776696987000-802505576-7fdc5047.png",
    "originalname": "test_image.png",
    "mimetype": "image/png",
    "size": 258,
    "url": "/uploads/image/1776696987000-802505576-7fdc5047.png",
    "destination": "uploads/image/",
    "relativePath": "image"
  }
}
```

- **字段说明**:
  - `fileInfo.filename`: 服务器生成的安全文件名
  - `fileInfo.originalname`: 原始文件名
  - `fileInfo.mimetype`: 文件MIME类型
  - `fileInfo.size`: 文件大小（字节）
  - `fileInfo.url`: 文件访问URL（用于素材创建）
  - `fileInfo.destination`: 存储目录
  - `fileInfo.relativePath`: 相对路径（用于URL构造）

- **错误响应**:
  - 400: 文件类型不支持、文件过大、未选择文件
  - 401: Token无效或过期
  - 500: 服务器内部错误

### 2. 获取上传文件列表（管理员专用）

**获取服务器上所有已上传的文件信息**

- **URL**: `/api/upload/list`
- **Method**: `GET`
- **认证**: 需要管理员Token
- **请求头**: `Authorization: Bearer <admin_token>`

- **成功响应** (200):

```json
{
  "message": "获取文件列表成功",
  "total": 1,
  "files": [
    {
      "name": "1776696987000-802505576-7fdc5047.png",
      "path": "uploads/image/1776696987000-802505576-7fdc5047.png",
      "url": "/uploads/image/1776696987000-802505576-7fdc5047.png",
      "size": 258,
      "type": "image",
      "modified": "2026-04-20T14:56:27.000Z"
    }
  ]
}
```

### 3. 删除文件（管理员专用）

**删除服务器上的上传文件**

- **URL**: `/api/upload/delete`
- **Method**: `DELETE`
- **认证**: 需要管理员Token
- **请求头**: `Authorization: Bearer <admin_token>`
- **请求体**:

```json
{
  "filename": "1776696987000-802505576-7fdc5047.png",
  "type": "image"
}
```

- **参数说明**:
  - `filename`: 文件名（服务器生成的安全文件名）
  - `type`: 文件类型，`image` 或 `media`

- **成功响应** (200):

```json
{
  "message": "文件删除成功",
  "deletedFile": "1776696987000-802505576-7fdc5047.png"
}
```

- **错误响应**:
  - 400: 参数验证失败（文件名或类型为空、类型无效）
  - 404: 文件不存在
  - 409: 文件正在被素材使用，无法删除（响应中包含素材名称和 ID）
  - 500: 服务器内部错误

````

### 4. 文件上传流程（前端集成示例）
1. **用户选择文件**并触发上传
2. **前端验证文件**类型和大小
3. **发送上传请求**到 `/api/upload/`，携带用户Token
4. **接收响应**，获取文件URL
5. **创建素材时**使用返回的URL作为`media_url`或`image_url`

- **前端示例代码** (JavaScript):
```javascript
// 文件上传函数
async function uploadFile(file, token) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // 注意：不要设置Content-Type，浏览器会自动设置multipart/form-data
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '上传失败');
  }

  return await response.json();
}

// 创建素材时使用上传的文件
async function createMaterial(materialData, fileUrl, token) {
  const response = await fetch('/api/materials/admin/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...materialData,
      image_url: fileUrl  // 或 media_url
    })
  });

  return await response.json();
}
````

---

## ⚠️ 注意事项

### 1. 认证头格式

```javascript
// 正确格式
headers: {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
}

// 错误格式 - 缺少Bearer前缀
headers: {
  'Authorization': token  // 错误！
}
```

### 2. 密码安全

- 前端应对密码进行适当隐藏（显示为\*\*\*\*）
- 不建议在前端存储明文密码
- 使用HTTPS传输敏感数据

### 3. 错误处理建议

```javascript
// 建议的错误处理逻辑
try {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    // 处理HTTP错误
    if (response.status === 401) {
      // Token过期，跳转到登录页
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error(data.message || "请求失败");
  }

  return data;
} catch (error) {
  // 显示用户友好的错误信息
  showNotification(error.message);
  throw error;
}
```

### 4. 本地开发配置

```javascript
// 开发环境配置示例
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.yourdomain.com/api"
    : "http://localhost:3000/api";
```

---

## 📝 更新日志

### 2026-04-27 (游戏系统重构)

- **体力机制**：新增体力系统，每次答题消耗 10 体力，每 5 分钟自动恢复 1 点，所有 API 请求自动同步体力
- **答题奖励重构**：移除旧的 Coins + 冷却期奖励机制，改为基于 `material_reward_configs` 配置的掉落系统（items + collections）
- **做题统计**：每次提交练习 `total_questions` +1，通过 `GET /api/user/stats` 获取完整统计
- **交易系统**：
  - `POST /api/items/sell` — 出售 items 换取 Coins
  - `POST /api/items/use` — 使用 food 恢复体力
  - `POST /api/shop/buy` — 使用 Coins 购买 collections
- **背包与收藏**：
  - `GET /api/items/inventory` — 查看背包物品
  - `GET /api/collections/mine` — 查看已购收藏品
- **管理员接口扩展**：
  - `items` 完整 CRUD（`/api/admin/items`）
  - `collections` 完整 CRUD（`/api/admin/collections`）
  - `material_reward_configs` 完整 CRUD（`/api/admin/reward-configs`）
- 更新接口文档，完善游戏系统各接口说明

---
