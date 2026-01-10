import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator, Shield } from 'lucide-react';

interface LoanOffersBannerProps {
  onCheckLoanOffers: () => void;
  onOpenEMICalculator: () => void;
  averageCarPrice: number;
}

const banks = [
  { name: 'HDFC', rate: '8.5%' },
  { name: 'ICICI', rate: '8.75%' },
  { name: 'Axis', rate: '9%' },
  { name: 'Kotak', rate: '8.9%' },
  { name: 'SBI', rate: '8.65%' },
  { name: 'PNB', rate: '9.15%' },
];

export function LoanOffersBanner({
  onCheckLoanOffers,
  onOpenEMICalculator,
}: LoanOffersBannerProps) {
  return (
    <section className="w-full my-6">
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/10 dark:to-indigo-950/5 border border-blue-200/60 dark:border-blue-800/30 rounded-xl p-6 md:p-8">
        
        {/* Main Content - Flex Container */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-4">
          
          {/* Left Section - CTAs */}
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button 
              onClick={onCheckLoanOffers}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full md:w-auto"
            >
              Check Loan Offers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={onOpenEMICalculator}
              variant="link"
              className="text-blue-600 dark:text-blue-400 justify-start md:justify-center"
            >
              <Calculator className="mr-2 h-4 w-4" />
              EMI Calculator
            </Button>
          </div>

          {/* Right Section - Bank Logos */}
          <div className="flex-1 w-full">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Trusted by 50,000+ buyers • Partner Banks
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {banks.map((bank) => (
                <div key={bank.name} className="text-center">
                  <div className="font-semibold text-sm text-foreground">{bank.name}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">from {bank.rate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="border-t border-blue-200/60 dark:border-blue-800/30 pt-4 mt-2">
          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="h-3 w-3" />
            100% Secure Process • No Hidden Charges • Compare Multiple Banks
          </p>
        </div>
      </div>
    </section>
  );
}
