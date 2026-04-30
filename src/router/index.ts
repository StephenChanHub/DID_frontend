import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/do' },
  { path: '/do', name: 'Do', component: () => import('@/views/Do.vue') },
  {
    path: '/did',
    name: 'Did',
    component: () => import('@/views/Did.vue')
  },
  {
    path: '/store',
    name: 'Store',
    component: () => import('@/views/Store.vue'),
    meta: { hideLayout: true, requiresAuth: true }
  },
  { path: '/preview', name: 'Preview', component: () => import('@/views/Preview.vue') },
  {
    path: '/practice/:id',
    name: 'Practice',
    component: () => import('@/views/Practice.vue'),
    meta: { hideLayout: true, requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  if (!to.meta?.requiresAuth) {
    return next();
  }
  const token = localStorage.getItem('did_token');
  if (token) {
    return next();
  }
  next('/do');
});

export default router;
