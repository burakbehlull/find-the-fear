import Link from 'next/link';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Branding */}
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Find The Fear. Tüm hakları saklıdır.
            </p>
          </div>

          {/* Made by Paradox Forge */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Yapımcı:</span>
            <Link
              href="https://github.com/Paradox-Forge"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors group"
            >
              <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Paradox Forge</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
