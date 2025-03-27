'use client';
import React, { useState, useContext } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Check, Code, FileCode, Upload } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { SandpackProvider, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react';

const UIComponentUpload = () => {
  const { userDetail } = useContext(UserDetailContext);
  const [componentData, setComponentData] = useState({
    name: '',
    description: '',
    code: '',
    category: 'general',
    tags: '',
    framework: 'react'
  });
  const [preview, setPreview] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setComponentData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setComponentData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userDetail?._id) {
      toast.error("Please sign in to upload components");
      return;
    }
    
    if (!componentData.name || !componentData.description || !componentData.code) {
      toast.error("Name, description, and code are required");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/ai/train/components', {
        userId: userDetail._id,
        component: {
          ...componentData,
          tags: componentData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }
      });
      
      if (response.data.success) {
        toast.success("Component uploaded successfully!");
        setComponentData({
          name: '',
          description: '',
          code: '',
          category: 'general',
          tags: '',
          framework: 'react'
        });
      } else {
        throw new Error(response.data.error || "Failed to upload component");
      }
    } catch (error) {
      console.error("Error uploading component:", error);
      toast.error(error.response?.data?.error || "Failed to upload component");
    } finally {
      setLoading(false);
    }
  };
  
  // Create sample files for preview
  const previewFiles = {
    "/App.js": {
      code: componentData.code || "// Your component code will appear here"
    },
    "/styles.css": {
      code: `
body {
  margin: 0;
  padding: 20px;
  font-family: system-ui, sans-serif;
}
      `
    },
    "/tailwind.config.js": {
      code: `
module.exports = {
  content: ["./**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
      `
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Upload UI Component</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Submit a New UI Component</CardTitle>
          <CardDescription>
            Share your component to help train the AI and improve code generation
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Component Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={componentData.name}
                    onChange={handleChange}
                    placeholder="e.g. ResponsiveNavbar"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={componentData.description}
                    onChange={handleChange}
                    placeholder="Describe what your component does and how to use it"
                    required
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={componentData.category}
                      onValueChange={(value) => handleSelectChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="form">Form</SelectItem>
                        <SelectItem value="navigation">Navigation</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="modal">Modal</SelectItem>
                        <SelectItem value="button">Button</SelectItem>
                        <SelectItem value="layout">Layout</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="chart">Chart</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="framework">Framework</Label>
                    <Select
                      value={componentData.framework}
                      onValueChange={(value) => handleSelectChange('framework', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="react">React</SelectItem>
                        <SelectItem value="vue">Vue</SelectItem>
                        <SelectItem value="angular">Angular</SelectItem>
                        <SelectItem value="svelte">Svelte</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={componentData.tags}
                    onChange={handleChange}
                    placeholder="e.g. responsive, animation, dark-mode"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="code">Component Code</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreview(!preview)}
                    >
                      {preview ? <Code className="h-4 w-4 mr-1" /> : <FileCode className="h-4 w-4 mr-1" />}
                      {preview ? "Show Editor" : "Show Preview"}
                    </Button>
                  </div>
                </div>
                
                <div className="h-80 border rounded-md overflow-hidden">
                  <SandpackProvider
                    files={previewFiles}
                    template="react"
                    theme="dark"
                    options={{ 
                      externalResources: ['https://cdn.tailwindcss.com'],
                      activeFile: "/App.js"
                    }}
                  >
                    {preview ? (
                      <SandpackPreview showNavigator={false} />
                    ) : (
                      <SandpackCodeEditor
                        showLineNumbers
                        readOnly={false}
                        onChange={(code) => setComponentData(prev => ({ ...prev, code }))}
                      />
                    )}
                  </SandpackProvider>
                </div>
              </div>
            </div>
            
            {!userDetail && (
              <div className="flex items-center p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p className="text-sm">You need to sign in to upload components</p>
              </div>
            )}
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setComponentData({
              name: '',
              description: '',
              code: '',
              category: 'general',
              tags: '',
              framework: 'react'
            })}
          >
            Reset
          </Button>
          
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !userDetail}
            className="gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></span>
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Component
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
    </div>
  );
};

export default UIComponentUpload;