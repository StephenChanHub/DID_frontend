<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import request from '@/api/request';

const userStore = useUserStore();
const form = ref({
  username: userStore.username,
  nickname: userStore.nickname,
  password: '',
  security_answer: ''
});

const close = () => userStore.toggleInfoModal(false);
const upperCase = () => form.value.security_answer = form.value.security_answer.toUpperCase();

// 定义接口响应类型
interface UpdateResponse {
  message: string;
  data?: any;
}

const handleSubmit = async () => {
  try {
    // 根据接口文档构建请求体
    const requestBody: any = {};

    // 检查是否有密码修改
    if (form.value.password.trim()) {
      // 修改密码流程：需要用户名和安全答案
      if (!form.value.username.trim()) {
        alert('修改密码需要提供用户名');
        return;
      }
      if (!form.value.security_answer.trim()) {
        alert('修改密码需要提供密保答案');
        return;
      }
      requestBody.username = form.value.username;
      requestBody.security_answer = form.value.security_answer.toUpperCase();
      requestBody.newPassword = form.value.password;

      // 如果昵称也有变化，一并更新
      if (form.value.nickname !== userStore.nickname) {
        requestBody.newNickname = form.value.nickname;
      }
    } else {
      // 只修改昵称（用户已登录，有有效Token）
      if (form.value.nickname === userStore.nickname) {
        alert('未检测到任何修改');
        return;
      }
      // 只修改昵称：只需提供 newNickname
      requestBody.newNickname = form.value.nickname;
    }

    // 调用后端更新接口
    const response = await request.post('/auth/update', requestBody) as UpdateResponse;

    // 更新本地状态
    if (form.value.nickname !== userStore.nickname) {
      userStore.updateProfile({
        nickname: form.value.nickname,
        username: userStore.username // 保持原用户名不变
      });
    }

    alert(response.message || '信息更新成功');
    close();
  } catch (err: any) {
    alert(err.response?.data?.message || '更新失败');
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
        <label>Username (Email/Phone)</label>
        <input v-model="form.username" type="text" readonly title="用户名不可修改" />
        <div class="field-hint">Unchangeable ！</div>
      </div>

      <div class="input-item style-image">
        <label>Nickname (< 10)</label>
        <input v-model="form.nickname" type="text" maxlength="10" />
      </div>

      <div class="input-item style-image">
        <label>New Password</label>
        <input v-model="form.password" type="password" placeholder="Leave empty if not changing" />
      </div>

      <div class="input-item style-image">
        <label>Security Answer</label>
        <input v-model="form.security_answer" type="text" @input="upperCase" />
      </div>

      <div class="btn-group style-image">
        <button class="btn-cancel" @click="close">Cancel</button>
        <button class="btn-submit style-image" @click="handleSubmit">Submit</button>
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
  border-radius: 24px; /* 增加圆角 */
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
button { flex: 1; padding: 15px; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; }

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
</style>