"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useAgents } from "@/hooks/queries/useAgents";
import { useDeleteCustomer } from "@/hooks/mutations/useCustomerMutations";
import { CustomerStatusBadge } from "@/components/atoms/CustomerStatusBadge";
import { SourceBadge } from "@/components/atoms/SourceBadge";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { CustomerCreateDialog } from "@/components/organisms/CustomerCreateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerStatus } from "@/lib/types";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: CustomerStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blacklisted", label: "Blacklisted" },
];

export function CustomersTable(): React.ReactElement {
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const params = {
    status: status === "all" ? undefined : status,
    assigned_agent_id: agentFilter || undefined,
    q: search || undefined,
    skip,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, error } = useCustomers(params);
  const { data: agentsData } = useAgents();
  const { mutate: disable } = useDeleteCustomer();

  const agents = agentsData?.items ?? [];
  const customers = data?.items ?? [];
  const total = data?.total ?? 0;
  const agentMap = new Map(agents.map((a) => [a.id, a.full_name]));

  if (error) return <p className="text-sm text-destructive">Failed to load customers.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
          className="w-64"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v as CustomerStatus | "all"); setSkip(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter || "all"} onValueChange={(v) => { setAgentFilter(v === "all" ? "" : v); setSkip(0); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All agents" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{total} customers</span>
        <Button onClick={() => setShowCreate(true)}>+ New Customer</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading customers...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-3 text-left font-medium">Name</th>
                  <th className="px-3 py-3 text-left font-medium">Phone</th>
                  <th className="px-3 py-3 text-left font-medium">Email</th>
                  <th className="px-3 py-3 text-left font-medium">Source</th>
                  <th className="px-3 py-3 text-left font-medium">Agent</th>
                  <th className="px-3 py-3 text-left font-medium">Status</th>
                  <th className="px-3 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="px-3 py-2.5 font-medium">{c.full_name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.phone ?? "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.email ?? "—"}</td>
                    <td className="px-3 py-2.5"><SourceBadge source={c.source} /></td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {c.assigned_agent_id ? agentMap.get(c.assigned_agent_id) ?? "—" : "—"}
                    </td>
                    <td className="px-3 py-2.5"><CustomerStatusBadge status={c.status} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/customers/${c.id}`}>Edit</Link>
                        </Button>
                        {c.status !== "inactive" && (
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="destructive">Disable</Button>}
                            title="Disable customer?"
                            description="This customer will be hidden from new deals and listings. You can re-enable later."
                            confirmLabel="Disable"
                            variant="destructive"
                            onConfirm={() => disable(c.id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No customers found</p>
            )}
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))} disabled={skip === 0}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
              </span>
              <Button variant="outline" size="sm" onClick={() => setSkip(skip + PAGE_SIZE)} disabled={skip + PAGE_SIZE >= total}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <CustomerCreateDialog open={showCreate} onClose={() => setShowCreate(false)} agents={agents} />
    </div>
  );
}
