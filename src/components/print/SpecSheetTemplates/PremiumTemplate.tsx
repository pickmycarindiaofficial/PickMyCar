import { CheckCircle2, Phone } from "lucide-react";
import "@/lib/printTemplates.css";

interface PremiumTemplateProps {
  carData: any;
  dealerProfile: any;
  selectedFields: string[];
}

export default function PremiumTemplate({ carData, dealerProfile, selectedFields }: PremiumTemplateProps) {
  const hasField = (key: string) => selectedFields.includes(key);
  const features = carData?.car_listing_features?.map((clf: any) => clf.features?.name).filter(Boolean) || [];

  const carImage = carData?.photos?.[0]?.large_url || carData?.photos?.[0]?.url;

  return (
    <div style={{ width: '210mm', height: '297mm', background: 'white', position: 'relative', overflow: 'hidden' }}>
      {/* Premium Header with Image */}
      {carImage && (
        <div style={{
          height: '100mm',
          background: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${carImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '20mm',
          color: 'white'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            {carData?.brands?.name} {carData?.models?.name}
          </div>
          {carData?.variant && (
            <div style={{ fontSize: '20px', marginTop: '8px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {carData.variant}
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div style={{ padding: '15mm' }}>
        {/* Dealer Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #e5e7eb' }}>
          <div>
            {dealerProfile?.logo_url && (
              <img src={dealerProfile.logo_url} alt="Logo" style={{ height: '50px' }} />
            )}
          </div>
          <div className="text-right">
            <div style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <Phone size={20} />
              {dealerProfile?.phone_number}
            </div>
          </div>
        </div>

        {/* Premium Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
          {hasField('year') && (
            <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Year</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{carData?.year_of_make}</div>
            </div>
          )}

          {hasField('km') && (
            <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Kilometers</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{carData?.kms_driven?.toLocaleString()}</div>
            </div>
          )}

          {hasField('fuel') && (
            <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Fuel Type</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{carData?.fuel_types?.name}</div>
            </div>
          )}

          {hasField('transmission') && (
            <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Transmission</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{carData?.transmissions?.name}</div>
            </div>
          )}

          {hasField('registration_number') && carData?.registration_number && (
            <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Registration</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>{carData.registration_number}</div>
            </div>
          )}

          {hasField('insurance_validity') && carData?.insurance_status === 'valid' && carData?.insurance_validity && (
            <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Insurance</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Valid till {new Date(carData.insurance_validity).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
          )}

          {hasField('insurance_validity') && carData?.insurance_status === 'expired' && (
            <div style={{ padding: '15px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Insurance</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea580c' }}>Expired</div>
            </div>
          )}
        </div>

        {/* Premium Price */}
        {hasField('price') && (
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '4px', opacity: 0.9 }}>Asking Price</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
              ₹ {Number(carData?.expected_price).toLocaleString()}
            </div>
          </div>
        )}

        {/* Features */}
        {hasField('features') && features.length > 0 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Key Features</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {features.slice(0, 8).map((feature: string, index: number) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 style={{ color: '#22c55e', flexShrink: 0 }} size={18} />
                  <span style={{ fontSize: '13px' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Premium Footer */}
      <div style={{
        position: 'absolute',
        bottom: '15mm',
        left: '15mm',
        right: '15mm',
        textAlign: 'center',
        padding: '15px',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          Trusted Dealer Certified by
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#000' }}>
          PickMyCar
        </div>
      </div>
    </div>
  );
}
