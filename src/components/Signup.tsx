// /src/components/Signup.tsx
"use client";  

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API_URL from '@/config/config';

const Signup = () => {
    
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, email, password }),
                // body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
              router.push("/home");
            } else {
              let message = 'Signup failed. Please try again.';
              try {
                const body = await response.json();
                message = body.error || body.message || message;
              } catch {}
              setError(message);
            }
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Something went wrong');
          }
        }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">
            Signup
          </h1>
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your username"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">Signup error: {error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Signup
            </button>
          </form>
        </div>
      </div>
    );
};

export default Signup;
