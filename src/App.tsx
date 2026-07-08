import { useState, useEffect, lazy, Suspense } from 'react';
import { LazyMotion, m, domAnimation, MotionConfig, AnimatePresence } from 'motion/react';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './components/Landing';
import LoginPage from './components/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Dashboard = lazy(() => import('./components/Dashboard'));

function AppContent() {
  const { user, loading } = useAuth();
  const [appStage, setAppStage] = useState<'landing' | 'auth' | 'dashboard'>(() => {
    return user ? 'dashboard' : 'landing';
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (user && appStage === 'landing') {
      setAppStage('dashboard');
    }
  }, [user, appStage]);

  const handleStart = () => {
    if (user) {
      setAppStage('dashboard');
    } else {
      setAppStage('auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showDashboard = appStage === 'dashboard' || !!user;

  return (
    <ErrorBoundary>
      <LazyMotion features={domAnimation}>
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait">
            {appStage === 'auth' && !user ? (
              <m.div
                key="login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <LoginPage onSkip={() => setAppStage('dashboard')} />
              </m.div>
            ) : showDashboard ? (
              <m.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Suspense fallback={<div className="min-h-dvh bg-background" />}>
                  <Dashboard darkMode={darkMode} onToggleDark={() => setDarkMode(v => !v)} />
                </Suspense>
              </m.div>
            ) : (
              <m.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <Landing onStart={handleStart} />
              </m.div>
            )}
          </AnimatePresence>
        </MotionConfig>
      </LazyMotion>

      <div className="dev-banner safe-area-inset-bottom">This site is still in development</div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
