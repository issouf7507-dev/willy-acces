import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext.tsx'
import { QuickBuyProvider } from './context/QuickBuyContext.tsx'
import { PreorderProvider } from './context/PreorderContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <QuickBuyProvider>
          <PreorderProvider>
            <App />
          </PreorderProvider>
        </QuickBuyProvider>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)
