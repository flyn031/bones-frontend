import React, { useState } from "react";
import axios from "axios"; // Keep using axios directly for login, it's fine
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Correct path assuming Login.tsx is in src/components
import { Button, Input, Alert } from "../components/ui"; // Assuming ui is inside components
import { Mail, Lock } from "lucide-react";
import loginBackground from "../assets/images/login-background copy.jpeg";

function Login() {
  const navigate = useNavigate(); // Still needed for potential manual navigation if needed elsewhere
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true); // Assuming default is login view
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "", // Keep for registration potentially
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Determine endpoint based on isLogin state
    const endpoint = isLogin ? '/auth/login' : '/auth/register'; // Adjust register endpoint if needed
    const payload = isLogin ? { email: formData.email, password: formData.password } : formData;

    try {
       console.log(`Attempting ${isLogin ? 'login' : 'registration'} for:`, payload.email);
      // Use axios directly for login/register - doesn't need interceptor yet
      const response = await axios.post(
        `http://localhost:4000/api${endpoint}`,
        payload
      );

      console.log(`${isLogin ? 'Login' : 'Registration'} response:`, response.data);

      if (response.data && response.data.token && response.data.user) {
        // Call context's login with BOTH token and user data
        await login(response.data.token, response.data.user);
        
        // Let the router in App.tsx handle redirection based on isAuthenticated state
        // No immediate navigation needed here

      } else if (isLogin) {
         // Handle case where login response is missing expected data
         console.error("Login Error: Response missing token or user data.", response.data);
         setError("Login failed: Invalid server response.");
      } else {
         // Handle successful registration (maybe show success message or auto-login)
         console.log("Registration successful. User might need to login now or auto-login triggered.");
         // If auto-login after register:
         // login(response.data.token, response.data.user);
         // Otherwise, maybe switch back to login view:
         setIsLogin(true);
         setError("Registration successful! Please log in."); // Use success alert ideally
      }
    } catch (err: any) {
      console.error(`Authentication ${isLogin ? 'login' : 'registration'} error:`, err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
        setLoading(false);
    }
  };

  // Toggle between Login and Register
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "", name: "" });
    setError(""); // Clear errors when switching forms
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4" // Added padding for small screens
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="max-w-md w-full space-y-8 p-8 bg-white bg-opacity-95 dark:bg-gray-900 dark:bg-opacity-95 rounded-xl shadow-lg border dark:border-gray-700">
        <div>
          {/* Optional: Add Logo here */}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {isLogin ? "Sign in to BONES CRM" : "Create your Account"}
          </h2>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            className="mb-4"
            onDismiss={() => setError("")} // Allow dismissing error
          />
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <div className="pb-4"> {/* Add spacing */}
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Full Name"
                  // leftIcon={User} // Add icon if desired
                  required={!isLogin}
                  className="rounded-t-md" // Adjust rounding if needed
                />
              </div>
            )}

            <div>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Email address"
                leftIcon={Mail}
                required
                // Adjust rounding based on whether name field is present
                className={isLogin ? "rounded-t-md" : ""}
              />
            </div>
            <div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Password"
                leftIcon={Lock}
                required
                className="rounded-b-md" // Always rounded bottom
              />
            </div>
          </div>

          {/* Optional: Remember me / Forgot password */}
          {isLogin && (
              <div className="flex items-center justify-between">
                {/* <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300"> Remember me </label>
                </div> */}
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Forgot your password?
                  </a>
                </div>
              </div>
           )}


          <div>
            <Button
              type="submit"
              fullWidth
              className="mt-6" // Added margin top
              disabled={loading} // Disable button while loading
            >
              {loading ? 'Processing...' : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </div>
        </form>

        <div className="text-sm text-center mt-6"> {/* Adjusted margin */}
          <Button
            variant="link" // Use link variant if available for less emphasis
            onClick={toggleForm}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Login;