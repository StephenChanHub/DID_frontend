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
4. **权限区分**: 普通用户和管理员使用相同的密钥，管理员接口需要 `role: 'admin'` 权限（通过在数据库中将用户role字段改为'admin'实现）

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

| 状态码 | 说明           | 常见场景                           |
| ------ | -------------- | ---------------------------------- |
| 200    | 成功           | 获取数据、登录成功                 |
| 201    | 创建成功       | 注册成功、创建素材成功             |
| 400    | 请求错误       | 参数验证失败、格式错误             |
| 401    | 未授权         | Token无效、过期、密码错误          |
| 403    | 禁止访问       | 权限不足（非管理员访问管理员接口） |
| 404    | 资源不存在     | 素材ID不存在                       |
| 500    | 服务器内部错误 | 数据库异常、未捕获错误             |

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
    "points": 150.5,
    "level": "B1",
    "role": "user"
  }
}
```

- **字段说明**:
  - `token`: JWT Token，需要在后续请求的Header中携带
  - `user.nickname`: 用户昵称
  - `user.points`: 用户当前积分（浮点数）
  - `user.level`: 用户当前等级（A1, A2, B1, B2, C1, C2）
  - `user.role`: 用户角色（user 或 admin）

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
    "created_at": "2026-04-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "type": "listening",
    "level": "B1",
    "title": "日常对话练习",
    "media_url": "/uploads/audio_67890.mp3",
    "image_url": null,
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

### 1. 提交练习答案

**提交用户对素材的练习答案并获取评分**

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
  1. **正确率计算**: 对比用户答案和标准答案
  2. **通过标准**: ≥60% 正确率
  3. **冷却期**: 7天（168小时）内重复完成同一素材不会获得新积分
  4. **积分计算**: 根据素材等级给予不同积分
  5. **等级更新**: 完成练习后用户等级可能更新为素材等级

- **成功响应** (200):

```json
{
  "message": "恭喜！获得 1.0 积分，当前等级已更新为 B1",
  "isPassed": true,
  "correctCount": 5,
  "totalQuestions": 8,
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
      "options": [],
      "userAnswer": "F",
      "correctAnswer": "F",
      "isCorrect": true
    },
    {
      "qId": 3,
      "qType": "fill",
      "stem": "中国的首都是______。",
      "options": [],
      "userAnswer": "北京",
      "correctAnswer": "北京",
      "isCorrect": true
    }
  ]
}
```

```json
{
  "message": "正确率未达标或处于冷却期",
  "isPassed": false,
  "correctCount": 3,
  "totalQuestions": 8,
  "answerDetails": [
    // 同上，包含所有题目的详细对比信息
  ]
}
```

- **字段说明**:
  - `isPassed`: 是否通过（正确率≥60%）
  - `correctCount`: 答对题目数
  - `totalQuestions`: 总题目数
  - `message`: 详细结果信息（包含积分获得情况）
  - `answerDetails`: 题目答案详细对比数组（新增）
    - `qId`: 题目ID
    - `qType`: 题目类型（choice: 选择题, bool: 判断题, fill: 填空题）
    - `stem`: 题干内容
    - `options`: 选项数组（选择题为字符串数组，其他类型为空数组）
    - `userAnswer`: 用户提交的答案
    - `correctAnswer`: 标准答案
    - `isCorrect`: 用户答案是否正确

- **错误响应**:
  - 400: 参数验证失败（materialId非数字，answers格式错误）
  - 500: 服务器内部错误

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
  "full_analysis": "本文讨论了环境保护的多个方面...",
  "created_at": "2026-04-15T10:30:00.000Z",
  "questions": [ ... ],
  "lastPractice": "2026-04-10T08:15:00.000Z",
  "isFavorited": true
}
```

---

## 👨‍💼 管理员接口

### 1. 管理员登录

**管理员专用登录接口（简化版）**

- **URL**: `/api/auth/admin/login`
- **Method**: `POST`
- **认证**: 不需要
- **请求体**:

```json
{
  "username": "admin@example.com",
  "password": "admin_password"
}
```

- **参数说明**:
  - `username`: 管理员账号（必须在数据库中将用户的role字段手动改为'admin'）
  - `password`: 管理员密码

- **成功响应** (200):

```json
{
  "message": "管理员认证成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "adminInfo": {
    "username": "admin@example.com",
    "nickname": "管理员昵称",
    "role": "admin"
  }
}
```

- **注意**:
  - 管理员与普通用户使用相同的JWT密钥（JWT_SECRET）
  - Token有效期统一为7天
  - 管理员权限通过在数据库中将用户role字段改为'admin'实现

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
    "id": 1,
    "username": "admin@example.com",
    "role": "admin"
  }
}
```

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
  "image_url": "/uploads/image_456.jpg" // 可选
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
  "image_url": "/uploads/updated_image.jpg"  // 可选，图片文件URL
}
````

- **参数说明**:
  - 至少需要提供一个更新字段
  - 所有字段均为可选，但至少提供一个
  - 类型和等级必须为有效值
  - 标题长度不超过255字符
  - 内容不能为空字符串

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
  formData.append("file", file);

  const response = await fetch("/api/upload/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // 注意：不要设置Content-Type，浏览器会自动设置multipart/form-data
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "上传失败");
  }

  return await response.json();
}

// 创建素材时使用上传的文件
async function createMaterial(materialData, fileUrl, token) {
  const response = await fetch("/api/materials/admin/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...materialData,
      image_url: fileUrl, // 或 media_url
    }),
  });

  return await response.json();
}
```

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

### 2026-04-21

- 新增用户收藏功能，支持添加/取消收藏、获取收藏列表、检查收藏状态
- 新增收藏接口：`POST /api/favorites/add`, `DELETE /api/favorites/remove`, `GET /api/favorites`, `GET /api/favorites/check/:materialId`
- 素材详情接口新增 `isFavorited` 字段，表示当前用户是否收藏了该素材
- 更新接口文档，增加完整的收藏接口说明

---
