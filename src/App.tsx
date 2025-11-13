import { useState, useEffect } from 'react';
import { LanguageProvider } from './lib/LanguageContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Loading from './components/Loading';
import ChartsPage from './pages/ChartsPage';
import Settings from './components/Settings';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { upsertOAuthUser } from './lib/auth';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');
    if (savedUserId && savedUsername) {
      setUserId(savedUserId);
      setUsername(savedUsername);
    }
    // Also check Supabase session for OAuth sign-ins
    (async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (session && session.user && session.user.email) {
          const email = session.user.email;
          const user = await upsertOAuthUser(email);
          if (user) handleLogin(user.id, user.username);
        }
      } catch (e) {
        // ignore
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    })();

    // Listen to auth state changes (e.g., after OAuth redirect)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && session.user && session.user.email) {
        try {
          const email = session.user.email;
          const user = await upsertOAuthUser(email);
          if (user) handleLogin(user.id, user.username);
        } catch (err) {
          console.error('Failed to upsert OAuth user', err);
        }
      }

      if (event === 'SIGNED_OUT') {
        handleLogout();
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLogin = (id: string, name: string) => {
    setUserId(id);
    setUsername(name);
    localStorage.setItem('userId', id);
    localStorage.setItem('username', name);
  };

  const handleLogout = () => {
    setUserId(null);
    setUsername('');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    // Sign out from Supabase auth as well
    supabase.auth.signOut().catch(() => {});
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={userId ? <Dashboard userId={userId} username={username} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/settings" element={userId ? <Settings userId={userId} /> : <Login onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
