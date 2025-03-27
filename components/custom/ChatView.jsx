'use client';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import Prompt from '@/data/Prompt';
import axios from 'axios';
import { ArrowRight, Link, Loader2Icon } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSidebar } from '../ui/sidebar';
import { toast } from 'sonner';

export const countToken = (inputText) => {
  return inputText
    .trim()
    .split(/\s+/)
    .filter((word) => word).length;
};

function ChatView() {
  const { id } = useParams();
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toggleSidebar } = useSidebar();

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
      const PROMPT = JSON.stringify(messages) + Prompt.CHAT_PROMPT;
      
      const result = await axios.post('/api/ai-chat', {
        prompt: PROMPT,
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
      
      // Update token count
      const tokenUsed = countToken(JSON.stringify(aiResp));
      const newTokenAmount = Number(userDetail.token) - Number(tokenUsed);
      
      // Update user token count in state
      setUserDetail(prev => ({ ...prev, token: newTokenAmount }));
      
      // Update token count in database
      await axios.put('/api/user/token', {
        token: newTokenAmount,
        userId: userDetail._id,
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast.error('Failed to generate AI response');
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = (input) => {
    if (!userDetail || userDetail.token < 10) {
      toast.error("You don't have enough tokens to generate code");
      return;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setUserInput('');
  };

  return (
    <div className="relative h-[83vh] flex flex-col">
      <div className="flex-1 overflow-y-scroll scrollbar-hide pl-10">
        {messages?.length > 0 && messages?.map((msg, index) => (
          <div
            key={index}
            className="p-3 rounded-lg mb-2 flex gap-2 items-center justify-start leading-7"
            style={{
              backgroundColor: Colors.CHAT_BACKGROUND,
            }}
          >
            {msg?.role === 'user' && userDetail?.picture && (
              <Image
                src={userDetail.picture}
                alt="userImage"
                width={35}
                height={35}
                className="rounded-full"
              />
            )}
            <ReactMarkdown className="flex flex-col">
              {msg?.content}
            </ReactMarkdown>
          </div>
        ))}
        {loading && (
          <div
            className="p-3 rounded-lg mb-2 flex gap-2 items-center justify-start"
            style={{
              backgroundColor: Colors.CHAT_BACKGROUND,
            }}
          >
            <Loader2Icon className="animate-spin" />
            <h2>Generating response...</h2>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="flex gap-2 items-end">
        {userDetail && (
          <Image
            onClick={toggleSidebar}
            src={userDetail?.picture}
            alt="userImage"
            width={30}
            height={30}
            className="rounded-full cursor-pointer"
          />
        )}
        <div
          className="p-5 border rounded-xl max-w-2xl w-full mt-3"
          style={{
            backgroundColor: Colors.BACKGROUND,
          }}
        >
          <div className="flex gap-2">
            <textarea
              placeholder={Lookup.INPUT_PLACEHOLDER}
              className="outline-none bg-transparent w-full h-32 max-h-56 resize-none"
              onChange={(event) => setUserInput(event.target.value)}
              value={userInput}
            />
            {userInput && (
              <ArrowRight
                onClick={() => onGenerate(userInput)}
                className="bg-blue-500 p-2 w-10 h-10 rounded-md cursor-pointer"
              />
            )}
          </div>
          <div>
            <Link className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatView;