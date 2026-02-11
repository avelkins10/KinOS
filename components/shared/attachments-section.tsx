"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, File, Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { AttachmentEntityType } from "@/lib/actions/attachments";

interface Attachment {
  id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  category: string | null;
  created_at: string | null;
}

interface AttachmentsSectionProps {
  entityType: AttachmentEntityType;
  entityId: string;
  initialAttachments?: Attachment[];
}

export function AttachmentsSection({
  entityType,
  entityId,
  initialAttachments = [],
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] =
    useState<Attachment[]>(initialAttachments);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = async () => {
    const res = await fetch(
      `/api/attachments?entityType=${entityType}&entityId=${entityId}`,
    );
    const data = await res.json();
    if (Array.isArray(data)) setAttachments(data);
  };

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("entityType", entityType);
    formData.set("entityId", entityId);
    formData.set("category", "other");
    try {
      const res = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast.error(json.error ?? "Upload failed");
        return;
      }
      e.target.value = "";
      fetchAttachments();
    } catch {
      setLoading(false);
      toast.error("Upload failed");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/attachments/${id}?expiry=60`);
      const json = await res.json();
      if (!res.ok || !json.url) {
        toast.error("Failed to get download link");
        return;
      }
      window.open(json.url, "_blank");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this attachment?")) return;
    try {
      const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Delete failed");
        return;
      }
      fetchAttachments();
    } catch {
      toast.error("Delete failed");
    }
  };

  const filtered =
    categoryFilter === "all"
      ? attachments
      : attachments.filter((a) => (a.category ?? "other") === categoryFilter);

  const icon = (mime: string | null) => {
    if (!mime) return <File className="h-4 w-4" />;
    if (mime.startsWith("image/")) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Attachments</CardTitle>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="all">All</option>
            <option value="documents">Documents</option>
            <option value="images">Images</option>
            <option value="other">Other</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={loading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-border p-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                {icon(a.mime_type)}
                <span className="truncate">{a.file_name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {a.file_size != null
                    ? `${(a.file_size / 1024).toFixed(1)} KB`
                    : ""}
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(a.id)}
                  aria-label="Download"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(a.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No attachments.</p>
        )}
      </CardContent>
    </Card>
  );
}
