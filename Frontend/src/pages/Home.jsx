import Header from "../components/Header";
import Homebody from "../components/Homebody";
import AnimatedBackground from "../components/AnimatedBackground";

const Home = () => {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        <Homebody />
      </div>
    </div>
  );
};

export default Home;