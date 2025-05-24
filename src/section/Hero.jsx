import { Code2 } from 'lucide-react';

const Hero = () => {
  return (
    <div className="mb-12 relative">
      {/* Logo and Beta Tag */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center text-[#E6D5B8]">
          <Code2 className="w-8 h-8" />
          <span className="text-2xl font-semibold ml-2 text-[#E6D5B8]">Code2Concept</span>
        </div>
        <span className="bg-[#8B7355] text-[#E6D5B8] px-2 py-1 rounded-full text-xs font-medium">
          BETA
        </span>
      </div>

      {/* Main Heading */}
      <h2 className="text-4xl sm:text-6xl font-bold mb-6 text-[#E6D5B8]">
        Transform DSA Problems
        <br />
        into Videos
      </h2>

      {/* Subtitle */}
      <p className="text-lg sm:text-xl text-[#E6D5B8]/90 font-medium mb-8 max-w-3xl mx-auto">
        Automatically generate{" "}
        <span className="bg-gradient-to-r from-[#8B7355] to-[#A67B5B] text-[#E6D5B8] font-bold px-1">
          brute-force approach
        </span>{" "}
        videos from Leetcode, GFG and other platform questions.
      </p>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-[#8B7355]/10 rounded-full filter blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#8B7355]/10 rounded-full filter blur-3xl -z-10"></div>
    </div>
  );
};

export default Hero;