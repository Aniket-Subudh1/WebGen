'use client';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import { 
  ArrowRight, 
  Code, 
  Layers, 
  Link as LinkIcon, 
  Sparkles, 
  Zap,
  LayoutGrid,
  FileCode,
  ChevronRight
} from 'lucide-react';
import React, { useContext, useState } from 'react';
import SignInDialog from './SignInDialog';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

function Hero() {
  const [userInput, setUserInput] = useState('');
  const { setMessages } = useContext(MessagesContext);
  const { userDetail } = useContext(UserDetailContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onGenerate = async (input) => {
    if (!userDetail?._id) {
      setOpenDialog(true);
      return;
    }
    
    if (userDetail.token < 100) {
      toast.error("You don't have enough tokens to generate code");
      return;
    }
    
    try {
      setIsLoading(true);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (userInput.trim()) {
        onGenerate(userInput);
      }
    }
  };

  // Sample templates for showcase
  const templates = [
    {
      title: "E-commerce Dashboard",
      description: "Modern admin panel with sales analytics",
      icon: LayoutGrid,
      prompt: "Create an e-commerce dashboard with product management, sales analytics, and order tracking features using React and Tailwind CSS."
    },
    {
      title: "Portfolio Website",
      description: "Showcase your work with style",
      icon: FileCode,
      prompt: "Build a professional portfolio website with a projects gallery, about section, and contact form."
    },
    {
      title: "Landing Page",
      description: "Convert visitors into customers",
      icon: Layers,
      prompt: "Design a modern landing page for a SaaS product with hero section, features, testimonials, and pricing."
    }
  ];

  return (
    <div className="flex flex-col items-center mt-20 xl:mt-24 gap-6 px-4 md:px-0">
      {/* Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/10 to-transparent -z-10" />
      
      {/* Main Heading */}
      <div className="text-center max-w-4xl">
        <div className="inline-block mb-4 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <div className="flex items-center space-x-1 text-blue-600 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by OpenAI GPT-4 Turbo</span>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {Lookup.HERO_HEADING}
        </h1>
        
        <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
          {Lookup.HERO_DESC}
        </p>
      </div>
      
      {/* Input Section */}
      <Card className="w-full max-w-3xl border shadow-xl">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="text" className="flex-1">Text Prompt</TabsTrigger>
              <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <div className="flex flex-col gap-4">
                <div
                  className="p-4 border rounded-xl w-full relative"
                  style={{
                    backgroundColor: Colors.BACKGROUND,
                  }}
                >
                  <textarea
                    placeholder={Lookup.INPUT_PLACEHOLDER}
                    className="outline-none bg-transparent w-full h-32 max-h-72 resize-none text-lg"
                    onChange={(event) => setUserInput(event.target.value)}
                    value={userInput}
                    onKeyDown={handleKeyDown}
                  />
                  
                  {userInput && (
                    <Button
                      onClick={() => onGenerate(userInput)}
                      className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Generating
                        </span>
                      ) : (
                        <span className="flex items-center">
                          Generate
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <LinkIcon className="h-4 w-4" />
                    <span className="text-xs">Tip: Be specific about what you want to build</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Lookup.SUGGSTIONS.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-sm"
                      onClick={() => onGenerate(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:border-blue-500 transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <template.icon className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{template.title}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between"
                        onClick={() => onGenerate(template.prompt)}
                      >
                        <span>Use Template</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-10">
        <div className="flex flex-col items-center text-center p-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mb-4">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Fast Generation</h3>
          <p className="text-muted-foreground">Generate complete web applications in seconds with just a text prompt.</p>
        </div>
        
        <div className="flex flex-col items-center text-center p-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mb-4">
            <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Custom Components</h3>
          <p className="text-muted-foreground">Upload your own UI components to create websites that match your style.</p>
        </div>
        
        <div className="flex flex-col items-center text-center p-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mb-4">
            <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Instant Deployment</h3>
          <p className="text-muted-foreground">Preview, edit, and deploy your website with just a few clicks.</p>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="w-full max-w-5xl mt-10 mb-20">
        <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to transform your ideas into code?</h2>
              <p className="text-blue-100">Join thousands of developers building with WebGen</p>
            </div>
            <div className="mt-6 md:mt-0">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50" 
                onClick={() => setOpenDialog(true)}
              >
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <SignInDialog
        openDialog={openDialog}
        closeDialog={(v) => setOpenDialog(v)}
      />
    </div>
  );
}

export default Hero;