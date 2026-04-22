'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          transition={Slide}
          newestOnTop
          closeOnClick={false}
          closeButton={false}
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          limit={3}
          theme="light"
          hideProgressBar={false}
          className="ems-toast-container"
          toastClassName="ems-toast"
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
