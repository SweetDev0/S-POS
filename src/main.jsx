import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// import { NhostClient, NhostProvider } from '@nhost/react'

import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Geçici olarak Nhost devre dışı
// const nhost = new NhostClient({
//   subdomain: 'ntxalvmalubpyiyfzgkv',
//   region: 'eu-central-1'
// });

// export { nhost };

// console.log('=== NHOST CONFIGURATION ===');
// console.log('Subdomain:', nhost.subdomain);
// console.log('Region:', nhost.region);
// console.log('Auth URL:', nhost.auth.url);

// Hata yakalama
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <NhostProvider nhost={nhost}> */}
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    {/* </NhostProvider> */}
  </React.StrictMode>
) 