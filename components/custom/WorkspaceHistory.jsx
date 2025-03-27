'use client';
import { UserDetailContext } from '@/context/UserDetailContext';
import Link from 'next/link';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useSidebar } from '../ui/sidebar';
import axios from 'axios';
import { toast } from 'sonner';
import { Clock, Loader2Icon, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';

function WorkspaceHistory() {
  const { userDetail } = useContext(UserDetailContext);
  const [workspaceList, setWorkspaceList] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const { toggleSidebar } = useSidebar();
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch workspaces if:
    // 1. User is logged in
    // 2. We haven't already fetched (using ref to track this)
    // 3. We're not currently loading
    if (userDetail?._id && !fetchedRef.current && !loading) {
      getAllWorkspaces();
    }
  }, [userDetail, loading]);

  const getAllWorkspaces = async () => {
    if (!userDetail?._id) return;
    
    // Prevent duplicate fetches
    if (fetchedRef.current || loading) return;
    
    setLoading(true);
    fetchedRef.current = true;
    
    try {
      const response = await axios.get(`/api/workspace?userId=${userDetail._id}`);
      if (response.data) {
        setWorkspaceList(response.data);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load your chat history');
      // Reset fetch flag on error so we can try again
      fetchedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkspace = async (e, workspaceId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deletingId) return;
    
    setDeletingId(workspaceId);
    
    try {
      await axios.delete(`/api/workspace/${workspaceId}`);
      setWorkspaceList(prev => prev.filter(workspace => workspace._id !== workspaceId));
      toast.success('Workspace deleted');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setDeletingId(null);
    }
  };

  const getWorkspaceTitle = (workspace) => {
    if (!workspace.messages || workspace.messages.length === 0) {
      return 'New project';
    }
    
    const firstUserMessage = workspace.messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) {
      return 'Untitled project';
    }
    
    const content = firstUserMessage.content;
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="p-2">
        <h2 className="font-medium text-sm uppercase text-muted-foreground tracking-wider mb-4">Recent Projects</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2Icon className="animate-spin h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h2 className="font-medium text-sm uppercase text-muted-foreground tracking-wider mb-4">Recent Projects</h2>
      
      <div className="space-y-1">
        {!workspaceList || workspaceList.length === 0 ? (
          <div className="text-sm text-center py-8 text-muted-foreground">
            No projects yet. Start a new one!
          </div>
        ) : (
          workspaceList.map((workspace) => (
            <Link key={workspace._id} href={`/workspace/${workspace._id}`}>
              <div 
                onClick={toggleSidebar} 
                className="group flex items-center justify-between p-2 text-sm rounded-md hover:bg-primary/10 cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{getWorkspaceTitle(workspace)}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground hidden group-hover:inline">
                    {getRelativeTime(workspace.updatedAt)}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => deleteWorkspace(e, workspace._id)}
                    disabled={deletingId === workspace._id}
                  >
                    {deletingId === workspace._id ? (
                      <Loader2Icon className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default WorkspaceHistory;