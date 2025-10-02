'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PartyPopper, Sun, Moon, Instagram } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import AdminStatus from './admin-status';

export default function AppHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-3 text-2xl font-bold text-foreground"
            >
              <div className="relative h-10 w-10">
                <Image
                  src="/the404s.png"
                  alt="THE404s Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="font-headline">THE404s</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Admin Status */}
            <AdminStatus />
            
            {/* Instagram Icon */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-10 w-10"
            >
              <a
                href="https://www.instagram.com/the404s.duk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Visit our Instagram</span>
              </a>
            </Button>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-10 w-10"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
