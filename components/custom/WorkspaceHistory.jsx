'use client';
import { UserDetailContext } from '@/context/UserDetailContext';
import Link from 'next/link';
import React, { useContext, useEffect, useState } from 'react';
import { useSidebar } from '../ui/sidebar';
import axios from 'axios';
import { toast } from 'sonner';

function WorkspaceHistory() {
  const { userDetail } = useContext(UserDetailContext);
  const [workspaceList, setWorkspaceList] = useState([]);
  const { toggleSidebar } = useSidebar();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userDetail?._id) {
      getAllWorkspaces();
    }
  }, [userDetail]);

  const getAllWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/workspace?userId=${userDetail._id}`);
      if (response.data) {
        setWorkspaceList(response.data);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load your chat history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="font-medium text-lg">Your Chats</h2>
        <div className="mt-4 text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-medium text-lg">Your Chats</h2>
      <div>
        {workspaceList.length === 0 ? (
          <div className="mt-4 text-gray-400 text-sm">No chats yet. Start a new conversation!</div>
        ) : (
          workspaceList.map((workspace, index) => (
            <Link key={index} href={'/workspace/' + workspace._id}>
              <h2 
                onClick={toggleSidebar} 
                className="text-sm text-gray-400 mt-2 font-light hover:text-white cursor-pointer truncate"
              >
                {workspace.messages && workspace.messages[0]?.content 
                  ? workspace.messages[0].content.length > 50 
                    ? workspace.messages[0].content.substring(0, 50) + '...' 
                    : workspace.messages[0].content
                  : 'Untitled chat'}
              </h2>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default WorkspaceHistory;