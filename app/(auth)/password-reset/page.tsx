"use client";
import React, { useState } from 'react';
import { FiMail, FiSend, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('https://bahifinal.pythonanywhere.com/api/auth/password/reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage('✅ Password reset email sent. Check your inbox.');
        setEmail('');
      } else {
        const data = await res.json();
        setError(data.detail || '❌ Failed to send reset email.');
      }
    } catch {
      setError('❌ An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-indigo-50 via-sky-100 to-blue-200 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-neutral-800">Reset Your Password</h2>
          <p className="text-gray-600 text-sm mt-1">Enter your email to receive a password reset link.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 w-full">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400"><FiMail /></span>
              <input
                id="email"
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full border ${error ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
              <FiAlertCircle className="mr-2" /> <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
              <FiSend className="mr-2" /> <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all flex items-center justify-center"
          >
            {loading ? "Sending..." : <>Send Reset Link <FiSend className="ml-2" /></>}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-700">
          <p className="text-sm">
            Remembered your password?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
