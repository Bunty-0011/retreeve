import React from "react";
import { Link } from "react-router-dom";
import bgImage from "../assets/bg-image.jpg";
import homeimage from "../assets/home.png";

export default function Home() {
  return (
    <main
      className="relative min-h-screen bg-fixed bg-center bg-cover overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#EEE2D4]/70"></div>


      {/* Decorative Elements */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#E6D2C0] rounded-full blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute top-[25%] right-[-5rem] w-72 h-72 bg-[#DCC3A1] rounded-full blur-3xl opacity-30 animate-pulse delay-300"></div>
      <div className="absolute bottom-20 right-20 w-20 h-20 bg-[#F5DEB3] opacity-40 rounded-full animate-pulse"></div>
      <div className="absolute top-[20%] left-[7%] w-20 h-20 bg-[#C2A37A] opacity-30 rounded-full animate-bounce delay-500"></div>
      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-[#C2A37A] opacity-30 rounded-full animate-bounce delay-300"></div>
      <div className="absolute top-[33%] right-[8%] w-[72px] h-[72px] bg-[#C2A37A] opacity-30 rounded-full animate-bounce delay-200"></div>
      <div className="absolute bottom-[33%] right-[7%] w-12 h-12 bg-[#C2A37A] opacity-30 rounded-full animate-bounce delay-700"></div>
      <div className="absolute bottom-[16%] left-[5%] w-20 h-20 bg-[#C2A37A] opacity-30 rounded-full animate-bounce delay-100"></div>
      <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-white rounded-full opacity-70 animate-ping"></div>
      <div className="absolute bottom-1/3 right-1/3 w-[6px] h-[6px] bg-white rounded-full opacity-60 animate-ping delay-200"></div>
      <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white rounded-full opacity-80 animate-ping delay-500"></div>
      <div className="absolute bottom-10 left-10 w-28 h-28 bg-[#F0D8BE] opacity-40 rounded-[60%_40%_60%_40%] animate-pulse"></div>


      {/* Hero Section */}
      <section className="text-gray-600 body-font relative z-10">
        <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
          <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
            <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">
              Welcome to <span className="text-[#C2A37A]">Treeve</span>
            </h1>
            <p className="mb-8 leading-relaxed">
              Treeve is your personal learning companion, built on spaced repetition —
              a proven technique that helps you remember information far longer
              than traditional study methods.
            </p>
            <div className="flex justify-center">
              <Link
                to="/signup"
                className="inline-flex text-white bg-[#C2A37A] border-0 py-2 px-6 focus:outline-none hover:bg-[#a9825c] rounded text-lg shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
          <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
            <img
              className="object-cover object-center rounded shadow-lg"
              alt="hero"
              src={homeimage}
            />
          </div>
        </div>
      </section>
      


      {/* Features Section */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Features</h2>
         
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/80 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Smart Revision</h3>
              <p>Visualize your learning curve with detailed reports and insights.

                Get timely reminders about subjects or topics that need more attention.</p>
            </div>
            <div className="p-6 bg-white/80 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
              <p> Adapts to your learning pace by identifying what you remember and what you forget.
              Saves time by focusing on weaker topics rather than repeating everything..</p>
            </div>
            <div className="p-6 bg-white/80 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Custom Plans</h3>
              <p>Build flexible study plans tailored to exams, deadlines, or personal goals.

                Adjust schedules dynamically as your performance improves.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 py-16 bg-[#EEE2D4]/60">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">How it Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Step 1</h3>
              <p>Sign up and create your personalized learning profile.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Step 2</h3>
              <p>Add your study materials and set your learning schedule.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Step 3</h3>
              <p>Review with smart reminders and track your progress easily.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Contact Us</h2>
          <p className="text-lg text-gray-700 mb-4">
            📧 Email: <a href="mailto:support@treeve.com" className="text-[#C2A37A] hover:underline">support@treeve.com</a>
          </p>
          <p className="text-lg text-gray-700">
            📱 Mobile: <a href="tel:+919876543210" className="text-[#C2A37A] hover:underline">+91 98765 43210</a>
          </p>
        </div>
      </section>
    </main>
  );
}
