import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { UIProvider } from './state/UIContext.jsx'
import './styles.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <App />
          <Toaster position="top-right" />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
