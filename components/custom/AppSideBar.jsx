import React, { useContext } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { Button } from '../ui/button';
import { MessageCircleCodeIcon, PlusIcon } from 'lucide-react';
import WorkspaceHistory from './WorkspaceHistory';
import SideBarFooter from './SideBarFooter';
import { UserDetailContext } from '@/context/UserDetailContext';
import SignInDialog from './SignInDialog';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { MessagesContext } from '@/context/MessagesContext';
import { toast } from 'sonner';

function AppSideBar() {
  const { userDetail } = useContext(UserDetailContext);
  const { setMessages } = useContext(MessagesContext);
  const [openSignInDialog, setOpenSignInDialog] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const router = useRouter();

  const handleStartNewChat = async () => {
    if (!userDetail?._id) {
      setOpenSignInDialog(true);
      return;
    }

    if (userDetail.token < 10) {
      toast.error("You don't have enough tokens");
      return;
    }

    setIsCreating(true);
    
    try {
      // Create an empty workspace
      const response = await axios.post('/api/workspace', {
        user: userDetail._id,
        messages: [],
      });
      
      if (response.data && response.data._id) {
        setMessages([]);
        router.push(`/workspace/${response.data._id}`);
      } else {
        toast.error('Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Something went wrong');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Image src="/logo.png" alt="WebGen" width={30} height={30} />
            <h1 className="font-bold text-xl">WebGen</h1>
          </div>
          
          <Button 
            className="w-full justify-start" 
            onClick={handleStartNewChat}
            disabled={isCreating}
          >
            {isCreating ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <PlusIcon className="mr-2 h-4 w-4" />
            )}
            New Project
          </Button>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <WorkspaceHistory />
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter>
          <SideBarFooter />
        </SidebarFooter>
      </Sidebar>
      
      <SignInDialog
        openDialog={openSignInDialog}
        closeDialog={(v) => setOpenSignInDialog(v)}
      />
    </>
  );
}

export default AppSideBar;