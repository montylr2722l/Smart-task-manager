import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please fill in all fields')
      }

      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] px-4 py-8">
      <div className="w-full max-w-[450px] rounded-xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-10">
        <div className="mb-8 text-center">
          <Sparkles size={32} className="mx-auto mb-4 text-[#667eea]" />
          <h1 className="m-0 text-2xl font-bold text-[#333] sm:text-[28px]">Smart Task Manager</h1>
          <p className="m-0 mt-1 text-sm text-[#999]">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold uppercase tracking-wide text-[#555]" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              className="rounded-lg border-2 border-[#e0e0e0] bg-[#fafafa] px-3.5 py-3 text-sm text-[#333] outline-none transition focus:border-[#667eea] focus:bg-white focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold uppercase tracking-wide text-[#555]" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              className="rounded-lg border-2 border-[#e0e0e0] bg-[#fafafa] px-3.5 py-3 text-sm text-[#333] outline-none transition focus:border-[#667eea] focus:bg-white focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error && <div className="rounded-lg border-l-4 border-[#c33] bg-[#fee] px-3.5 py-3 text-sm text-[#c33]">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(102,126,234,0.4)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-[#eee] pt-5 text-center">
          <p className="m-0 text-sm text-[#666]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#667eea] no-underline hover:text-[#764ba2] hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
