---
# 🧩 问题一：DID 页面变回“浏览器模式”

## ✅ 本质原因（关键）

在 Safari 的“主屏幕模式”里，只要触发以下任意情况：

👉 **就会跳出 Web App，回到 Safari 浏览器**
---

## 🚨 常见触发条件（你重点排查这些）

### 1️⃣ 路由不是同源（最常见）

比如：

```ts
window.location.href = "https://xxx.com/did";
```

或者：

```html
<a href="https://xxx.com/did"></a>
```

👉 即使域名一样，只要不是“当前 Web App 的 scope”，也可能跳出

---

### 2️⃣ 使用了 `target="_blank"`

```html
<a href="/did" target="_blank"></a>
```

👉 必跳浏览器 ❌

---

### 3️⃣ Vue Router 配置问题（你这个很可能中招）

如果你：

```ts
createWebHistory();
```

但部署路径 / base 不对：

```ts
createWebHistory("/app/");
```

👉 访问 `/did` 时可能被 Safari 当成“外部页面”

---

### 4️⃣ 使用了完整 URL 而不是 SPA 路由

错误：

```ts
window.location.href = "/did";
```

正确：

```ts
router.push("/did");
```

---

### 5️⃣ DID 页面里有外链资源触发跳转

比如：

```html
<img src="https://xxx.com/xxx.png" />
```

👉 某些情况下 Safari 会认为你“跨域导航”

---

## 🧪 为什么 DO 正常、DID 不正常？

👉 说明：

- DO 页面是 SPA 内部跳转 ✔️
- DID 页面某一步触发了“浏览器跳转” ❌

---

## ✅ 你现在该怎么查（非常关键）

在 DID 页面：

👉 打开 DevTools（Mac Safari 远程调试）

重点看：

```js
window.location.href;
```

有没有发生变化

---

## 🔧 解决方案（直接给你标准写法）

### ✅ Vue 路由必须统一：

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(), // 注意 base
  routes: [...]
})
```

---

### ✅ 页面跳转统一用：

```ts
router.push("/did");
```

---

### ❌ 禁止：

```ts
window.location.href = "/did";
```

---

---

# 🧩 问题二：没有“全面屏 / 状态栏侵入”

👉 这个是另一个经典坑

---

## ✅ 正确配置（必须同时满足）

### 1️⃣ meta（最关键）

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
```

👉 没这个 = 永远是浏览器模式

---

### 2️⃣ 状态栏样式

```html
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>
```

👉 这个才是“沉浸式”

---

### 3️⃣ viewport（你大概率缺这个）

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

👉 ❗ `viewport-fit=cover` 是关键

---

## 💡 然后 CSS 还要配合

```css
body {
  padding-top: env(safe-area-inset-top);
}
```

如果是底部：

```css
padding-bottom: env(safe-area-inset-bottom);
```

---

## 🧠 原理解释一下（你理解会更深）

iPhone 刘海屏：

- 默认网页不会占用状态栏区域
- 只有加了 `viewport-fit=cover` 才允许“侵入”

但侵入之后：

👉 你必须自己处理安全区（safe-area）

---

## 🚨 常见错误

| 问题           | 原因                              |
| -------------- | --------------------------------- |
| 顶部有白边     | 没写 viewport-fit                 |
| 内容被刘海挡住 | 没用 safe-area                    |
| 页面像浏览器   | 没加 apple-mobile-web-app-capable |

---

# 🔥 最后帮你总结一下

## 🎯 问题1（DID变浏览器）

👉 99% 是：

- 路由跳转方式错了
- 或 scope / base 配错了

---

## 🎯 问题2（不全屏）

👉 必须三件套：

```html
apple-mobile-web-app-capable apple-mobile-web-app-status-bar-style
viewport-fit=cover
```

- CSS safe-area

---
