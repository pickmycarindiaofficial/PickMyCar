import { CheckCircle2, Phone } from "lucide-react";
import "@/lib/printTemplates.css";

interface StandardTemplateProps {
  carData: any;
  dealerProfile: any;
  selectedFields: string[];
}

export default function StandardTemplate({ carData, dealerProfile, selectedFields }: StandardTemplateProps) {
  const hasField = (key: string) => selectedFields.includes(key);

  const features = carData?.car_listing_features?.map((clf: any) => clf.features?.name).filter(Boolean) || [];

  return (
    <div className="spec-sheet-container" style={{ width: '210mm', height: '297mm', padding: '10mm', background: 'white' }}>
      {/* Header */}
      <div className="spec-sheet-header" style={{ borderBottom: '3px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
        <div className="flex justify-between items-start">
          <div>
            {dealerProfile?.logo_url && (
              <img 
                src={dealerProfile.logo_url} 
                alt="Dealer Logo" 
                style={{ height: '60px', objectFit: 'contain' }}
              />
            )}
            <div className="mt-2 text-sm font-medium">{dealerProfile?.dealership_name || 'Dealer Name'}</div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end text-2xl font-bold">
              <Phone className="h-6 w-6" />
              <span>{dealerProfile?.profiles?.phone_number || 'Contact Number'}</span>
            </div>
            {dealerProfile?.about_text && (
              <div className="text-sm mt-1 text-muted-foreground">
                {dealerProfile.about_text.substring(0, 100)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Car Details Table */}
      <div className="spec-sheet-body">
        <table className="spec-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>
            {hasField('brand_model') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', width: '40%' }}>
                  Brand & Model
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '18px', fontWeight: '600' }}>
                  {carData?.brands?.name} {carData?.models?.name}
                </td>
              </tr>
            )}
            
            {hasField('variant') && carData?.variant && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Variant
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData.variant}
                </td>
              </tr>
            )}
            
            {hasField('year') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Year of Make
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData?.year_of_make}
                </td>
              </tr>
            )}
            
            {hasField('km') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  KM Driven
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData?.kms_driven?.toLocaleString()} km
                </td>
              </tr>
            )}
            
            {hasField('fuel') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Fuel Type
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData?.fuel_types?.name}
                </td>
              </tr>
            )}
            
            {hasField('transmission') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Transmission
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData?.transmissions?.name}
                </td>
              </tr>
            )}
            
            {hasField('ownership') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Ownership
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData?.owner_types?.name}
                </td>
              </tr>
            )}
            
            {hasField('color') && carData?.color && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Color
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData.color}
                </td>
              </tr>
            )}
            
            {hasField('seats') && carData?.seats && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Seats
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData.seats} Seater
                </td>
              </tr>
            )}
            
            {hasField('category') && carData?.car_categories?.name && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Category
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  {carData.car_categories.name}
                </td>
              </tr>
            )}
            
            {hasField('registration_number') && carData?.registration_number && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Registration No.
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px', textTransform: 'uppercase' }}>
                  {carData.registration_number}
                </td>
              </tr>
            )}
            
            {hasField('insurance_validity') && carData?.insurance_status === 'valid' && carData?.insurance_validity && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Insurance
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px' }}>
                  Valid till {new Date(carData.insurance_validity).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
              </tr>
            )}
            
            {hasField('insurance_validity') && carData?.insurance_status === 'expired' && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Insurance
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '12px', fontSize: '16px', color: '#ea580c', fontWeight: '500' }}>
                  Expired
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Price Highlight */}
        {hasField('price') && (
          <div className="price-highlight" style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#22c55e', 
            textAlign: 'center', 
            padding: '20px', 
            border: '3px solid #22c55e', 
            backgroundColor: '#f0fdf4',
            marginBottom: '20px',
            borderRadius: '8px'
          }}>
            ₹ {Number(carData?.expected_price).toLocaleString()}
          </div>
        )}

        {/* Features */}
        {hasField('features') && features.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
              Features
            </h3>
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {features.slice(0, 10).map((feature: string, index: number) => (
                <div key={index} className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 className="checkmark" style={{ color: '#22c55e', flexShrink: 0 }} size={20} />
                  <span style={{ fontSize: '14px' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="spec-sheet-footer" style={{ position: 'absolute', bottom: '10mm', right: '10mm', left: '10mm', textAlign: 'center', fontSize: '12px', color: '#666' }}>
        <div style={{ borderTop: '2px solid #ddd', paddingTop: '10px' }}>
          <div style={{ fontWeight: '600', marginBottom: '5px' }}>Trusted Dealer by</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>PickMyCar</div>
        </div>
      </div>
    </div>
  );
}
