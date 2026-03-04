import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

const tableHeaders = ["სახელი", "ელ-ფოსტა", "რეგისტრაციის თარიღი", "კურსები", "სტატუსი"];

export default function AdminStudentsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        სტუდენტები
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        სტუდენტების სია და მართვა
      </p>

      {/* Table shell */}
      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface">
        {/* Search bar */}
        <div className="border-b border-brand-border p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <Input
              placeholder="სტუდენტის ძიება..."
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-muted"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={tableHeaders.length} className="px-4 py-16">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary-light">
                      <Users className="size-6 text-brand-primary" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-brand-secondary">
                      სტუდენტები ჯერ არ არის რეგისტრირებული
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      ახალი რეგისტრაციები აქ გამოჩნდება
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
