import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

const Login = () => {
  const { login, isAuthenticated, loading, signInError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(null)
  const [triedLogin, setTriedLogin] = useState(false) // Kullanıcı giriş denemesi yaptı mı?

  // Input referansları
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Component mount olduğunda email input'una focus ol
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Error temizlendiğinde input'a focus ol
  useEffect(() => {
    if (!error && emailInputRef.current) {
      const timer = setTimeout(() => {
        emailInputRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Loading durumu
  if (loading) {
    return <LoadingSpinner />;
  }

  // Kullanıcı zaten giriş yapmışsa null döndür
  if (isAuthenticated) {
    return null;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null) // Her değişiklikte hata mesajını temizle
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setTriedLogin(true) // Giriş denemesi yapıldı
    const result = await login(form.email, form.password)
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('token', localStorage.getItem('token'))
        localStorage.setItem('user', localStorage.getItem('user'))
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
      } else {
        localStorage.removeItem('rememberMe')
        sessionStorage.setItem('token', localStorage.getItem('token'))
        sessionStorage.setItem('user', localStorage.getItem('user'))
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      navigate('/')
    } else {
      // Nhost'tan gelen hata mesajını kontrol et
      if (result.error?.message?.includes('Invalid email or password')) {
        setError('E-posta adresi veya şifre hatalı')
      } else if (result.error?.message?.includes('Email not confirmed')) {
        setError('E-posta adresinizi doğrulamanız gerekmektedir')
      } else {
        setError(result.error?.message || 'Giriş başarısız')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 drop-shadow-sm tracking-tight">
            S POS
          </h2>
          <p className="mt-2 text-base text-gray-600 font-medium">
            Hesabınıza giriş yapın
          </p>
        </div>

        <div className="card shadow-2xl border border-gray-100 animate-fade-in">
          <div className="card-body">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    ref={emailInputRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input pl-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-150"
                    placeholder="ornek@email.com"
                    value={form.email}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    ref={passwordInputRef}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input pl-10 pr-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-150"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-500 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-700">Beni Hatırla</label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex justify-center items-center shadow-md hover:shadow-lg hover:scale-105 transition-all duration-150"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </div>

              {/* Hata mesajları */}
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              {/* signInError sadece kullanıcı giriş denemesi yaptıysa ve local error yoksa gösterilsin */}
              {signInError && !error && triedLogin && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                  {signInError.message}
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Hesabınız yok mu?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Kayıt olun
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center animate-fade-in">
          <p className="text-xs text-gray-500 bg-primary-50 rounded-lg px-4 py-2 inline-block shadow">
            Yeni kayıt olduysanız, e-posta doğrulaması yapmanız gerekmektedir.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login 