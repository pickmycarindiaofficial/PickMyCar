import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useEventTracking } from '@/hooks/useEventTracking';

interface EMICalculatorProps {
  carPrice: number;
  onApplyForFinance: () => void;
}

export const EMICalculator = ({ carPrice, onApplyForFinance }: EMICalculatorProps) => {
  const [loanAmount, setLoanAmount] = useState(carPrice * 0.8);
  const [interestRate, setInterestRate] = useState(10);
  const [tenure, setTenure] = useState(5);
  const { trackFunnel } = useEventTracking();
  const [hasTrackedEngage, setHasTrackedEngage] = useState(false);

  useEffect(() => {
    if (!hasTrackedEngage && (loanAmount !== carPrice * 0.8 || interestRate !== 10 || tenure !== 5)) {
      // Track 'engage' stage when user interacts with calculator
      trackFunnel.mutate({ 
        stage: 'engage',
        meta: { 
          interaction_type: 'emi_calculator',
          loan_amount: loanAmount,
          interest_rate: interestRate,
          tenure: tenure,
        }
      });
      setHasTrackedEngage(true);
    }
  }, [loanAmount, interestRate, tenure]);

  const calculateEMI = () => {
    const monthlyRate = interestRate / 12 / 100;
    const months = tenure * 12;
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  const emi = calculateEMI();
  const totalAmount = emi * tenure * 12;
  const totalInterest = totalAmount - loanAmount;

  const chartData = [
    { name: 'Principal', value: loanAmount },
    { name: 'Interest', value: totalInterest },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))'];

  return (
    <div className="border rounded-lg p-6 bg-card space-y-6">
      <h2 className="text-xl font-semibold">EMI Calculator</h2>

      <div className="space-y-6">
        {/* Loan Amount */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Loan Amount</label>
            <span className="text-sm font-semibold text-primary">₹{(loanAmount / 100000).toFixed(2)} L</span>
          </div>
          <Slider
            value={[loanAmount]}
            onValueChange={(value) => setLoanAmount(value[0])}
            min={carPrice * 0.2}
            max={carPrice}
            step={10000}
            className="w-full"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Interest Rate</label>
            <span className="text-sm font-semibold text-primary">{interestRate}%</span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(value) => setInterestRate(value[0])}
            min={6}
            max={18}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Tenure */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Loan Tenure</label>
            <span className="text-sm font-semibold text-primary">{tenure} Years</span>
          </div>
          <Slider
            value={[tenure]}
            onValueChange={(value) => setTenure(value[0])}
            min={1}
            max={7}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly EMI</span>
            <span className="text-2xl font-bold text-primary">₹{emi.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-semibold">₹{totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Interest</span>
            <span className="font-semibold">₹{totalInterest.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Button 
        onClick={onApplyForFinance} 
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
        size="lg"
      >
        Apply for Loan
      </Button>
    </div>
  );
};
