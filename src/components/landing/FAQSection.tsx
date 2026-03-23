import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "როგორ დავიწყო სწავლა?",
    answer:
      "დარეგისტრირდი პლატფორმაზე, აირჩიე სასურველი კურსი და შეიძინე. ყიდვის შემდეგ მყისვე მიიღებ წვდომას ყველა ვიდეო გაკვეთილზე და სასწავლო მასალაზე.",
  },
  {
    question: "რა ენაზეა კურსები?",
    answer:
      "ჩვენი ყველა კურსი სრულად ქართულ ენაზეა. ვიდეო გაკვეთილები, სასწავლო მასალა და დავალებები - ყველაფერი ქართულად.",
  },
  {
    question: "რამდენ ხანს მექნება კურსზე წვდომა?",
    answer:
      "კურსის შეძენის შემდეგ წვდომა სამუდამოა. შეგიძლია ნებისმიერ დროს დაუბრუნდე მასალას და გაიმეორო გაკვეთილები.",
  },
  {
    question: "მივიღებ სერთიფიკატს?",
    answer:
      "დიახ! კურსის წარმატებით დასრულების შემდეგ მიიღებ ვერიფიცირებულ ციფრულ სერთიფიკატს, რომელიც შეგიძლია დაამატო შენს CV-ს ან LinkedIn პროფილს.",
  },
  {
    question: "რა მოთხოვნებია კურსებზე?",
    answer:
      "კურსების უმეტესობა განკუთვნილია დამწყებთათვის - საჭიროა მხოლოდ კომპიუტერი და ინტერნეტი. კონკრეტული წინაპირობები მითითებულია თითოეული კურსის აღწერაში.",
  },
] as const;

export function FAQSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="animate-in fade-in-0 slide-in-from-bottom-5 text-center duration-500">
          <Badge className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-brand-secondary backdrop-blur-sm">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <span className="size-2 rounded-full bg-brand-primary" />
              FAQ
            </span>
          </Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-secondary sm:text-4xl">
            ხშირად დასმული კითხვები
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-muted">
            პასუხები ყველაზე გავრცელებულ კითხვებზე
          </p>
        </div>

        {/* Accordion */}
        <div className="mt-12 animate-in fade-in-0 slide-in-from-bottom-5 duration-500" style={{ animationDelay: "150ms" }}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-2xl border border-brand-border bg-brand-surface px-5 shadow-sm transition-shadow data-[state=open]:border-brand-primary/30 data-[state=open]:shadow-[0_0_30px_rgba(255,214,10,0.1)]"
              >
                <AccordionTrigger className="py-5 text-base font-semibold text-brand-secondary hover:no-underline [&[data-state=open]]:text-brand-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-brand-muted">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
