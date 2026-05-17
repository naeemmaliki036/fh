import type { ConsumerListingPurpose } from "@fh/portal-types";

export type WizardStepId =
  | "purpose-type"
  | "location"
  | "details"
  | "photos"
  | "pricing"
  | "review";

export const STEP_LABELS: Record<WizardStepId, string> = {
  "purpose-type": "Purpose & type",
  location: "Location",
  details: "Details",
  photos: "Photos",
  pricing: "Price & description",
  review: "Review",
};

export const WIZARD_STEPS: WizardStepId[] = [
  "purpose-type",
  "location",
  "details",
  "photos",
  "pricing",
  "review",
];

// The full form state managed by the wizard
export interface WizardFormState {
  purpose: ConsumerListingPurpose;
  property_type: string;
  country: string;
  city: string;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  furnishing_status: string | null;
  completion_status: string | null;
  parking_spaces: number | null;
  floor_number: number | null;
  view_orientation: string | null;
  ownership_type: string | null;
  title: string | null;
  description: string | null;
  price: number | undefined;
  currency: string;
}

export const INITIAL_WIZARD_STATE: WizardFormState = {
  purpose: "sale",
  property_type: "",
  country: "",
  city: "",
  area: null,
  bedrooms: null,
  bathrooms: null,
  size_sqft: null,
  furnishing_status: null,
  completion_status: null,
  parking_spaces: null,
  floor_number: null,
  view_orientation: null,
  ownership_type: null,
  title: null,
  description: null,
  price: undefined,
  currency: "AED",
};
