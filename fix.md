# 安全修复日志（2026-04-30）

## 本次修复范围（8项）

1. 认证与验证码接口限流（防爆破/防轰炸）。
2. 上传与管理端接口基础限流。
3. 文件删除路径穿越防护。
4. 移除注册时通过邮箱自动授予 ADMIN 的逻辑。
5. 统一错误响应，去除 debug/error 详情泄露。
6. CORS 改为白名单策略（环境变量配置）。
7. 上传文件增加“内容魔数签名”校验，阻断伪造 MIME/扩展名。
8. 账号枚举风险缓解（登录/管理员登录/重置验证码统一模糊提示）。

## 具体改动说明

- 新增 `securityMiddleware`：
  - `createRateLimiter(windowMs, max)`：按 `path + IP` 限流。
  - `securityHeaders`：增加 `nosniff`、`DENY`、`CSP` 等基础安全头。
- `authRoutes` 增加分场景限流：
  - `/send-code`、`/send-reset-code`、`/reset-password`、`/register` 限流。
  - `/login` 与 `/admin/login` 采用更严格策略。
- `index.ts`：
  - CORS 改为 `CORS_ALLOWED_ORIGINS` 白名单。
  - 全局启用安全响应头。
  - `/api/upload`、`/api/admin` 增加路由级限流。
  - 静态目录禁用索引并拒绝 dotfiles。
- `uploadController.ts`：
  - 上传成功前增加文件签名检测（JPEG/PNG/GIF/MP3/WAV/MP4）。
  - 签名不通过立即删除落盘文件并拒绝请求。
  - 删除文件接口对 `filename` 做 `basename` + realpath 越界检查。
- `authController.ts`：
  - 验证码改为 `crypto.randomInt`。
  - 注册角色固定 `USER`。
  - 去除服务端 `debug/error` 细节返回。
  - 统一模糊化提示减少账号枚举。
- `adminAuthController.ts`：
  - 管理员登录失败提示统一为“邮箱或密码错误”。
- `authMiddleware.ts`：
  - JWT 验证显式限制算法为 `HS256`。

---

## 前端对接工作信息

### 1) CORS 配置要求

- 后端需设置环境变量：
  - `CORS_ALLOWED_ORIGINS=https://xxx.com,https://admin.xxx.com`
- 本地开发可加：
  - `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173`

### 2) 限流状态处理

- 新增 429 返回：`{ message: '请求过于频繁，请稍后再试' }`
- 前端建议：
  - 对登录/验证码按钮做冷却倒计时。
  - 收到 429 时读取 `Retry-After` 并提示剩余等待秒数。

### 3) 登录/找回密码文案变化

- 失败提示趋于统一（例如“邮箱或密码错误”）。
- 前端不要依赖“用户不存在/邮箱未注册”等细粒度信息做分支。

### 4) 上传失败处理

- 可能返回：`文件内容与扩展名或MIME不匹配`
- 前端建议：
  - 上传前做前置类型校验（扩展名 + MIME）。
  - 提示用户“请使用标准编码导出的文件”。

### 5) 环境变量同步

- 需与后端对齐：
  - `CORS_ALLOWED_ORIGINS` -（可选）后续若扩展限流策略，可增加白名单或更细粒度配置。

### 6) 回归测试建议（前后端联调）

- 登录失败连续触发，确认 429 与冷却提示。
- 连续请求验证码，确认限流生效。
- 上传伪造后缀文件，确认被拒绝。
- 管理端登录错误提示不泄露账号状态。
