// API configuration
const API_BASE_URL = '/api'

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('auth_token')
}

// Helper function to set auth token
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAuthToken()
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Authentication API
export const authAPI = {
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    
    if (response.session_token) {
      setAuthToken(response.session_token)
    }
    
    return response
  },

  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    if (response.session_token) {
      setAuthToken(response.session_token)
    }
    
    return response
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      setAuthToken(null)
    }
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me')
  },

  forgotPassword: async (email) => {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  resetPassword: async (resetToken, newPassword) => {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        reset_token: resetToken,
        new_password: newPassword,
      }),
    })
  },

  changePassword: async (currentPassword, newPassword) => {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
  },
}

// Properties API
export const propertiesAPI = {
  getProperties: async (filters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value)
      }
    })
    
    const queryString = params.toString()
    const endpoint = queryString ? `/properties?${queryString}` : '/properties'
    
    return await apiRequest(endpoint)
  },

  getProperty: async (id) => {
    return await apiRequest(`/properties/${id}`)
  },

  createProperty: async (propertyData) => {
    return await apiRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    })
  },

  updateProperty: async (id, propertyData) => {
    return await apiRequest(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    })
  },

  deleteProperty: async (id) => {
    return await apiRequest(`/properties/${id}`, {
      method: 'DELETE',
    })
  },

  getMyProperties: async (page = 1, perPage = 10) => {
    return await apiRequest(`/my-properties?page=${page}&per_page=${perPage}`)
  },

  addToFavorites: async (propertyId) => {
    return await apiRequest(`/properties/${propertyId}/favorite`, {
      method: 'POST',
    })
  },

  removeFromFavorites: async (propertyId) => {
    return await apiRequest(`/properties/${propertyId}/favorite`, {
      method: 'DELETE',
    })
  },

  getFavorites: async (page = 1, perPage = 10) => {
    return await apiRequest(`/favorites?page=${page}&per_page=${perPage}`)
  },

  createInquiry: async (propertyId, inquiryData) => {
    return await apiRequest(`/properties/${propertyId}/inquire`, {
      method: 'POST',
      body: JSON.stringify(inquiryData),
    })
  },

  getInquiries: async (page = 1, perPage = 10) => {
    return await apiRequest(`/inquiries?page=${page}&per_page=${perPage}`)
  },

  bulkUpload: async (properties) => {
    return await apiRequest('/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    })
  },
}

// Users API
export const usersAPI = {
  getUsers: async (page = 1, perPage = 10) => {
    return await apiRequest(`/users?page=${page}&per_page=${perPage}`)
  },

  getUser: async (id) => {
    return await apiRequest(`/users/${id}`)
  },

  updateProfile: async (userData) => {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },

  updateUser: async (id, userData) => {
    return await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },

  deleteUser: async (id) => {
    return await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    })
  },
}

// Subscription API
export const subscriptionAPI = {
  getPlans: async () => {
    return await apiRequest('/subscription/plans')
  },

  subscribe: async (subscriptionData) => {
    return await apiRequest('/subscription/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    })
  },

  getSubscriptionStatus: async () => {
    return await apiRequest('/subscription/status')
  },

  cancelSubscription: async () => {
    return await apiRequest('/subscription/cancel', {
      method: 'POST',
    })
  },

  getPaymentHistory: async (page = 1, perPage = 10) => {
    return await apiRequest(`/subscription/payments?page=${page}&per_page=${perPage}`)
  },

  startTrial: async () => {
    return await apiRequest('/subscription/trial/start', {
      method: 'POST',
    })
  },

  createPaymentIntent: async (planId, billingCycle = 'monthly') => {
    return await apiRequest('/subscription/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        billing_cycle: billingCycle,
      }),
    })
  },
}

// Marketing API
export const marketingAPI = {
  getCampaigns: async (page = 1, perPage = 10) => {
    return await apiRequest(`/marketing/campaigns?page=${page}&per_page=${perPage}`)
  },

  createCampaign: async (campaignData) => {
    return await apiRequest('/marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    })
  },

  updateCampaign: async (id, campaignData) => {
    return await apiRequest(`/marketing/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
    })
  },

  deleteCampaign: async (id) => {
    return await apiRequest(`/marketing/campaigns/${id}`, {
      method: 'DELETE',
    })
  },

  getCampaignMetrics: async (id) => {
    return await apiRequest(`/marketing/campaigns/${id}/metrics`)
  },
}

// Utility functions
export const utils = {
  formatPrice: (price, currency = 'AED') => {
    if (price >= 1000000) {
      return `${currency} ${(price / 1000000).toFixed(1)}M`
    } else if (price >= 1000) {
      return `${currency} ${(price / 1000).toFixed(0)}K`
    } else {
      return `${currency} ${price.toLocaleString()}`
    }
  },

  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },

  formatDateTime: (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },
}

// Export auth token utilities
export { getAuthToken, setAuthToken }

