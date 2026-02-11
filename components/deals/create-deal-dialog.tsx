"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateDealDialogProps {
  defaultOfficeId?: string;
  defaultCloserId?: string;
  trigger?: React.ReactNode;
}

export function CreateDealDialog({
  defaultOfficeId,
  defaultCloserId,
  trigger,
}: CreateDealDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactId, setContactId] = useState("");
  const [closerId, setCloserId] = useState(defaultCloserId ?? "");
  const [officeId, setOfficeId] = useState(defaultOfficeId ?? "");
  const [source, setSource] = useState("Manual");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId.trim()) {
      toast.error("Contact is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactId.trim(),
          closerId: closerId || undefined,
          officeId: officeId || undefined,
          source: source || "Manual",
        }),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast.error(json.error ?? "Create failed");
        return;
      }
      toast.success(`Deal created: ${json.deal_number ?? ""}`);
      setOpen(false);
      setContactId("");
      if (json.id) router.push(`/deals/${json.id}`);
    } catch {
      setLoading(false);
      toast.error("Create failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contactId">Contact ID (UUID)</Label>
            <Input
              id="contactId"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              placeholder="Contact UUID from contacts table"
              className="mt-1"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter an existing contact ID. Contact search/autocomplete can be
              added later.
            </p>
          </div>
          <div>
            <Label htmlFor="closerId">Closer (optional)</Label>
            <Input
              id="closerId"
              value={closerId}
              onChange={(e) => setCloserId(e.target.value)}
              placeholder="User UUID"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="officeId">Office (optional)</Label>
            <Input
              id="officeId"
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              placeholder="Office UUID"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Manual"
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
