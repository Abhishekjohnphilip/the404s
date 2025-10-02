'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function AdminStatus() {
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if admin is logged in from localStorage
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      setAdminUser(storedUser);
    }

    // Listen for storage changes (when admin logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminUser') {
        setAdminUser(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    // Redirect to home page
    window.location.href = '/';
  };

  if (!mounted) {
    return null;
  }

  if (!adminUser) {
    // Show login icon when not logged in
    return (
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="h-10 w-10"
      >
        <Link
          href="/admin/login"
          className="text-foreground hover:text-primary transition-colors"
        >
          <LogIn className="h-5 w-5" />
          <span className="sr-only">Admin Login</span>
        </Link>
      </Button>
    );
  }

  // Show user dropdown when logged in
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 px-3 gap-2 text-foreground hover:text-primary transition-colors"
        >
          <User className="h-5 w-5" />
          <span className="hidden sm:inline-block font-medium">{adminUser}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/admin" className="cursor-pointer">
            Admin Panel
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
