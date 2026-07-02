import { useState } from 'react'

const links = {
  Support: ['Log In for Order Status', 'Shipping', 'Returns', 'Warranty', 'FAQs', 'Contact Us', 'Dealer Locator'],
  Company: ['Our Story', 'Blog Stories', 'Move Your Way', 'Drop Shop PDX', 'Retailers', 'Pro Program', 'Careers'],
  Resources: ['Reviews', 'Privacy Statement', 'Terms of Use', 'Accessibility Policy', 'Sitemap'],
}

function SocialIcon({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a href={href} className="text-zinc-400 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

export default function Footer() {
  const [email, setEmail] = useState('')

  return (
    <footer className="border-t border-zinc-200 bg-white mt-4">
      <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Newsletter */}
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest mb-4">Stay Connected</h3>
            <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
              Sign up for updates on new gear, drops, and stories.
            </p>
            <form
              onSubmit={e => { e.preventDefault(); setEmail('') }}
              className="flex gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                required
              />
              <button
                type="submit"
                className="bg-black text-white px-4 py-2.5 text-sm font-bold hover:bg-zinc-800 transition-colors"
              >
                →
              </button>
            </form>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="font-black text-sm uppercase tracking-widest mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-zinc-500 hover:text-black transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Social */}
          <div className="flex items-center gap-5">
            <SocialIcon href="#">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2.4c-2.607 0-2.934.011-3.958.058-1.022.046-1.72.209-2.33.446a4.705 4.705 0 0 0-1.7 1.107 4.706 4.706 0 0 0-1.108 1.7c-.237.611-.4 1.31-.446 2.331C2.41 9.066 2.4 9.392 2.4 12c0 2.607.011 2.934.058 3.958.046 1.022.209 1.72.446 2.33a4.706 4.706 0 0 0 1.107 1.7c.534.535 1.07.863 1.7 1.108.611.237 1.309.4 2.33.446 1.025.047 1.352.058 3.959.058s2.934-.011 3.958-.058c1.022-.046 1.72-.209 2.33-.446a4.706 4.706 0 0 0 1.7-1.107 4.706 4.706 0 0 0 1.108-1.7c.237-.611.4-1.31.446-2.33.047-1.025.058-1.352.058-3.959s-.011-2.934-.058-3.958c-.047-1.022-.209-1.72-.446-2.33a4.706 4.706 0 0 0-1.107-1.7 4.705 4.705 0 0 0-1.7-1.108c-.611-.237-1.31-.4-2.331-.446C14.934 2.41 14.608 2.4 12 2.4zm0 1.73c2.563 0 2.867.01 3.88.056.935.042 1.443.199 1.782.33.448.174.768.382 1.104.718.336.336.544.656.718 1.104.131.338.287.847.33 1.783.046 1.012.056 1.316.056 3.879 0 2.563-.01 2.867-.056 3.88-.043.935-.199 1.444-.33 1.782a2.974 2.974 0 0 1-.719 1.104 2.974 2.974 0 0 1-1.103.718c-.339.131-.847.288-1.783.33-1.012.046-1.316.056-3.88.056-2.563 0-2.866-.01-3.878-.056-.936-.042-1.445-.199-1.783-.33a2.974 2.974 0 0 1-1.104-.718 2.974 2.974 0 0 1-.718-1.104c-.131-.338-.288-.847-.33-1.783-.047-1.012-.056-1.316-.056-3.879 0-2.563.01-2.867.056-3.88.042-.935.199-1.443.33-1.782.174-.448.382-.768.718-1.104a2.974 2.974 0 0 1 1.104-.718c.338-.131.847-.288 1.783-.33C9.133 4.14 9.437 4.13 12 4.13zm0 11.07a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm0-8.13a4.93 4.93 0 1 0 0 9.86 4.93 4.93 0 0 0 0-9.86zm6.276-.194a1.152 1.152 0 1 1-2.304 0 1.152 1.152 0 0 1 2.304 0z" />
              </svg>
            </SocialIcon>

            <SocialIcon href="#">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M20.44 5.243c.929.244 1.66.963 1.909 1.876.451 1.654.451 5.106.451 5.106s0 3.452-.451 5.106a2.681 2.681 0 0 1-1.91 1.876c-1.684.443-8.439.443-8.439.443s-6.754 0-8.439-.443a2.682 2.682 0 0 1-1.91-1.876c-.45-1.654-.45-5.106-.45-5.106s0-3.452.45-5.106a2.681 2.681 0 0 1 1.91-1.876c1.685-.443 8.44-.443 8.44-.443s6.754 0 8.438.443zm-5.004 6.982L9.792 15.36V9.091l5.646 3.134z" />
              </svg>
            </SocialIcon>

            <SocialIcon href="#">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.027 10.168a5.125 5.125 0 0 1-4.76-2.294v7.893a5.833 5.833 0 1 1-5.834-5.834c.122 0 .241.011.361.019v2.874c-.12-.014-.237-.036-.36-.036a2.977 2.977 0 0 0 0 5.954c1.644 0 3.096-1.295 3.096-2.94L12.56 2.4h2.75a5.122 5.122 0 0 0 4.72 4.573v3.195" />
              </svg>
            </SocialIcon>

            <SocialIcon href="#">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M10.183 21.85v-8.868H7.2V9.526h2.983V6.982a4.17 4.17 0 0 1 4.44-4.572 22.33 22.33 0 0 1 2.667.144v3.084h-1.83a1.44 1.44 0 0 0-1.713 1.68v2.208h3.423l-.447 3.456h-2.97v8.868h-3.57Z" />
              </svg>
            </SocialIcon>
          </div>

          <p className="text-xs text-zinc-400 text-center">
            © 2026, Mon E-Commerce. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
