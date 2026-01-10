import { CheckCircle2, Shield, Award, TrendingUp } from 'lucide-react';

export function TrustSignalsSection() {
  const trustSignals = [
    { icon: CheckCircle2, value: '50,000+', label: 'Happy Customers', color: 'text-green-500' },
    { icon: Shield, value: '10,000+', label: 'Verified Cars', color: 'text-blue-500' },
    { icon: Award, value: '4.8/5', label: 'Customer Rating', color: 'text-yellow-500' },
    { icon: TrendingUp, value: '98%', label: 'Satisfaction Rate', color: 'text-purple-500' },
  ];

  return (
    <section className="my-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {trustSignals.map((signal, idx) => {
          const Icon = signal.icon;
          return (
            <div key={idx} className="text-center p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
              <Icon className={`w-8 h-8 mx-auto mb-3 ${signal.color}`} />
              <div className="text-3xl font-bold text-foreground mb-2">{signal.value}</div>
              <div className="text-sm text-muted-foreground">{signal.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
