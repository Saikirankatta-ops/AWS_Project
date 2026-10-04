import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
})

export function login(credentials) {
  return api.post('/api/auth/login', credentials).then((response) => response.data)
}

export function register(credentials) {
  return api.post('/api/auth/register', credentials).then((response) => response.data)
}

export function getCurrentUser() {
  return api.get('/api/auth/me').then((response) => response.data)
}

export function logout() {
  return api.post('/api/auth/logout').then((response) => response.data)
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401
      && !error.config?.url?.startsWith('/api/auth/')
    ) {
      window.dispatchEvent(new Event('cravedash:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getHealth() {
  return api.get('/api/health').then((response) => response.data)
}

export function getOrders() {
  return api.get('/api/orders').then((response) => response.data)
}

export function getOrder(orderId) {
  return api.get(`/api/orders/${encodeURIComponent(orderId)}`).then((response) => response.data)
}

export function createOrder(orderData) {
  return api.post('/api/orders', orderData).then((response) => response.data)
}

export function updateOrderStatus(orderId, status) {
  return api
    .put(`/api/orders/${encodeURIComponent(orderId)}/status`, { status })
    .then((response) => response.data)
}

export function getOrderHistory(orderId) {
  return api
    .get(`/api/orders/${encodeURIComponent(orderId)}/history`)
    .then((response) => response.data)
}

export function getApiErrorMessage(error, fallback = 'Unable to connect to backend.') {
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.status === 404) return 'Order not found.'
  if (error.response) return 'The request could not be completed. Please try again.'
  if (error.request) {
    return 'Could not reach the current backend. Restart Spring Boot to load the latest API and CORS settings, then try again.'
  }
  return fallback
}
