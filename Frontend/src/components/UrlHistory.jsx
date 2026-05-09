
import { useEffect, useState } from "react";
import UrlCard from "./UrlCard";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {FallingLines} from "react-loader-spinner"

const UrlHistory = () => {

  const [urls,setUrls] =useState([]);
  const {getToken} =useAuth();
  const [loadingData,setLoadingData]=useState(false);

  // const urls = [
  //   // {
  //   //   id: 1,
  //   //   shortUrl: "https://mkshrt.io/abc123",
  //   //   originalUrl: "https://github.com/Niranjan0524",
  //   //   createdAt: "March 3, 2026 5:59 PM GMT+5:30",
  //   // },
  //   // {
  //   //   id: 2,
  //   //   shortUrl: "https://mkshrt.io/xyz789",
  //   //   originalUrl: "https://www.example.com/some/very/long/url/path",
  //   //   createdAt: "March 3, 2026 4:30 PM GMT+5:30",
  //   // },
  // ];


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
          if(res.status==401 || res.status==511) errorMessage="Unauthorized";
          else if(res.status==400) errorMessage="Bad Request";
          else if(res.status==500) errorMessage="Internal Server Error";
          toast.error(errorMessage);
          return ;
        }
        
        
        
        console.log(data);
        setUrls(data);
        
   
        // toast.success("")
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
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Recent URLs</h2>
        <span className="rounded-full border border-border bg-bg-secondary/60 px-3 py-1 text-xs text-text-muted">
          {urls?.length} links
        </span>
      </div>

      {/* Cards */}
      
        {loadingData ? <div className="w-40 mx-auto flex flex-col gap-3">
              <FallingLines
                color="#4fa94d"
                width="100"
                visible={true}
                ariaLabel="falling-circles-loading"
              /> 
        </div>
        :
        <div className="flex flex-col gap-3">
        {
          urls?.map((url) => (
          <UrlCard key={url.createdAt} {...url} />
        ))}
        </div>
      }
    </section>
  );
};

export default UrlHistory;