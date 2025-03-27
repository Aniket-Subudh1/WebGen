'use client';
import { ActionContext } from '@/context/ActionContext';
import { SandpackPreview, useSandpack } from '@codesandbox/sandpack-react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

function SandpackPreviewClient() {
  const previewRef = useRef();
  const { sandpack } = useSandpack();
  const { action, setAction } = useContext(ActionContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const loadingTimeoutRef = useRef(null);
  

  useEffect(() => {

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Set loading state
    setIsLoading(true);
    
    // Set a reasonable timeout for loading (3 seconds)
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => {
      // Clean up on unmount
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [sandpack?.id]); // Only run when sandpack instance changes
  
  // Handle action (deploy/export)
  useEffect(() => {
    if (action?.actionType && sandpack && previewRef.current) {
      handleAction(action.actionType);
    }
  }, [action, sandpack]);
  
  const handleAction = async (actionType) => {
    if (!previewRef.current || !sandpack) return;
    
    try {
      setIsExporting(true);
      const client = previewRef.current.getClient();
      
      if (client) {
        // Make sure the client is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await client.getCodeSandboxURL();
        
        if (actionType === "deploy") {
          if (result?.sandboxId) {
            window.open('https://' + result.sandboxId + ".csb.app/");
            toast.success("Deployed to CodeSandbox live preview");
          } else {
            toast.error("Failed to deploy. Try refreshing the preview first.");
          }
        } else if (actionType === "export") {
          if (result?.editorUrl) {
            window.open(result.editorUrl);
            toast.success("Exported to CodeSandbox editor");
          } else {
            toast.error("Failed to export. Try refreshing the preview first.");
          }
        }
      }
    } catch (error) {
      console.error("Error handling action:", error);
      toast.error("Failed to " + actionType + " project. Please try again after refreshing the preview.");
    } finally {
      setIsExporting(false);
      // Reset action after handling
      setAction(null);
    }
  };

  // Force refresh preview
  const refreshPreview = () => {
    setIsLoading(true);
    
    if (sandpack?.refresh) {
      sandpack.refresh();
      
      // Set a timeout to hide loading state after a reasonable time
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        toast.success("Preview refreshed");
      }, 2000);
    }
  };

  return (
    <div className="relative w-full h-full">
      <SandpackPreview
        ref={previewRef}
        showNavigator={true}
        showRefreshButton={true}
        showOpenInCodeSandbox={false}
        style={{ height: '75vh', width: '100%' }}
        // Add key to force re-render when sandpack changes
        key={sandpack?.id || 'preview'}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Loading preview...</p>
          <Button 
            onClick={() => setIsLoading(false)}
            variant="link"
            size="sm"
            className="mt-4"
          >
            Hide loading screen
          </Button>
        </div>
      )}
      
      {isExporting && (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Processing your request...</p>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button 
          onClick={refreshPreview}
          size="sm"
          variant="secondary"
          className="shadow-md"
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Preview
        </Button>
      </div>
    </div>
  );
}

export default SandpackPreviewClient;