import { cn } from '@/lib/utils'

/**
 * Le conteneur porte le défilement horizontal : un tableau large doit glisser
 * dans sa carte, jamais pousser la page entière de côté.
 *
 * Les cellules ont un padding serré (`px-2`), et ce sont la première et la
 * dernière colonne qui reprennent la marge de la carte : le tableau touche
 * ainsi les bords intérieurs sans décrochement.
 */
function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          'w-full caption-bottom text-sm',
          '[&_th:first-child]:ps-(--card-spacing) [&_td:first-child]:ps-(--card-spacing)',
          '[&_th:last-child]:pe-(--card-spacing) [&_td:last-child]:pe-(--card-spacing)',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-border', className)} {...props} />
}

function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        'border-t border-border bg-muted/40 font-medium [&_tr]:border-0',
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-2 text-left align-middle text-[0.8rem] font-medium whitespace-nowrap text-muted-foreground',
        // Les colonnes de chiffres s'alignent à droite d'un seul attribut.
        '[&[data-align=right]]:text-right [&[data-align=center]]:text-center',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'px-2 py-3 align-middle whitespace-nowrap',
        '[&[data-align=right]]:text-right [&[data-align=center]]:text-center',
        // Les chiffres d'une colonne doivent s'aligner verticalement.
        '[&[data-num]]:tabular-nums [&[data-num]]:text-right',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption }
