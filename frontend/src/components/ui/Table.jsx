export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      {children}
    </thead>
  )
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-gray-200">{children}</tbody>
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-4 text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  )
}
