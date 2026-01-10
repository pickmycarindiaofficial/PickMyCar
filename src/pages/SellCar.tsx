import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCircle, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { CarListingForm } from '@/components/listing/CarListingForm';
import { Navbar } from '@/components/layout/Navbar';

const SellCar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showListingForm, setShowListingForm] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    if (user && action === 'post') {
      setShowListingForm(true);
    }
  }, [user, searchParams]);

  const handlePostCar = () => {
    if (!user) {
      navigate('/auth?returnTo=/sell-car&action=post');
    } else {
      setShowListingForm(true);
    }
  };

  const handleDealerOffers = () => {
    if (!user) {
      navigate('/auth?returnTo=/sell-car&action=dealers');
    } else {
      // Future: Navigate to dealer inquiry form
      navigate('/dashboard/enquiries');
    }
  };

  const handleSearch = (term: string) => {
    navigate(`/?search=${encodeURIComponent(term)}`);
  };

  const handleNavigate = (view: string) => {
    if (view === 'home' || view === 'buy') {
      navigate('/');
    } else if (view === 'sell') {
      navigate('/sell-car');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        onSearch={handleSearch}
        onNavigate={handleNavigate}
      />
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Sell Your Car?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the easiest way for you to get the best value for your vehicle.
          </p>
        </div>

        {/* Two Options Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Option 1: Post Your Car */}
          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Post Your Car</CardTitle>
              <CardDescription>
                Get maximum price by attracting direct buyers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Set your own price and negotiate directly with buyers</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Your listing visible to thousands of active buyers</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Featured listing options for maximum visibility</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Complete control over the selling process</p>
                </div>
              </div>
              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={handlePostCar}
              >
                Create a Listing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Sell to Dealers */}
          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Sell to Dealers</CardTitle>
              <CardDescription>
                Get a fair price instantly from trusted dealers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Get instant offers from verified dealers</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Skip negotiations - dealers make direct offers</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Access network of trusted dealers immediately</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Quick and hassle-free selling experience</p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full mt-6" 
                size="lg"
                onClick={handleDealerOffers}
              >
                Get Dealer Offers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="timeline">
              <AccordionTrigger>How long will it take to sell my car?</AccordionTrigger>
              <AccordionContent>
                Direct listings typically sell within 7-14 days depending on your pricing and vehicle condition. Dealer offers usually come within 24-48 hours after submission.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="fee">
              <AccordionTrigger>Is there a fee for listing my car?</AccordionTrigger>
              <AccordionContent>
                Basic listing is completely free. We also offer premium featured listings for faster visibility and priority placement in search results.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="dealers">
              <AccordionTrigger>How do dealer offers work?</AccordionTrigger>
              <AccordionContent>
                Submit your car details and photos. Our verified dealers will review and send competitive offers directly. You choose the best offer and complete the sale.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="documents">
              <AccordionTrigger>What documents do I need to sell my car?</AccordionTrigger>
              <AccordionContent>
                You'll need RC book (registration certificate), valid insurance papers, and service history. If you have an active loan, you'll also need loan closure documents.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="safety">
              <AccordionTrigger>Is my personal information safe?</AccordionTrigger>
              <AccordionContent>
                Yes! Your contact details are only shared after you approve a buyer or dealer. We never display your phone number or address publicly.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="edit">
              <AccordionTrigger>Can I edit my listing after posting?</AccordionTrigger>
              <AccordionContent>
                Absolutely! You can edit price, description, photos, and all details anytime from your dashboard. Changes are reflected immediately.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl p-8 md:p-12 text-center border">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied sellers who found the perfect buyers through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handlePostCar}>
              List Your Car Now
            </Button>
            <Button size="lg" variant="outline" onClick={handleDealerOffers}>
              Get Dealer Offers
            </Button>
          </div>
        </div>
      </div>

      {/* Listing Form Dialog */}
      <Dialog open={showListingForm} onOpenChange={setShowListingForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Your Car Listing</DialogTitle>
          </DialogHeader>
          <CarListingForm onSuccess={() => {
            setShowListingForm(false);
            navigate('/dashboard/my-listings');
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellCar;
