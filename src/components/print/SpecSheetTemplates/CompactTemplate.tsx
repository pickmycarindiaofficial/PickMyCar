import { CheckCircle2 } from "lucide-react";
import "@/lib/printTemplates.css";

interface CompactTemplateProps {
  carData: any;
  dealerProfile: any;
  selectedFields: string[];
}

export default function CompactTemplate({ carData, dealerProfile, selectedFields }: CompactTemplateProps) {
  const hasField = (key: string) => selectedFields.includes(key);

  return (
    <div style={{ width: '210mm', height: '148mm', padding: '5mm', background: 'white', fontSize: '12px' }}>
      {/* Compact Header */}
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
        <div className="flex justify-between items-center">
          <div>
            {dealerProfile?.logo_url && (
              <img src={dealerProfile.logo_url} alt="Logo" style={{ height: '30px' }} />
            )}
          </div>
          <div className="text-right text-sm font-bold">
            {dealerProfile?.phone_number}
          </div>
        </div>
      </div>

      {/* Compact Details */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {hasField('brand_model') && (
          <div>
            <span className="font-bold">Car:</span> {carData?.brands?.name} {carData?.models?.name}
          </div>
        )}
        {hasField('year') && (
          <div>
            <span className="font-bold">Year:</span> {carData?.year_of_make}
          </div>
        )}
        {hasField('km') && (
          <div>
            <span className="font-bold">KM:</span> {carData?.kms_driven?.toLocaleString()}
          </div>
        )}
        {hasField('fuel') && (
          <div>
            <span className="font-bold">Fuel:</span> {carData?.fuel_types?.name}
          </div>
        )}
        {hasField('transmission') && (
          <div>
            <span className="font-bold">Trans:</span> {carData?.transmissions?.name}
          </div>
        )}
        {hasField('ownership') && (
          <div>
            <span className="font-bold">Owner:</span> {carData?.owner_types?.name}
          </div>
        )}
        {hasField('registration_number') && carData?.registration_number && (
          <div>
            <span className="font-bold">Reg:</span> <span style={{ textTransform: 'uppercase' }}>{carData.registration_number}</span>
          </div>
        )}
        {hasField('insurance_validity') && carData?.insurance_status === 'valid' && carData?.insurance_validity && (
          <div>
            <span className="font-bold">Insurance:</span> Valid till {new Date(carData.insurance_validity).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </div>
        )}
        {hasField('insurance_validity') && carData?.insurance_status === 'expired' && (
          <div>
            <span className="font-bold">Insurance:</span> <span style={{ color: '#ea580c', fontWeight: '500' }}>Expired</span>
          </div>
        )}
      </div>

      {/* Compact Price */}
      {hasField('price') && (
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#22c55e',
          textAlign: 'center',
          padding: '10px',
          border: '2px solid #22c55e',
          backgroundColor: '#f0fdf4',
          marginBottom: '10px'
        }}>
          ₹ {Number(carData?.expected_price).toLocaleString()}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
        <span className="font-semibold">PickMyCar Trusted Dealer</span>
      </div>
    </div>
  );
}
