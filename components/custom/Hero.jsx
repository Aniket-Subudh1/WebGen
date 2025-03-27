'use client';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import { ArrowRight, Link } from 'lucide-react';
import React, { useContext, useState } from 'react';
import SignInDialog from './SignInDialog';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function Hero() {
  const [userInput, setUserInput] = useState('');
  const { setMessages } = useContext(MessagesContext);
  const { userDetail } = useContext(UserDetailContext);
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter();

  const onGenerate = async (input) => {
    if (!userDetail?._id) {
      setOpenDialog(true);
      return;
    }
    
    if (userDetail.token < 10) {
      toast.error("You don't have enough tokens to generate code");
      return;
    }
    
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
      }
    } catch (error) {
      console.error('Error generating workspace:', error);
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="flex flex-col items-center mt-36 xl:mt-42 gap-2">
      <h2 className="font-bold text-4xl">{Lookup.HERO_HEADING}</h2>
      <p className="text-gray-400 font-medium">{Lookup.HERO_DESC}</p>
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

      <div className="flex mt-8 flex-wrap max-w-2xl items-center justify-center gap-3">
        {Lookup.SUGGSTIONS.map((suggestion, index) => (
          <h2
            className="p-1 px-2 border rounded-full text-sm text-gray-400 hover:text-white cursor-pointer"
            key={index}
            onClick={() => onGenerate(suggestion)}
          >
            {suggestion}
          </h2>
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