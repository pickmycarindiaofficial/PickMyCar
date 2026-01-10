import { Shield, BadgeCheck, CreditCard, Package } from 'lucide-react';

const benefits = [
  {
    icon: Shield,
    title: 'Warranty Assured',
    description: '6 Months to 1 Year on select cars',
  },
  {
    icon: BadgeCheck,
    title: 'Certified Cars',
    description: 'Quality you can trust',
  },
  {
    icon: CreditCard,
    title: 'Easy Loan Options',
    description: 'Flexible financing available',
  },
  {
    icon: Package,
    title: 'Book Insurance Online',
    description: 'Hassle-free insurance process',
  },
];

export const PromoSection = () => {
  return (
    <div className="mb-4 rounded-lg bg-gradient-to-br from-accent to-accent/50 p-4">
      <h2 className="mb-3 text-center text-lg font-bold text-accent-foreground">
        Marketplace Benefits
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div
              key={index}
              className="flex flex-col items-center text-center animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-0 text-sm font-semibold text-accent-foreground leading-tight">{benefit.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{benefit.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
