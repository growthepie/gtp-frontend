import { useState, useEffect } from 'react';

const useCookieChange = (cookieName) => {
  const [cookieValue, setCookieValue] = useState(() => {
    // Get initial cookie value
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
    return cookie ? cookie.split('=')[1] : null;
  });

  useEffect(() => {
    const checkCookie = () => {
      const cookies = document.cookie.split(';');
      const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
      const newValue = cookie ? cookie.split('=')[1] : null;
      
      if (newValue !== cookieValue) {
        setCookieValue(newValue);
      }
    };

    // Check for changes every second
    const interval = setInterval(checkCookie, 1000);

    // Add event listener for storage events (in case cookie is changed in another tab)
    const handleStorageChange = (e) => {
      if (e.key === cookieName) {
        checkCookie();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [cookieName, cookieValue]);

  return cookieValue;
};

export default useCookieChange;