## 项目目标

把听力练习页面改成可在局域网手机上正常访问的版本，确保：

1. 图片、音频不再依赖 `localhost`
2. 播放器逻辑保持稳定，不会重复请求导致卡顿
3. 练习页在 Mac 前端 + UTM Ubuntu 后端环境中可正常运行
4. 前端请求地址统一管理，后续方便切换环境

---

## 当前环境说明

- 前端开发机：Mac
- 后端运行环境：UTM Ubuntu
- 手机与 Mac/Ubuntu 处于同一局域网时，手机应通过 **后端 Ubuntu 的局域网 IP** 访问资源
- 不要在手机访问场景中使用 `localhost` 或 `127.0.0.1`

---

## 当前代码结构理解

### 1. `Player.vue`

播放器是一个受控音频组件：

- `src`：音频地址
- `active`：是否允许播放，通常由当前卡片是否在视口内决定
- 内部状态：
  - `isPlaying`
  - `currentTime`
  - `duration`

核心行为：

- 点击播放/暂停按钮时，调用 `audio.play()` / `audio.pause()`
- 拖动进度条时，修改 `audio.currentTime`
- 音频自然播放过程中，通过 `timeupdate` 更新进度
- 音频加载完元数据后，通过 `loadedmetadata` 获取总时长
- 当 `active` 变为 `false` 时，自动暂停

### 2. `Practice.vue`

练习页负责：

- 请求练习素材列表
- 拼接图片和音频的完整 URL
- 渲染题目、收藏、提交、反馈
- 通过 `IntersectionObserver` 控制当前可播放卡片
- 将 `item.audio_url` 传给 `Player.vue`

---

## 需要完成的前端任务

### 任务 A：统一资源基础地址

当前代码里存在硬编码：

```ts
const baseUrl = "http://192.168.64.2:3000";
```

这类写法需要改造成可配置方式，建议：

- 通过 `.env.development`
- 或者通过单独的配置文件
- 或者复用 `request` 的基础地址配置

建议目标：

```ts
VITE_API_BASE_URL=http://192.168.64.2:3000
```

然后在代码里统一使用：

```ts
const baseUrl = import.meta.env.VITE_API_BASE_URL;
```

要求：

- 图片和音频都要走同一个基础地址逻辑
- 不允许页面里继续散落多个写死的 IP

---

### 任务 B：修正资源 URL 拼接逻辑

现有逻辑中，`buildFileUrl()` 需要保持以下规则：

1. 如果传入值已经是完整 URL（`http://` 或 `https://`），原样返回
2. 如果是相对路径 `/uploads/a.mp3`，则拼接成完整 URL
3. 如果没有以 `/` 开头，也要正确拼接

建议最终行为：

```ts
buildFileUrl("/uploads/a.mp3");
// -> http://192.168.64.2:3000/uploads/a.mp3
```

同时处理：

- `image_url`
- `media_url`
- `audio_url`

---

### 任务 C：保持播放器逻辑，不要改成 fetch 播放

播放器必须继续使用原生 `<audio>` 标签，不要改成：

- `fetch(...)`
- `axios(...)`
- base64 整段载入

原因：

- 原生 `<audio>` 支持浏览器缓存
- 原生 `<audio>` 支持 Range 请求
- 更适合音频分段加载

`Player.vue` 应继续保留：

- `togglePlay`
- `skip`
- `onSeek`
- `onLoadedMetadata`
- `onTimeUpdate`
- `watch(active)`

---

### 任务 D：确保一个时间只播放一个卡片

目前通过 `activeCards[item.id]` 和 `IntersectionObserver` 控制播放资格，这个思路是正确的。

要求：

- 当前可视卡片可播放
- 卡片离开视口后自动暂停
- 刷新后 active 状态要重置
- 不要让多个卡片同时处于播放态

---

### 任务 E：让手机可以正常看到图片和音频

前端页面中所有资源地址必须来自后端 IP，而不是 localhost。

你需要检查这些点：

1. `Practice.vue` 中的资源拼接是否全部改为后端 IP
2. `request` 的 API 基础地址是否正确
3. 页面中的图片 `<img :src="...">` 和音频 `<audio :src="...">` 是否使用同一套地址规则
4. 手机浏览器访问时，资源 URL 中不能再出现 `localhost`

---

## 具体修改步骤

### 第一步：抽离配置

建议新增配置文件，例如：

```ts
// src/config/env.ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.64.2:3000";
```

然后在所有需要拼资源地址的地方引用它。

---

### 第二步：修改 `buildFileUrl`

要求代码逻辑清晰、可复用，避免重复拼接。

---

### 第三步：检查 `request` 实例

如果 `request` 也是 axios 实例，确保：

- `baseURL` 统一配置
- 请求拦截器没有把资源链接改坏
- 不要把 API 地址和静态资源地址混成两套不好维护的逻辑

---

### 第四步：验证页面行为

测试场景：

- Mac 本机访问页面，图片能显示，音频能播放
- 手机访问页面，图片能显示，音频能播放
- 刷新后仍然正常
- 点击不同题目卡片时，只播放当前卡片的音频
- 切换卡片时，离开视口的音频自动暂停

---

## 前端验收标准

Claude 完成后，以下情况都应成立：

- 代码中不再出现用于资源加载的 `localhost`
- `image_url`、`media_url`、`audio_url` 可以在手机上打开
- 播放器使用原生 `<audio>`
- 翻页/滚动时不会出现多个音频同时播放
- 刷新后页面不报错
- 现有练习题作答、收藏、提交功能不受影响

---

## 额外注意事项

1. 不要破坏现有题目提交逻辑
2. 不要破坏收藏逻辑
3. 不要改坏 `IntersectionObserver`
4. 不要把音频直接塞进前端本地存储
5. 不要把所有音频一次性下载到内存

---

## 交付物

Claude 最终应该返回：

- 修改后的 `Practice.vue`
- 修改后的 `Player.vue`（如有必要）
- 新增的配置文件（如有必要）
- 如需修改请求封装，也要一并说明
- 一份简短说明：改了什么、为什么这样改、如何验证

---

## 推荐执行顺序

1. 先统一资源地址配置
2. 再改 `buildFileUrl`
3. 再检查 `request` 基础地址
4. 最后做手机端联调验证
