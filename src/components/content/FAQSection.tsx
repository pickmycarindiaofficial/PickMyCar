import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQSectionProps {
  city: string;
  totalCars: number;
}

export const FAQSection = ({ city, totalCars }: FAQSectionProps) => {
  const cityName = city === 'All Cities' ? 'India' : city;
  
  const faqs = [
    {
      question: `How many used cars are available across ${cityName}?`,
      answer: `As of today, there are ${totalCars}+ verified second-hand cars listed across ${cityName} on PickMyCar, spanning various brands, models, and price points to fit every need.`,
    },
    {
      question: `What is the starting price of a second-hand car across ${cityName}?`,
      answer: `Used car prices across ${cityName} start from as low as ₹50,000 for entry-level hatchbacks, with a wide range of options available up to ₹50 Lakh+ for premium SUVs and luxury sedans.`,
    },
    {
      question: `Which are the most popular used car brands across ${cityName}?`,
      answer: `The most popular used car brands across ${cityName} include Maruti Suzuki, Hyundai, Honda, Tata, Mahindra, and Toyota, known for their reliability, fuel efficiency, and strong resale value.`,
    },
    {
      question: `What are the best used SUVs under ₹10 Lakh across ${cityName}?`,
      answer: `Top used SUVs under ₹10 Lakh across ${cityName} include the Hyundai Creta, Kia Seltos, Mahindra XUV500, Tata Harrier, and Renault Duster, offering great value, space, and features.`,
    },
    {
      question: `Can I get financing for a used car across ${cityName}?`,
      answer: `Yes, PickMyCar offers easy financing options with multiple bank and NBFC partnerships. Get instant loan approvals with competitive interest rates, flexible tenures, and minimal documentation for used cars across ${cityName}.`,
    },
  ];

  return (
    <div className="mt-12 rounded-xl border border-border bg-card p-6">
      <h2 className="mb-6 text-2xl font-bold text-foreground">
        Frequently Asked Questions about Used Cars across {cityName}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
