import axios from 'axios'; // Axios is a popular HTTP client for making API requests 

// Create an instance of Axios with default configuration for the API base URL and headers. 
// This allows us to easily make requests to our backend API without having to specify the 
// base URL and headers every time.
const API = axios.create({
    baseURL: 'http://localhost:8080/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add JWT token interceptor to include authorization header in all requests
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle authentication errors globally
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ------------------------------------------------------------------------
// HomeCanvas: Authentication API calls 
export const authAPI = {
    // Define methods for authentication-related API calls for HomeCanvas.
    register: (userData: any) => API.post('/auth/register', userData), // Register a new user
    login: (credentials: any) => API.post('/auth/login', credentials), // Log in a user
    getUser: (userId: string) => API.get(`/auth/user/${userId}`), // Fetch user data by user ID
    checkHealth: () => API.get('/auth/health'), // Check the health of the authentication service
};

// ------------------------------------------------------------------------
// HomeCanvas: Device Management API calls
export const deviceAPI = {
    // Define methods for device-related API calls
    getDevices: () => API.get('/devices'), // Get all devices for the authenticated user
    getDevice: (id: number) => API.get(`/devices/${id}`), // Get device details
    getTelemetry: (id: number, page: number = 0, size: number = 10) => 
        API.get(`/devices/${id}/telemetry`, { params: { page, size } }), // Get device telemetry history
    getActions: (id: number, page: number = 0, size: number = 10) => 
        API.get(`/devices/${id}/actions`, { params: { page, size } }), // Get device action logs
    // Send device commands to control hardware
    sendCommand: (deviceId: number, command: any) => 
        API.post(`/devices/${deviceId}/command`, command), // Send control command (servo, LED, etc.)
};

// Export the API instance for direct access if needed
export default API;