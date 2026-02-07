import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary items-center justify-center">
        <img
          src="/images/zyntel_no_background.png"
          alt="Zyntel"
          className="w-3/4 max-w-md"
        />
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-primary p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white neon-glow mb-2">
              Zyntel
            </h1>
            <p className="text-gray-400 text-lg">Data Analysis Experts</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
                required
                autoFocus
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {error && (
              <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="text-center text-sm text-gray-400">
              <span className="text-highlight">Measured</span> |{' '}
              <span className="text-highlight">Managed</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              &copy; 2025 Zyntel. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;