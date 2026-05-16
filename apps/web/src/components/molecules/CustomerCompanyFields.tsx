import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerFormValues } from "@/components/molecules/CustomerForm";

interface CustomerCompanyFieldsProps {
  register: UseFormRegister<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
}

export function CustomerCompanyFields({
  register,
  errors,
}: CustomerCompanyFieldsProps): React.ReactElement {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="form-trade-license">Trade license #</Label>
        <Input
          id="form-trade-license"
          {...register("company_trade_license")}
          maxLength={64}
          placeholder="Optional"
        />
        {errors.company_trade_license && (
          <p className="text-xs text-destructive">{errors.company_trade_license.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="form-contact-name">Contact person name *</Label>
        <Input id="form-contact-name" {...register("contact_person_name")} />
        {errors.contact_person_name && (
          <p className="text-xs text-destructive">{errors.contact_person_name.message}</p>
        )}
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="form-designation">Designation</Label>
        <Input
          id="form-designation"
          {...register("contact_person_designation")}
          maxLength={128}
          placeholder="Optional"
        />
        {errors.contact_person_designation && (
          <p className="text-xs text-destructive">{errors.contact_person_designation.message}</p>
        )}
      </div>
      <p className="col-span-2 text-xs text-muted-foreground -mt-1">
        Phone and email below are for the contact person.
      </p>
    </>
  );
}
