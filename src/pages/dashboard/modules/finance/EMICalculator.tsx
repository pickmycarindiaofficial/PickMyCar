import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calculator } from 'lucide-react';
import { useState } from 'react';

export default function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(60);

  const calculateEMI = () => {
    const principal = loanAmount;
    const rate = interestRate / 12 / 100;
    const time = tenure;

    const emi = (principal * rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1);
    const totalAmount = emi * time;
    const totalInterest = totalAmount - principal;

    return {
      emi: Math.round(emi),
      totalAmount: Math.round(totalAmount),
      totalInterest: Math.round(totalInterest),
      principal: Math.round(principal),
    };
  };

  const result = calculateEMI();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">EMI Calculator</h1>
        <p className="text-muted-foreground text-lg">
          Calculate monthly installments for car loans
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Loan Amount</Label>
              <Input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
              />
              <Slider
                value={[loanAmount]}
                onValueChange={(v) => setLoanAmount(v[0])}
                min={100000}
                max={5000000}
                step={50000}
              />
              <p className="text-sm text-muted-foreground">₹{loanAmount.toLocaleString()}</p>
            </div>

            <div className="space-y-2">
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                step="0.1"
              />
              <Slider
                value={[interestRate]}
                onValueChange={(v) => setInterestRate(v[0])}
                min={5}
                max={20}
                step={0.1}
              />
              <p className="text-sm text-muted-foreground">{interestRate}% per annum</p>
            </div>

            <div className="space-y-2">
              <Label>Tenure (Months)</Label>
              <Input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
              />
              <Slider
                value={[tenure]}
                onValueChange={(v) => setTenure(v[0])}
                min={12}
                max={84}
                step={6}
              />
              <p className="text-sm text-muted-foreground">{tenure} months ({Math.round(tenure / 12)} years)</p>
            </div>

            <Button className="w-full">
              <Calculator className="mr-2 h-4 w-4" />
              Recalculate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EMI Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">Monthly EMI</span>
                <span className="text-2xl font-bold text-primary">₹{result.emi.toLocaleString()}</span>
              </div>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Principal Amount</span>
                  <span className="font-medium">₹{result.principal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Interest</span>
                  <span className="font-medium">₹{result.totalInterest.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold">₹{result.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Principal</span>
                  <span>{((result.principal / result.totalAmount) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(result.principal / result.totalAmount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Interest</span>
                  <span>{((result.totalInterest / result.totalAmount) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${(result.totalInterest / result.totalAmount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
