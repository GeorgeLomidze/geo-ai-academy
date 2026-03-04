import { Plus, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tableHeaders = ["სახელი", "კატეგორია", "სტუდენტები", "ფასი", "სტატუსი"];

export default function AdminCoursesPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-secondary">
            კურსები
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            მართე კურსები და სასწავლო მასალა
          </p>
        </div>
        <Button disabled className="rounded-xl gap-1.5">
          <Plus className="size-4" />
          ახალი კურსი
        </Button>
      </div>

      {/* Table shell */}
      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface">
        {/* Search bar */}
        <div className="border-b border-brand-border p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <Input
              placeholder="კურსის ძიება..."
              disabled
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">კურსების სია</caption>
            <thead>
              <tr className="border-b border-brand-border">
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    scope="col"
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
                      <BookOpen className="size-6 text-brand-primary" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-brand-secondary">
                      კურსები ჯერ არ არის დამატებული
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      კურსების დამატება შესაძლებელი იქნება შემდეგ სპრინტში
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
