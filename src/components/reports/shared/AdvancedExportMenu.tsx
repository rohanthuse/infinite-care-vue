import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table, Sheet, Settings } from 'lucide-react';
import { toast } from 'sonner';

export interface ExportColumn {
  key: string;
  label: string;
  included: boolean;
}

export interface AdvancedExportMenuProps {
  columns: ExportColumn[];
  onExport: (format: 'pdf' | 'csv' | 'excel', options: ExportOptions) => void;
  filterApplied?: boolean;
  selectedRowCount?: number;
  totalRowCount: number;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeFilters: boolean;
  includeMetadata: boolean;
  selectedColumns: string[];
  exportScope: 'all' | 'filtered' | 'selected';
}

export function AdvancedExportMenu({
  columns,
  onExport,
  filterApplied = false,
  selectedRowCount = 0,
  totalRowCount,
}: AdvancedExportMenuProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter(col => col.included).map(col => col.key)
  );
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleExport = (format: 'pdf' | 'csv' | 'excel', scope: 'all' | 'filtered' | 'selected') => {
    if (scope === 'selected' && selectedRowCount === 0) {
      toast.error('No rows selected', {
        description: 'Please select at least one row to export',
      });
      return;
    }

    const options: ExportOptions = {
      format,
      includeFilters: scope === 'filtered',
      includeMetadata,
      selectedColumns,
      exportScope: scope,
    };

    onExport(format, options);

    toast.success(`Export initiated`, {
      description: `Exporting ${scope === 'all' ? totalRowCount : scope === 'filtered' ? 'filtered' : selectedRowCount} records as ${format.toUpperCase()}`,
    });
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* PDF Exports */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleExport('pdf', 'all')}>
              All Records ({totalRowCount})
            </DropdownMenuItem>
            {filterApplied && (
              <DropdownMenuItem onClick={() => handleExport('pdf', 'filtered')}>
                Filtered Results
              </DropdownMenuItem>
            )}
            {selectedRowCount > 0 && (
              <DropdownMenuItem onClick={() => handleExport('pdf', 'selected')}>
                Selected Rows ({selectedRowCount})
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* CSV Exports */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Table className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleExport('csv', 'all')}>
              All Records ({totalRowCount})
            </DropdownMenuItem>
            {filterApplied && (
              <DropdownMenuItem onClick={() => handleExport('csv', 'filtered')}>
                Filtered Results
              </DropdownMenuItem>
            )}
            {selectedRowCount > 0 && (
              <DropdownMenuItem onClick={() => handleExport('csv', 'selected')}>
                Selected Rows ({selectedRowCount})
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Excel Exports */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sheet className="h-4 w-4 mr-2" />
            Export as Excel
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleExport('excel', 'all')}>
              All Records ({totalRowCount})
            </DropdownMenuItem>
            {filterApplied && (
              <DropdownMenuItem onClick={() => handleExport('excel', 'filtered')}>
                Filtered Results
              </DropdownMenuItem>
            )}
            {selectedRowCount > 0 && (
              <DropdownMenuItem onClick={() => handleExport('excel', 'selected')}>
                Selected Rows ({selectedRowCount})
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Export Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Settings className="h-4 w-4 mr-2" />
            Configure Export
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuLabel className="text-xs">Include in Export</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={includeMetadata}
              onCheckedChange={setIncludeMetadata}
            >
              Metadata & Filters
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Columns</DropdownMenuLabel>
            <div className="max-h-[200px] overflow-y-auto">
              {columns.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={selectedColumns.includes(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
