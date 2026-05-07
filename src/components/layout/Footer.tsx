import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#1B2A4A] text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="text-center md:text-left">
            <div className="text-xl font-bold">
              RankUp
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Firefighter promotional exam prep
            </p>
          </div>

          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <a href="mailto:support@rankupfire.com" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </a>
          </div>

          <div className="text-gray-400 text-sm text-center md:text-right">
            © {currentYear} RankUp. All rights reserved.
          </div>
          
        </div>
      </div>
    </footer>
  );
}
