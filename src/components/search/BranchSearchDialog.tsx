import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useBranchSearch } from "@/hooks/useBranchSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchResultCard } from "./SearchResultCard";
import { useTenant } from "@/contexts/TenantContext";

interface BranchSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  branchId: string | null;
  branchName: string | null;
}

export function BranchSearchDialog({
  open,
  onOpenChange,
  searchValue,
  onSearchValueChange,
  branchId,
  branchName,
}: BranchSearchDialogProps) {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const debouncedSearchTerm = useDebounce(searchValue, 500);

  const {
    clientResults,
    staffResults,
    bookingResults,
    documentResults,
    isLoading,
    totalResults,
    clientCount,
    staffCount,
    bookingCount,
    documentCount,
  } = useBranchSearch(branchId, debouncedSearchTerm);

  // Close dialog on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  const handleResultClick = (type: string, id: string) => {
    onOpenChange(false);
    
    const basePath = tenantSlug
      ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}`
      : `/branch-dashboard/${branchId}/${branchName}`;

    switch (type) {
      case 'client':
        navigate(`${basePath}/clients?selected=${id}`);
        break;
      case 'staff':
        navigate(`${basePath}/carers?selected=${id}`);
        break;
      case 'booking':
        navigate(`${basePath}/bookings?selected=${id}`);
        break;
      case 'document':
        navigate(`${basePath}/documents?selected=${id}`);
        break;
    }
  };

  const showResults = debouncedSearchTerm.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Branch Data</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, carers, bookings, documents..."
            className="pl-10"
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            autoFocus
          />
        </div>

        {!showResults && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Type at least 2 characters to search
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Search across clients, carers, bookings, and documents
            </p>
          </div>
        )}

        {showResults && (
          <Tabs defaultValue="clients" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="clients" className="relative">
                Clients
                {clientCount > 0 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {clientCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="staff" className="relative">
                Carers
                {staffCount > 0 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {staffCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="bookings" className="relative">
                Bookings
                {bookingCount > 0 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {bookingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="relative">
                Documents
                {documentCount > 0 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {documentCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : totalResults === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  No results found for "{debouncedSearchTerm}"
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Try different keywords or check spelling
                </p>
              </div>
            ) : (
              <>
                <TabsContent value="clients" className="flex-1 overflow-y-auto space-y-2 mt-4">
                  {clientResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No clients found</p>
                  ) : (
                    clientResults.map((result) => (
                      <SearchResultCard
                        key={result.id}
                        result={result}
                        onClick={() => handleResultClick(result.type, result.id)}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="staff" className="flex-1 overflow-y-auto space-y-2 mt-4">
                  {staffResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No carers found</p>
                  ) : (
                    staffResults.map((result) => (
                      <SearchResultCard
                        key={result.id}
                        result={result}
                        onClick={() => handleResultClick(result.type, result.id)}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="bookings" className="flex-1 overflow-y-auto space-y-2 mt-4">
                  {bookingResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No bookings found</p>
                  ) : (
                    bookingResults.map((result) => (
                      <SearchResultCard
                        key={result.id}
                        result={result}
                        onClick={() => handleResultClick(result.type, result.id)}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="documents" className="flex-1 overflow-y-auto space-y-2 mt-4">
                  {documentResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No documents found</p>
                  ) : (
                    documentResults.map((result) => (
                      <SearchResultCard
                        key={result.id}
                        result={result}
                        onClick={() => handleResultClick(result.type, result.id)}
                      />
                    ))
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
