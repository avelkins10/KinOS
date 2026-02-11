"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DuplicateCandidate {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  owner: string | null;
}

interface DuplicateCheckDialogProps {
  open: boolean;
  duplicates: DuplicateCandidate[];
  onClose: () => void;
  onUseExisting: (id: string) => void;
  onCreateAnyway: () => void;
}

export function DuplicateCheckDialog({
  open,
  duplicates,
  onClose,
  onUseExisting,
  onCreateAnyway,
}: DuplicateCheckDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Possible duplicate</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          A contact with this phone or email already exists. Choose an option:
        </p>
        <div className="max-h-48 overflow-auto rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicates.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {d.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs truncate max-w-[140px]">
                    {d.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onUseExisting(d.id)}
                    >
                      Use
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onCreateAnyway}>
            Create anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
