<template>
  <div class="modal-mask" @click.self="close">
    <div class="modal-container style-image">
      <button class="close-btn" @click="close">X</button>

      <div class="modal-header">
        <h2>{{ isLogin ? 'Sign In' : 'Create Account' }}</h2>
      </div>

      <div class="tab-bar">
        <span :class="['tab', { active: isLogin }]" @click="isLogin = true">Sign In</span>
        <span :class="['tab', { active: !isLogin }]" @click="isLogin = false">Register</span>
      </div>

      <form @submit.prevent="isLogin ? handleLogin() : handleRegister()">
        <input v-model="form.email" type="email" placeholder="Email" required />

        <div v-if="!isLogin" class="code-row">
          <input v-model="form.code" type="text" placeholder="Verification Code" class="code-input" required />
          <button type="button" class="send-code-btn" :disabled="codeCooldown > 0" @click="sendCode">
            {{ codeCooldown > 0 ? `${codeCooldown}s` : 'Send Code' }}
          </button>
        </div>

        <input v-if="!isLogin" v-model="form.nickname" type="text" placeholder="Nickname" required />

        <input v-model="form.password" type="password" placeholder="Password" required />

        <button type="submit" class="submit-btn style-image" :disabled="loading">
          {{ loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register') }}
        </button>
      </form>

      <div class="switch-tip style-image">
        <span v-if="isLogin">Don't have an account?</span>
        <span v-else>Already have an account?</span>
        <span class="switch-link" @click="isLogin = !isLogin">
          {{ isLogin ? 'Register' : 'Sign In' }}
        </span>
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
const loading = ref(false);
const codeCooldown = ref(0);
let codeTimer: ReturnType<typeof setInterval> | null = null;

const form = ref({
  email: '',
  password: '',
  code: '',
  nickname: ''
});

const close = () => {
  userStore.showAuthModal = false;
};

const startCodeCooldown = () => {
  codeCooldown.value = 60;
  codeTimer = setInterval(() => {
    codeCooldown.value--;
    if (codeCooldown.value <= 0) {
      if (codeTimer) clearInterval(codeTimer);
      codeTimer = null;
    }
  }, 1000);
};

const sendCode = async () => {
  if (!form.value.email) {
    alert('Please enter your email first');
    return;
  }
  if (codeCooldown.value > 0) return;

  try {
    await request.post('/auth/send-code', { email: form.value.email });
    startCodeCooldown();
    alert('Verification code sent, please check your email');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to send code');
  }
};

const handleLogin = async () => {
  loading.value = true;
  try {
    const res: any = await request.post('/auth/login', {
      email: form.value.email,
      password: form.value.password
    });
    userStore.loginSuccess({ ...res, email: form.value.email });
    close();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Login failed');
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  loading.value = true;
  try {
    const res: any = await request.post('/auth/register', {
      email: form.value.email,
      password: form.value.password,
      code: form.value.code,
      nickname: form.value.nickname
    });
    // Register returns { message, token, userId } — auto-login
    const loginRes: any = await request.post('/auth/login', {
      email: form.value.email,
      password: form.value.password
    });
    userStore.loginSuccess({ ...loginRes, email: form.value.email });
    close();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Registration failed');
  } finally {
    loading.value = false;
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
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 24px;
  width: 340px;
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  position: relative;
}

.modal-header {
  display: flex; justify-content: center;
  margin-bottom: 20px;
}
.modal-header h2 {
  color: var(--primary-color);
  font-weight: 800; font-size: 1.5rem;
}
.close-btn {
  position: absolute; right: 15px; top: 10px;
  background: none; border: none; font-size: 20px; cursor: pointer; color: #999;
}

.tab-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}
.tab {
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: #999;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

input {
  width: 100%; padding: 14px 18px;
  margin-bottom: 16px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  box-sizing: border-box; background: #fff; outline: none; transition: border-color 0.2s;
}
input:focus { border-color: var(--primary-color); }
input::placeholder { color: #999; }

.code-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.code-input {
  flex: 1;
  margin-bottom: 0;
}
.send-code-btn {
  flex-shrink: 0;
  padding: 0 16px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  transition: opacity 0.2s;
}
.send-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn.style-image {
  width: 100%; padding: 15px;
  background: var(--primary-color); color: #fff;
  border: none; border-radius: 12px; cursor: pointer; font-weight: 800;
  box-shadow: 0 4px 12px rgba(13, 33, 165, 0.2);
  margin-top: 6px;
  transition: opacity 0.2s;
}
.submit-btn.style-image:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-tip.style-image {
  margin-top: 20px; text-align: center; font-size: 0.85rem;
  color: #666;
}
.switch-link {
  color: var(--primary-color); font-weight: 600; cursor: pointer;
  margin-left: 4px;
}
</style>
