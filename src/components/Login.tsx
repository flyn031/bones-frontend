import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Alert } from "./ui"; // Assuming ui components are in src/components/ui
import { Mail, Lock, User } from "lucide-react";
import loginBackground from "../assets/images/FabricoX_ The X-Factor Design 2.jpeg"; // <-- UPDATED to your new blank background

// API Response Interfaces
interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}
interface RegisterResponse {
  token?: string;
  user?: { id: string; name: string; email: string; role: string };
  message?: string;
}

function Login() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin ? { email: formData.email, password: formData.password } : formData;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://bonesbackend-production.up.railway.app/api'}${endpoint}`,
        payload
      );

      if (isLogin) {
        const loginData = response.data as LoginResponse;
        if (loginData?.token && loginData?.user) {
          await login(loginData.token, loginData.user);
        } else {
          setError("Login failed: Invalid server response.");
        }
      } else {
        const registerData = response.data as RegisterResponse;
        if (registerData?.token && registerData?.user) {
          await login(registerData.token, registerData.user);
        } else {
          setIsLogin(true);
          setError("Registration successful! Please log in.");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "", name: "" });
    setError("");
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* ===== Left Column: Branding ===== */}
      <div
        className="hidden lg:flex flex-col items-center justify-center p-12 text-center"
        style={{
          backgroundImage: `url(${loginBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* The HTML text is now rendered over the blank background image */}
        <div className="bg-black bg-opacity-25 p-8 rounded-lg">
          <h1 className="text-6xl font-bold text-white tracking-tighter">
            FabricoX
          </h1>
          <p className="mt-4 text-2xl text-white/90">
            The X-Factor in Manufacturing Management
          </p>
        </div>
      </div>

      {/* ===== Right Column: Form ===== */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="mx-auto grid w-full max-w-sm gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              {isLogin ? "Welcome Back" : "Create an Account"}
            </h1>
            <p className="text-balance text-gray-600 dark:text-gray-400">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Enter your details to get started"}
            </p>
          </div>

          {error && <Alert type="error" message={error} />}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="grid gap-2">
                <label htmlFor="name" className="sr-only">Name</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Full Name"
                  required
                  leftIcon={User}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="email-address" className="sr-only">Email</label>
              <Input
                id="email-address"
                name="email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                required
                leftIcon={Mail}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="sr-only">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                leftIcon={Lock}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
            </div>
            
            {isLogin && (
              <div className="flex items-center">
                 <a href="#" className="ml-auto inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 underline underline-offset-4">
                    Forgot your password?
                  </a>
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={toggleForm}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 underline underline-offset-4"
              disabled={loading}
            >
              {isLogin ? "Register" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;