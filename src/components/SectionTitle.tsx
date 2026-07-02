interface Props {
  eyebrow?: string
  subtitle?: string
  bold?: boolean
  className?: string
}

export default function SectionTitle({ eyebrow, subtitle, bold, className = '' }: Props) {
  return (
    <div className={`max-w-[1600px] mx-auto px-5 md:px-12 py-10 text-center ${className}`}>
      {eyebrow && (
        <h2 className={`uppercase tracking-tight mb-2 ${bold ? 'text-xl md:text-2xl font-black' : 'text-2xl md:text-4xl font-black'}`}>
          {eyebrow}
        </h2>
      )}
      {subtitle && (
        <p className="text-zinc-500 text-base mt-1">{subtitle}</p>
      )}
    </div>
  )
}
