'use client';
import React, { useContext, useEffect, useState, useRef } from 'react';

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack,
} from '@codesandbox/sandpack-react';
import Lookup from '@/data/Lookup';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import { ActionContext } from '@/context/ActionContext';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { CodeIcon, EyeIcon, Loader2Icon, RefreshCw } from 'lucide-react';
import { countToken } from './ChatView';
import { toast } from 'sonner';
import SandpackPreviewClient from './SandpackPreviewClient';
import { Button } from '../ui/button';

// Fixed SandpackRefresher component with proper state tracking
const SandpackRefresher = ({ files }) => {
  const { sandpack } = useSandpack();
  const prevFilesRef = useRef(null);
  
  useEffect(() => {
    // Only refresh if files have changed
    if (sandpack && 
        files && 
        (!prevFilesRef.current || 
         JSON.stringify(prevFilesRef.current) !== JSON.stringify(files))) {
      
      // Update our reference
      prevFilesRef.current = { ...files };
      
      // Just refresh instead of trying to update files individually
      if (typeof sandpack.refresh === 'function') {
        // Small delay to ensure state is updated
        setTimeout(() => {
          sandpack.refresh();
        }, 300);
      }
    }
  }, [files, sandpack]);
  
  return null;
};

function CodeView() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('code');
  const [files, setFiles] = useState(Lookup?.DEFAULT_FILE);
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { action, setAction } = useContext(ActionContext);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sandpackKey, setSandpackKey] = useState(Date.now()); // Force re-render with key
  
  // Refs to track state changes
  const messagesRef = useRef(messages);
  const isGeneratingRef = useRef(isGenerating);
  const fetchedRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
    isGeneratingRef.current = isGenerating;
  }, [messages, isGenerating]);

  useEffect(() => {
    if (action?.actionType === 'deploy' || action?.actionType === 'export') {
      setActiveTab('preview');
    }
  }, [action]);

  useEffect(() => {
    if (id && !fetchedRef.current) {
      getFiles();
      fetchedRef.current = true; // Prevent repeated fetches
    }
  }, [id]);

  const getFiles = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await axios.get(`/api/workspace/${id}`);
      
      if (result.data && result.data.fileData) {
        // Merge default files with workspace-specific files
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result.data.fileData };
        setFiles(mergedFiles);
        
        // Force SandpackProvider to re-render
        setSandpackKey(Date.now());
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

  // Check for message changes to trigger code generation (safely)
  useEffect(() => {
    const checkLastMessage = () => {
      const currentMessages = messagesRef.current;
      if (currentMessages?.length > 0 && !isGeneratingRef.current) {
        const role = currentMessages[currentMessages.length - 1].role;
        if (role === 'user') {
          generateAiCode();
        }
      }
    };
    
    // Minor delay to prevent race conditions
    const timer = setTimeout(checkLastMessage, 300);
    return () => clearTimeout(timer);
  }, [messages]);

  const generateAiCode = async () => {
    if (!userDetail || !userDetail._id) {
      toast.error("You need to be signed in to generate code");
      return;
    }
    
    if (userDetail.token < 100) {
      toast.error("You don't have enough tokens to generate code");
      return;
    }
  
    // Prevent multiple simultaneous generations
    if (isGeneratingRef.current) return;
    
    setIsGenerating(true);
    isGeneratingRef.current = true;
    setLoading(true);
    
    try {
      // Get the last user message
      const currentMessages = messagesRef.current;
      const userMessage = currentMessages[currentMessages.length - 1].content;
      
      // Send request to generate code
      const result = await axios.post('/api/gen-ai-code', {
        prompt: userMessage,
        userId: userDetail._id
      });
      
      if (result.data && result.data.files) {
        // Merge default files with AI-generated files
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result.data.files };
        setFiles(mergedFiles);
        
        // Force SandpackProvider to re-render
        setSandpackKey(Date.now());
        
        // Save generated files to database
        await axios.put('/api/workspace/files', {
          workspaceId: id,
          files: result.data.files,
        });
        
        // Update user token in state if remainingTokens is provided
        if (result.data.remainingTokens !== undefined) {
          setUserDetail(prev => ({ ...prev, token: result.data.remainingTokens }));
        } else {
          // Calculate token usage (approximate) if not provided by API
          const tokenUsed = countToken(JSON.stringify(result.data));
          const newTokenAmount = Number(userDetail.token) - Number(tokenUsed);
          
          // Update user token in state
          setUserDetail(prev => ({ ...prev, token: newTokenAmount }));
          
          // Update token in database
          await axios.put('/api/user/token', {
            token: newTokenAmount,
            userId: userDetail._id,
          });
        }
        
        // Add AI response to messages
        const aiResponse = {
          role: 'ai',
          content: `I've created a ${result.data.projectTitle} project. ${result.data.explanation}`
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        // Save messages to database
        await axios.put('/api/workspace/messages', {
          messages: [...currentMessages, aiResponse],
          workspaceId: id,
        });
        
        // Switch to preview tab automatically
        setActiveTab('preview');
      } else {
        toast.error('Failed to generate code: Invalid response format');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate code. Please try again.');
      
      // Add friendly error message to the chat
      const errorResponse = {
        role: 'ai',
        content: "I'm sorry, I encountered an issue while trying to generate code. Let me try a different approach. Please describe your project again or try a slightly different request."
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      // Save error message to database
      try {
        await axios.put('/api/workspace/messages', {
          messages: [...messagesRef.current, errorResponse],
          workspaceId: id,
        });
      } catch (err) {
        console.error('Error saving error message:', err);
      }
    } finally {
      setLoading(false);
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  const refreshSandpack = () => {
    setSandpackKey(Date.now());
    toast.success("Code editor refreshed");
  };

  // Limited dependencies that actually work in Sandpack
  const sandpackDependencies = {
    "lucide-react": "^0.469.0"
  };

  return (
    <div className="relative flex flex-col h-full bg-background rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="font-medium text-lg">Code Editor</h2>
          <div className="flex items-center bg-muted/70 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center px-3 py-1 rounded text-sm transition-colors ${
                activeTab === 'code'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted-foreground/10'
              }`}
            >
              <CodeIcon className="w-4 h-4 mr-2" />
              Code
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center px-3 py-1 rounded text-sm transition-colors ${
                activeTab === 'preview'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted-foreground/10'
              }`}
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              Preview
            </button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshSandpack}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <SandpackProvider
          key={sandpackKey}
          files={files}
          template="react"
          theme="dark"
          customSetup={{
            dependencies: sandpackDependencies,
          }}
          options={{ 
            externalResources: ['https://cdn.tailwindcss.com'],
            recompileMode: "immediate",
            recompileDelay: 300
          }}
        >
          <SandpackRefresher files={files} />
          <SandpackLayout>
            {activeTab === 'code' ? (
              <>
                <SandpackFileExplorer 
                  style={{ height: '75vh' }}
                  className="border-r border-border" 
                />
                <SandpackCodeEditor 
                  style={{ height: '75vh' }}
                  showLineNumbers={true}
                  showInlineErrors={true}
                  wrapContent={true}
                  readOnly={false}
                />
              </>
            ) : (
              <SandpackPreviewClient />
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <Loader2Icon className="animate-spin w-10 h-10 text-primary mb-4" />
          <h2 className="text-lg font-medium">Generating your code...</h2>
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
        </div>
      )}
    </div>
  );
}

export default CodeView;