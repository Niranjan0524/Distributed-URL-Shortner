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
import toast from "react-hot-toast";
import { useState } from 'react';

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
  const [statusLoading,setStatusLoading]=useState(false);

  const checkHealth=async (server)=>{
    const backendUrl=import.meta.env.VITE_BACKEND_URL;

    if(server!= "redis" && server!="mainServer"){
      toast.error("Not Valid Server Type");
      return
    }
    setStatusLoading(true);
    try{
      const res=await fetch(`${backendUrl}/health/${server}`);

      const data=await res.json();
      const serverStatus=data?.Status;
      setStatusLoading(false);
      console.log(server, "is ", serverStatus);
      if(serverStatus=="up"){
        toast.success(server,"is up");
      }
      else{
        toast.error(server,"is down");
      }
    }
    catch(err){
      toast.error("Server is down");
      console.log(err);
    }
    finally{
      setStatusLoading(false);
    }


  }

  

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
       <div className="fixed bottom-5 right-5 z-50">
          <div className="flex flex-col gap-2 rounded-xl border border-red-900/40 bg-black/80 p-2 shadow-2xl backdrop-blur-md">
            <button
              onClick={()=>checkHealth("mainServer")}
              className="rounded-lg border border-red-800/50 bg-zinc-950 px-3 py-2 text-xs font-medium text-red-400 transition-all duration-200 hover:border-red-600 hover:bg-red-700 hover:text-white active:scale-95 cursor-pointer"
            >
              ⚡ Main Server
            </button>

            <button
              onClick={()=>{checkHealth("redis")}}
              className="flex items-center justify-center rounded-lg border border-red-800/50 bg-zinc-950 px-3 py-2 text-xs font-medium text-red-400 transition-all duration-200 hover:border-red-600 hover:bg-red-700 hover:text-white active:scale-95 cursor-pointer"
            >
              {statusLoading==true?<Triangle className="items-center justify-center" height={17} width={20}/> :<>🗄️ Redis</>}
            </button>
          </div>
        </div>
      </div>
    </BrowserRouter>
    
  )
}

export default App;
