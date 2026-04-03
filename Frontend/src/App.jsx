import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Home from './pages/Home.jsx';
import LoginSignup from './components/LoginSignup.jsx';
import Page404 from './components/page404.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import { useAuth } from './context/AuthContext';
import {Triangle} from 'react-loader-spinner';
import {Toaster} from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) 
    return <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh"   // full screen center
    }}>
      <Triangle
        visible={true}
        height="80"
        width="80"
        color="#4fa94d"
        ariaLabel="triangle-loading"
      />
    </div>;
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (

    <BrowserRouter>
      <div className="min-h-screen bg-bg-primary font-body text-text-primary">
            <Toaster/>
        <Routes>
          <Route path="/"       element={<Home />} />
          <Route path="/login"  element={<LoginSignup />} />
          <Route path="/signup" element={<LoginSignup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          //need to make analytics route private later
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="*" element={<Page404 />} />
        </Routes>
       
      </div>
    </BrowserRouter>
    
  )
}

export default App;
