export interface CatalogItem {
  kind: string;
  label: string;
}

export interface CatalogGroup {
  group: string;
  items: CatalogItem[];
}

export const CATALOG: CatalogGroup[] = [
  {
    group: "Identity",
    items: [
      { kind: "full_name", label: "Full Name" },
      { kind: "date_of_birth", label: "Date of Birth" },
      { kind: "nationality", label: "Nationality" },
    ],
  },
  {
    group: "Contact",
    items: [
      { kind: "phone", label: "Phone" },
      { kind: "email", label: "Email" },
    ],
  },
  {
    group: "ID Documents",
    items: [
      { kind: "passport", label: "Passport" },
      { kind: "emirates_id", label: "Emirates ID" },
      { kind: "visa", label: "Visa" },
      { kind: "residence_visa", label: "Residence Visa" },
      { kind: "drivers_license", label: "Driver's License" },
      { kind: "national_id", label: "National ID" },
    ],
  },
  {
    group: "Financial",
    items: [
      { kind: "salary_certificate", label: "Salary Certificate" },
      { kind: "bank_statement", label: "Bank Statement" },
      { kind: "source_of_funds", label: "Source of Funds" },
      { kind: "mortgage_approval", label: "Mortgage Approval" },
    ],
  },
  {
    group: "Property",
    items: [
      { kind: "ejari", label: "Ejari" },
      { kind: "makani", label: "Makani" },
      { kind: "title_deed", label: "Title Deed" },
      { kind: "noc", label: "NOC" },
      { kind: "trade_license", label: "Trade License" },
    ],
  },
];
