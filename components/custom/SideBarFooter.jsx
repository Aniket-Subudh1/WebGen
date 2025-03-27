'use client';
import { HelpCircle, LogOut, Settings, Wallet } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

function SideBarFooter() {
  const router = useRouter();
  const { logout } = useAuth();
  
  const options = [
    {
      name: 'Settings',
      icon: Settings,
      action: () => toast.info('Settings feature coming soon'),
    },
    {
      name: 'Help Center',
      icon: HelpCircle,
      action: () => toast.info('Help Center feature coming soon'),
    },
    {
      name: 'My Subscription',
      icon: Wallet,
      action: () => router.push('/pricing'),
    },
    {
      name: 'Sign Out',
      icon: LogOut,
      action: () => {
        logout();
        toast.success('Signed out successfully');
      },
    },
  ];

  const handleOptionClick = (option) => {
    option.action();
  };

  return (
    <div className="p-2 mb-10">
      {options.map((option, index) => (
        <Button
          onClick={() => handleOptionClick(option)}
          key={index}
          variant="ghost"
          className="w-full flex justify-start my-3"
        >
          <option.icon className="mr-2" />
          {option.name}
        </Button>
      ))}
    </div>
  );
}

export default SideBarFooter;