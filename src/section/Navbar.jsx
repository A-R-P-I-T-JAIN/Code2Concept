import { Code2 } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="bg-[#e6ddd6] border-b border-[#2C2522] shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Code2 className="w-7 h-7 text-[#2C2522]" />
            <h1 className="text-2xl font-bold text-[#2C2522]">
              Code2Concept
            </h1>
            <span className="hidden md:inline-block text-xs bg-[#2C2522] text-[#A39179] px-2 py-1 rounded-full ml-2">
              BETA
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;