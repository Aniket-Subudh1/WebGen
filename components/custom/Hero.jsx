'use client';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import Lookup from '@/data/Lookup';
import { ArrowRight, Code, Send, Sparkles } from 'lucide-react';
import React, { useContext, useState, useRef, useEffect } from 'react';
import SignInDialog from './SignInDialog';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '../ui/button';

function Hero() {
  const [userInput, setUserInput] = useState('');
  const { setMessages } = useContext(MessagesContext);
  const { userDetail } = useContext(UserDetailContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const textareaRef = useRef(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [userInput]);

  const onGenerate = async (input) => {
    if (!input.trim()) return;
    
    if (!userDetail?._id) {
      setOpenDialog(true);
      return;
    }
    
    if (userDetail.token < 10) {
      toast.error("You don't have enough tokens to generate code");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Create a message object
      const msg = {
        role: 'user',
        content: input,
      };
      
      // Set message in context
      setMessages([msg]);
      
      // Create a new workspace
      const response = await axios.post('/api/workspace', {
        user: userDetail._id,
        messages: [msg],
      });
      
      if (response.data && response.data._id) {
        // Navigate to the new workspace
        router.push(`/workspace/${response.data._id}`);
      } else {
        toast.error('Failed to create workspace');
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error generating workspace:', error);
      toast.error('Something went wrong');
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onGenerate(userInput);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4 py-10">
      <div className="max-w-5xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {Lookup.HERO_HEADING}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {Lookup.HERO_DESC}
        </p>
      </div>

      <div className="w-full max-w-2xl mt-10 relative">
        <div className="absolute -top-10 right-5 rounded-full bg-primary/10 p-2 border border-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="absolute -top-10 left-5 rounded-full bg-primary/10 p-2 border border-primary/20">
          <Code className="h-5 w-5 text-primary" />
        </div>
        
        <div className="relative bg-background border rounded-xl shadow-sm overflow-hidden">
          <textarea
            ref={textareaRef}
            placeholder={Lookup.INPUT_PLACEHOLDER}
            className="w-full resize-none bg-transparent p-4 outline-none min-h-[100px] max-h-[200px]"
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            value={userInput}
            disabled={isGenerating}
          />
          
          <div className="p-3 border-t flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to generate
            </div>
            <Button
              onClick={() => onGenerate(userInput)}
              disabled={!userInput.trim() || isGenerating}
              className="gap-2"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl">
        {Lookup.SUGGSTIONS.map((suggestion, index) => (
          <button
            key={index}
            className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 rounded-full text-foreground cursor-pointer transition-colors"
            onClick={() => {
              setUserInput(suggestion);
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
              }
            }}
            disabled={isGenerating}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <SignInDialog
        openDialog={openDialog}
        closeDialog={(v) => setOpenDialog(v)}
      />
    </div>
  );
}

export default Hero;