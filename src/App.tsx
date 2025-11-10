import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Loading from './components/Loading';
import ChartsPage from './pages/ChartsPage';
import Settings from './components/Settings';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={userId ? <Dashboard userId={userId} username={username} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/settings" element={userId ? <Settings userId={userId} /> : <Login onLogin={handleLogin} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
