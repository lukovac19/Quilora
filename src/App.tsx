import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <RouterProvider router={router} />
        <Toaster 
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#04245A',
              border: '1px solid rgba(0, 207, 255, 0.3)',
              color: '#E6F0FF',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </ToastProvider>
    </AppProvider>
  );
}