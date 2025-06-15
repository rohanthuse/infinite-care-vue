import React, { useState, useEffect } from "react";
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow, TableCell, 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, ChevronRight, 
  ArrowUpDown, Plus, Filter,
  Search, Download, List, Check, Edit, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ColumnDef {
  header: string;
  accessorKey: string;
  enableSorting?: boolean;
  className?: string;
  id?: string;
  cell?: ((value: any) => React.ReactNode) | ((value: any, row: any) => React.ReactNode);
}

export interface ParameterItem {
  id: string | number;
  [key: string]: any;
}

interface ParameterTableProps {
  title: string;
  icon: React.ReactNode;
  columns: ColumnDef[];
  data: ParameterItem[];
  showActions?: boolean;
  showFilter?: boolean;
  filterOptions?: { 
    name: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
  }[];
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  hasColorColumn?: boolean;
  addButton?: React.ReactNode;
  onEdit?: (item: ParameterItem) => void;
  onDelete?: (item: ParameterItem) => void;
}

export function ParameterTable({
  title,
  icon,
  columns,
  data,
  showActions = true,
  showFilter = false,
  filterOptions = [],
  onSearch,
  searchPlaceholder = "Search...",
  hasColorColumn = false,
  addButton,
  onEdit,
  onDelete,
}: ParameterTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState("");
  const [internalFilteredData, setInternalFilteredData] = useState(data);

  useEffect(() => {
    let sortedData = [...data];
    if (sortColumn) {
      sortedData.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setInternalFilteredData(sortedData);
  }, [sortColumn, sortDirection, data]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    let filteredData = data;
    if (searchQuery) {
      filteredData = data.filter(item => {
        return Object.values(item).some(value => 
          value != null && 
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }
    setInternalFilteredData(filteredData);
    setCurrentPage(1);
  }, [searchQuery, data]);

  const totalPages = Math.ceil(internalFilteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = internalFilteredData.slice(startIndex, startIndex + itemsPerPage);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };
  
  const headerContent = (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      {title && (
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">{title}</h1>
            <p className="text-gray-500 text-sm md:text-base">Manage {title.toLowerCase()}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:justify-end">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              className="pl-9 bg-white border-gray-200 focus:border-blue-300 w-full" 
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        
        {addButton}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl p-6 md:p-8 mb-4 border-b">
         {headerContent}
      </div>
      
      {showFilter && filterOptions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm mb-4 p-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((filter) => (
                <select 
                  key={filter.name}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/90">
                {columns.map((column, index) => (
                  <TableHead 
                    key={index} 
                    className={cn(
                      "text-gray-700",
                      column.className
                    )}
                  >
                    {column.enableSorting ? (
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 font-semibold p-0 hover:bg-transparent"
                        onClick={() => handleSort(column.accessorKey)}
                      >
                        {column.header}
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
                {showActions && (
                  <TableHead className="text-right"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, rowIndex) => (
                  <TableRow key={item.id || rowIndex} className="hover:bg-gray-50/70 group">
                    {columns.map((column, colIndex) => (
                      <TableCell key={`${rowIndex}-${colIndex}`} className={column.className}>
                        {column.cell ? (
                          // Update to handle both function signatures
                          column.cell instanceof Function && column.cell.length > 1 
                            ? (column.cell as any)(item[column.accessorKey], item)
                            : (column.cell as any)(item[column.accessorKey])
                        ) : (
                          column.accessorKey === "color" ? (
                            <div 
                              className="h-6 w-12 rounded"
                              style={{ backgroundColor: item[column.accessorKey] }}
                            ></div>
                          ) : (
                            item[column.accessorKey]
                          )
                        )}
                      </TableCell>
                    ))}
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full p-2 h-8 w-8"
                            onClick={() => onEdit && onEdit(item)}
                            disabled={!onEdit}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full p-2 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onDelete && onDelete(item)}
                            disabled={!onDelete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + (showActions ? 1 : 0)} className="text-center py-8 text-gray-500">
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t border-gray-100/60 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gray-50/50 rounded-b-xl">
          <div className="text-gray-600 text-sm">
            Showing {Math.min(internalFilteredData.length, 1 + (currentPage - 1) * itemsPerPage)} to {Math.min(currentPage * itemsPerPage, internalFilteredData.length)} of {internalFilteredData.length} entries
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(1)}
              className="flex items-center gap-1 px-2.5 border-gray-200 text-gray-700 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="flex items-center gap-1 px-2.5 border-gray-200 text-gray-700 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 p-0 rounded-full",
                      pageNum === currentPage
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "border-gray-200 text-gray-700"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && <span className="px-1">...</span>}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="flex items-center gap-1 px-2.5 border-gray-200 text-gray-700 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(totalPages)}
              className="flex items-center gap-1 px-2.5 border-gray-200 text-gray-700 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-3" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 px-2.5 border-gray-200 text-gray-700 rounded-full"
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
