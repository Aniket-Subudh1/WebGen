'use client';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import axios from 'axios';
import { ArrowRight, Link, Loader2Icon, Send } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSidebar } from '../ui/sidebar';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export const countToken = (inputText) => {
  return Math.ceil(inputText.length / 4);
};

function ChatView() {
  const { id } = useParams();
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toggleSidebar } = useSidebar();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [userInput]);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    id && getWorkspaceData();
  }, [id]);

  /**
   * Used to Get Workspace data using Workspace ID
   */
  const getWorkspaceData = async () => {
    try {
      const result = await axios.get(`/api/workspace/${id}`);
      if (result.data && result.data.messages) {
        setMessages(result.data.messages);
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
      toast.error('Failed to load chat history');
    }
  };

  useEffect(() => {
    if (messages?.length > 0) {
      const role = messages[messages?.length - 1].role;
      if (role === 'user') {
        getAiResponse();
      }
    }
  }, [messages]);

  const getAiResponse = async () => {
    if (!userDetail || userDetail.token < 10) {
      toast.error("You don't have enough tokens to generate a response");
      return;
    }

    setLoading(true);
    try {
      // Send the entire messages array to maintain conversation context
      const result = await axios.post('/api/ai-chat', {
        messages: messages,
        userId: userDetail._id,
      });
      
      const aiResp = {
        role: 'ai',
        content: result.data.result,
      };
      
      // Update messages state with AI response
      const updatedMessages = [...messages, aiResp];
      setMessages(updatedMessages);
      
      // Save messages to database
      await axios.put('/api/workspace/messages', {
        messages: updatedMessages,
        workspaceId: id,
      });
      
      // Update token count in state
      setUserDetail(prev => ({ 
        ...prev, 
        token: result.data.remainingTokens 
      }));
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast.error('Failed to generate AI response');
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = (input) => {
    if (!input.trim()) return;
    
    if (!userDetail || userDetail.token < 10) {
      toast.error("You don't have enough tokens to generate code");
      return;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setUserInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onGenerate(userInput);
    }
  };

  // Custom renderer for code blocks to handle overflow properly
  const renderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="w-full overflow-x-auto rounded-md my-3">
          <SyntaxHighlighter
            style={atomDark}
            language={match[1]}
            PreTag="div"
            className="rounded-md"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      );
    },
    p({ children }) {
      return <p className="mb-4 break-words whitespace-pre-wrap">{children}</p>;
    }
  };

  return (
    <div className="relative h-[83vh] flex flex-col bg-background rounded-lg border border-border shadow-sm">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="font-medium text-lg">Chat</h2>
        <div className="text-sm text-muted-foreground">
          {userDetail && `${userDetail.token} tokens remaining`}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg overflow-x-hidden ${
                msg?.role === 'user' 
                  ? 'bg-secondary ml-8' 
                  : 'bg-primary/10 mr-8'
              }`}
            >
              <div className="flex gap-3 items-start">
                {msg?.role === 'user' && userDetail?.picture ? (
                  <Image
                    src={userDetail.picture}
                    alt="User"
                    width={28}
                    height={28}
                    className="rounded-full mt-1 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground mt-1 shrink-0">
                    AI
                  </div>
                )}
                <div className="w-full max-w-full overflow-x-auto">
                  <ReactMarkdown 
                    className="prose prose-sm dark:prose-invert prose-p:my-1 prose-pre:my-2 max-w-full"
                    components={renderers}
                  >
                    {msg?.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium">Start a conversation</h3>
            <p className="max-w-sm mt-1">
              Ask about what you want to build, and I'll help create it for you.
            </p>
          </div>
        )}
        
        {loading && (
          <div className="p-4 rounded-lg bg-primary/10 mr-8">
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                AI
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-border">
        <div className="relative flex items-end">
          <textarea
            ref={textareaRef}
            placeholder={Lookup.INPUT_PLACEHOLDER}
            className="flex-1 bg-background border rounded-lg resize-none p-3 pr-10 outline-none focus:ring-1 focus:ring-primary min-h-[50px] max-h-[150px]"
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            value={userInput}
            rows={1}
          />
          <button
            onClick={() => onGenerate(userInput)}
            disabled={!userInput.trim()}
            className="absolute right-3 bottom-3 p-1 rounded-md bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex mt-2 text-xs text-muted-foreground">
          <span>Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Enter</kbd> for new line</span>
        </div>
      </div>
    </div>
  );
}

export default ChatView;