import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function EcosystemNav() {
  return (
    <nav className="sticky top-0 z-50 px-6 py-4 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={20} />
          <span className="font-semibold">Back to Home</span>
        </Link>
        <div className="text-2xl font-bold text-white">
          Ecosystem Explorer
        </div>
        <a
          href="/admin/login"
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-300 text-sm"
        >
          Admin
        </a>
      </div>
    </nav>
  );
}
