import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Alert } from "../components/ui";
import { Mail, Lock } from "lucide-react";
import loginBackground from "../assets/images/login-background copy.jpeg";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:4000/api/auth/login",
        formData
      );

      if (response.data && response.data.token) {
        login(response.data.token);
        navigate("/");
      } else {
        setError("No token received from server");
      }
    } catch (error: any) {
      setError(error.response?.data?.error || "Authentication failed");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="max-w-md w-full space-y-8 p-8 bg-white bg-opacity-90 rounded-xl shadow-medium">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-neutral-900">
            {isLogin ? "Sign in to BONES CRM" : "Create Account"}
          </h2>
        </div>

        {error && (
          <Alert 
            type="error" 
            message={error} 
            className="mb-4" 
          />
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your full name"
                required={!isLogin}
              />
            )}
            
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="you@example.com"
              leftIcon={Mail}
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter your password"
              leftIcon={Lock}
              required
            />
          </div>

          <Button 
            type="submit" 
            fullWidth 
            className="mt-6"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ email: "", password: "", name: "" });
              setError("");
            }}
          >
            {isLogin 
              ? "Need an account? Register" 
              : "Already have an account? Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Login;