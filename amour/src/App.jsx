import { Component, Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { useNativeAuthRedirect } from './hooks/useNativeAuthRedirect'
import { useAndroidWidgets } from './hooks/useAndroidWidgets'
import { useRealtimeSync } from './hooks/useRealtimeSync'

// Eager: auth + home (critical path)
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'

// Lazy: everything else
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const PairingPage = lazy(() => import('./pages/PairingPage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const MoodPage = lazy(() => import('./pages/MoodPage'))
const MemoriesPage = lazy(() => import('./pages/MemoriesPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const DoodlePage = lazy(() => import('./pages/DoodlePage'))
const ImageSharePage = lazy(() => import('./pages/ImageSharePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LockscreenDoodle = lazy(() => import('./pages/LockscreenDoodle'))
const SplashScreen = lazy(() => import('./pages/SplashScreen'))

const Loader = <div className="grid min-h-screen place-items-center bg-bg"><div className="skeleton h-10 w-10 rounded-2xl" /></div>
const S = ({ children }) => <Suspense fallback={Loader}>{children}</Suspense>

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    return this.state.error
      ? <div className="grid min-h-screen place-items-center bg-bg p-8 text-center text-white"><div><span className="text-5xl">💔</span><h1 className="display mt-3 text-3xl">A little pause</h1><p className="mt-2 text-muted">Amour hit a snag. Refresh the page and your saved moments will still be here.</p><button onClick={() => location.reload()} className="primary-btn mt-5">Refresh Amour</button></div></div>
      : this.props.children
  }
}

function Protected({ children }) {
  const { user, demoMode, loading } = useAppStore()
  if (loading) return <div className="grid min-h-screen place-items-center bg-bg"><div className="skeleton h-20 w-20 rounded-3xl" /></div>
  return user || demoMode ? children : <Navigate to="/auth" replace />
}

const guard = x => <Protected><S>{x}</S></Protected>

export default function App() {
  const init = useAppStore(s => s.initAuth)
  useNativeAuthRedirect()
  useAndroidWidgets()
  useRealtimeSync()
  useEffect(() => { init() }, [init])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/splash" element={<S><SplashScreen /></S>} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<S><ResetPasswordPage /></S>} />
          <Route path="/auth-callback" element={<S><AuthCallbackPage /></S>} />
          <Route path="/pair" element={guard(<PairingPage />)} />
          <Route path="/home" element={<Protected><Dashboard /></Protected>} />
          <Route path="/notes" element={guard(<NotesPage />)} />
          <Route path="/mood" element={guard(<MoodPage />)} />
          <Route path="/memories" element={guard(<MemoriesPage />)} />
          <Route path="/quiz" element={guard(<QuizPage />)} />
          <Route path="/doodle" element={guard(<DoodlePage />)} />
          <Route path="/lockscreen-doodle" element={guard(<LockscreenDoodle />)} />
          <Route path="/images" element={guard(<ImageSharePage />)} />
          <Route path="/profile" element={guard(<ProfilePage />)} />
          <Route path="/settings" element={guard(<SettingsPage />)} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
