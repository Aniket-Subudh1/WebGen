export function getFromLocalStorage(key, defaultValue = null) {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  }
  

  export function setInLocalStorage(key, value) {
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
      return false;
    }
  }

  export function removeFromLocalStorage(key) {
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  }