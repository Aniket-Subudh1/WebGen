'use client';
import React, { useContext, useEffect, useState } from 'react';

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from '@codesandbox/sandpack-react';
import Lookup from '@/data/Lookup';
import { MessagesContext } from '@/context/MessagesContext';
import Prompt from '@/data/Prompt';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { countToken } from './ChatView';
import { UserDetailContext } from '@/context/UserDetailContext';
import { toast } from 'sonner';
import SandpackPreviewClient from './SandpackPreviewClient';
import { ActionContext } from '@/context/ActionContext';

function CodeView() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('code');
  const [files, setFiles] = useState(Lookup?.DEFAULT_FILE);
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { action, setAction } = useContext(ActionContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (action?.actionType === 'deploy' || action?.actionType === 'export') &&
      setActiveTab('preview');
  }, [action]);

  useEffect(() => {
    id && getFiles();
  }, [id]);

  const getFiles = async () => {
    setLoading(true);
    try {
      const result = await axios.get(`/api/workspace/${id}`);
      
      if (result.data && result.data.fileData) {
        // Merge default files with workspace-specific files
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result.data.fileData };
        setFiles(mergedFiles);
      } else {
        setFiles(Lookup.DEFAULT_FILE);
      }
    } catch (error) {
      console.error('Error fetching workspace files:', error);
      toast.error('Failed to load workspace files');
      setFiles(Lookup.DEFAULT_FILE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages?.length > 0) {
      const role = messages[messages?.length - 1].role;
      if (role === 'user') {
        generateAiCode();
      }
    }
  }, [messages]);

  const generateAiCode = async () => {
    if (!userDetail || userDetail.token < 10) {
      toast.error("You don't have enough tokens to generate code");
      return;
    }
  
    setLoading(true);
    try {
      // Get the last user message
      const userMessage = messages[messages.length - 1].content;
      
      // Send request to generate code
      const result = await axios.post('/api/gen-ai-code', {
        prompt: userMessage,
      });
      
      if (result.data && result.data.files) {
        // Merge default files with AI-generated files
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result.data.files };
        setFiles(mergedFiles);
        
        // Save generated files to database
        await axios.put('/api/workspace/files', {
          workspaceId: id,
          files: result.data.files,
        });
        
        // Calculate token usage (approximate)
        const tokenUsed = countToken(JSON.stringify(result.data));
        const newTokenAmount = Number(userDetail.token) - Number(tokenUsed);
        
        // Update user token in state
        setUserDetail(prev => ({ ...prev, token: newTokenAmount }));
        
        // Update token in database
        await axios.put('/api/user/token', {
          token: newTokenAmount,
          userId: userDetail._id,
        });
        
        // Add AI response to messages
        const aiResponse = {
          role: 'ai',
          content: `I've created a ${result.data.projectTitle} project. ${result.data.explanation}`
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        // Save messages to database
        await axios.put('/api/workspace/messages', {
          messages: [...messages, aiResponse],
          workspaceId: id,
        });
      } else {
        toast.error('Failed to generate code: Invalid response format');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate code');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative">
      <div className="bg-[#181818] w-full p-2 border">
        <div className="flex items-center flex-wrap shrink-0 bg-black p-1 w-[140px] gap-3 justify-center rounded-full">
          <h2
            onClick={() => setActiveTab('code')}
            className={`text-sm cursor-pointer ${activeTab == 'code' && 'text-blue-500 bg-blue-500 bg-opacity-25 p-1 px-2 rounded-full'}`}
          >
            Code
          </h2>
          <h2
            onClick={() => setActiveTab('preview')}
            className={`text-sm cursor-pointer ${activeTab == 'preview' && 'text-blue-500 bg-blue-500 bg-opacity-25 p-1 px-2 rounded-full'}`}
          >
            Preview
          </h2>
        </div>
      </div>
      <SandpackProvider
        files={files}
        template="react"
        theme={'dark'}
        customSetup={{
          dependencies: {
            ...Lookup.DEPENDANCY,
          },
        }}
        options={{ externalResources: ['https://cdn.tailwindcss.com'] }}
      >
        <SandpackLayout>
          {activeTab == 'code' ? (
            <>
              <SandpackFileExplorer style={{ height: '80vh' }} />
              <SandpackCodeEditor style={{ height: '80vh' }} />
            </>
          ) : (
            <>
              <SandpackPreviewClient />
            </>
          )}
        </SandpackLayout>
      </SandpackProvider>

      {loading && (
        <div className="p-10 bg-gray-900 bg-opacity-80 absolute top-0 w-full h-full flex justify-center items-center">
          <Loader2Icon className="animate-spin w-10 h-10 text-white" />
          <h2>Generating your files...</h2>
        </div>
      )}
    </div>
  );
}

export default CodeView;