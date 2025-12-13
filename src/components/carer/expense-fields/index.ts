export { TravelExpenseFields } from './TravelExpenseFields';
export { MealExpenseFields } from './MealExpenseFields';
export { MedicalExpenseFields } from './MedicalExpenseFields';
export { OtherExpenseFields } from './OtherExpenseFields';

// Expense category detection from expense type name
export function detectExpenseCategory(expenseTypeName: string): 'travel' | 'meal' | 'medical' | 'other' {
  const name = expenseTypeName.toLowerCase();
  
  if (name.includes('travel') || name.includes('mileage') || name.includes('transport') || name.includes('fuel')) {
    return 'travel';
  }
  
  if (name.includes('meal') || name.includes('food') || name.includes('lunch') || name.includes('dinner') || name.includes('breakfast')) {
    return 'meal';
  }
  
  if (name.includes('medical') || name.includes('medicine') || name.includes('pharmacy') || name.includes('health')) {
    return 'medical';
  }
  
  return 'other';
}

// Build metadata object for submission
export function buildExpenseMetadata(
  category: 'travel' | 'meal' | 'medical' | 'other',
  formData: Record<string, string>
): Record<string, unknown> {
  switch (category) {
    case 'travel':
      return {
        travel_mode: formData.travel_mode,
        from_location: formData.from_location,
        to_location: formData.to_location,
        distance: formData.distance ? parseFloat(formData.distance) : null,
        distance_unit: formData.distance_unit,
        rate_per_unit: formData.rate_per_unit ? parseFloat(formData.rate_per_unit) : null,
      };
    case 'meal':
      return {
        meal_type: formData.meal_type,
        vendor_name: formData.vendor_name,
        meal_date: formData.meal_date,
      };
    case 'medical':
      return {
        medical_item: formData.medical_item,
        provider_name: formData.provider_name,
        prescription_ref: formData.prescription_ref,
      };
    case 'other':
      return {
        expense_title: formData.expense_title,
        other_description: formData.other_description,
      };
    default:
      return {};
  }
}
