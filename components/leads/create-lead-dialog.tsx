"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DuplicateCheckDialog } from "./duplicate-check-dialog";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOfficeId?: string;
  defaultOwnerId?: string;
  ownerOptions?: { id: string; name: string }[];
}

export function CreateLeadDialog({
  open,
  onOpenChange,
  defaultOwnerId,
  ownerOptions = [],
}: CreateLeadDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] =
    useState<
      {
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        owner: string | null;
      }[]
    >(null);
  const [pendingPayload, setPendingPayload] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    secondary_email: "",
    secondary_phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    owner_id: defaultOwnerId ?? "",
    contact_source: "Manual",
  });

  const reset = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      secondary_email: "",
      secondary_phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      owner_id: defaultOwnerId ?? "",
      contact_source: "Manual",
    });
    setDuplicates(null);
    setPendingPayload(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    if (!firstName || !lastName) {
      toast.error("First name and last name are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        secondary_email: form.secondary_email.trim() || null,
        secondary_phone: form.secondary_phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        owner_id: form.owner_id || null,
        contact_source: form.contact_source || "Manual",
      };
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        if (json.duplicateId && json.error?.includes("already exists")) {
          const dupRes = await fetch(
            `/api/contacts?action=check-duplicates&phone=${encodeURIComponent(form.phone)}&email=${encodeURIComponent(form.email)}`,
          );
          const dupList = await dupRes.json();
          if (Array.isArray(dupList) && dupList.length > 0) {
            setDuplicates(dupList);
            setPendingPayload(payload);
            return;
          }
        }
        toast.error(json.error ?? "Create failed");
        return;
      }
      toast.success("Lead created");
      onOpenChange(false);
      reset();
      if (json?.id) router.push(`/leads/${json.id}`);
    } catch {
      setLoading(false);
      toast.error("Create failed");
    }
  };

  const handleDuplicateResolved = () => {
    setDuplicates(null);
    setPendingPayload(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first_name">First name *</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last name *</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zip">Zip</Label>
                <Input
                  id="zip"
                  value={form.zip}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zip: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            {ownerOptions.length > 0 && (
              <div>
                <Label htmlFor="owner_id">Lead Owner</Label>
                <select
                  id="owner_id"
                  value={form.owner_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, owner_id: e.target.value }))
                  }
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">—</option>
                  {ownerOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create lead"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {duplicates && (
        <DuplicateCheckDialog
          open={!!duplicates.length}
          duplicates={duplicates}
          onClose={handleDuplicateResolved}
          onUseExisting={(id) => {
            router.push(`/leads/${id}`);
            handleDuplicateResolved();
            onOpenChange(false);
          }}
          onCreateAnyway={async () => {
            if (!pendingPayload) return;
            setLoading(true);
            try {
              const res = await fetch("/api/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pendingPayload),
              });
              const json = await res.json();
              setLoading(false);
              if (!res.ok) {
                toast.error(json.error ?? "Create failed");
                return;
              }
              toast.success("Lead created");
              onOpenChange(false);
              reset();
              handleDuplicateResolved();
              if (json?.id) router.push(`/leads/${json.id}`);
            } catch {
              setLoading(false);
              toast.error("Create failed");
            }
          }}
        />
      )}
    </>
  );
}
