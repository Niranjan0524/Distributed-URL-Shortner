import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import Home from './pages/Home.jsx';
import LoginSignup from './components/LoginSignup.jsx';
import Page404 from './components/page404.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg-primary font-body text-text-primary">
        <Routes>
          <Route path="/"       element={<Home />} />
          <Route path="/login"  element={<LoginSignup />} />
          <Route path="/signup" element={<LoginSignup />} />
          <Route path="*" element={<Page404 />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App;
