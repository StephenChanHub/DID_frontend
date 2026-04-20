import axios from 'axios';

const request = axios.create({
  baseURL: '/api', // 使用代理配置，开发环境通过vite代理转发
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：严格遵循 Bearer Token 格式
request.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
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

    const { status, data } = err.response;
    const msg = data?.message || '未知错误';

    if (status === 401) {
      alert('登录失效：' + msg);
      localStorage.removeItem('auth_token');
      // 不再使用window.location.href跳转，避免PWA模式跳出
      // 由前端组件监听认证状态变化并处理跳转
    } else {
      alert('请求失败：' + msg); // 捕获 400, 403, 404, 500 等
    }
    return Promise.reject(err);
  }
);

export default request;