import { CheckCircle, Shield, Zap, Award, Home, FileCheck } from 'lucide-react';

export function BenefitsSection() {
  const benefits = [
    {
      icon: Shield,
      title: 'Certified Pre-Owned Cars',
      desc: 'Every vehicle undergoes 200+ point inspection',
    },
    {
      icon: Award,
      title: 'Best Prices Guaranteed',
      desc: 'Compare 10,000+ used cars from verified dealers',
    },
    {
      icon: Zap,
      title: 'Instant Loan Approval',
      desc: 'Get financing in 30 minutes from top banks',
    },
    {
      icon: FileCheck,
      title: '6-Month Warranty',
      desc: 'Drive worry-free with comprehensive coverage',
    },
    {
      icon: Home,
      title: 'Free Home Test Drive',
      desc: 'Try before you buy - at your doorstep',
    },
    {
      icon: CheckCircle,
      title: 'Transparent Pricing',
      desc: 'No hidden charges, complete price breakdown',
    },
  ];

  const categories = [
    { name: 'Hatchback Cars Under 3 Lakhs', href: '/used-cars/hatchback' },
    { name: 'Sedan Cars 5-10 Lakhs', href: '/used-cars/sedan' },
    { name: 'SUV Cars with Low Mileage', href: '/used-cars/suv' },
    { name: 'Automatic Transmission Cars', href: '/used-cars/automatic' },
    { name: 'First Owner Cars', href: '/used-cars/first-owner' },
    { name: 'CNG Cars in Your City', href: '/used-cars/cng' },
  ];

  return (
    <section className="my-16">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Benefits */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Why Buy From Us?</h2>
          <div className="space-y-4">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{benefit.title}</div>
                    <div className="text-sm text-muted-foreground">{benefit.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Categories */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Popular Used Car Categories</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {categories.map((category, idx) => (
              <a
                key={idx}
                href={category.href}
                className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-colors group"
              >
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {category.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
