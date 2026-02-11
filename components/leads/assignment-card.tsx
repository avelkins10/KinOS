"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AssignmentCardProps {
  contactId: string;
  office: { id: string; name: string } | null;
  officeOptions: { id: string; name: string }[];
  owner: { id: string; first_name: string; last_name: string } | null;
  ownerOptions: { id: string; name: string }[];
  setter: { id: string; first_name: string; last_name: string } | null;
  setterOptions: { id: string; name: string }[];
  contactSource: string | null;
  onUpdate?: () => void;
}

export function AssignmentCard({
  contactId,
  office,
  officeOptions,
  owner,
  ownerOptions,
  setter,
  setterOptions,
  contactSource,
  onUpdate,
}: AssignmentCardProps) {
  const handleAssign = async (
    field: "ownerId" | "setterId" | "officeId",
    value: string,
  ) => {
    const body: Record<string, string | null | undefined> = {};
    if (field === "ownerId") body.ownerId = value || null;
    else if (field === "setterId") body.setterId = value || null;
    else if (field === "officeId") body.officeId = value || null;
    try {
      const res = await fetch(`/api/contacts/${contactId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      onUpdate?.();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {officeOptions.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Office</Label>
            <Select
              value={office?.id ?? ""}
              onValueChange={(v) => handleAssign("officeId", v)}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {officeOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-0.5 text-xs text-muted-foreground">
              From latest deal. Create a deal to set office if none.
            </p>
          </div>
        )}
        <div>
          <Label className="text-xs text-muted-foreground">Lead Owner</Label>
          <Select
            value={owner?.id ?? ""}
            onValueChange={(v) => handleAssign("ownerId", v)}
          >
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {ownerOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Setter</Label>
          <Select
            value={setter?.id ?? ""}
            onValueChange={(v) => handleAssign("setterId", v)}
          >
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {setterOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Source</Label>
          <p className="mt-0.5 font-medium">{contactSource ?? "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
