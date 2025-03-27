'use client';
import React, { useContext, useEffect, useState } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';
import { useAuth } from '@/hooks/use-auth';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Activity, 
  Code, 
  FileCode, 
  FolderOpen, 
  Grid, 
  LayoutGrid, 
  Loader2, 
  Plus, 
  Settings, 
  Trash2, 
  Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const { userDetail } = useContext(UserDetailContext);
  const { requireAuth } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  useEffect(() => {
    requireAuth(() => {
      fetchWorkspaces();
    });
  }, [userDetail]);

  const fetchWorkspaces = async () => {
    if (!userDetail?._id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/workspace?userId=${userDetail._id}`);
      if (response.data) {
        setWorkspaces(response.data);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load your workspaces');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    try {
      await axios.delete(`/api/workspace/${workspaceId}`);
      toast.success('Workspace deleted successfully');
      fetchWorkspaces();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    }
  };

  const createNewWorkspace = async () => {
    try {
      const response = await axios.post('/api/workspace', {
        user: userDetail._id,
        messages: [],
      });
      
      if (response.data && response.data._id) {
        router.push(`/workspace/${response.data._id}`);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create new workspace');
    }
  };

  // Filter workspaces based on search query and active tab
  const filteredWorkspaces = workspaces.filter(workspace => {
    const searchMatch = workspace.messages && workspace.messages[0]?.content
      ? workspace.messages[0].content.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    // Filter by time for the tabs
    if (activeTab === 'recent') {
      const creationDate = new Date(workspace.createdAt);
      const daysDifference = (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
      return searchMatch && daysDifference <= 7; // Recent = last 7 days
    }
    
    return searchMatch;
  });
  
  // Group workspaces by creation date (today, yesterday, older)
  const groupedWorkspaces = filteredWorkspaces.reduce((groups, workspace) => {
    const creationDate = new Date(workspace.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = creationDate.toDateString() === today.toDateString();
    const isYesterday = creationDate.toDateString() === yesterday.toDateString();
    
    const group = isToday ? 'today' : isYesterday ? 'yesterday' : 'older';
    
    if (!groups[group]) {
      groups[group] = [];
    }
    
    groups[group].push(workspace);
    return groups;
  }, {});

  if (!userDetail) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects and workspaces
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex gap-3 items-center">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="font-semibold">{userDetail?.token?.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Button onClick={createNewWorkspace}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            
            <div className="relative">
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-[250px]"
              />
            </div>
          </div>
          
          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No projects found</h3>
                <p className="mt-1 text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={createNewWorkspace} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedWorkspaces).map(([group, items]) => (
                  <div key={group}>
                    <h2 className="text-lg font-semibold capitalize mb-3">
                      {group === 'today' ? 'Today' : 
                       group === 'yesterday' ? 'Yesterday' : 
                       'Older'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((workspace) => (
                        <Card key={workspace._id} className="hover:border-blue-500 transition-all duration-200">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base truncate">
                                {workspace.messages && workspace.messages[0]?.content 
                                  ? workspace.messages[0].content.length > 30 
                                    ? workspace.messages[0].content.substring(0, 30) + '...' 
                                    : workspace.messages[0].content
                                  : 'Untitled Project'}
                              </CardTitle>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => router.push(`/workspace/${workspace._id}`)}>
                                    <FileCode className="h-4 w-4 mr-2" />
                                    Open Editor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500"
                                    onClick={() => deleteWorkspace(workspace._id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <CardDescription>
                              Created {formatDistanceToNow(new Date(workspace.createdAt), { addSuffix: true })}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Code className="h-4 w-4 mr-1" />
                              <span>
                                {Object.keys(workspace.fileData || {}).length} files
                              </span>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => router.push(`/workspace/${workspace._id}`)}
                            >
                              Open Project
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent">
            {/* Same content structure as "all" tab, but filtered for recent items only */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No recent projects</h3>
                <p className="mt-1 text-muted-foreground">
                  Projects created in the last 7 days will appear here
                </p>
                <Button onClick={createNewWorkspace} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {filteredWorkspaces.map((workspace) => (
                  <Card key={workspace._id} className="hover:border-blue-500 transition-all duration-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base truncate">
                          {workspace.messages && workspace.messages[0]?.content 
                            ? workspace.messages[0].content.length > 30 
                              ? workspace.messages[0].content.substring(0, 30) + '...' 
                              : workspace.messages[0].content
                            : 'Untitled Project'}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/workspace/${workspace._id}`)}>
                              <FileCode className="h-4 w-4 mr-2" />
                              Open Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => deleteWorkspace(workspace._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription>
                        Created {formatDistanceToNow(new Date(workspace.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Code className="h-4 w-4 mr-1" />
                        <span>
                          {Object.keys(workspace.fileData || {}).length} files
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => router.push(`/workspace/${workspace._id}`)}
                      >
                        Open Project
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;