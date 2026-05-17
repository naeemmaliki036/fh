export type WizardIntent = "sell" | "rent";
export type WizardRentFrequency = "yearly" | "monthly";
export type WizardCategory = "residential" | "commercial";
export type WizardPropertyType =
  | "apartment" | "villa" | "townhouse" | "penthouse"
  | "land" | "plot" | "other"
  | "office" | "retail" | "warehouse";
export type WizardBedrooms = "studio" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8+";
export type WizardFurnishing = "furnished" | "unfurnished" | "partly_furnished";
export type WizardUrgency = "this_month" | "within_2_months" | "flexible";

export type WizardStepId =
  | "intent"
  | "rent-frequency"
  | "location"
  | "category-type"
  | "bedrooms"
  | "area-furnishing"
  | "urgency"
  | "contact";

export interface WizardState {
  intent: WizardIntent | null;
  rentFrequency: WizardRentFrequency | null;
  country: string;
  city: string;
  area: string;
  category: WizardCategory;
  propertyType: WizardPropertyType | null;
  bedrooms: WizardBedrooms | null;
  sqft: string;
  furnishing: WizardFurnishing | null;
  urgency: WizardUrgency | null;
  name: string;
  email: string;
  phone: string;
}

export const STEP_LABELS: Record<WizardStepId, string> = {
  "intent": "Intent",
  "rent-frequency": "Rent period",
  "location": "Location",
  "category-type": "Property type",
  "bedrooms": "Bedrooms",
  "area-furnishing": "Size & furnishing",
  "urgency": "Urgency",
  "contact": "Contact",
};
