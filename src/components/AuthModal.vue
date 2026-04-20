<template>
  <div class="modal-mask" @click.self="close">
    <div class="modal-container style-image">
      <button class="close-btn" @click="close">X</button>
      
      <div class="modal-header">
        <h2>{{ isLogin ? 'Sign In' : 'Create Account' }}</h2>
      </div>

      <form v-if="isLogin" @submit.prevent="handleLogin">
        <input v-model="form.username" type="text" placeholder="phone number/ email" required />
        <input v-model="form.password" type="password" placeholder="password" required />
        <button type="submit" class="submit-btn style-image">Sign in</button>
      </form>

      <form v-else @submit.prevent="handleRegister">
        <input v-model="form.nickname" type="text" placeholder="nickname" required />
        <input v-model="form.username" type="text" placeholder="phone number / email" required />
        <input v-model="form.password" type="password" placeholder="password / new password" required />
        <input 
          v-model="form.security_answer" 
          type="text" 
          placeholder="security answer" 
          @input="form.security_answer = form.security_answer.toUpperCase()"
          required 
        />
        <button type="submit" class="submit-btn style-image">Sign up</button>
      </form>

      <div class="switch-tip style-image">
        <span v-if="isLogin">Don't have an account or forget your password?</span>
<span v-else>
  Already have an account?
  <br>
  *忘记密码填入正确密保可重置*
</span><br>
        <span @click="isLogin = !isLogin">{{ isLogin ? 'Sign up' : 'Sign in' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import request from '@/api/request';

const userStore = useUserStore();
const isLogin = ref(true);
const form = ref({
nickname: '',
  username: '',
  password: '',
  security_answer: ''
});

const close = () => {
  userStore.showAuthModal = false;
};

const handleLogin = async () => {
  try {
    const response = await request.post('/auth/login', {
      username: form.value.username,
      password: form.value.password
    });
    // 将登录时使用的用户名也传递给store
    userStore.loginSuccess({
      ...response,
      loginUsername: form.value.username
    });
    close();
  } catch (err: any) {
    alert(err.response?.data?.message || '登录失败');
  }
};

const handleRegister = async () => {
  try {
    const response = await request.post('/auth/register', {
        nickname: form.value.nickname,
      username: form.value.username,
      password: form.value.password,
      security_answer: form.value.security_answer
    });
    // 注册成功后自动切换到登录表单
    alert('注册成功！请使用您的账号登录');
    isLogin.value = true;
    // 清空表单
    form.value.password = '';
    form.value.security_answer = '';
  } catch (err: any) {
    alert(err.response?.data?.message || '注册失败');
  }
};
</script>

<style scoped>
.modal-mask {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); 
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-container.style-image {
  background: rgba(255, 255, 255, 0.95); /* 纯白背景 */
  padding: 40px; /* 增加内边距 */
  border-radius: 24px; /* 增加圆角 */
  width: 320px;
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  position: relative; /* 为关闭按钮定位 */
}

.modal-header {
  display: flex; justify-content: center; /* 标题居中 */
  margin-bottom: 30px;
}
.modal-header h2 {
  color: var(--primary-color); /* 应用新主色，即图片蓝色 */
  font-weight: 800; font-size: 1.5rem;
}
.close-btn {
  position: absolute; right: 15px; top: 10px; /* 调整关闭按钮位置 */
  background: none; border: none; font-size: 20px; cursor: pointer; color: #999;
}
input {
  width: 100%; padding: 15px 20px; /* 增加内边距 */
  margin-bottom: 20px; /* 增加间距 */
  border: 1px solid rgba(0,0,0,0.1); /* 微妙边框 */
  border-radius: 12px; /* 圆角 */
  box-sizing: border-box; background: #fff; outline: none; transition: border-color 0.2s;
}
input:focus { border-color: var(--primary-color); }
input::placeholder { color: #999; }

.submit-btn.style-image {
  width: 100%; padding: 15px; /* 增加内边距 */
  background: var(--primary-color); color: #fff; /* 蓝色背景，白色文本 */
  border: none; border-radius: 12px; cursor: pointer; font-weight: 800;
  box-shadow: 0 4px 12px rgba(13, 33, 165, 0.2); /* 蓝色阴影 */
  margin-top: 10px; /* 增加上间距 */
}

.switch-tip.style-image {
  margin-top: 25px; text-align: center; font-size: 0.85rem;
}
.switch-tip.style-image span:first-child { color: #666; margin-right: 5px; }
.switch-tip.style-image span:last-child {
  color: var(--primary-color); font-weight: 600; cursor: pointer;
}
</style>