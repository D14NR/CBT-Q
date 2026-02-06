import { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  keyExtractor: (item: T) => string;
}

export function Table<T>({ data, columns, onEdit, onDelete, keyExtractor }: TableProps<T>) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-sm text-gray-500">
                Tidak ada data.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-gray-50">
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof col.accessor === 'function'
                      ? col.accessor(item)
                      : (item[col.accessor] as ReactNode)}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
