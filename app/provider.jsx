'use client';
import React, { useState, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import Header from '@/components/custom/Header';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSideBar from '@/components/custom/AppSideBar';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { ActionContext } from '@/context/ActionContext';
import { getFromLocalStorage } from '@/lib/localStorage';

function Provider({ children }) {
  const [messages, setMessages] = useState([]);
  const [userDetail, setUserDetail] = useState(null);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize with localStorage on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = getFromLocalStorage('user');
        if (localUser) {
          // Initialize with local data
          setUserDetail(localUser);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show a simple loading spinner if still initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <GoogleOAuthProvider
        clientId={process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY}
      >
        <PayPalScriptProvider
          options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID }}
        >
          <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            <MessagesContext.Provider value={{ messages, setMessages }}>
              <ActionContext.Provider value={{ action, setAction }}>
                <NextThemesProvider
                  attribute="class"
                  defaultTheme="dark"
                  enableSystem
                  disableTransitionOnChange
                >
                  <SidebarProvider defaultOpen={false}>
                    <AppSideBar />
                    <main className="w-full">
                      <Header />
                      {children}
                    </main>
                  </SidebarProvider>
                </NextThemesProvider>
              </ActionContext.Provider>
            </MessagesContext.Provider>
          </UserDetailContext.Provider>
        </PayPalScriptProvider>
      </GoogleOAuthProvider>
    </div>
  );
}

export default Provider;