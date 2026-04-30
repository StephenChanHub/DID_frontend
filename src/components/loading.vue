<template>
  <span class="loader"></span>
  <span class="loading">loading...</span>
</template>

<script>
export default {
  name: 'LoadingComponent'
}
</script>

<style lang="scss" scoped>
.loading{
  font-size:30px;
  margin-left: 20px;
  color: #0d161b;
}
.loader {
  position: relative;
  width: 108px;
  display: flex;
  justify-content: space-between;
  /* 解决移动端深色模式导致的颜色反转问题 */
  color-scheme: light; 
  
}

.loader::after,
.loader::before {
  content: "";
  display: inline-block;
  width: 48px;
  height: 48px;
  /* 复合写法：瞳孔背景 + 白色底色，确保移动端显示一致 */
  background: radial-gradient(circle 14px, #0d161b 95%, rgba(255, 255, 255, 0) 100%) no-repeat, #ffffff;
  background-repeat: no-repeat;
  border-radius: 50%;
  animation: eyeMove 3s infinite, blink 3s infinite;
}

@keyframes eyeMove {
  /* 1. 居中 (0% - 10%) */
  0%, 10% { background-position: 0px 0px; }
  
  /* 2. 向下看 (15% - 25%) */
  15%, 25% { background-position: 0px 15px; }
  
  /* 3. 左下看 (30% - 40%) */
  30%, 40% { background-position: -10px 12px; }
  
  /* 4. 右下看 (45% - 55%) */
  45%, 55% { background-position: 10px 12px; }
  
  /* 5. 回正 (60% - 100%) */
  60%, 100% { background-position: 0px 0px; }
}

@keyframes blink {
  /* 初始状态：睁眼 (48px) */
  0%, 64% { height: 48px; }
  
  /* 第一次眨眼：在回正过程中 (约 65% 处)，极速闪动 */
  65% { height: 18px; } 
  66%, 89% { height: 48px; }
  
  /* 第二次眨眼：在完全回正后 (约 90% 处)，极速闪动 */
  90% { height: 18px; }
  91%, 100% { height: 48px; }
}

/* 移动端强制补丁：确保背景色为白色 */
@media screen and (max-width: 768px) {
  .loader::after,
  .loader::before {
    background-color: #ffffff !important;
  }
}
</style>