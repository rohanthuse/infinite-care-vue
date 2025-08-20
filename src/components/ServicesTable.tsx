
import React, { useState, useMemo, useEffect } from "react";
import { Check, ArrowUpDown, MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditServiceDialog } from "./EditServiceDialog";

interface Service {
  id: string;
  title: string;
  double_handed: boolean;
  category: string;
  description: string | null;
}

interface ServicesTableProps {
  searchQuery?: string;
  filterCategory?: string | null;
  filterDoubleHanded?: boolean | null;
}

export function ServicesTable({ 
  searchQuery = "", 
  filterCategory = null, 
  filterDoubleHanded = null 
}: ServicesTableProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortColumn, setSortColumn] = useState<'title' | 'double_handed' | 'category'>('title');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('title', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Service deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (serviceId: string) => {
    deleteMutation.mutate(serviceId);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };
  
  const filteredAndSortedServices = useMemo(() => {
    if (!services) return [];
    
    let filtered = services.filter(service => {
      const matchesSearch = !searchQuery 
        ? true 
        : service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = filterCategory 
        ? service.category === filterCategory 
        : true;
      
      const matchesDoubleHanded = filterDoubleHanded !== null 
        ? service.double_handed === filterDoubleHanded 
        : true;
      
      return matchesSearch && matchesCategory && matchesDoubleHanded;
    });
    
    return filtered.sort((a, b) => {
      if (sortColumn === 'title') {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      } else if (sortColumn === 'category') {
        const catA = a.category || '';
        const catB = b.category || '';
        return sortOrder === 'asc'
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      } else {
        return sortOrder === 'asc' 
          ? Number(a.double_handed) - Number(b.double_handed)
          : Number(b.double_handed) - Number(a.double_handed);
      }
    });
  }, [services, searchQuery, filterCategory, filterDoubleHanded, sortColumn, sortOrder]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterDoubleHanded, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = filteredAndSortedServices.slice(startIndex, startIndex + itemsPerPage);
  
  const handleSort = (column: 'title' | 'double_handed' | 'category') => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };
  
  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[10%]">ID</TableHead>
              <TableHead className="w-[40%] font-semibold">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 font-semibold p-0 hover:bg-transparent"
                  onClick={() => handleSort('title')}
                >
                  Service Title
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
              </TableHead>
              <TableHead className="w-[30%] font-semibold">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 font-semibold p-0 hover:bg-transparent"
                  onClick={() => handleSort('category')}
                >
                  Category
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
              </TableHead>
              <TableHead className="w-[10%] font-semibold">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 font-semibold p-0 hover:bg-transparent"
                  onClick={() => handleSort('double_handed')}
                >
                  Double Handed
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
              </TableHead>
              <TableHead className="w-[10%] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading services...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-destructive">
                  Error loading services: {error.message}
                </TableCell>
              </TableRow>
            ) : paginatedServices.length > 0 ? (
              paginatedServices.map((service, index) => (
                <TableRow key={service.id} className="hover:bg-accent/50 group">
                  <TableCell className="text-muted-foreground text-sm">#{startIndex + index + 1}</TableCell>
                  <TableCell className="font-medium">{service.title}</TableCell>
                  <TableCell>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {service.category || 'General'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {service.double_handed ? (
                      <div className="flex items-center">
                        <span className="bg-green-500/10 text-green-500 rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={() => handleEdit(service)}>
                          <Edit className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive flex items-center gap-2" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No services found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {filteredAndSortedServices.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedServices.length)} of {filteredAndSortedServices.length} entries
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center px-2">
                <span className="text-sm font-medium text-foreground">
                  {currentPage} <span className="text-muted-foreground">of</span> {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(totalPages)}
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-3" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue placeholder={itemsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {isEditDialogOpen && (
        <EditServiceDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          service={selectedService}
        />
      )}
    </div>
  );
}
