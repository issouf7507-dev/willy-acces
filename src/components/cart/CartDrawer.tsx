import { useRef } from 'react'
import { useCart } from '../../context/CartContext'
import { RECOMMENDATIONS } from '../../data/recommendations'

const FREE_SHIPPING_THRESHOLD = 110

function TruckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="none" className="flex-shrink-0">
      <g transform="translate(1.4 1.4) scale(2.81 2.81)">
        <path d="M85.687 66.088h-2.755v-4h2.755c.173 0 .313-.141.313-.313V47.326c0-.076-.028-.149-.079-.207L71.512 30.911c-.059-.066-.145-.105-.234-.105H58.633v31.282h11.295v4H54.633V26.806h16.645c1.23 0 2.406.527 3.224 1.447L88.91 44.461C89.612 45.25 90 46.268 90 47.326v14.448C90 64.153 88.065 66.088 85.687 66.088z" fill="#000" />
        <path d="M58.633 66.088H29.019v-4h25.614V22.155c0-2.394-1.468-4.417-3.205-4.417H7.206C5.468 17.739 4 19.761 4 22.155v38.84c0 .705.383 1.093.51 1.093h11.515v4H4.51C2.023 66.088 0 63.804 0 60.995V22.155C0 17.514 3.232 13.738 7.206 13.738h44.222c3.973 0 7.205 3.775 7.205 8.417V66.088z" fill="#000" />
        <path d="M76.43 72.262c-4.688 0-8.502-3.814-8.502-8.503s3.813-8.502 8.502-8.502 8.502 3.813 8.502 8.502-3.814 8.503-8.502 8.503zm0-13.005c-2.482 0-4.502 2.02-4.502 4.502 0 2.483 2.02 4.503 4.502 4.503s4.502-2.02 4.502-4.503c0-2.482-2.02-4.502-4.502-4.502z" fill="#000" />
        <path d="M22.517 72.262c-4.688 0-8.502-3.814-8.502-8.503s3.814-8.502 8.502-8.502c4.688 0 8.502 3.813 8.502 8.502s-3.797 8.503-8.502 8.503zm0-13.005c-2.482 0-4.502 2.02-4.502 4.502 0 2.483 2.02 4.503 4.502 4.503s4.502-2.02 4.502-4.503c0-2.482-2-4.502-4.502-4.502z" fill="#000" />
        <path d="M88 48.447H67.664c-2.244 0-4.069-1.825-4.069-4.069V28.806h4v15.573L88 44.447V48.447z" fill="#000" />
      </g>
    </svg>
  )
}

function FreeShippingBar({ total }: { total: number }) {
  const remaining = FREE_SHIPPING_THRESHOLD - total
  const progress = Math.min(total / FREE_SHIPPING_THRESHOLD, 1)
  const reached = total >= FREE_SHIPPING_THRESHOLD

  return (
    <div className="mt-3">
      <p className="text-xs text-center text-zinc-600 mb-2">
        {reached
          ? '🎉 Woohoo, you are eligible for free shipping!'
          : `Spend $${remaining.toFixed(2)} more and get free shipping!`}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <TruckIcon />
      </div>
    </div>
  )
}

function RecommendationCard({ product }: { product: typeof RECOMMENDATIONS[0] }) {
  const { addItem } = useCart()

  return (
    <div className="flex-shrink-0 w-44 bg-white rounded-sm flex flex-col snap-start">
      {/* Image placeholder */}
      <div className={`aspect-square ${product.gradient} rounded-sm flex items-center justify-center`}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="0.8">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
        </svg>
      </div>
      {/* Info */}
      <div className="p-2 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-medium leading-tight text-zinc-900 line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-1.5">
          {product.compareAtPrice && (
            <span className="text-xs text-zinc-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
          )}
          <span className={`text-xs font-semibold ${product.compareAtPrice ? 'text-red-600' : 'text-zinc-600'}`}>
            ${product.price.toFixed(2)} USD
          </span>
        </div>
        <button
          onClick={() => addItem({ id: product.id, name: product.name, price: product.price, color: 'Default', gradientFrom: 'from-zinc-200', gradientTo: 'to-zinc-300' })}
          className="mt-auto text-xs font-bold uppercase tracking-wide border border-zinc-300 px-3 py-1.5 hover:bg-black hover:text-white hover:border-black transition-all"
        >
          + Add
        </button>
      </div>
    </div>
  )
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCart()
  const recoRef = useRef<HTMLDivElement>(null)

  const scrollRecos = (dir: 'left' | 'right') => {
    recoRef.current?.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' })
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── HEADER ── */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <p className="font-bold text-lg">Cart</p>
              <span className="min-w-[22px] h-[22px] bg-black text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
                {itemCount}
              </span>
            </div>
            <button
              onClick={closeCart}
              aria-label="Close cart"
              className="p-1.5 hover:opacity-60 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <FreeShippingBar total={total} />
        </div>

        {/* ── BODY (scrollable) ── */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-5 text-center">
              <svg width="48" height="48" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                <path d="M11 7H3.577A2 2 0 0 0 1.64 9.497l2.051 8A2 2 0 0 0 5.63 19H16.37a2 2 0 0 0 1.937-1.503l2.052-8A2 2 0 0 0 18.422 7H11Zm0 0V1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-zinc-400 font-medium">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="px-6 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <div>
              {/* Line items */}
              <div className="px-5 pt-5 pb-3 space-y-5">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    {/* Image */}
                    <div className={`w-20 h-20 flex-shrink-0 bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} rounded-sm flex items-center justify-center`}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-snug">{item.name}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">${item.price.toFixed(2)} USD</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.color}</p>

                      {/* Quantity + Remove */}
                      <div className="flex items-center gap-4 mt-2">
                        {/* Qty stepper */}
                        <div className="flex items-center border border-zinc-300">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors text-lg leading-none"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-medium select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors text-lg leading-none"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-zinc-400 hover:text-black underline transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="bg-zinc-100 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-sm">You Might Also Like</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => scrollRecos('left')}
                      className="w-7 h-7 rounded-full border border-zinc-300 flex items-center justify-center hover:border-black transition-colors"
                      aria-label="Previous"
                    >
                      <svg width="5" height="8" viewBox="0 0 5 8" fill="none">
                        <path d="m4.25 7-3-3 3-3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => scrollRecos('right')}
                      className="w-7 h-7 rounded-full border border-zinc-300 flex items-center justify-center hover:border-black transition-colors"
                      aria-label="Next"
                    >
                      <svg width="5" height="8" viewBox="0 0 5 8" fill="none">
                        <path d="m.75 7 3-3-3-3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div
                  ref={recoRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory"
                >
                  {RECOMMENDATIONS.map(product => (
                    <RecommendationCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t border-zinc-200 bg-white space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Subtotal</span>
              <span className="font-bold text-sm">${total.toFixed(2)} USD</span>
            </div>
            <p className="text-xs text-zinc-500">
              Taxes and{' '}
              <a href="#" className="underline hover:text-black transition-colors">shipping</a>{' '}
              calculated at checkout
            </p>

            {/* Checkout button */}
            <button className="w-full bg-zinc-800 text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3.236 18.182a5.071 5.071 0 0 0 4.831 4.465 114.098 114.098 0 0 0 7.865-.001 5.07 5.07 0 0 0 4.831-4.464 23.03 23.03 0 0 0 .165-2.611c0-.881-.067-1.752-.165-2.61a5.07 5.07 0 0 0-4.83-4.465c-1.311-.046-2.622-.07-3.933-.069a109.9 109.9 0 0 0-3.933.069 5.07 5.07 0 0 0-4.83 4.466 23.158 23.158 0 0 0-.165 2.609c0 .883.067 1.754.164 2.61Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
                <path d="M17 8.43V6.285A5 5 0 0 0 7 6.286V8.43" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 17.714a2.143 2.143 0 1 0 0-4.286 2.143 2.143 0 0 0 0 4.286Z" />
              </svg>
              Checkout
            </button>

            {/* View cart */}
            <div className="text-center">
              <button
                onClick={closeCart}
                className="text-sm underline text-zinc-500 hover:text-black transition-colors"
              >
                View cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
