'use client';
import Image from 'next/image';
import React, { useContext, useState } from 'react';
import { Button } from '../ui/button';
import { UserDetailContext } from '@/context/UserDetailContext';
import Link from 'next/link';
import { Download, Menu, Rocket, User } from 'lucide-react';
import { useSidebar } from '../ui/sidebar';
import { usePathname } from 'next/navigation';
import { ActionContext } from '@/context/ActionContext';
import SignInDialog from './SignInDialog';
import { toast } from 'sonner';

function Header() {
  const { userDetail } = useContext(UserDetailContext);
  const { action, setAction } = useContext(ActionContext);
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [openSignInDialog, setOpenSignInDialog] = React.useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Format token count safely
  const formatTokens = (tokens) => {
    if (tokens === undefined || tokens === null) return '0';
    return typeof tokens === 'number' ? tokens.toLocaleString() : String(tokens);
  };

  const onActionBtn = (actionType) => {
    if (isProcessingAction) return;
    
    setIsProcessingAction(true);
    toast.info(`Starting ${actionType} process...`);
    
    setAction({
      actionType: actionType,
      timeStamp: Date.now()
    });
    
    // Reset after a delay to prevent multiple clicks
    setTimeout(() => {
      setIsProcessingAction(false);
    }, 3000);
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-sm bg-background/90 border-b border-border">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          <Link href={'/'} className="flex items-center space-x-2">
            <Image src={'/logo.png'} alt="WebGen Logo" width={32} height={32} />
            <span className="font-bold text-xl hidden sm:inline-block">WebGen</span>
          </Link>
        </div>

        {!userDetail?.name ? (
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setOpenSignInDialog(true)}
              className="hidden sm:flex"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => setOpenSignInDialog(true)}
              className="gap-2"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Get Started</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {pathname.includes('/workspace/') && (
              <div className="hidden sm:flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => onActionBtn('export')}
                  className="gap-2"
                  disabled={isProcessingAction}
                >
                  {isProcessingAction ? (
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export
                </Button>
                <Button
                  onClick={() => onActionBtn('deploy')}
                  className="gap-2"
                  disabled={isProcessingAction}
                >
                  {isProcessingAction ? (
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  Deploy
                </Button>
              </div>
            )}
            {userDetail && (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-sm">
                  <div className="font-medium">{userDetail.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {formatTokens(userDetail.token)} tokens
                  </div>
                </div>
                <Image
                  onClick={toggleSidebar}
                  src={userDetail?.picture || '/default-avatar.png'}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full cursor-pointer object-cover border-2 border-primary/10 hover:border-primary/30 transition-colors"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      <SignInDialog
        openDialog={openSignInDialog}
        closeDialog={(v) => setOpenSignInDialog(v)}
      />
    </header>
  );
}

export default Header;