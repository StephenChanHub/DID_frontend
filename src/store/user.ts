import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('did_token') || '',
    userId: Number(localStorage.getItem('did_userId')) || 0,
    email: localStorage.getItem('did_email') || '',
    nickname: localStorage.getItem('did_nickname') || 'Guest',
    level: localStorage.getItem('did_level') || 'A1',
    coins: Number(localStorage.getItem('did_coins')) || 0,
    exerciseCount: Number(localStorage.getItem('did_exerciseCount')) || 0,
    avatar: localStorage.getItem('did_avatar') || '',
    showAuthModal: false,
    showInfoModal: false
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    avatarText: (state) => (state.nickname || 'Guest').slice(0, 2).toUpperCase(),
    username: (state) => state.email
  },
  actions: {
    loginSuccess(data: any) {
      this.token = data.token || '';
      this.userId = data.userId || 0;
      this.nickname = data.user?.nickname || data.nickname || 'User';
      this.email = data.user?.email || data.email || '';
      this.level = data.user?.level || data.level || 'A1';
      this.coins = data.user?.coins ?? Number(data.coins) ?? 0;
      this.exerciseCount = data.user?.exerciseCount ?? Number(data.exerciseCount) ?? 0;
      this.avatar = data.user?.avatar || data.avatar || '';

      localStorage.setItem('did_token', this.token);
      localStorage.setItem('did_userId', String(this.userId));
      localStorage.setItem('did_email', this.email);
      localStorage.setItem('did_nickname', this.nickname);
      localStorage.setItem('did_level', this.level);
      localStorage.setItem('did_coins', String(this.coins));
      localStorage.setItem('did_exerciseCount', String(this.exerciseCount));
      if (this.avatar) {
        localStorage.setItem('did_avatar', this.avatar);
      }
      this.showAuthModal = false;
    },
    logout() {
      this.token = '';
      this.userId = 0;
      this.email = '';
      this.nickname = 'Guest';
      this.level = 'A1';
      this.coins = 0;
      this.exerciseCount = 0;
      this.avatar = '';
      localStorage.removeItem('did_token');
      localStorage.removeItem('did_userId');
      localStorage.removeItem('did_email');
      localStorage.removeItem('did_nickname');
      localStorage.removeItem('did_level');
      localStorage.removeItem('did_coins');
      localStorage.removeItem('did_exerciseCount');
      localStorage.removeItem('did_avatar');
      this.showInfoModal = false;
    },
    toggleInfoModal(show: boolean) {
      this.showInfoModal = show;
    },
    updateProfile(data: { nickname: string; username?: string }) {
      this.nickname = data.nickname;
      localStorage.setItem('did_nickname', data.nickname);
    }
  }
});
