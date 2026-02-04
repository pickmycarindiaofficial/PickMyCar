import { CheckCircle2, Phone } from "lucide-react";
import "@/lib/printTemplates.css";

interface StandardTemplateProps {
  carData: any;
  dealerProfile: any;
  selectedFields: string[];
  customPhone?: string;
}

export default function StandardTemplate({ carData, dealerProfile, selectedFields, customPhone }: StandardTemplateProps) {
  const hasField = (key: string) => selectedFields.includes(key);

  const features = carData?.car_listing_features?.map((clf: any) => clf.features?.name).filter(Boolean) || [];

  return (
    <div className="spec-sheet-container" style={{ width: '210mm', height: '297mm', padding: '10mm', background: 'white', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="spec-sheet-header" style={{ borderBottom: '3px solid #000', paddingBottom: '5px', marginBottom: '5px' }}>
        <div className="flex justify-between items-start">
          <div>
            {dealerProfile?.logo_url && (
              <img
                src={dealerProfile.logo_url}
                alt="Dealer Logo"
                style={{ height: '60px', objectFit: 'contain' }}
              />
            )}
            <div className="mt-1 text-lg font-bold">{dealerProfile?.dealership_name || 'Dealer Name'}</div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 justify-end text-3xl font-extrabold">
              <Phone className="h-8 w-8" />
              <span>{customPhone || dealerProfile?.profiles?.phone_number || 'Contact Number'}</span>
            </div>
            {dealerProfile?.about_text && (
              <div className="text-sm mt-1 text-muted-foreground" style={{ maxWidth: '400px', marginLeft: 'auto', lineHeight: '1.2' }}>
                {dealerProfile.about_text.substring(0, 80)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Car Details Table */}
      <div className="spec-sheet-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <table className="spec-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
          <tbody>
            {hasField('brand_model') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', width: '35%', fontSize: '18px' }}>
                  Brand & Model
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '24px', fontWeight: '800' }}>
                  {carData?.brands?.name} {carData?.models?.name}
                </td>
              </tr>
            )}

            {hasField('variant') && carData?.variant && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Variant
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px', fontWeight: '600' }}>
                  {carData.variant}
                </td>
              </tr>
            )}

            {hasField('year') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Year of Make
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
                  {carData?.year_of_make}
                </td>
              </tr>
            )}

            {hasField('km') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  KM Driven
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
                  {carData?.kms_driven?.toLocaleString()} km
                </td>
              </tr>
            )}

            {hasField('fuel') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Fuel Type
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
                  {carData?.fuel_types?.name}
                </td>
              </tr>
            )}

            {hasField('transmission') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Transmission
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
                  {carData?.transmissions?.name}
                </td>
              </tr>
            )}

            {hasField('ownership') && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Ownership
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
                  {carData?.owner_types?.name}
                </td>
              </tr>
            )}

            {hasField('color') && carData?.color && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Color
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
                  {carData.color}
                </td>
              </tr>
            )}

            {hasField('seats') && carData?.seats && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Seats
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
                  {carData.seats} Seater
                </td>
              </tr>
            )}

            {hasField('category') && carData?.car_categories?.name && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Category
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
                  {carData.car_categories.name}
                </td>
              </tr>
            )}

            {hasField('registration_number') && carData?.registration_number && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Registration No.
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px', textTransform: 'uppercase' }}>
                  {carData.registration_number}
                </td>
              </tr>
            )}

            {hasField('insurance_validity') && carData?.insurance_status === 'valid' && carData?.insurance_validity && (
              <tr>
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Insurance
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px' }}>
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
                <td className="label" style={{ border: '1px solid #333', padding: '5px 12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '18px' }}>
                  Insurance
                </td>
                <td className="value" style={{ border: '1px solid #333', padding: '5px 12px', fontSize: '20px', color: '#ea580c', fontWeight: '600' }}>
                  Expired
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Price Highlight */}
        {hasField('price') && (
          <div className="price-highlight" style={{
            fontSize: '56px',
            fontWeight: '800',
            color: '#22c55e',
            textAlign: 'center',
            padding: '4px 10px',
            border: '4px solid #22c55e',
            backgroundColor: '#f0fdf4',
            marginBottom: '8px',
            borderRadius: '12px',
            lineHeight: 1.1
          }}>
            ₹ {Number(carData?.expected_price).toLocaleString()}
          </div>
        )}

        {/* Features */}
        {hasField('features') && features.length > 0 && (
          <div style={{ marginTop: '0px', flex: 1, overflow: 'hidden' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', borderBottom: '2px solid #000', paddingBottom: '2px' }}>
              Features
            </h3>
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 12px', alignContent: 'start' }}>
              {features.slice(0, 10).map((feature: string, index: number) => (
                <div key={index} className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 className="checkmark" style={{ color: '#22c55e', flexShrink: 0 }} size={24} />
                  <span style={{ fontSize: '22px', fontWeight: '500', lineHeight: 1.2 }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="spec-sheet-footer" style={{ marginTop: 'auto', textAlign: 'center', fontSize: '12px', color: '#666', paddingTop: '5px' }}>
        <div style={{ borderTop: '2px solid #ddd', paddingTop: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontWeight: '600' }}>Trusted Dealer by</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>PickMyCar</div>
        </div>
      </div>
    </div>
  );
}
