import { Code2, } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <Code2 className="w-7 h-7 text-purple-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              AlgoViz
            </h1>
            <span className="hidden md:inline-block text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full ml-2">
              BETA
            </span>
          </div>
      
      </div>
    </header>
  );
};

export default Navbar;