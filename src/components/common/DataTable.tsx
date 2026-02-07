import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  renderMobileItem?: (row: Row<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  onRowClick,
  renderMobileItem,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-8 max-w-sm"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-hidden hidden md:block">
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-muted/50 font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={`
                      ${onRowClick ? 'cursor-pointer' : ''} 
                      ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                      hover:bg-accent/50 transition-colors
                    `}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            renderMobileItem ? (
              <div key={row.id} onClick={() => onRowClick?.(row.original)}>
                {renderMobileItem(row)}
              </div>
            ) : (
              <div
                key={row.id}
                className={`
                  bg-white rounded-lg border p-4 shadow-sm flex flex-col gap-3
                  ${onRowClick ? 'active:bg-muted cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(row.original)}
              >
                {/* Header: Usually the first column */}
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-lg">
                    {flexRender(row.getVisibleCells()[0].column.columnDef.cell, row.getVisibleCells()[0].getContext())}
                  </div>
                  {/* Actions: Usually the last column, if it is 'actions' */}
                  {row.getVisibleCells().find(c => c.column.id === 'actions') && (
                    <div className="-mr-2 -mt-2">
                      {flexRender(
                        row.getVisibleCells().find(c => c.column.id === 'actions')?.column.columnDef.cell,
                        row.getVisibleCells().find(c => c.column.id === 'actions')?.getContext()!
                      )}
                    </div>
                  )}
                </div>

                {/* Body: Rest of the columns */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-1">
                  {row.getVisibleCells().slice(1).map((cell) => {
                    if (cell.column.id === 'actions') return null; // Skip actions here
                    return (
                      <div key={cell.id} className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          {typeof cell.column.columnDef.header === 'string'
                            ? cell.column.columnDef.header
                            : ''}
                        </span>
                        <div className="text-foreground">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            No results found.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} row(s) total
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
