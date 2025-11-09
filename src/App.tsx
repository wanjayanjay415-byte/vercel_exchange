import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Loading from './components/Loading';

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
    // Simulasi loading selama 1.5 detik
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
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
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!userId) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard userId={userId} username={username} onLogout={handleLogout} />;
}

export default App;
