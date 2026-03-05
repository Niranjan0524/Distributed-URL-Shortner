import UrlForm from "./urlForm";
import UrlHistory from "./UrlHistory";
import Footer from "./Footer";
import HeroSection from "./HeroSection";

const Homebody = () => {
  return (
    <div className="relative z-10 mt-20">
      {/* ── Hero + Form (two-column) ── */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-2">
          <HeroSection />
          <UrlForm />
        </div>
      </div>

      {/* ── History & Footer (unchanged) ── */}
      <UrlHistory />
      <Footer />
    </div>
  );
};

export default Homebody;