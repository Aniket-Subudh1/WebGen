'use client';
import { useContext, useEffect, useState, createContext } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getFromLocalStorage, setInLocalStorage, removeFromLocalStorage } from '@/lib/localStorage';

const FallbackContext = createContext({ userDetail: null, setUserDetail: () => {} });

export function useAuth() {
  let userDetailContext;
  try {
    userDetailContext = useContext(UserDetailContext);
    if (!userDetailContext) {
      throw new Error('useAuth must be used within a UserDetailContext provider');
    }
  } catch (error) {
    console.warn('UserDetailContext not available, using fallback');
    userDetailContext = useContext(FallbackContext);
  }

  const { userDetail, setUserDetail } = userDetailContext;
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const localUser = getFromLocalStorage('user');
      
      if (!localUser) {
        setLoading(false);
        return false;
      }
      
      const response = await axios.get(`/api/auth/session?email=${encodeURIComponent(localUser.email)}`);
      
      if (response.data) {
        setUserDetail(response.data);
        setLoading(false);
        return true;
      } else {
        removeFromLocalStorage('user');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      removeFromLocalStorage('user');
      setLoading(false);
      return false;
    }
  };

  const login = async (googleUser) => {
    try {
      const response = await axios.post('/api/auth/google', {
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        uid: googleUser.sub || Date.now().toString(),
      });
      
      const user = response.data;
      
      setInLocalStorage('user', googleUser);
      
      setUserDetail(user);
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    removeFromLocalStorage('user');
    setUserDetail(null);
    router.push('/');
  };

  const requireAuth = (callback) => {
    if (!loading && !userDetail) {
      router.push('/');
      return false;
    }
    
    if (!loading && userDetail && callback) {
      callback();
    }
    
    return true;
  };

  return {
    user: userDetail,
    loading,
    login,
    logout,
    requireAuth,
    checkAuthStatus,
  };
}