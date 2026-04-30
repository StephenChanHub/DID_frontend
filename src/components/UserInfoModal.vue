<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import request from '@/api/request';

const userStore = useUserStore();
const form = ref({
  email: userStore.email,
  nickname: userStore.nickname,
  password: '',
  code: ''
});
const sendingCode = ref(false);
const codeCooldown = ref(0);
const submitCooldown = ref(0);
let codeTimer: ReturnType<typeof setInterval> | null = null;
let submitTimer: ReturnType<typeof setInterval> | null = null;

const close = () => userStore.toggleInfoModal(false);

const startCodeCooldown = (seconds = 60) => {
  if (codeTimer) clearInterval(codeTimer);
  codeCooldown.value = seconds;
  codeTimer = setInterval(() => {
    codeCooldown.value--;
    if (codeCooldown.value <= 0) {
      if (codeTimer) clearInterval(codeTimer);
      codeTimer = null;
    }
  }, 1000);
};

const startSubmitCooldown = (seconds: number) => {
  if (submitTimer) clearInterval(submitTimer);
  submitCooldown.value = seconds;
  submitTimer = setInterval(() => {
    submitCooldown.value--;
    if (submitCooldown.value <= 0) {
      if (submitTimer) clearInterval(submitTimer);
      submitTimer = null;
    }
  }, 1000);
};

const sendCode = async () => {
  if (!form.value.email.trim()) {
    alert('邮箱不能为空');
    return;
  }
  if (codeCooldown.value > 0) return;
  sendingCode.value = true;
  try {
    await request.post('/auth/send-reset-code', {
      email: form.value.email
    });
    startCodeCooldown();
    alert('验证码已发送，请检查邮箱');
  } catch (err: any) {
    if (err.response?.status === 429) {
      startCodeCooldown(err.retryAfter || 60);
    }
    alert(err.response?.data?.message || '验证码发送失败');
  } finally {
    sendingCode.value = false;
  }
};

const handleSubmit = async () => {
  try {
    const hasPassword = form.value.password.trim().length > 0;
    const hasNicknameChange = form.value.nickname !== userStore.nickname;

    if (!hasPassword && !hasNicknameChange) {
      alert('未检测到任何修改');
      return;
    }

    if (hasPassword) {
      // 修改密码：使用邮箱验证码
      if (form.value.password.length < 6) {
        alert('密码长度至少6个字符');
        return;
      }
      if (!form.value.code.trim()) {
        alert('请先获取并输入验证码');
        return;
      }

      await request.post('/auth/reset-password', {
        email: form.value.email,
        code: form.value.code,
        newPassword: form.value.password
      });

      alert('密码重置成功');
      form.value.code = '';
      form.value.password = '';

      // 如果同时也修改了昵称，单独调用更新
      if (hasNicknameChange) {
        await request.post('/auth/update', {
          newNickname: form.value.nickname
        });
      }
    } else {
      // 只修改昵称（用户已登录，有有效Token）
      await request.post('/auth/update', {
        newNickname: form.value.nickname
      });
    }

    // 更新本地状态
    if (hasNicknameChange) {
      userStore.updateProfile({
        nickname: form.value.nickname,
        username: userStore.email
      });
    }

    close();
  } catch (err: any) {
    if (err.response?.status === 429) {
      startSubmitCooldown(err.retryAfter || 60);
    }
    alert(err.response?.data?.message || '操作失败');
  }
};
</script>


<template>
  <div class="modal-mask" @click.self="close">
    <div class="info-card style-image">
      <button class="close-btn" @click="close">×</button>
      
      <div class="modal-header">
        <h2>Edit Profile</h2>
      </div>
      
      <div class="input-item style-image">
        <label>Email</label>
        <input :value="form.email" type="email" readonly />
      </div>

      <div class="input-item style-image">
        <label>Nickname (< 10)</label>
        <input v-model="form.nickname" type="text" maxlength="10" />
      </div>

      <div class="input-item style-image">
        <label>New Password</label>
        <input v-model="form.password" type="password" placeholder="Leave empty if not changing" />
      </div>

      <div class="input-item style-image" v-if="form.password.trim()">
        <label>Verification Code</label>
        <div class="code-row">
          <input v-model="form.code" type="text" placeholder="Enter 6-digit code" maxlength="6" />
          <button class="btn-send-code" @click="sendCode" :disabled="sendingCode || codeCooldown > 0">
            {{ sendingCode ? 'Sending...' : codeCooldown > 0 ? `${codeCooldown}s` : 'Send Code' }}
          </button>
        </div>
      </div>

      <div class="btn-group style-image">
        <button class="btn-cancel" @click="close">Cancel</button>
        <button class="btn-submit style-image" :disabled="submitCooldown > 0" @click="handleSubmit">
          {{ submitCooldown > 0 ? `${submitCooldown}s` : 'Submit' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); /* 毛玻璃蒙版保持不变 */
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.info-card.style-image {
  background: rgba(255, 255, 255, 0.95); /* 纯白背景 */
  padding: 40px; /* 增加内边距 */
  border-radius: 36px; /* 增加圆角 */
  width: 320px;
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.modal-header {
  display: flex; justify-content: center; /* 标题居中 */
  margin-bottom: 30px; position: relative;
}
.modal-header h2 {
  color: var(--primary-color); /* 应用新主色，即图片蓝色 */
  font-weight: 800; font-size: 1.5rem;
}
.close-btn {
  position: absolute; right: -25px; top: -10px; /* 调整关闭按钮位置 */
  background: none; border: none; font-size: 20px; cursor: pointer; color: #999;
}

.input-item.style-image { margin-bottom: 15px; }
.input-item.style-image label {
  display: block; font-size: 12px; color: #000; margin-bottom: 5px; /* 灰色标签，接近占位符 */
  margin-left: 5px; /* 增加左间距 */
}
.input-item.style-image input {
  width: 100%; padding: 12px 18px; /* 增加内边距 */
  border-radius: 10px; border: 1px solid rgba(0,0,0,0.1); /* 微妙边框 */
  background: #fff; outline: none; transition: border-color 0.2s;
}
.input-item.style-image input:focus { border-color: var(--primary-color); }
.input-item.style-image input[readonly] {
  background-color: #f8f9fa;
  cursor: not-allowed;
  color: #666;
}

.btn-group.style-image {
  display: flex; gap: 15px; margin-top: 30px; /* 增加上间距和间隙 */
}
button { flex: 1; padding: 15px; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; }

.btn-cancel {
  background: rgba(0,0,0,0.05); color: #666; /* 灰色背景，灰色文本 */
}
.btn-submit.style-image {
  background: var(--primary-color); color: #fff; /* 蓝色背景，白色文本 */
  box-shadow: 0 4px 12px rgba(13, 33, 165, 0.2); /* 蓝色阴影 */
}

.field-hint {
  font-size: 11px;
  color: red;
  margin-top: 4px;
  margin-left: 5px;
}

.code-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.code-row input {
  flex: 1;
}
.btn-send-code {
  flex: 0 0 auto;
  padding: 12px 14px;
  white-space: nowrap;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  transition: opacity 0.2s;
}
.btn-send-code:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

