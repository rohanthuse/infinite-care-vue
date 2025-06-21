
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pill, Clock, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const MedicationTableColumns = [
  {
    accessorKey: "name",
    header: "Medication",
    accessorFn: (row: any) => (
      <div className="flex items-center space-x-2">
        <Pill className="h-4 w-4 text-blue-500" />
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.dosage}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "client",
    header: "Patient",
    accessorFn: (row: any) => (
      <div className="flex items-center space-x-2">
        <User className="h-4 w-4 text-gray-500" />
        <div>
          <div className="font-medium">
            {row.client_care_plans?.clients?.first_name} {row.client_care_plans?.clients?.last_name}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    accessorFn: (row: any) => (
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span>{row.frequency}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    accessorFn: (row: any) => (
      <Badge 
        variant={row.status === 'active' ? 'default' : 'secondary'}
        className={row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
      >
        {row.status === 'active' ? 'Active' : row.status}
      </Badge>
    ),
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
    accessorFn: (row: any) => row.start_date ? format(new Date(row.start_date), "MMM dd, yyyy") : "N/A",
  },
  {
    accessorKey: "end_date",
    header: "End Date",
    accessorFn: (row: any) => row.end_date ? format(new Date(row.end_date), "MMM dd, yyyy") : "Ongoing",
  },
  {
    id: "actions",
    header: "Actions",
    accessorFn: (row: any) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.id)}>
            Copy medication ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Edit medication</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            Discontinue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
