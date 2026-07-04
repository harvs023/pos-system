'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: { fontSize: '14px', borderRadius: '10px' },
        success: { iconTheme: { primary: '#1E9469', secondary: '#fff' } },
      }}
    />
  );
}
