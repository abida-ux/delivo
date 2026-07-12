import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { CartUIProvider } from './context/CartUIContext'
import { LoaderProvider } from './context/LoaderContext'
import { AuthModalProvider } from './context/AuthModalContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LoaderProvider>
      <AuthProvider>
        <AuthModalProvider>
          <CartProvider>
            <CartUIProvider>
              <App />
            </CartUIProvider>
          </CartProvider>
        </AuthModalProvider>
      </AuthProvider>
    </LoaderProvider>
  </BrowserRouter>
)