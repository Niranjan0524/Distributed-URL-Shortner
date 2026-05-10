
import { useEffect, useState } from "react";
import UrlCard from "./UrlCard";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FallingLines } from "react-loader-spinner";
import { FiLink2 } from "react-icons/fi";

const UrlHistory = ({urls,loadingData}) => {

 

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


  

  
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      <div
        className="rounded-2xl border bg-bg-secondary/50 p-5 backdrop-blur-xl sm:p-6"
        style={{
          borderColor: "rgba(255,255,255,0.07)",
          boxShadow:
            "0 0 0 1px rgba(180,18,27,0.14), 0 18px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted/50">
              Your Links
            </p>
            <h2 className="mt-1 text-lg font-semibold text-text-primary">
              Recent URLs
            </h2>
          </div>

          <span
            className="rounded-full border px-3 py-1 text-xs font-medium text-text-muted"
            style={{
              background: "rgba(26,26,26,0.72)",
              borderColor: "rgba(180,18,27,0.22)",
            }}
          >
            {urls?.length || 0} links
          </span>
        </div>

      {
        loadingData ? <div className="mx-auto flex w-40 flex-col items-center gap-3 py-10">
              <FallingLines
                color="#D91E28"
                width="100"
                visible={true}
                ariaLabel="falling-circles-loading"
              /> 
        </div>
        : urls?.length >0 ? 
        <div
          className="url-history-scroll flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-2"
          style={{ scrollbarColor: "rgba(180,18,27,0.42) transparent" }}
        >
        {
          urls?.map((url) => (
          <UrlCard key={url.createdAt} {...url} />
        ))}
        </div>
      :
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center"
        style={{
          background: "linear-gradient(180deg, rgba(26,26,26,0.72), rgba(13,13,13,0.72))",
          borderColor: "rgba(180,18,27,0.28)",
        }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(180,18,27,0.12)",
            border: "1px solid rgba(180,18,27,0.24)",
            boxShadow: "0 0 24px rgba(180,18,27,0.14)",
          }}
        >
          <FiLink2 size={24} className="text-accent-red" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-text-primary">
          No shortened URLs yet
        </h3>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-text-muted/70">
          Shorten your first link above and it will appear here for quick access.
        </p>
      </div>
      }
      </div>
    </section>
  );
};

export default UrlHistory;
