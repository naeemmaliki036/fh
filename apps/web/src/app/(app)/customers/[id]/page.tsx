"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCustomer } from "@/hooks/queries/useCustomers";
import { useUpdateCustomer } from "@/hooks/mutations/useCustomerMutations";
import { useAgents } from "@/hooks/queries/useAgents";
import { CustomerForm } from "@/components/molecules/CustomerForm";
import { CustomerKycPanel } from "@/components/organisms/CustomerKycPanel";
import { CustomerStatusBadge } from "@/components/atoms/CustomerStatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { CustomerUpdateRequest, CustomerCreateRequest } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data: customer, isLoading, error } = useCustomer(id);
  const { data: agentsData } = useAgents();
  const { mutate: update, isPending } = useUpdateCustomer(id);

  const agents = agentsData?.items ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading customer...</p>;
  }

  if (error || !customer) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Customer not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to customers</Link>
        </Button>
      </div>
    );
  }

  const handleUpdate = (data: CustomerCreateRequest | CustomerUpdateRequest): void => {
    update(data as CustomerUpdateRequest);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.full_name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-muted-foreground">{customer.phone ?? customer.email ?? "No contact"}</span>
            <CustomerStatusBadge status={customer.status} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-4">
          <CustomerForm
            defaultValues={customer}
            agents={agents}
            isPending={isPending}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
          />
        </TabsContent>
        <TabsContent value="kyc" className="pt-4">
          <CustomerKycPanel customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
