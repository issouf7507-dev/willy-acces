import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '../../context/ThemeContext'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
]

/**
 * Choix du thème du back-office.
 *
 * Trois états et non deux : « système » suit le réglage de l'appareil, ce qui
 * est ce qu'attend quelqu'un dont le téléphone bascule tout seul le soir. Le
 * bouton montre le thème **appliqué**, pas l'option choisie — sinon l'icône ne
 * dirait rien en mode système.
 */
export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme()
  const Icon = resolved === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Thème : ${OPTIONS.find((o) => o.value === theme)?.label}`}
        title="Changer le thème"
        className={cn(
          'rounded-lg p-2 text-muted-foreground transition-colors',
          'hover:bg-accent hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Icon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => setTheme(o.value)}
            className={cn(theme === o.value && 'bg-accent font-medium')}
          >
            <o.icon className="h-4 w-4" />
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
