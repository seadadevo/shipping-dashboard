import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

// Order State Management API
export const orderStateAPI = {
  /**
   * Update order status with role-based validation
   */
  updateOrderStatus: async (orderId: string, status: string, changeReason?: string) => {
    const response = await api.put(`/api/orders/${orderId}/status`, {
      status,
      changeReason
    });
    return response.data;
  },

  /**
   * Get order state history
   */
  getOrderStateHistory: async (orderId: string) => {
    const response = await api.get(`/api/orders/${orderId}/state-history`);
    return response.data;
  },

  /**
   * Validate state change before attempting
   */
  validateStateChange: async (orderId: string, newState: string) => {
    const response = await api.post(`/api/orders/${orderId}/validate-state-change`, {
      newState
    });
    return response.data;
  }
};

export default api;
