// API service for backend communication
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const API_BASE_URL = API_URL.replace(/\/api$/, '')

export const resolveBackendFileUrl = (urlPath = '') => {
  if (!urlPath) {
    return '#'
  }

  if (/^https?:\/\//i.test(urlPath)) {
    return urlPath
  }

  return `${API_BASE_URL}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`
}

const apiCall = async (endpoint, method = 'GET', data = null, token = null) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  const headers = {}

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    method,
    headers,
  }

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = isFormData ? data : JSON.stringify(data)
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'API Error')
    }

    return result
  } catch (error) {
    throw error
  }
}

// Auth API calls
export const authAPI = {
  login: async (email, password) => {
    return apiCall('/auth/login', 'POST', { email, password })
  },
  logout: async (token) => {
    return apiCall('/auth/logout', 'POST', null, token)
  },
  register: async (name, username, password, email) => {
    return apiCall('/auth/register', 'POST', { name, username, password, email })
  },
}

// User API calls
export const userAPI = {
  registerUser: async (userData, token) => {
    return apiCall('/admin/create-user', 'POST', userData, token)
  },
  getProfile: async (token) => {
    return apiCall('/users/profile', 'GET', null, token)
  },
  getAllUsers: async (token, search = '') => {
    return apiCall(`/users/all?search=${search}`, 'GET', null, token)
  },
  getUserStats: async (token) => {
    return apiCall('/users/stats', 'GET', null, token)
  },
  deleteUser: async (userId, token) => {
    return apiCall(`/users/${userId}`, 'DELETE', null, token)
  },
  updateUserPassword: async (userId, password, token) => {
    return apiCall(`/users/${userId}/password`, 'PATCH', { password }, token)
  },
}

// Notes API calls
export const notesAPI = {
  getAllNotes: async () => {
    return apiCall('/notes/all', 'GET')
  },
  getAdminNotes: async (token) => {
    return apiCall('/notes/admin/all', 'GET', null, token)
  },
  getNoteStats: async () => {
    return apiCall('/notes/stats', 'GET')
  },
  getUserNotes: async (token) => {
    return apiCall('/notes/my-notes', 'GET', null, token)
  },
  uploadNote: async (noteData, token) => {
    return apiCall('/notes/upload', 'POST', noteData, token)
  },
  deleteNote: async (noteId, token) => {
    return apiCall(`/notes/${noteId}`, 'DELETE', null, token)
  },
}

export default apiCall
