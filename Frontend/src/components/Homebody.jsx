import UrlForm from "./urlForm";
import UrlHistory from "./UrlHistory";
import Footer from "./Footer";
import HeroSection from "./HeroSection";
import { useState,useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Homebody = () => {

  const {user}=useAuth();
  const isLoggedIn = !!user;

  const [urls,setUrls] =useState([]);
  const {getToken} =useAuth();
  const [loadingData,setLoadingData]=useState(false);

  const handleUrlCreated=(newUrl)=>{
    setUrls((prev)=>[newUrl,...prev]);
  }
  

  useEffect(()=>{
    
    const fetchUrlsData=async ()=>{
      const backendUrl=import.meta.env.VITE_BACKEND_URL;
      const token=await getToken();
      try{
        setLoadingData(true);
        const response =await fetch(`${backendUrl}/api/getPastUrls`,{
          method:"GET",
          headers:{
            Authorization :`Bearer ${token}`
          }
        });

        const data=await response.json();

        if(!response.ok){
          let errorMessage = "Unable to load URL history";
          if(response.status==401 || response.status==511) errorMessage="Unauthorized";
          else if(response.status==400) errorMessage="Bad Request";
          else if(response.status==500) errorMessage="Internal Server Error";
          toast.error(errorMessage);
          return ;
        }
        
        console.log(data);
        setUrls(data);

      }
      catch(err){
        console.log(err);
        toast.error("Internal Server Error");
      }
      finally{
        setLoadingData(false);
      }
    }


    fetchUrlsData();
    
  },[]);



  return (
    <div className="relative z-10 mt-20">
      {/* ── Hero + Form (two-column) ── */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-2">
          <HeroSection />
          <UrlForm handleUrlCreated={handleUrlCreated} />
        </div>
      </div>

      {/* ── History & Footer (unchanged) ── */}
      {isLoggedIn ? <UrlHistory urls={urls} loadingData={loadingData}/> :<div> </div>}
      <Footer />
    </div>
  );
};

export default Homebody;