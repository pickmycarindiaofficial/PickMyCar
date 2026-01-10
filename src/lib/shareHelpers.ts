import { DemandGap } from '@/hooks/useDemandGaps';

export interface LeadData extends DemandGap {
  profiles?: {
    full_name: string;
    phone_number: string;
  };
  brands?: { name: string }[];
  models?: { name: string }[];
  fuel_types?: { name: string }[];
}

export function formatShareMessage(lead: LeadData, platformName: string = 'PickMyCar'): string {
  const name = lead.profiles?.full_name || 'Customer';
  const phone = lead.profiles?.phone_number || 'Not provided';
  const location = lead.city || 'Not specified';
  const budgetMin = lead.budget_min?.toLocaleString('en-IN') || '0';
  const budgetMax = lead.budget_max?.toLocaleString('en-IN') || 'N/A';
  const brands = lead.brand_preference?.join(', ') || 'Any';
  const models = lead.model_preference?.join(', ') || 'Any';
  const fuelTypes = lead.must_haves?.fuel_types?.join(', ') || 'Any';
  const requirements = lead.note || 'No specific requirements';
  
  const priority = lead.priority_score >= 80 ? '🔥 HOT' : 
                   lead.priority_score >= 50 ? '📌 WARM' : '❄️ COLD';

  return `🚗 *New Car Lead from ${platformName}*

👤 *Customer:* ${name}
📱 *Phone:* ${phone}
📍 *Location:* ${location}
💰 *Budget:* ₹${budgetMin} - ₹${budgetMax}
🚙 *Brand:* ${brands}
🏎️ *Model:* ${models}
⛽ *Fuel:* ${fuelTypes}
📝 *Requirements:* ${requirements}

🎯 *Priority:* ${priority}
📅 *Lead Date:* ${new Date(lead.created_at).toLocaleDateString('en-IN')}
🆔 *Lead ID:* ${lead.id.slice(0, 8)}`;
}

export function shareToWhatsApp(lead: LeadData, platformName?: string): void {
  const message = formatShareMessage(lead, platformName);
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

export function shareToTelegram(lead: LeadData, platformName?: string, platformUrl?: string): void {
  const message = formatShareMessage(lead, platformName);
  const url = platformUrl 
    ? `https://t.me/share/url?url=${encodeURIComponent(platformUrl)}&text=${encodeURIComponent(message)}`
    : `https://t.me/share/url?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
