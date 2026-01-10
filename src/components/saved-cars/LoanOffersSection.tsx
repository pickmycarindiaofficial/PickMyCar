import { useState } from 'react';
import { Building2, CheckCircle2, Zap, CreditCard, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EMICalculator } from '@/components/detail/EMICalculator';

interface LoanOffersSectionProps {
  averageCarPrice: number;
}

export function LoanOffersSection({ averageCarPrice }: LoanOffersSectionProps) {
  const [showEMICalculator, setShowEMICalculator] = useState(false);

  const banks = [
    { name: 'HDFC Bank', rate: '8.5%' },
    { name: 'ICICI Bank', rate: '8.75%' },
    { name: 'Axis Bank', rate: '9%' },
    { name: 'Kotak Bank', rate: '8.9%' },
    { name: 'SBI', rate: '8.65%' },
    { name: 'PNB', rate: '9.15%' },
  ];

  const benefits = [
    { icon: CheckCircle2, title: 'Instant Approval', desc: 'Get approved in 30 mins' },
    { icon: CreditCard, title: 'Low Interest', desc: 'Rates starting at 8.5%' },
    { icon: Zap, title: 'Quick Disbursal', desc: 'Funds in 24-48 hours' },
    { icon: TrendingUp, title: 'Flexible Tenure', desc: 'Up to 7 years EMI' },
  ];

  return (
    <>
      <section className="my-12 relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Want to Check Pre-Approved Loan Offers?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant financing options from top banks. Quick approval, competitive rates.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex flex-col items-center text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <benefit.icon className="w-8 h-8 text-primary mb-2" />
                <h4 className="font-semibold text-sm mb-1">{benefit.title}</h4>
                <p className="text-xs text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Bank Partners */}
          <div className="bg-card/50 rounded-lg p-6 border border-border/50">
            <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
              Trusted by 50,000+ buyers • Partner Banks
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {banks.map((bank) => (
                <div key={bank.name} className="text-center space-y-1">
                  <div className="font-semibold text-sm">{bank.name}</div>
                  <div className="text-xs text-primary font-medium">from {bank.rate}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg font-semibold"
              onClick={() => setShowEMICalculator(true)}
            >
              Check Loan Offers →
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowEMICalculator(true)}
            >
              EMI Calculator
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-center text-sm text-muted-foreground">
            🔒 100% Secure Process • No Hidden Charges • Compare Multiple Banks
          </p>
        </div>
      </section>

      {/* EMI Calculator Modal */}
      <Dialog open={showEMICalculator} onOpenChange={setShowEMICalculator}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calculate Your EMI</DialogTitle>
          </DialogHeader>
          <EMICalculator
            carPrice={averageCarPrice || 500000}
            onApplyForFinance={() => {
              setShowEMICalculator(false);
            }}
          />

        </DialogContent>
      </Dialog>
    </>
  );
}
