import axios from 'axios';
import { useUserStore } from '@/store/user';

const SAFE_ERROR_MESSAGE: Record<number, string> = {
  400: '请求参数错误，请检查后重试',
  401: '登录已失效，请重新登录',
  403: '暂无权限执行该操作',
  404: '请求资源不存在',
  429: '请求过于频繁，请稍后再试',
  500: '服务器开小差了，请稍后再试'
};

const request = axios.create({
  baseURL: '/api', // 使用代理配置，开发环境通过vite代理转发
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：严格遵循 Bearer Token 格式
request.interceptors.request.use(config => {
  const token = localStorage.getItem('did_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`; // 必须包含 Bearer 前缀
  }
  return config;
});

// 响应拦截器：集中处理文档定义的错误码
request.interceptors.response.use(
  res => res.data,
  err => {
    // 处理网络错误或服务器无响应
    if (!err.response) {
      alert('网络错误或服务器无响应，请检查网络连接和服务器状态');
      return Promise.reject(err);
    }

    const { status, headers } = err.response;
    const msg = SAFE_ERROR_MESSAGE[status] || '请求失败，请稍后重试';

    if (status === 401) {
      alert('登录失效：' + msg);
      try {
        const userStore = useUserStore();
        userStore.clearSensitiveState();
      } catch {
        localStorage.removeItem('did_token');
      }
    } else if (status === 429) {
      const retryAfter = parseInt(headers['retry-after']) || 60;
      err.retryAfter = retryAfter;
      // 429 由各组件自行处理冷却倒计时
    } else if (status !== 403) {
      // 403 错误（每日次数用尽、体力不足等）由各组件自行处理，不弹 alert
      alert('请求失败：' + msg);
    }
    return Promise.reject(err);
  }
);

export default request;
