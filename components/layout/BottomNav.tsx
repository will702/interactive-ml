'use client';

import Link from 'next/link';
import { Home, Search, Camera, Globe, TreePine, Box } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Index', icon: Home },
    { href: '/cv/filtering', label: 'Filtering', icon: Search },
    { href: '/cv/camera-model', label: 'Camera', icon: Camera },
    { href: '/cv/epipolar', label: 'Stereo', icon: Globe },
    { href: '/ml/trees', label: 'Trees', icon: TreePine },
    { href: '/ml/svm', label: 'SVM', icon: Box },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex md:hidden items-center justify-around z-50 px-6 pb-2 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] rounded-t-xl">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${isActive ? 'text-indigo-900' : 'text-slate-400 hover:text-indigo-900'}`}
          >
            <link.icon size={18} strokeWidth={1.5} />
            <span className="text-[8px] font-sans font-bold uppercase tracking-[0.2em]">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
