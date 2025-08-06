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

// ------------------------------------------------------------------------
// HomeCanvas: Authentication API calls 
export const authAPI = {
    // Define methods for authentication-related API calls for HomeCanvas.
    register: (userData: any) => API.post('/auth/register', userData), // Register a new user
    login: (credentials: any) => API.post('/auth/login', credentials), // Log in a user
    getUser: (userId: string) => API.get(`/auth/user/${userId}`), // Fetch user data by user ID
    checkHealth: () => API.get('/auth/health'), // Check the health of the authentication service
};


// ------------------------------------------------------------------------------