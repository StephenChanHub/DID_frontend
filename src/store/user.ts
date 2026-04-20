import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    // 基础持久化数据
    token: localStorage.getItem('auth_token') || '',
    nickname: localStorage.getItem('nickname') || 'Guest',
    username: localStorage.getItem('username') || '',
    level: localStorage.getItem('user_level') || 'A1',
    points: Number(localStorage.getItem('user_points')) || 0,
    exerciseCount: Number(localStorage.getItem('exercise_count')) || 0,
    avatar: localStorage.getItem('avatar') || '', // 用户头像 URL
    // 弹窗控制
    showAuthModal: false,
    showInfoModal: false
  }),
  getters: {
    // 实时判断登录状态，防止逻辑错乱
    isLoggedIn: (state) => !!state.token,
    // 头像文本逻辑
    avatarText: (state) => (state.nickname || 'Guest').slice(0, 2).toUpperCase()
  },
  actions: {
    loginSuccess(data: any) {
      // 根据接口文档：登录成功返回 { token, user: { points, level } }
      // 实际可能包含更多字段，确保代码健壮
      this.token = data.token || '';
      this.nickname = data.user?.nickname || 'User';
      // 优先使用传入的loginUsername（登录时使用的用户名），如果没有则尝试从user对象获取
      this.username = data.loginUsername || data.user?.username || '';
      this.level = data.user?.level || 'A1';
      this.points = data.user?.points || 0;
      this.exerciseCount = data.user?.exerciseCount || 0;
      this.avatar = data.user?.avatar || '';

      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('nickname', this.nickname);
      localStorage.setItem('username', this.username);
      localStorage.setItem('exercise_count', this.exerciseCount.toString());
      if (this.avatar) {
        localStorage.setItem('avatar', this.avatar);
      }
      this.showAuthModal = false;
    },
    logout() {
      this.token = '';
      localStorage.clear();
      this.showInfoModal = false;
      // 不再使用window.location.href，由组件通过router处理跳转
    },
    toggleInfoModal(show: boolean) {
      this.showInfoModal = show;
    },
    updateProfile(data: { nickname: string; username: string }) {
      this.nickname = data.nickname;
      this.username = data.username;
      localStorage.setItem('nickname', data.nickname);
      localStorage.setItem('username', data.username);
    }
  }
});


