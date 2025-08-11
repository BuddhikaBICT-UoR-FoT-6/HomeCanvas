import { useCallback, useState } from 'react'; // Importing the useState hook from React to manage component state
import { authAPI } from '../services/api'; // Importing the authAPI object from our API service, which
//  contains methods for making authentication-related API calls

// Define the props for the LoginForm component. It expects a single prop, onLoginSuccess, which
// is a function that will be called when the user successfully logs in. The function receives the
// user data as an argument.
interface LoginFormProps {
    onLoginSuccess: (user: any) => void;
    onSwitchToRegister?: () => void; // Optional prop for switching to the registration form 
}

// The LoginForm component is a functional React component that renders a login form. It 
// manages the state of the email, password, loading status, error messages, and success
// messages using the useState hook. When the form is submitted, it makes an API call to
// log the user in and handles the response accordingly, updating the state and localStorage
// as needed.
export default function LoginForm({onLoginSuccess, onSwitchToRegister}: LoginFormProps){
    const [username, setUsername] = useState<string>(''); // State for storing the username input value
    const [password, setPassword] = useState<string>(''); // State for storing the password input value
    const [loading, setLoading] = useState<boolean>(false); // State for tracking whether the login process is currently in progress
    const [toast, setToast] = useState({ message: '', type: '', visible: false }); // State for managing toast notifications (message, type, and visibility)

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type, visible: true });
        const timer = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // The handleSubmit function is called when the login form is submitted. It prevents the default
    // form submission behavior, clears any previous error or success messages, sets the loading
    // state to true, and then attempts to log the user in via the authAPI.login method. If the
    // login is successful, it stores the user data in localStorage, calls the onLoginSuccess
    // callback function, resets the form fields, and redirects the user to the dashboard after 2
    // seconds. If an error occurs, it sets the error message. Finally, it always sets the loading
    // state back to false.
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // default behavior of a form submission is to reload the page. By calling
        // e.preventDefault(), we prevent this default action from occurring, allowing us to handle the
        // form submission with our custom logic instead.
        setLoading(true); // Set the loading state to true to indicate that the login 
        // process has started. This can be used to disable the login button and show a
        // loading indicator while the API call is in progress.

        try{
            // ensure that both username and password fields are filled out before making the API call
            if(!username || !password){
                showToast('Username and password are required', 'error');
                setLoading(false);
                return;

            }

            // Make the API call to log the user in using the authAPI.login method, passing the username and
            // password as parameters. The response from the API call is stored in the response variable.
            const response = await authAPI.login({username, password});

            // Check if the login was successful by looking at the success property in the response data.
            // If the login was successful, we set a success message, store the user data in localStorage,
            // call the onLoginSuccess callback function with the user data, reset the form fields, and
            // redirect the user to the dashboard after a short delay.
            if(response.data.success){
                showToast('Login successful! Redirecting...', 'success');

                // Store the user data in localStorage so that it can be accessed across different parts
                // of the application. 
                localStorage.setItem('user', JSON.stringify(response.data.data));
                localStorage.setItem('userId', response.data.data.id);

                // Call the onLoginSuccess callback function, passing the user data as an argument.
                // This allows the parent component to update its state and navigate the user to the
                // dashboard or perform other actions upon successful login.
                if(onLoginSuccess){
                    onLoginSuccess(response.data.data);
                }

                setUsername(''); // Reset the username input field to an empty string after a successful login
                setPassword(''); // Reset the password input field to an empty string after a successful login 

                // Redirect to dashboard after 2 seconds to give the user time to see the success message before
                // navigating away from the login page.
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            }

        } catch (err: any) {
            // If an error occurs during the login process, we catch it and set an appropriate error message.
            // We check if the error response contains a message and use that; otherwise, we set a generic error message.
            showToast(err.response?.data?.message || 'Login failed. Please try again.', 'error');
        } finally {
            // set the loading state back to false to indicate that the login process has completed, regardless of
            // whether it was successful or if an error occurred.
            setLoading(false);
        }
    };

    // The return statement contains the JSX that defines the structure and styling of the login form. It includes
    // a header, input fields for username and password, error and success message displays, a submit button, and a 
    // link to the registration page. The form is styled using Tailwind CSS classes to create a visually appealing
    // and responsive design.
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Toast Notification */}
            {toast.visible && (
                <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-[60] ${
                    toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                }`}>
                    {toast.message}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                {/* Header */}
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    HomeCanvas
                </h1>
                <p className="text-center text-gray-600 mb-8">Login to your account</p>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Input */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <input 
                            type="text" 
                            id="username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            placeholder="your_username" 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Footer link */}
                <p className="text-center text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <button
                        onClick={onSwitchToRegister}
                        className="text-blue-500 hover:underline font-bold bg-none border-none cursor-pointer"
                    >
                        Register here
                    </button>
                </p>
        </div>
    </div>
    );
        
}