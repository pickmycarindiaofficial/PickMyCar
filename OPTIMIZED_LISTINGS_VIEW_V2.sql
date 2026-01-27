-- ============================================================
-- PRODUCTION GRADE FIX: High-Performance Listings View (v2)
-- This version uses security_invoker to ensure RLS is followed
-- and includes more robust COALESCE for seller info.
-- ============================================================

-- Drop old view first
DROP VIEW IF EXISTS car_listings_detailed;

-- Create flattened view with security_invoker=true
CREATE OR REPLACE VIEW car_listings_detailed 
WITH (security_invoker = true)
AS
SELECT 
    cl.*,
    -- Unified Seller Info (Robust COALESCE)
    CASE 
        WHEN cl.seller_type = 'individual' THEN COALESCE(p.full_name, 'Individual Seller')
        WHEN cl.seller_type = 'dealer' THEN COALESCE(da.dealership_name, da.owner_name, p.full_name, 'Dealer')
        ELSE COALESCE(p.full_name, 'Seller')
    END as unified_seller_name,
    CASE 
        WHEN cl.seller_type = 'individual' THEN p.phone_number
        WHEN cl.seller_type = 'dealer' THEN COALESCE(da.phone_number, p.phone_number)
        ELSE p.phone_number
    END as unified_seller_phone,
    
    -- Essential Labels
    b.name as brand_name,
    b.logo_url as brand_logo_url,
    m.name as model_name,
    ft.name as fuel_type_name,
    tr.name as transmission_name,
    bt.name as body_type_name,
    ot.name as owner_type_name,
    ci.name as city_name,
    ci.state as city_state,
    cc.name as category_name,
    cc.badge_color as category_badge_color
FROM car_listings cl
LEFT JOIN profiles p ON cl.seller_id = p.id
LEFT JOIN dealer_accounts da ON cl.seller_id = da.id
LEFT JOIN brands b ON cl.brand_id = b.id
LEFT JOIN models m ON cl.model_id = m.id
LEFT JOIN fuel_types ft ON cl.fuel_type_id = ft.id
LEFT JOIN transmissions tr ON cl.transmission_id = tr.id
LEFT JOIN body_types bt ON cl.body_type_id = bt.id
LEFT JOIN owner_types ot ON cl.owner_type_id = ot.id
LEFT JOIN cities ci ON cl.city_id = ci.id
LEFT JOIN car_categories cc ON cl.category_id = cc.id;

-- Grant permissions (though security_invoker relies on underlying table RLS)
GRANT SELECT ON car_listings_detailed TO anon, authenticated, service_role;

SELECT 'High-performance listings view (v2) with security_invoker created!' as status;
