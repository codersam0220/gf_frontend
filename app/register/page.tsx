"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(email, password);
      localStorage.setItem("auth_token", data.token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <h1 className="text-white text-xl font-semibold tracking-tight">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Get 100 credits free</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none placeholder-gray-500 border border-gray-700 focus:border-gray-500 transition"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none placeholder-gray-500 border border-gray-700 focus:border-gray-500 transition"
          />

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-950 font-semibold py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50 mt-1"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-400 hover:text-white transition">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
