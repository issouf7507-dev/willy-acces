import { useEffect, useState } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function computeTimeLeft(target: number): TimeLeft {
  const diff = target - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }
  const seconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: false,
  }
}

interface Props {
  /** Date de sortie au format ISO 8601 */
  releaseDate: string
  /**
   * `sm` / `lg` : blocs chiffrés (carte de la page Précommandes, bannière).
   * `inline` : une seule ligne, pour tenir dans la place d'une note en étoiles
   * sur les cartes du catalogue.
   */
  size?: 'sm' | 'lg' | 'inline'
}

const pad = (n: number) => n.toString().padStart(2, '0')

export default function Countdown({ releaseDate, size = 'sm' }: Props) {
  const target = new Date(releaseDate).getTime()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(target))

  useEffect(() => {
    setTimeLeft(computeTimeLeft(target))
    const id = setInterval(() => setTimeLeft(computeTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  if (timeLeft.done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Disponible maintenant
      </span>
    )
  }

  if (size === 'inline') {
    // Au-delà d'un jour, les secondes n'apportent rien et font clignoter la
    // carte à chaque tick : on n'affiche le détail fin qu'au dernier jour.
    const label = timeLeft.days > 0
      ? `${timeLeft.days} j ${pad(timeLeft.hours)} h`
      : `${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m ${pad(timeLeft.seconds)}s`

    // Le décompte seul (« J-13 · 06h ») passait pour une mention technique au
    // milieu des cartes : il est explicitement introduit par « Sortie dans » et
    // posé sur une pastille, pour se distinguer de la note en étoiles qu'il
    // remplace.
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white"
        role="timer"
        aria-label={`Disponible dans ${timeLeft.days} jours ${timeLeft.hours} heures`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <span className="uppercase tracking-wide">Sortie dans</span>
        <span className="tabular-nums">{label}</span>
      </span>
    )
  }

  const units = [
    { value: timeLeft.days, label: 'J' },
    { value: timeLeft.hours, label: 'H' },
    { value: timeLeft.minutes, label: 'M' },
    { value: timeLeft.seconds, label: 'S' },
  ]

  const box =
    size === 'lg'
      ? 'min-w-[3.25rem] px-2 py-2 text-2xl md:text-3xl'
      : 'min-w-[2.25rem] px-1.5 py-1 text-base'

  return (
    <div
      className="flex items-center gap-1.5"
      role="timer"
      aria-label={`Disponible dans ${timeLeft.days} jours ${timeLeft.hours} heures ${timeLeft.minutes} minutes`}
    >
      {units.map((u, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className={`font-black tabular-nums bg-zinc-900 text-white rounded flex items-center justify-center ${box}`}>
            {pad(u.value)}
          </span>
          <span className={`mt-1 font-bold text-zinc-400 ${size === 'lg' ? 'text-[11px]' : 'text-[9px]'}`}>
            {u.label}
          </span>
        </div>
      ))}
    </div>
  )
}
