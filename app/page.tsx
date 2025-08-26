import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-100 to-white">
      
      {/* Blob Backgrounds */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
      <div className="absolute top-[300px] right-[-100px] w-[400px] h-[400px] bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-100px] left-[200px] w-[400px] h-[400px] bg-yellow-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Top Navigation Bar */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-4 bg-white bg-opacity-80 shadow-md backdrop-blur-md">
        <div className="text-xl font-bold text-gray-800">BAHI SDA CHURCH</div>
        <div className="flex space-x-6 text-gray-700">
          <Link href="/login" className="hover:text-blue-600 transition">Login</Link>
          <Link href="/register" className="hover:text-blue-600 transition">Register</Link>
          <Link href="/about" className="hover:text-blue-600 transition">About Us</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 mt-32">
        <h3 className="text-4xl font-extrabold text-gray-800 mb-6">Click button bellow to login</h3>

        {/* Login Button */}
        <Link 
          href="/login"
          className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
            />
          </svg>
          Login
        </Link>
      </div>
    </div>
  );
}
