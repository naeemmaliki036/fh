import { Badge } from "@/components/ui/badge";

const KIND_LABELS: Record<string, string> = {
  rera_id: "RERA ID",
  passport: "Passport",
  emirates_id: "Emirates ID",
  trade_license: "Trade License",
  noc: "NOC",
  contract: "Contract",
  kyc: "KYC",
  other: "Other",
  full_name: "Full Name",
  date_of_birth: "Date of Birth",
  nationality: "Nationality",
  phone: "Phone",
  email: "Email",
  visa: "Visa",
  residence_visa: "Residence Visa",
  drivers_license: "Driver's License",
  national_id: "National ID",
  salary_certificate: "Salary Certificate",
  bank_statement: "Bank Statement",
  source_of_funds: "Source of Funds",
  mortgage_approval: "Mortgage Approval",
  ejari: "Ejari",
  makani: "Makani",
  title_deed: "Title Deed",
};

interface KindBadgeProps {
  kind: string;
}

export function KindBadge({ kind }: KindBadgeProps): React.ReactElement {
  return <Badge variant="secondary">{KIND_LABELS[kind] ?? kind.replace(/_/g, " ")}</Badge>;
}
