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
      {/* Beige Overlay */}
      <div className="absolute inset-0 bg-[#EEE2D4]/70"></div>

      {/* Decorative Elements */}
      

      {/* Hero Section from Tailblocks */}
      <section className="text-gray-600 body-font relative z-10">
        <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
          <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
            <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">
              Welcome to <span className="text-[#C2A37A]">Treeve</span>
            </h1>
            <p className="mb-8 leading-relaxed">
              Treeve is your personal learning companion, built on spaced repetition — a proven technique that helps you remember information far longer than traditional study methods.
            </p>
            <div className="flex justify-center">
              <Link
                to="/signup"
                className="inline-flex text-white bg-[#D2B48C] border-0 py-2 px-6 focus:outline-none hover:bg-[#C2A37A] rounded text-lg"
              >
                Get Started
              </Link>
              <Link
                to="/about"
                className="ml-4 inline-flex text-gray-700 bg-gray-100 border-0 py-2 px-6 focus:outline-none hover:bg-gray-200 rounded text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
            <img
              className="object-cover object-center rounded"
              alt="hero"
              src={homeimage}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
