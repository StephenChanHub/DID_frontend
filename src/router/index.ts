import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/do' },
  { path: '/do', name: 'Do', component: () => import('@/views/Do.vue') },
  {
    path: '/did',
    name: 'Did',
    component: () => import('@/views/Did.vue')
  },
  { path: '/store', name: 'Store', component: () => import('@/views/Store.vue'), meta: { hideLayout: true } },
  { path: '/preview', name: 'Preview', component: () => import('@/views/Preview.vue') },
  {
    path: '/practice/:id',
    name: 'Practice',
    component: () => import('@/views/Practice.vue'),
    meta: { hideLayout: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 移除认证守卫，DID 页面可公开访问
// 如果需要路由级认证，可在此处添加

export default router;