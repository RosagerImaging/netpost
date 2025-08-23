import React from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import LoadingSpinner from './LoadingSpinner'

export interface TableColumn<T = any> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  error?: string
  emptyState?: React.ReactNode
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  className?: string
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  error,
  emptyState,
  onSort,
  sortColumn,
  sortDirection,
  className
}: DataTableProps<T>) {
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return

    const newDirection = 
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    
    onSort(column.key, newDirection)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
      </div>
    )
  }

  if (data.length === 0 && emptyState) {
    return <div className="text-center py-12">{emptyState}</div>
  }

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer select-none hover:bg-gray-100',
                  column.className
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className="flex flex-col">
                      <ChevronUpIcon 
                        className={clsx(
                          'h-3 w-3',
                          sortColumn === column.key && sortDirection === 'asc'
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        )} 
                      />
                      <ChevronDownIcon 
                        className={clsx(
                          'h-3 w-3 -mt-1',
                          sortColumn === column.key && sortDirection === 'desc'
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        )} 
                      />
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={`${item.id || index}-${column.key}`}
                  className={clsx(
                    'px-6 py-4 whitespace-nowrap text-sm',
                    column.className
                  )}
                >
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}