
import { 
  useReportTypes, 
  useFileCategories, 
  useCommunicationTypes, 
  useExpenseTypes,
  useTravelRates,
  useBankHolidays
} from './useKeyParameters';

// Helper hook to get options for dropdowns/selects
export function useReportTypeOptions() {
  const { data, isLoading } = useReportTypes();
  
  const options = data
    ?.filter(item => item.status === 'Active')
    ?.map(item => ({ value: item.id, label: item.title })) || [];
  
  return { options, isLoading };
}

export function useFileCategoryOptions() {
  const { data, isLoading } = useFileCategories();
  
  const options = data
    ?.filter(item => item.status === 'Active')
    ?.map(item => ({ value: item.id, label: item.title })) || [];
  
  return { options, isLoading };
}

export function useCommunicationTypeOptions() {
  const { data, isLoading } = useCommunicationTypes();
  
  const options = data
    ?.filter(item => item.status === 'Active')
    ?.map(item => ({ value: item.id, label: item.title })) || [];
  
  return { options, isLoading };
}

export function useExpenseTypeOptions() {
  const { data, isLoading } = useExpenseTypes();
  
  const options = data
    ?.filter(item => item.status === 'Active')
    ?.map(item => ({ value: item.id, label: item.title })) || [];
  
  return { options, isLoading };
}

export function useTravelRateOptions() {
  const { data, isLoading } = useTravelRates();
  
  const options = data
    ?.filter(item => item.status === 'Active')
    ?.map(item => ({ value: item.id, label: item.title })) || [];
  
  return { options, isLoading };
}

export function useBankHolidayOptions() {
  const { data, isLoading } = useBankHolidays();
  
  const options = data
    ?.filter(item => item.status === 'Active')
    ?.map(item => ({ value: item.id, label: item.title })) || [];
  
  return { options, isLoading };
}

// Helper to get parameter by ID
export function useParameterById(parameterType: string, id: string) {
  const reportTypes = useReportTypes();
  const fileCategories = useFileCategories();
  const communicationTypes = useCommunicationTypes();
  const expenseTypes = useExpenseTypes();
  const travelRates = useTravelRates();
  const bankHolidays = useBankHolidays();

  switch (parameterType) {
    case 'report-types':
      return reportTypes.data?.find(item => item.id === id);
    case 'file-categories':
      return fileCategories.data?.find(item => item.id === id);
    case 'communication-types':
      return communicationTypes.data?.find(item => item.id === id);
    case 'expense-types':
      return expenseTypes.data?.find(item => item.id === id);
    case 'travel-rates':
      return travelRates.data?.find(item => item.id === id);
    case 'bank-holidays':
      return bankHolidays.data?.find(item => item.id === id);
    default:
      return null;
  }
}
