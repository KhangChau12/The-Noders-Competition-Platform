'use client';

import React, { useState } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  highlightRow?: (row: T) => boolean;
  className?: string;
  emptyMessage?: string;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  highlightRow,
  className = '',
  emptyMessage = 'No data available',
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string, sortable?: boolean) => {
    if (!sortable) return;

    if (sortKey === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-surface border-b border-border-default">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-4 font-semibold text-sm text-text-secondary ${
                  alignClasses[column.align || 'left']
                } ${column.sortable ? 'cursor-pointer hover:text-text-primary transition-colors select-none' : ''}`}
                onClick={() => handleSort(column.key, column.sortable)}
              >
                <div className="flex items-center gap-2 justify-start">
                  {column.header}
                  {column.sortable && (
                    <span className="text-xs text-text-tertiary">
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? '▲' : '▼'
                      ) : (
                        '⇅'
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-text-tertiary"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => {
              const isHighlighted = highlightRow?.(row);
              return (
                <tr
                  key={keyExtractor(row, rowIndex)}
                  className={`border-b border-border-subtle transition-colors duration-200 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isHighlighted
                      ? 'bg-primary-blue/10 border-l-4 border-l-primary-blue'
                      : 'hover:bg-bg-surface'
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-4 text-sm text-text-primary ${
                        alignClasses[column.align || 'left']
                      }`}
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
