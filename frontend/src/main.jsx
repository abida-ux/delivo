import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { CartProvider } from './context/CartContext'
import { CartUIProvider } from './context/CartUIContext'
import { LoaderProvider } from './context/LoaderContext'
import { AuthModalProvider } from './context/AuthModalContext'
import { AuthProvider } from './context/AuthContext'
import PwaInstallPrompt from './components/PwaInstallPrompt'
import ErrorBoundary from './components/ErrorBoundary'
import { LocationProvider } from './context/LocationContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <BrowserRouter>
      <ErrorBoundary>
        <LoaderProvider>
          <AuthProvider>
            <LocationProvider>
              <AuthModalProvider>
                <CartProvider>
                  <CartUIProvider>
                    <App />
                    <PwaInstallPrompt />
                  </CartUIProvider>
                </CartProvider>
              </AuthModalProvider>
            </LocationProvider>
          </AuthProvider>
        </LoaderProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </HelmetProvider>
)