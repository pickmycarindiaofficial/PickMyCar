import { Car } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CarDetailFAQProps {
  car: Car;
}

export const CarDetailFAQ = ({ car }: CarDetailFAQProps) => {
  const faqs = [
    {
      question: `Is this ${car.brand} ${car.model} still available?`,
      answer: `Yes, this ${car.year} ${car.brand} ${car.model} is currently ${car.availability.toLowerCase()} and available for viewing. Contact the dealer to schedule a test drive.`,
    },
    {
      question: `What is the on-road price of this ${car.model} in ${car.city}?`,
      answer: `The on-road price includes the ex-showroom price of ₹${(car.price / 100000).toFixed(2)} Lakh, plus registration charges, insurance, and other applicable fees. Contact us for an exact on-road price quotation for ${car.city}.`,
    },
    {
      question: 'Does this car come with warranty?',
      answer: `This vehicle is categorized as "${car.category}". ${car.category === 'New Car Warranty' ? 'It comes with a comprehensive manufacturer warranty.' : car.category === 'Brand Warranty' ? 'It includes extended brand warranty coverage.' : car.category === 'Certified' ? 'It comes with a certified pre-owned warranty.' : 'Warranty options may be available. Please contact the dealer for details.'}`,
    },
    {
      question: 'What documents are required to buy this car?',
      answer: 'You will need: Valid ID proof (Aadhar/PAN), Address proof, Passport size photos, and Income proof (for loan). Our team will guide you through the complete documentation process.',
    },
    {
      question: `Can I get finance for this ${car.model}?`,
      answer: 'Yes, we have tie-ups with leading banks and NBFCs offering attractive interest rates starting from 8.5% per annum. Loan approval is subject to credit assessment. Use our EMI calculator above to estimate your monthly payments.',
    },
    {
      question: 'What is the insurance status?',
      answer: car.insuranceValidity 
        ? `The insurance is valid until ${car.insuranceValidity}. Transfer of insurance to your name can be facilitated.`
        : 'Insurance details will be provided by the dealer. We can help you with insurance transfer or new policy purchase.',
    },
    {
      question: 'Can I exchange my old car?',
      answer: 'Yes, we accept old car exchanges. Our team will evaluate your current vehicle and offer the best exchange value, which can be adjusted against the price of this car.',
    },
  ];

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
