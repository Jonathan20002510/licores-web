import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../services/http'

const routes = [
  { path: '/', redirect: () => (getToken() ? '/home' : '/login') },
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue'), meta: { guest: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('../views/ForgotPasswordView.vue'), meta: { guest: true } },
  { path: '/reset-password', name: 'ResetPassword', component: () => import('../views/ResetPasswordView.vue'), meta: { guest: true } },
  { path: '/age-verification', name: 'AgeVerification', component: () => import('../views/AgeVerificationView.vue'), meta: { requiresAuth: true } },
  { path: '/home', name: 'Home', component: () => import('../views/HomeView.vue'), meta: { requiresAuth: true } },
  { path: '/product/:id', name: 'Product', component: () => import('../views/ProductView.vue') },
  { path: '/cart', name: 'Cart', component: () => import('../views/CartView.vue'), meta: { requiresAuth: true } },
  { path: '/orders', name: 'Orders', component: () => import('../views/OrdersView.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:id', name: 'OrderDetail', component: () => import('../views/OrderDetailView.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
  { path: '/account', name: 'Account', component: () => import('../views/AccountView.vue'), meta: { requiresAuth: true } },
  { path: '/location', name: 'Location', component: () => import('../views/LocationView.vue'), meta: { requiresAuth: true } },
  { path: '/terms', name: 'Terms', component: () => import('../views/TermsView.vue') },
  { path: '/privacy', name: 'Privacy', component: () => import('../views/PrivacyView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = getToken()
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  if (to.meta.guest && token && to.name !== 'AgeVerification') {
    next({ name: 'Home' })
    return
  }
  next()
})

export default router
