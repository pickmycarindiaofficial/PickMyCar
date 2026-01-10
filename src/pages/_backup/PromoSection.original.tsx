import { Shield, BadgeCheck, CreditCard, Package, ChevronRight, TrendingUp, Star, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const benefits = [
  {
    icon: Shield,
    title: 'Warranty Assured',
    description: '6 Months to 1 Year',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BadgeCheck,
    title: 'Certified Cars',
    description: '150+ Point Inspection',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: CreditCard,
    title: 'Easy Financing',
    description: 'Approval in 24 Hours',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Package,
    title: 'Quick Insurance',
    description: 'Hassle-free Process',
    gradient: 'from-orange-500 to-amber-500',
  },
];

const stats = [
  { value: '10,000+', label: 'Happy Customers', icon: Star },
  { value: '5,000+', label: 'Cars Sold', icon: TrendingUp },
  { value: '4.8★', label: 'Customer Rating', icon: Award },
];

export const PromoSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Modern Hero with Gradient Background */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />

          {/* Grid Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 px-6 py-12 md:py-16 lg:py-20">
          {/* Hero Text */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Trusted by 10,000+ happy customers
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-primary via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Pre-Owned Car
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
              India's most trusted marketplace for quality certified used cars with warranty, easy financing, and doorstep delivery.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-white shadow-lg shadow-primary/25 px-8"
                onClick={() => navigate('/sell-car')}
              >
                Sell Your Car
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 border-white/20 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm px-8"
              >
                Browse 5000+ Cars
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits Grid - Glassmorphism Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  {/* Gradient Glow on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br ${benefit.gradient} mb-4 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                    <p className="text-sm text-white/60">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
