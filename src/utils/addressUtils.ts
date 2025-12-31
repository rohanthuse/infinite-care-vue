
export interface ClientAddressData {
  address_line_1?: string;
  address_line_2?: string | null;
  city?: string;
  state_county?: string | null;
  postcode?: string;
  country?: string | null;
  is_default?: boolean | null;
}

export function formatClientAddress(address: ClientAddressData | null): string {
  if (!address) return '';
  
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state_county,
    address.postcode,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
}

export function getClientDisplayAddress(
  locationAddress: string | null | undefined,
  legacyAddress: string | null | undefined,
  structuredAddresses: ClientAddressData[] | null | undefined
): string {
  // Priority 1: Use booking's explicit location_address
  if (locationAddress) return locationAddress;
  
  // Priority 2: Use client's default structured address
  if (structuredAddresses && structuredAddresses.length > 0) {
    const defaultAddr = structuredAddresses.find(a => a.is_default) || structuredAddresses[0];
    const formatted = formatClientAddress(defaultAddr);
    if (formatted) return formatted;
  }
  
  // Priority 3: Use client's legacy address field
  if (legacyAddress) return legacyAddress;
  
  return '';
}
