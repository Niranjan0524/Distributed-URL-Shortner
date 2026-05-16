import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../library/supabaseClient";
import {
  FiCopy, FiExternalLink, FiTrash2, FiLink2, FiBarChart2,
  FiPlus, FiCheck, FiLogOut, FiTrendingUp, FiMousePointer, FiCalendar, FiArrowLeft
} from "react-icons/fi";
import toast from "react-hot-toast";
import { FallingLines } from "react-loader-spinner";


const StatCard = ({ icon, label, value, sub, glow }) => (
  <div
    className="relative flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-5 overflow-hidden"
    style={
      glow
        ? { boxShadow: "0 0 32px rgba(180,18,27,0.15), 0 2px 16px rgba(0,0,0,0.6)" }
        : { boxShadow: "0 2px 16px rgba(0,0,0,0.5)" }
    }
  >
    {glow && (
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #B4121B 0%, transparent 70%)" }}
      />
    )}
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-widest text-text-muted">{label}</span>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ background: glow ? "rgba(180,18,27,0.18)" : "rgba(255,255,255,0.05)" }}
      >
        <span style={{ color: glow ? "#D91E28" : "#94A3B8" }}>{icon}</span>
      </span>
    </div>
    <div>
      <p className="font-display text-3xl font-bold text-text-primary">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  </div>
);

/* ── Link row ── */
const LinkRow = ({ link, onDelete, onCopy, copiedId ,handleRedirect }) => (
  <div
    className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#0D0D0D] px-5 py-4 transition-all duration-200 hover:border-accent-red/25 hover:bg-[#111]"
    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
  >
    {/* Icon */}
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={{ background: "rgba(180,18,27,0.12)", border: "1px solid rgba(180,18,27,0.2)" }}
    >
      <FiLink2 size={16} className="text-accent-red" />
    </div>

    {/* URLs */}
    <div className="min-w-0 flex-1">
      <p
        className="truncate text-sm font-semibold"
        style={{
          background: "linear-gradient(135deg, #D91E28, #B4121B)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {link.shortUrl}
      </p>
      <p className="mt-0.5 truncate text-xs text-text-muted" title={link.originalUrl}>
        <span className="mr-1 opacity-40">↪</span>{link.originalUrl}
      </p>
    </div>

    {/* Clicks */}
    <div className="hidden shrink-0 flex-col items-center sm:flex">
      <span className="text-base font-bold text-text-primary">{link.clicks}</span>
      <span className="text-[10px] uppercase tracking-widest text-text-muted">clicks</span>
    </div>

    {/* Date */}
    <div className="hidden shrink-0 items-center gap-1.5 text-xs text-text-muted/60 lg:flex">
      <FiCalendar size={11} />
      {link.createdAt}
    </div>

    {/* Actions */}
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        onClick={() => onCopy(link.shortUrl,link.Id)}
        title="Copy short URL"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/[0.07] text-text-muted transition-all duration-150 hover:border-accent-red/30 hover:text-white"
      >
        {copiedId === link.Id
          ? <FiCheck size={14} className="text-success" />
          : <FiCopy size={14} />}
      </button>
      <button
        onClick={() => handleRedirect(link.shortUrl)}
        title="Visit"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/[0.07] text-text-muted transition-all duration-150 hover:border-accent-red/30 hover:text-white"
      >
        <FiExternalLink size={14} />
      </button>
      <button
        onClick={() => onDelete(link.Id)}
        title="Delete"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/[0.07] text-text-muted transition-all duration-150 hover:border-red-500/40 hover:text-red-400"
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [links, setLinks] = useState([]);
  const [inputUrl, setInputUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [shortening, setShortening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState("");

  const {getToken}=useAuth();
  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const topClicks = links.length ? Math.max(...links.map(l => l.clicks)) : 0;

  /* ── Shorten (mocked) ── */
  const handleShorten = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
  
    const url=inputUrl.trim();

    setShortening(true);
    const body = {
      longUrl: url,
      ...(alias && { alias: alias }),
    };
    const token=await getToken();

    if(!token) {
      toast.error("Please Login/Signup");
      return ;
    }
    const backendUrl=import.meta.env.VITE_BACKEND_URL;

    let code;
    try{
      const res=await fetch(`${backendUrl}/api/shortenUrl`,
        {
          method: "POST",
          headers:{
            "content-Type":"application/json",
            "authorization":`bearer ${token}`
          },
          body: JSON.stringify(body)
        }
      )

      code=await res.json();
      toast.success("Short link is ready..")
  
      console.log("ShortCode",code);
      setLinks(prev => [
        {
          Id: code.Id,
          shortUrl: `${code.shortUrl}`,
          originalUrl: inputUrl.trim(),
          clicks: 0,
          createdAt: new Date().toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }),
        },
        ...prev,
      ]);
     
    }
    catch(err){
      toast.error("Internal Error");
      console.error(err);
    }
    finally{
      setInputUrl("");
      setAlias("");
      setShortening(false);
    }

    
  };

  const handleDelete = async(id) => {

    const token=await getToken();
    const BackendUrl=import.meta.env.VITE_BACKEND_URL;
    console.log("Deleting url ,id:",id);
    try{
      const response=await fetch(`${BackendUrl}/removeUrl/${id}`,{
        method:"DELETE",
        headers:{
          Authorization:`Bearer ${token}`,
        }
      });

      const res=await response.json();
      
      if(!response.ok){
        console.log("in dashboard :handleDelete",response.Status);
        if(response.status==404){
          toast.error(`Url Not Found: Id: ${id} `);
        }
        else {
          toast.error("Internal Server Error");
        }
        return ;
      }

      toast.success("Url Deleted Successfully");
      setLinks((prevLinks)=>prevLinks.filter((link)=> link.Id!=id));
    }
    catch(err){
      toast.error("Internal Server Error");
      console.log("Error in dashBoard:",err);
    }

  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filtered = links.filter(l =>
    l.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
    l.shortUrl.toLowerCase().includes(search.toLowerCase())
  );

  const getRedirectUrl = (url) => {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";
    return `${backendUrl}/${encodeURIComponent(url)}`;
  };

  const handleRedirect = (url) => {
    window.open(getRedirectUrl(url), "_blank", "noopener,noreferrer");
  };

  const handleCopy=async(url,id)=>{
    setCopiedId(id);
    await navigator.clipboard.writeText(getRedirectUrl(url));
    setTimeout(() => setCopiedId(null), 2000);
  }
 
  const [loadingData,setLoadingData]=useState(false);

  useEffect(()=>{
    
    const fetchUrlsData=async ()=>{
      const backendUrl=import.meta.env.VITE_BACKEND_URL;
      const token=await getToken();
      try{
        setLoadingData(true);
        const response =await fetch(`${backendUrl}/api/dashboard/urls`,{
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
        setLinks(data);

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
    <div className="min-h-screen" style={{ background: "#000000" }}>

      {/* ── Ambient glow ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #B4121B 0%, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      {/* ── Fixed Header ── */}
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07]"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.7), 0 1px 0 rgba(180,18,27,0.12)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #B4121B 0%, #E8212D 100%)", boxShadow: "0 0 14px rgba(180,18,27,0.55)" }}
            >
              M
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">
              makeIt<span style={{ color: "#ff4d4d" }}>Short</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.07] px-3 py-1.5 text-xs font-medium text-text-muted transition-all duration-150 hover:border-accent-red/30 hover:text-white"
            >
              <FiArrowLeft size={13} /> Home
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #B4121B, #E8212D)", boxShadow: "0 0 10px rgba(180,18,27,0.4)" }}
            >
              {displayName[0].toUpperCase()}
            </div>
            <span className="hidden text-sm text-text-muted sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.07] px-3 py-1.5 text-xs font-medium text-text-muted transition-all duration-150 hover:border-red-500/30 hover:text-red-400"
            >
              <FiLogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-4 pt-24 pb-8">

        {/* ── Greeting ── */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Hey, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-text-muted">Here's what's happening with your links.</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<FiLink2 size={16} />}
            label="Total Links"
            value={links.length}
            sub="shortened URLs"
            glow
          />
          <StatCard
            icon={<FiMousePointer size={16} />}
            label="Total Clicks"
            value={totalClicks.toLocaleString()}
            sub="across all links"
            glow
          />
          <StatCard
            icon={<FiTrendingUp size={16} />}
            label="Top Link"
            value={topClicks.toLocaleString()}
            sub="clicks on best link"
          />
        </div>

        {/* ── Shorten form ── */}
        <div
          className="mb-8 rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-6"
          style={{ boxShadow: "0 0 0 1px rgba(180,18,27,0.15), 0 8px 32px rgba(180,18,27,0.1)" }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <FiPlus size={15} className="text-accent-red" /> Shorten a new link
          </h2>
          <form onSubmit={handleShorten} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              required
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="Paste your long URL here..."
              className="flex-1 rounded-xl border border-white/[0.07] bg-[#1A1A1A] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-150 focus:border-accent-red/50"
            />
            <input
              type="text"
              value={alias}
              onChange={e => setAlias(e.target.value)}
              placeholder="Custom alias (optional)"
              className="w-full rounded-xl border border-white/[0.07] bg-[#1A1A1A] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-150 focus:border-accent-red/50 sm:w-48"
            />
            <button
              type="submit"
              disabled={shortening}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all duration-150 hover:scale-[1.02] hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #B4121B, #D91E28)", boxShadow: "0 0 20px rgba(180,18,27,0.35)" }}
            >
              {shortening ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <FiLink2 size={15} />
              )}
              {shortening ? "Shortening..." : "Shorten"}
            </button>
          </form>
        </div>

        {/* ── Links list ── */}
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <FiBarChart2 size={15} className="text-accent-red" /> Your Links
              <span className="ml-1 rounded-full bg-accent-red/15 px-2 py-0.5 text-xs font-bold text-accent-red">
                {links.length}
              </span>
            </h2>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search links..."
              className="w-44 rounded-xl border border-white/[0.07] bg-[#1A1A1A] px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none transition-all duration-150 focus:border-accent-red/40"
            />
          </div>

          
          {loadingData ? <div className="mx-auto flex w-40 flex-col items-center gap-3 py-10">
              <FallingLines
                color="#D91E28"
                width="100"
                visible={true}
                ariaLabel="falling-circles-loading"
              /> 
        </div>
        :
        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0D0D0D] py-16 text-text-muted">
              <FiLink2 size={32} className="opacity-30" />
              <p className="text-sm">
                {search ? "No links match your search." : "No links yet — shorten your first URL above!"}
              </p>
            </div>
          ) : (
            <div
              className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto pr-2"
              style={{ scrollbarColor: "rgba(180,18,27,0.42) transparent" }}
            >
              {filtered.map(link => (
                <LinkRow
                  key={link.Id}
                  link={link}
                  onDelete={handleDelete}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                  handleRedirect={handleRedirect}
                />
              ))}
            </div>
          )}
        </div>
        }
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
