import {
  ArrowUpRight,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactHighlights = [
  {
    icon: Mail,
    title: "ელფოსტა",
    value: "hello@geoaiacademy.com",
  },
  {
    icon: MapPin,
    title: "ლოკაცია",
    value: "თბილისი, საქართველო",
  },
] as const;

const contactFieldClassName =
  "h-12 rounded-lg border border-transparent bg-white/5 px-4 text-sm text-brand-secondary placeholder:text-brand-muted/50 transition-[background-color,border-color,box-shadow] duration-200 ease-out focus-visible:border-brand-primary/70 focus-visible:bg-white/8 focus-visible:ring-0";

const contactTextareaClassName =
  "brand-scrollbar h-full min-h-[18rem] rounded-lg border border-transparent bg-white/5 px-4 py-3 text-sm text-brand-secondary placeholder:text-brand-muted/50 transition-[background-color,border-color,box-shadow] duration-200 ease-out focus-visible:border-brand-primary/70 focus-visible:bg-white/8 focus-visible:ring-0 resize-none overflow-y-auto";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative isolate scroll-mt-24 overflow-hidden border-t border-brand-border bg-brand-background"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-12 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-brand-border" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <div className="relative grid gap-6 self-start">
            <div className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-secondary">
                <span className="size-2 rounded-full bg-brand-primary" />
                კონტაქტი
              </span>
            </div>

            <div className="max-w-xl">
              <h2 className="text-4xl sm:text-5xl">დაგვიკავშირდი</h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-brand-muted sm:text-base">
                თუ გინდა მეტი ინფორმაცია კურსებზე, პარტნიორობაზე ან თანამშრომლობაზე,
                მოგვწერე და გიპასუხებთ მოკლე დროში.
              </p>
            </div>

            <div className="grid gap-4 self-start">
              {contactHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex min-w-0 items-center gap-4 rounded-[1.35rem] border border-white/10 bg-[#0e0e0e] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-transparent text-brand-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-secondary">
                        {item.title}
                      </p>
                      <p className="mt-1 break-words text-sm text-brand-secondary text-pretty">
                        {item.value}
                      </p>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/6 text-brand-secondary">
                      <ArrowUpRight className="size-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative self-start p-1">
            <div className="w-full rounded-2xl bg-white/[0.03] p-5 sm:p-6">
              <form className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-4">
                <div className="grid gap-4">
                  <Input
                    id="contact-name"
                    name="name"
                    aria-label="სახელი"
                    placeholder="სახელი"
                    className={contactFieldClassName}
                  />
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    aria-label="ელფოსტა"
                    placeholder="ელფოსტა"
                    className={contactFieldClassName}
                  />
                </div>

                <div className="min-h-0">
                  <Textarea
                    id="contact-message"
                    name="message"
                    rows={6}
                    aria-label="შეტყობინება"
                    placeholder="შეტყობინება"
                    className={contactTextareaClassName}
                  />
                </div>

                <Button
                  type="button"
                  className="h-12 w-full rounded-[0.9rem] bg-brand-accent px-6 text-sm font-semibold text-black shadow-none transition-colors duration-200 hover:bg-brand-accent-hover"
                >
                  გაგზავნა
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
