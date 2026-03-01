const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://api.hexasoft-ec.com/api'

export const apiConfig = {
  baseUrl,
  storageBaseUrl: 'https://api.hexasoft-ec.com/storage',
  defaultImageUrl: 'https://api.hexasoft-ec.com/assets/img/no-image.png',
  requestTimeout: 30000,

  register: '/register',
  login: '/login',
  user: '/user',
  logout: '/logout',
  userLocation: '/user/location',
  userProfile: '/user/profile',
  products: '/products',
  orders: '/orders',
  payments: '/payments',
  paymentAccounts: '/payment_accounts',
  terms: '/terms',
  privacy: '/privacy',
  acceptTerms: '/user/accept-terms',
  banners: '/banners',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  appConfig: '/app-config',
} as const

export function getOrdersUrl(): string {
  return `${baseUrl}${apiConfig.orders}`
}
export function getOrderUrl(orderId: number): string {
  return `${baseUrl}${apiConfig.orders}/${orderId}`
}
export function getOrderItemsUrl(orderId: number): string {
  return `${baseUrl}${apiConfig.orders}/${orderId}/items`
}
export function getOrderAddressLineUrl(orderId: number): string {
  return `${baseUrl}${apiConfig.orders}/${orderId}/address_line`
}
export function getCalculateShippingUrl(): string {
  return `${baseUrl}${apiConfig.orders}/calculate-shipping`
}
export function getActiveOriginPointUrl(): string {
  return `${baseUrl}/origin-point/active`
}

export function getLoginUrl(): string { return `${baseUrl}${apiConfig.login}` }
export function getRegisterUrl(): string { return `${baseUrl}${apiConfig.register}` }
export function getUserUrl(): string { return `${baseUrl}${apiConfig.user}` }
export function getLogoutUrl(): string { return `${baseUrl}${apiConfig.logout}` }
export function getProductsUrl(): string { return `${baseUrl}${apiConfig.products}` }
export function getBannersUrl(): string { return `${baseUrl}${apiConfig.banners}` }
export function getAppConfigUrl(): string { return `${baseUrl}${apiConfig.appConfig}` }
export function getTermsUrl(): string { return `${baseUrl}${apiConfig.terms}` }
export function getPrivacyUrl(): string { return `${baseUrl}${apiConfig.privacy}` }
export function getAcceptTermsUrl(): string { return `${baseUrl}${apiConfig.acceptTerms}` }
export function getForgotPasswordUrl(): string { return `${baseUrl}${apiConfig.forgotPassword}` }
export function getResetPasswordUrl(): string { return `${baseUrl}${apiConfig.resetPassword}` }
export function getUserLocationUrl(): string { return `${baseUrl}${apiConfig.userLocation}` }
export function getUserProfileUrl(): string { return `${baseUrl}${apiConfig.userProfile}` }
export function getPaymentsUrl(): string { return `${baseUrl}${apiConfig.payments}` }
export function getPaymentAccountsUrl(): string { return `${baseUrl}${apiConfig.paymentAccounts}` }
