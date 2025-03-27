'use client';
import React, { useContext, useEffect, useState } from 'react';

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
import { 
  AlertCircle, 
  Code2, 
  Eye, 
  FileCode, 
  Loader2Icon, 
  Plus, 
  Save, 
  Settings 
} from 'lucide-react';
import { toast } from 'sonner';
import SandpackPreviewClient from './SandpackPreviewClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter,
  SheetTrigger
} from '../ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { countToken } from './ChatView';

function CodeView() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('code');
  const [files, setFiles] = useState(Lookup?.DEFAULT_FILE);
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { action, setAction } = useContext(ActionContext);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    framework: 'react',
    useCustomComponents: true,
    theme: 'dark',
    libraries: ['tailwindcss'],
    responsive: true
  });
  const [currentFile, setCurrentFile] = useState(null);
  const [fileToEdit, setFileToEdit] = useState(null);
  const [codeImprovement, setCodeImprovement] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

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
      // Extract the last user message
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      if (!lastUserMessage) throw new Error("No user message found");
      
      // Prepare request data
      const requestData = {
        prompt: lastUserMessage.content,
        userId: userDetail._id,
        options: {
          ...settings,
          previousMessages: messages.slice(0, -1) // Provide context from previous messages
        }
      };
      
      // Call the new OpenAI-powered endpoint
      const result = await axios.post('/api/ai/code-gen', requestData);
      
      if (result.data && result.data.files) {
        // Merge default files with AI-generated files
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result.data.files };
        setFiles(mergedFiles);
        
        // Save generated files to database
        await axios.put('/api/workspace/files', {
          workspaceId: id,
          files: result.data.files,
        });
        
        // Update token count in user state
        setUserDetail(prev => ({ 
          ...prev, 
          token: result.data.remainingTokens 
        }));
        
        // Add AI's explanation as a message
        const aiMessage = {
          role: 'ai',
          content: `I've generated a ${result.data.projectTitle}. ${result.data.explanation}`
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Update messages in database
        await axios.put('/api/workspace/messages', {
          messages: [...messages, aiMessage],
          workspaceId: id,
        });
        
        toast.success('Code generated successfully!');
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate code: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const improveCode = async () => {
    if (!fileToEdit || !codeImprovement) {
      toast.error("Please select a file and provide improvement instructions");
      return;
    }

    if (!userDetail || userDetail.token < 10) {
      toast.error("You don't have enough tokens to improve code");
      return;
    }

    setLoading(true);
    try {
      const originalCode = files[fileToEdit]?.code || "";
      
      const result = await axios.post('/api/ai/code-improve', {
        originalCode,
        feedback: codeImprovement,
        userId: userDetail._id
      });
      
      if (result.data && result.data.improvedCode) {
        // Update the file with improved code
        const updatedFiles = {
          ...files,
          [fileToEdit]: {
            ...files[fileToEdit],
            code: result.data.improvedCode
          }
        };
        
        setFiles(updatedFiles);
        
        // Save to database
        await axios.put('/api/workspace/files', {
          workspaceId: id,
          files: updatedFiles,
        });
        
        // Update token count
        setUserDetail(prev => ({ 
          ...prev, 
          token: result.data.remainingTokens 
        }));
        
        toast.success('Code improved successfully!');
        setFileToEdit(null);
        setCodeImprovement('');
      }
    } catch (error) {
      console.error('Error improving code:', error);
      toast.error('Failed to improve code');
    } finally {
      setLoading(false);
    }
  };

  const addNewFile = () => {
    if (!newFileName || !newFileContent) {
      toast.error("Filename and content are required");
      return;
    }
    
    // Ensure the filename has the correct format
    let formattedFileName = newFileName;
    if (!formattedFileName.startsWith('/')) {
      formattedFileName = '/' + formattedFileName;
    }
    
    // Update files
    const updatedFiles = {
      ...files,
      [formattedFileName]: { code: newFileContent }
    };
    
    setFiles(updatedFiles);
    
    // Save to database
    axios.put('/api/workspace/files', {
      workspaceId: id,
      files: updatedFiles,
    })
    .then(() => {
      toast.success('File added successfully!');
      setNewFileName('');
      setNewFileContent('');
    })
    .catch(error => {
      console.error('Error adding file:', error);
      toast.error('Failed to add file');
    });
  };

  // Get the list of available files
  const fileList = Object.keys(files || {}).sort();

  return (
    <div className="relative">
      <div className="bg-[#181818] w-full p-2 border flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center w-full">
            <TabsList className="bg-black">
              <TabsTrigger value="code" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Code2 className="h-4 w-4 mr-2" />
                Code
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add File
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Add New File</SheetTitle>
                    <SheetDescription>
                      Create a new file in your project
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div>
                      <Input
                        placeholder="File path (e.g. /components/Button.js)"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                      />
                    </div>
                    <div>
                      <textarea 
                        className="w-full h-64 p-2 border rounded-md bg-background text-foreground"
                        placeholder="File content"
                        value={newFileContent}
                        onChange={(e) => setNewFileContent(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button onClick={addNewFile}>
                        <Save className="h-4 w-4 mr-2" />
                        Save File
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileCode className="h-4 w-4 mr-2" />
                    Improve Code
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Improve Code</SheetTitle>
                    <SheetDescription>
                      Let AI improve your code based on your instructions
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div>
                      <Select onValueChange={setFileToEdit} value={fileToEdit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select file to improve" />
                        </SelectTrigger>
                        <SelectContent>
                          {fileList.map((file) => (
                            <SelectItem key={file} value={file}>
                              {file}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <textarea 
                        className="w-full h-32 p-2 border rounded-md bg-background text-foreground"
                        placeholder="Instructions for improvement (e.g. 'Add error handling', 'Make it responsive', etc.)"
                        value={codeImprovement}
                        onChange={(e) => setCodeImprovement(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button onClick={improveCode}>
                        Improve Code
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Code Generation Settings</SheetTitle>
                    <SheetDescription>
                      Customize how code is generated
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Framework</label>
                      <Select 
                        value={settings.framework}
                        onValueChange={(value) => setSettings({...settings, framework: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="react">React</SelectItem>
                          <SelectItem value="vue">Vue</SelectItem>
                          <SelectItem value="svelte">Svelte</SelectItem>
                          <SelectItem value="nextjs">Next.js</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="useCustomComponents"
                        checked={settings.useCustomComponents}
                        onChange={(e) => setSettings({...settings, useCustomComponents: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="useCustomComponents" className="text-sm font-medium">
                        Use custom UI components
                      </label>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Theme</label>
                      <Select 
                        value={settings.theme}
                        onValueChange={(value) => setSettings({...settings, theme: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </Tabs>
      </div>

      <SandpackProvider
        files={files}
        template="react"
        theme={settings.theme}
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
        <div className="p-10 bg-gray-900 bg-opacity-80 absolute top-0 w-full h-full flex flex-col gap-4 justify-center items-center">
          <Loader2Icon className="animate-spin w-10 h-10 text-white" />
          <h2 className="text-white text-xl font-semibold">Working on your code...</h2>
          <p className="text-gray-300 text-center max-w-md">
            Our AI is carefully generating high-quality code based on your requirements. 
            This may take a moment.
          </p>
        </div>
      )}
      
      {!userDetail && (
        <div className="p-6 bg-yellow-900 bg-opacity-90 absolute bottom-0 w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-yellow-300" />
            <p className="text-white">
              Sign in to save your work and access all features
            </p>
          </div>
          <Button>Sign In</Button>
        </div>
        )}
      </div>
    );
  }
  
  export default CodeView;