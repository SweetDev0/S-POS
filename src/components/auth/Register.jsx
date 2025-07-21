import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ShoppingCart, User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

const Register = () => {
  const navigate = useNavigate()
  const { register, loading, signUpError, isAuthenticated } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Input referansları
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Component mount olduğunda name input'una focus ol
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Error temizlendiğinde input'a focus ol
  useEffect(() => {
    if (!error && nameInputRef.current) {
      const timer = setTimeout(() => {
        nameInputRef.current.focus();
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
    setSuccess(false)
    setError(null)
    
    // Form validasyonu
    if (!form.name.trim()) {
      setError('Ad Soyad alanı zorunludur')
      return
    }

    if (!form.email.trim()) {
      setError('E-posta alanı zorunludur')
      return
    }

    if (!form.email.includes('@')) {
      setError('Geçerli bir e-posta adresi giriniz')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      return
    }

    const result = await register(form.name, form.email, form.password)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } else {
      // Nhost'tan gelen hata mesajını kontrol et
      const errMsg = result.error?.message || ''
      if (
        errMsg.includes('409') ||
        errMsg.includes('already exists')
      ) {
        setError('Bu e-posta adresi ile zaten bir hesap bulunmaktadır. Giriş yapmayı deneyin.')
      } else if (
        errMsg.toLowerCase().includes('email') &&
        errMsg.toLowerCase().includes('verify')
      ) {
        setSuccess(true)
        setError(null)
      } else {
        setError(errMsg || 'Kayıt sırasında bir hata oluştu')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            S POS
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Yeni hesap oluşturun
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={nameInputRef}
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="input pl-10"
                    placeholder="Ad Soyad"
                    value={form.name}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={emailInputRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input pl-10"
                    placeholder="ornek@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={passwordInputRef}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={confirmPasswordInputRef}
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex justify-center items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                </button>
              </div>

              {/* Hata mesajları */}
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              {signUpError && !error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                  {signUpError.message}
                </div>
              )}
              {success && (
                <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg border border-green-200">
                  Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.<br />
                  <Link to="/login" className="underline text-primary-700 font-semibold block mt-2">
                    Giriş ekranına git
                  </Link>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Zaten hesabınız var mı?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Giriş yapın
                  </Link>
                </p>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-4 py-2 inline-block">
                  <span className="font-semibold">Önemli:</span> Kayıt sonrası e-posta adresinizi doğrulamanız gerekmektedir.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register 