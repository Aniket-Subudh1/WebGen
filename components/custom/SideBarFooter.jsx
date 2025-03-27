'use client';
import { HelpCircle, LogOut, Settings, Wallet } from 'lucide-react';
import React, { useContext } from 'react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { UserDetailContext } from '@/context/UserDetailContext';

function SideBarFooter() {
  const router = useRouter();
  const { logout } = useAuth();
  const { userDetail } = useContext(UserDetailContext);
  
  const options = [
    {
      name: 'My Subscription',
      icon: Wallet,
      action: () => router.push('/pricing'),
    },
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
      name: 'Sign Out',
      icon: LogOut,
      action: () => {
        logout();
        toast.success('Signed out successfully');
      },
    },
  ];

  // Format token count safely
  const formatTokens = (tokens) => {
    if (tokens === undefined || tokens === null) return '0';
    return typeof tokens === 'number' ? tokens.toLocaleString() : String(tokens);
  };

  if (!userDetail) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="p-4 mb-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Available Tokens</span>
          <span className="text-sm font-bold">{formatTokens(userDetail?.token)}</span>
        </div>
        <Button 
          variant="link" 
          className="px-0 h-auto text-xs text-primary"
          onClick={() => router.push('/pricing')}
        >
          Get more tokens →
        </Button>
      </div>
      
      <div className="space-y-1">
        {options.map((option, index) => (
          <Button
            onClick={option.action}
            key={index}
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.name}
          </Button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
        <p>WebGen v2.0</p>
      </div>
    </div>
  );
}

export default SideBarFooter;