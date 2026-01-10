import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function FAQSection() {
  const faqs = [
    {
      q: 'Where can I buy reliable second hand cars in India?',
      a: 'Our platform offers India\'s largest selection of certified pre-owned cars from verified dealers. Every car is inspected, comes with warranty, and has transparent pricing. Browse 10,000+ used cars across 50+ cities with instant loan approval.',
    },
    {
      q: 'What\'s the best way to finance a used car in 2025?',
      a: 'Get instant pre-approved loan offers from HDFC, ICICI, and Axis Bank through our platform. Interest rates start at 8.5% APR with flexible tenure up to 7 years. 100% online process with approval in 30 minutes.',
    },
    {
      q: 'How do I know if a used car is in good condition?',
      a: 'All our listed cars undergo a comprehensive 200+ point inspection covering engine, transmission, brakes, suspension, electrical systems, and body condition. You also get a detailed inspection report and 6-month warranty on certified cars.',
    },
    {
      q: 'Can I get a warranty on second hand cars?',
      a: 'Yes! All certified pre-owned cars come with a standard 6-month warranty covering major components. You can also extend the warranty up to 2 years for added peace of mind. Non-warranty cars are clearly marked.',
    },
    {
      q: 'What documents do I need to buy a used car?',
      a: 'You need: Valid ID proof (Aadhaar/PAN), Address proof, Passport-size photos, and Insurance documents. For loan applications, additional income proof is required. We assist with RC transfer and insurance processing.',
    },
  ];

  return (
    <section className="my-16">
      <div>
        <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, idx) => (
            <AccordionItem 
              key={idx} 
              value={`faq-${idx}`}
              className="border rounded-lg px-4 bg-card"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
