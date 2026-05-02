import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: '14px', borderRadius: '10px' },
          success: { duration: 3000 },
          error:   { duration: 4000 },
        }}
      />
    </>
  );
}
