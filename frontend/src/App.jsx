import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Routes/ProtectedRoute';
import Navbar from './Components/Navbar';
import QuizPlay from './Pages/QuizPlay';
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
import ResetPassword from './Pages/ResetPassword';
import ForgotPassword from './Pages/ForgotPassword';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/results" element={<Results />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/challenge" element={<Challenge />} />
            <Route path="/matchmaking" element={<Matchmaking />} />
            <Route path="/quiz/play" element={<QuizPlay />} />
            
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}