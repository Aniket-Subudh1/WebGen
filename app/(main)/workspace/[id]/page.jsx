'use client';
import ChatView from '@/components/custom/ChatView';
import CodeView from '@/components/custom/CodeView';
import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useContext } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';

function Workspace() {
  const { userDetail } = useContext(UserDetailContext);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (!userDetail || !userDetail._id) {
      router.push('/');
    }
  }, [userDetail, router]);

  if (!userDetail) {
    return null; 
  }

  return (
    <div className="p-3 pr-10 mt-3 h-[calc(100vh-6rem)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        <div className="h-full overflow-hidden">
          <ChatView />
        </div>
        <div className="col-span-2 h-full overflow-hidden">
          <CodeView />
        </div>
      </div>
    </div>
  );
}

export default Workspace;