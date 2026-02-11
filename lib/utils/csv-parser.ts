/**
 * Simple CSV parser for contact import. Handles quoted fields and commas.
 */

export interface ParseCSVResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: { row: number; message: string }[];
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      current += c;
    } else if (c === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse CSV string into headers and rows of key-value objects.
 * Normalizes headers to lowercase with underscores.
 */
export function parseCSV(
  csv: string,
  options: { headers?: string[] } = {},
): ParseCSVResult {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  const errors: { row: number; message: string }[] = [];
  if (lines.length === 0) {
    return { headers: [], rows: [], errors };
  }

  const firstLine = parseLine(lines[0]);
  const headers =
    options.headers ??
    firstLine.map((h) =>
      h.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_"),
    );
  const startRow = options.headers ? 0 : 1;
  const rows: Record<string, string>[] = [];

  for (let i = startRow; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    if (row.first_name || row.last_name || row.email || row.phone) {
      rows.push(row);
    }
  }

  return { headers, rows, errors };
}

/**
 * Map common CSV column names to ImportContactRow fields.
 */
export function mapToImportRows(rows: Record<string, string>[]): {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}[] {
  const normalize = (r: Record<string, string>) => ({
    first_name: (r.first_name ?? r["first name"] ?? "").trim(),
    last_name: (r.last_name ?? r["last name"] ?? "").trim(),
    email: (r.email ?? "").trim() || undefined,
    phone: (r.phone ?? r.phone_number ?? "").trim() || undefined,
    address: (r.address ?? r.street ?? "").trim() || undefined,
    city: (r.city ?? "").trim() || undefined,
    state: (r.state ?? "").trim() || undefined,
    zip: (r.zip ?? r.zipcode ?? r["zip code"] ?? "").trim() || undefined,
  });
  return rows.map(normalize);
}
