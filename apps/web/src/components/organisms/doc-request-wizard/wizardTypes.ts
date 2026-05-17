export interface WizardCustomer {
  id: string;
  full_name: string;
  phone: string | null;
}

export interface WizardItem {
  kind: string;
  label: string;
  is_required: boolean;
  ordering: number;
}

export interface WizardState {
  customer: WizardCustomer | null;
  propertyId: string | null;
  propertyTitle: string | null;
  items: WizardItem[];
  agentNote: string;
  expiresInDays: number;
  sendEmail: boolean;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5;
