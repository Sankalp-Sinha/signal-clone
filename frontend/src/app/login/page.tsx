"use client";

import { useState } from "react";
import { login, verifyOtp } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      setError("");

      await login(username);

      setOtpSent(true);
      alert("Mock OTP is 123456");
    } catch {
      setError("User not found");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      setError("");
      const user = await verifyOtp(username, otp);
      localStorage.setItem("user", JSON.stringify(user));
      window.location.href = "/";
    } catch {
      setError("Invalid OTP");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f6f6] text-black">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-blue-500">Signal</h1>
        <p className="mt-2 text-gray-500">Login with mocked OTP</p>

        <div className="mt-8 space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={otpSent}
            className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none"
            placeholder="Username"
          />

          {otpSent && (
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none"
              placeholder="Enter OTP: 123456"
            />
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {loading && (
            <p className="text-center text-sm text-gray-500">
              Starting backend... This may take up to 30 seconds on the first request.
            </p>
          )}

          {!otpSent ? (
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? "Waking server..." : "Send OTP"}
            </button>
          ) : (
            <button
              onClick={handleVerifyOtp}
              className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white"
            >
              Verify & Login
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          New user?{" "}
          <a href="/register" className="text-blue-500">
            Register
          </a>
        </p>
      </div>
    </main>
  );
}