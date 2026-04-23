import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify';
import AuthProvider from "./context/AuthContext.jsx"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
        <ToastContainer theme='dark' closeOnClick={true} position='bottom-right' />
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>
)
