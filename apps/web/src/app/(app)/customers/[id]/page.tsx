"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Pencil } from "lucide-react";
import { useCustomerDetail } from "@/hooks/queries/useCustomers";
import { CustomerStatusBadge } from "@/components/atoms/CustomerStatusBadge";
import { CustomerInfoPanel } from "@/components/organisms/CustomerInfoPanel";
import { CustomerDocumentsPanel } from "@/components/organisms/CustomerDocumentsPanel";
import { CustomerDealHistoryPanel } from "@/components/organisms/CustomerDealHistoryPanel";
import { CustomerInterestedListingsPanel } from "@/components/organisms/CustomerInterestedListingsPanel";
import { DocRequestWizardDialog } from "@/components/organisms/DocRequestWizardDialog";
import { CustomerEditDialog } from "@/components/organisms/CustomerEditDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const MODERATE_ROLES = new Set(["agent", "company_admin", "company_owner", "property_admin"]);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { currentUser } = useAuth();
  const { data: customer, isLoading, error } = useCustomerDetail(id);
  const [showDocRequest, setShowDocRequest] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const canModerate = !!currentUser && MODERATE_ROLES.has(currentUser.role);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading customer…</p>;
  }

  if (error || !customer) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Customer not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to customers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button asChild variant="ghost" size="sm" className="mt-1">
          <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{customer.full_name}</h1>
            <CustomerStatusBadge status={customer.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {customer.phone ?? customer.email ?? "No contact info"}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 mt-1">
          <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowDocRequest(true)}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />Send doc request
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({customer.documents.length})
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deal History ({customer.deal_history.length})
          </TabsTrigger>
          <TabsTrigger value="listings">
            Interested Listings ({customer.interested_listings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="pt-4">
          <CustomerInfoPanel customer={customer} />
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <CustomerDocumentsPanel
            customerId={customer.id}
            documents={customer.documents}
            canModerate={canModerate}
          />
        </TabsContent>

        <TabsContent value="deals" className="pt-4">
          <CustomerDealHistoryPanel deals={customer.deal_history} />
        </TabsContent>

        <TabsContent value="listings" className="pt-4">
          <CustomerInterestedListingsPanel listings={customer.interested_listings} />
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <CustomerEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        customer={customer}
      />

      {/* Doc request wizard */}
      <DocRequestWizardDialog
        open={showDocRequest}
        onOpenChange={setShowDocRequest}
        prefillCustomer={{ id: customer.id, full_name: customer.full_name, email: customer.email, phone: customer.phone, phone_normalized: customer.phone_normalized }}
      />
    </div>
  );
}
