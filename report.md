### 1. 管理员登录

**请求**：

```
POST /api/auth/admin/login
Content-Type: application/json

{
  "username": "18979764502",
  "password": "123456789"
}
```

**响应**：

```
HTTP 200 OK
{
  "message": "管理员认证成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "adminInfo": {
    "username": "18979764502",
    "nickname": "stephen",
    "role": "admin"
  }
}
```

**状态**：✅ 成功

### 2. 素材创建

**请求**：

```
POST /api/materials/admin/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "reading",
  "level": "B1",
  "title": "测试阅读素材",
  "content": "这是一段测试阅读内容，用于测试素材录入功能。",
  "full_analysis": "这是完整解析。",
  "media_url": null,
  "image_url": null
}
```

**响应**：

```
HTTP 201 Created
{
  "message": "素材创建成功",
  "materialId": 29
}
```

**状态**：✅ 成功  
**创建的素材ID**：29

### 3. 题目批量录入

**请求**：

```
POST /api/materials/admin/bulk-questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "materialId": 29,
  "questions": [
    {
      "q_type": "choice",
      "stem": "以下哪个选项是正确的？",
      "options": ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"],
      "std_answer": "A"
    },
    {
      "q_type": "bool",
      "stem": "地球是平的。",
      "options": [],
      "std_answer": "F"
    },
    {
      "q_type": "fill",
      "stem": "中国的首都是______。",
      "options": [],
      "std_answer": "北京"
    }
  ]
}
```

**响应**：

```
HTTP 201 Created
{
  "message": "题目批量录入成功"
}
```

**状态**：✅ 成功  
**录入题目类型**：选择题、判断题、填空题各一题

## 数据验证

通过数据库查询确认数据已正确插入：

```sql
-- 素材记录
SELECT * FROM materials WHERE id = 29;

-- 题目记录
SELECT id, q_type, stem, std_answer FROM questions WHERE material_id = 29;
```

查询结果：

1. 素材ID 29：类型=reading，难度=B1，标题="测试阅读素材"
2. 题目记录：
   - 选择题：题干="以下哪个选项是正确的？"，答案="A"
   - 判断题：题干="地球是平的。"，答案="F"
   - 填空题：题干="中国的首都是**\_\_**。"，答案="北京"

## 测试结论

✅ **所有测试用例通过**

1. **管理员登录功能**：正常，能够正确验证管理员身份并返回JWT token
2. **素材创建功能**：正常，能够成功创建阅读/听力素材并返回素材ID
3. **题目批量录入功能**：正常，能够一次性录入多种题型（选择题、判断题、填空题）并关联到指定素材

所有API端点响应状态码正确，业务逻辑符合预期，数据完整性和关联性得到保障。

---
