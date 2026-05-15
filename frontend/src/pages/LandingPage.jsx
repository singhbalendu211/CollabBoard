import { Users, MessageSquare, Shield, Layout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import illustration from "../assets/illustration.png";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#eaf2fb] flex justify-center items-center p-6">
      
      {/* Main Container */}
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Navbar */}
        <nav className="flex justify-between items-center px-10 py-5 border-b">
          
          <div className="flex gap-8 text-gray-600 font-medium">
            <span onClick={() => window.scrollTo(0, 0)} className="cursor-pointer hover:text-blue-600 transition-colors duration-200">Home</span>
            <span onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer hover:text-blue-600 transition-colors duration-200">Features</span>
            <span className="cursor-pointer hover:text-blue-600 transition-colors duration-200">About</span>
          </div>

          <div className="flex gap-4 items-center">
            <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
              Sign In
            </button>

            <button onClick={() => navigate('/signup')} className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition-all duration-200">
              Sign Up
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="grid md:grid-cols-2 items-center px-12 py-16 gap-10 bg-gradient-to-r from-blue-50 to-blue-100">
          
          {/* Left */}
          <div>
            <h1 className="text-5xl font-bold text-blue-600 mb-4">
              CollabBoard
            </h1>

            <p className="text-gray-600 text-lg mb-8">
              Real-time Collaborative Whiteboard
            </p>

            <div className="flex gap-4 flex-col sm:flex-row">
              <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-all duration-200">
                Sign In
              </button>

              <button onClick={() => navigate('/signup')} className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-all duration-200">
                Sign Up
              </button>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="flex justify-center">
            <img
              src={illustration}
              alt="Whiteboard Illustration"
              className="w-full max-w-md h-auto rounded-lg"
            />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-10 py-14 grid md:grid-cols-4 gap-6 bg-gray-50">
          
          <FeatureCard
            icon={<Users size={28} />}
            title="Real-time Collaboration"
            desc="Work together in sync."
          />

          <FeatureCard
            icon={<Layout size={28} />}
            title="Shared Whiteboard Rooms"
            desc="Create and join rooms."
          />

          <FeatureCard
            icon={<MessageSquare size={28} />}
            title="Live Text Chat"
            desc="Communicate in real-time."
          />

          <FeatureCard
            icon={<Shield size={28} />}
            title="Secure JWT Authentication"
            desc="Safe and secure access."
          />

        </section>

      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-300">
      <div className="text-blue-600 mb-4">{icon}</div>

      <h3 className="font-semibold text-gray-800 mb-2">
        {title}
      </h3>

      <p className="text-gray-500 text-sm">
        {desc}
      </p>
    </div>
  );
}