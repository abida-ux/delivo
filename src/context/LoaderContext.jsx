import { createContext, useState, useEffect } from 'react';

export const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Minimum display time for loader (in milliseconds)
    const MINIMUM_LOADER_TIME = 2000; // 2 seconds
    const startTime = Date.now();

    // Hide loader when page is fully loaded
    const handleLoadComplete = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADER_TIME - elapsedTime);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    };

    // Check if page is already loaded
    if (document.readyState === 'complete') {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADER_TIME - elapsedTime);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    } else {
      window.addEventListener('load', handleLoadComplete);
      return () => window.removeEventListener('load', handleLoadComplete);
    }
  }, []);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  return (
    <LoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};
