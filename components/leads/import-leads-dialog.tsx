"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { parseCSV, mapToImportRows } from "@/lib/utils/csv-parser";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
}: ImportLeadsDialogProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<
    {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const { rows: parsed } = parseCSV(text);
        const mapped = mapToImportRows(parsed);
        setRows(mapped);
      };
      reader.readAsText(f);
    },
    [],
  );

  const handleImport = async () => {
    if (rows.length === 0) {
      toast.error("No rows to import. Upload a CSV first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((r) => ({
            first_name: r.first_name,
            last_name: r.last_name,
            email: r.email,
            phone: r.phone,
            address: r.address,
            city: r.city,
            state: r.state,
            zip: r.zip,
          })),
          skipDuplicates: skipDuplicates,
        }),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast.error(json.error ?? "Import failed");
        return;
      }
      const created = json.created ?? 0;
      const skipped = json.skipped ?? 0;
      const errors = json.errors ?? [];
      toast.success(
        `Imported: ${created} created, ${skipped} skipped${errors.length ? `, ${errors.length} errors` : ""}`,
      );
      onOpenChange(false);
      setFile(null);
      setRows([]);
      router.refresh();
    } catch {
      setLoading(false);
      toast.error("Import failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import leads from CSV</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Upload a CSV with columns: first_name, last_name, email, phone,
          address, city, state, zip (or similar names).
        </p>
        <div>
          <Label htmlFor="csv-file">CSV file</Label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="skip-dup"
            checked={skipDuplicates}
            onChange={(e) => setSkipDuplicates(e.target.checked)}
          />
          <Label htmlFor="skip-dup">
            Skip rows that match existing phone/email
          </Label>
        </div>
        {rows.length > 0 && (
          <div className="max-h-48 overflow-auto rounded border border-border text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 text-left">First</th>
                  <th className="p-2 text-left">Last</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Phone</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2">{r.first_name}</td>
                    <td className="p-2">{r.last_name}</td>
                    <td className="p-2 truncate max-w-[120px]">
                      {r.email ?? "—"}
                    </td>
                    <td className="p-2">{r.phone ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <p className="p-2 text-muted-foreground">
                … and {rows.length - 10} more rows
              </p>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={loading || rows.length === 0}
          >
            {loading ? "Importing…" : `Import ${rows.length} row(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
