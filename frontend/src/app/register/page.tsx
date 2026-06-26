"use client";

import { useState } from "react";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    try {
      setLoading(true);
      setError("");

      await registerUser(
        username,
        phone,
        displayName
      );

      alert("Registration successful. Please login.");

      window.location.href = "/login";
    } catch {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f6f6] text-black">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-blue-500">Signal</h1>
        <p className="mt-2 text-gray-500">
          Create your account
        </p>

        <div className="mt-8 space-y-4">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none"
            placeholder="Display Name"
          />

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none"
            placeholder="Username"
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none"
            placeholder="Phone Number"
          />

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}
          {loading && (
            <p className="text-center text-sm text-gray-500">
              Starting backend... This may take up to 30 seconds on the first request.
            </p>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white"
          >
            {loading ? "Starting backend..." : "Register"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}