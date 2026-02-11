"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ContactInfoCardProps {
  contactId: string;
  initialData: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    secondary_email: string | null;
    secondary_phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  onUpdate?: () => void;
}

export function ContactInfoCard({
  contactId,
  initialData,
  onUpdate,
}: ContactInfoCardProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: initialData.first_name,
    last_name: initialData.last_name,
    email: initialData.email ?? "",
    phone: initialData.phone ?? "",
    secondary_email: initialData.secondary_email ?? "",
    secondary_phone: initialData.secondary_phone ?? "",
    address: initialData.address ?? "",
    city: initialData.city ?? "",
    state: initialData.state ?? "",
    zip: initialData.zip ?? "",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      setEditing(false);
      onUpdate?.();
    } catch {
      setLoading(false);
      toast.error("Update failed");
    }
  };

  const handleCancel = () => {
    setForm({
      first_name: initialData.first_name,
      last_name: initialData.last_name,
      email: initialData.email ?? "",
      phone: initialData.phone ?? "",
      secondary_email: initialData.secondary_email ?? "",
      secondary_phone: initialData.secondary_phone ?? "",
      address: initialData.address ?? "",
      city: initialData.city ?? "",
      state: initialData.state ?? "",
      zip: initialData.zip ?? "",
    });
    setEditing(false);
  };

  const fullAddress = [form.address, form.city, form.state, form.zip]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Contact info</CardTitle>
        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={handleSave}
              disabled={loading}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {editing ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">First name</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  className="h-8 mt-0.5"
                />
              </div>
              <div>
                <Label className="text-xs">Last name</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  className="h-8 mt-0.5"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="h-8 mt-0.5"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="h-8 mt-0.5"
              />
            </div>
            <div>
              <Label className="text-xs">Secondary email</Label>
              <Input
                type="email"
                value={form.secondary_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secondary_email: e.target.value }))
                }
                className="h-8 mt-0.5"
              />
            </div>
            <div>
              <Label className="text-xs">Secondary phone</Label>
              <Input
                value={form.secondary_phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secondary_phone: e.target.value }))
                }
                className="h-8 mt-0.5"
              />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="h-8 mt-0.5"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  className="h-8 mt-0.5"
                />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                  className="h-8 mt-0.5"
                />
              </div>
              <div>
                <Label className="text-xs">Zip</Label>
                <Input
                  value={form.zip}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zip: e.target.value }))
                  }
                  className="h-8 mt-0.5"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="font-medium">
              {form.first_name} {form.last_name}
            </p>
            <p className="text-muted-foreground">
              Email: {form.email || "—"}
              {form.secondary_email ? ` · ${form.secondary_email}` : ""}
            </p>
            <p className="text-muted-foreground">
              Phone: {form.phone || "—"}
              {form.secondary_phone ? ` · ${form.secondary_phone}` : ""}
            </p>
            {fullAddress && (
              <p className="text-muted-foreground">
                Address:{" "}
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {fullAddress}
                  </a>
                ) : (
                  fullAddress
                )}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
