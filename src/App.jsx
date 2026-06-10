import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Routes/ProtectedRoute';
import Navbar from './Components/Navbar';

import Home from './Pages/Home';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import Quiz from './Pages/Quiz';
import Results from './Pages/Results';
import Leaderboard from './Pages/Leaderboard';
import HallOfFame from './Pages/HallOfFame';
import Profile from './Pages/Profile';
import Challenge from './Pages/Challenge';
import Matchmaking from './Pages/Matchmaking';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<><Navbar /><Dashboard /></>} />
            <Route path="/quiz" element={<><Navbar /><Quiz /></>} />
            <Route path="/results" element={<><Navbar /><Results /></>} />
            <Route path="/leaderboard" element={<><Navbar /><Leaderboard /></>} />
            <Route path="/hall-of-fame" element={<><Navbar /><HallOfFame /></>} />
            <Route path="/profile" element={<><Navbar /><Profile /></>} />
            <Route path="/challenge" element={<><Navbar /><Challenge /></>} />
            <Route path="/matchmaking" element={<><Navbar /><Matchmaking /></>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}