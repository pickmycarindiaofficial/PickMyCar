-- ============================================================
-- PickMyCar - Model Defaults Migration (Seats & Body Type)
-- ============================================================
-- This script adds default_seats and default_body_type columns
-- to the models table and populates them based on research.
--
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================================

-- ============================================================
-- STEP 1: ADD COLUMNS TO MODELS TABLE IF NOT EXISTS
-- ============================================================
DO $$ 
BEGIN
    -- Add default_seats column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'default_seats'
    ) THEN
        ALTER TABLE models ADD COLUMN default_seats INTEGER;
    END IF;
    
    -- Add default_body_type column (stores body type name for simplicity)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'default_body_type'
    ) THEN
        ALTER TABLE models ADD COLUMN default_body_type TEXT;
    END IF;
END $$;

-- ============================================================
-- STEP 2: ENSURE BODY_TYPES TABLE HAS REQUIRED TYPES
-- ============================================================
INSERT INTO body_types (name, is_active) VALUES
('Hatchback', true),
('Sedan', true),
('SUV', true),
('Compact SUV', true),
('MPV', true),
('Crossover', true),
('Pickup', true),
('Convertible', true),
('Coupe', true),
('MUV', true),
('Sports Car', true),
('Luxury SUV', true),
('Electric', true),
('Van', true)
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- ============================================================
-- STEP 3: UPDATE MARUTI SUZUKI MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Wagon R' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Swift' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Baleno' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Dzire' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Ertiga' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Brezza' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 4, default_body_type = 'Hatchback'
WHERE name = 'Alto' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 4, default_body_type = 'Hatchback'
WHERE name = 'Alto K10' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 4, default_body_type = 'Hatchback'
WHERE name = 'Alto 800' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Celerio' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'Celerio X' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Grand Vitara' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'Ignis' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 6, default_body_type = 'MPV'
WHERE name = 'XL6' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'S-Cross' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Vitara Brezza' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Swift Dzire' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 7, default_body_type = 'Van'
WHERE name = 'Eeco' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

UPDATE models SET default_seats = 8, default_body_type = 'Van'
WHERE name = 'Omni' AND brand_id = (SELECT id FROM brands WHERE name = 'Maruti Suzuki');

-- ============================================================
-- STEP 4: UPDATE HYUNDAI MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Creta' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Venue' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'i20' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Grand i10 Nios' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Verna' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Aura' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'i10' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Grand i10' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'i20 N Line' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'i20 Active' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Santro' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'Kona Electric' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Elantra' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Xcent' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Eon' AND brand_id = (SELECT id FROM brands WHERE name = 'Hyundai');

-- ============================================================
-- STEP 5: UPDATE TATA MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Nexon' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Punch' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Tiago' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Altroz' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Harrier' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Safari' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Tigor' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Safari Storme' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Hexa' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Zest' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Bolt' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Aria' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

UPDATE models SET default_seats = 9, default_body_type = 'MUV'
WHERE name = 'Sumo' AND brand_id = (SELECT id FROM brands WHERE name = 'Tata');

-- ============================================================
-- STEP 6: UPDATE MAHINDRA MODELS
-- ============================================================
UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Scorpio N' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'XUV700' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 4, default_body_type = 'SUV'
WHERE name = 'Thar' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'XUV300' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Bolero' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Scorpio' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'XUV500' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Bolero Neo' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 8, default_body_type = 'MPV'
WHERE name = 'Marazzo' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'Alturas G4' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 6, default_body_type = 'Compact SUV'
WHERE name = 'KUV100 NXT' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'TUV300' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Verito' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Verito Vibe' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra');

-- ============================================================
-- STEP 7: UPDATE KIA MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Seltos' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Sonet' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Carens' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 8, default_body_type = 'MPV'
WHERE name = 'Carnival' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'EV6' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Carens Clavis' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 7, default_body_type = 'Electric'
WHERE name = 'Carens EV' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 7, default_body_type = 'Electric'
WHERE name = 'EV9' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'EV5' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'EV3' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Cerato' AND brand_id = (SELECT id FROM brands WHERE name = 'Kia');

-- ============================================================
-- STEP 8: UPDATE TOYOTA MODELS
-- ============================================================
UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Innova Crysta' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Fortuner' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Glanza' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Urban Cruiser' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Innova' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Camry' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'Vellfire' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Yaris' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Corolla Altis' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Etios' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Etios Liva' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'Etios Cross' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota');

-- ============================================================
-- STEP 9: UPDATE HONDA MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'City' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Amaze' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'WR-V' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Jazz' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'CR-V' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Civic' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'BR-V' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Brio' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Mobilio' AND brand_id = (SELECT id FROM brands WHERE name = 'Honda');

-- ============================================================
-- STEP 10: UPDATE MG MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Hector' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Astor' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'ZS EV' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

UPDATE models SET default_seats = 6, default_body_type = 'SUV'
WHERE name = 'Hector Plus' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'Gloster' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

UPDATE models SET default_seats = 4, default_body_type = 'Electric'
WHERE name = 'Comet EV' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'Windsor EV' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

UPDATE models SET default_seats = 2, default_body_type = 'Sports Car'
WHERE name = 'Cyberster' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

UPDATE models SET default_seats = 7, default_body_type = 'Electric'
WHERE name = 'M9' AND brand_id = (SELECT id FROM brands WHERE name = 'MG');

-- ============================================================
-- STEP 11: UPDATE SKODA MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Kushaq' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Slavia' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Kodiaq' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Octavia' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Superb' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Kushaq Facelift' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Kylaq' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Karoq' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Rapid' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Fabia' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'Fabia Scout' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Laura' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Yeti' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'Enyaq' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'Elroq' AND brand_id = (SELECT id FROM brands WHERE name = 'Skoda');

-- ============================================================
-- STEP 12: UPDATE VOLKSWAGEN MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Virtus' AND brand_id = (SELECT id FROM brands WHERE name = 'Volkswagen');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Taigun' AND brand_id = (SELECT id FROM brands WHERE name = 'Volkswagen');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Polo' AND brand_id = (SELECT id FROM brands WHERE name = 'Volkswagen');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Vento' AND brand_id = (SELECT id FROM brands WHERE name = 'Volkswagen');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Tiguan' AND brand_id = (SELECT id FROM brands WHERE name = 'Volkswagen');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Ameo' AND brand_id = (SELECT id FROM brands WHERE name = 'Volkswagen');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Jetta' AND brand_id = (SELECT id FROM brands WHERE name = 'Volkswagen');

UPDATE models SET default_seats = 4, default_body_type = 'Coupe'
WHERE name = 'Beetle' AND brand_id = (SELECT id FROM brands WHERE name = 'Volkswagen');

-- ============================================================
-- STEP 13: UPDATE RENAULT MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Kiger' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Triber' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Duster' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Kwid' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Captur' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'Lodgy' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Koleos' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Scala' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Pulse' AND brand_id = (SELECT id FROM brands WHERE name = 'Renault');

-- ============================================================
-- STEP 14: UPDATE NISSAN MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Magnite' AND brand_id = (SELECT id FROM brands WHERE name = 'Nissan');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Kicks' AND brand_id = (SELECT id FROM brands WHERE name = 'Nissan');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Terrano' AND brand_id = (SELECT id FROM brands WHERE name = 'Nissan');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Micra' AND brand_id = (SELECT id FROM brands WHERE name = 'Nissan');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Sunny' AND brand_id = (SELECT id FROM brands WHERE name = 'Nissan');

-- ============================================================
-- STEP 15: UPDATE FORD MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'EcoSport' AND brand_id = (SELECT id FROM brands WHERE name = 'Ford');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Endeavour' AND brand_id = (SELECT id FROM brands WHERE name = 'Ford');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Figo' AND brand_id = (SELECT id FROM brands WHERE name = 'Ford');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Aspire' AND brand_id = (SELECT id FROM brands WHERE name = 'Ford');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'Freestyle' AND brand_id = (SELECT id FROM brands WHERE name = 'Ford');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Fiesta' AND brand_id = (SELECT id FROM brands WHERE name = 'Ford');

-- ============================================================
-- STEP 16: UPDATE JEEP MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Compass' AND brand_id = (SELECT id FROM brands WHERE name = 'Jeep');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Meridian' AND brand_id = (SELECT id FROM brands WHERE name = 'Jeep');

UPDATE models SET default_seats = 4, default_body_type = 'SUV'
WHERE name = 'Wrangler' AND brand_id = (SELECT id FROM brands WHERE name = 'Jeep');

-- ============================================================
-- STEP 17: UPDATE MERCEDES-BENZ MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'C-Class' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'E-Class' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'GLC' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'A-Class' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'GLA' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'GLE' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'S-Class' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'GLS' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 5, default_body_type = 'Coupe'
WHERE name = 'CLA' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'B-Class' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz');

-- ============================================================
-- STEP 18: UPDATE BMW MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = '3 Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = '5 Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'X1' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'X3' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'X5' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Coupe'
WHERE name = '2 Series Gran Coupe' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = '3 Series Gran Limousine' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = '7 Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'X7' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'iX' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'i7' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'X4' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'X6' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 2, default_body_type = 'Convertible'
WHERE name = 'Z4' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Sports Car'
WHERE name = 'M Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = '1 Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Coupe'
WHERE name = '2 Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = '3 Series GT' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Coupe'
WHERE name = '4 Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = '5 Series GT' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 4, default_body_type = 'Coupe'
WHERE name = '6 Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = '6 Series GT' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'X4 M40i' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'X5 M' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW');

-- ============================================================
-- STEP 19: UPDATE AUDI MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Q3' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'A4' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Q5' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'A6' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'Q7' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'A3' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Luxury SUV'
WHERE name = 'Q8' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 4, default_body_type = 'Electric'
WHERE name = 'e-tron GT' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'Q8 e-tron' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Luxury SUV'
WHERE name = 'RS Q8' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 4, default_body_type = 'Convertible'
WHERE name = 'A3 Cabriolet' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Coupe'
WHERE name = 'A5' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'A7' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'A8' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Coupe'
WHERE name = 'S5' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Q3 Sportback' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'Q8 Sportback e-tron' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi');

-- ============================================================
-- STEP 20: UPDATE VOLVO MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'XC40' AND brand_id = (SELECT id FROM brands WHERE name = 'Volvo');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'XC60' AND brand_id = (SELECT id FROM brands WHERE name = 'Volvo');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'XC90' AND brand_id = (SELECT id FROM brands WHERE name = 'Volvo');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'S60' AND brand_id = (SELECT id FROM brands WHERE name = 'Volvo');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'S90' AND brand_id = (SELECT id FROM brands WHERE name = 'Volvo');

-- ============================================================
-- STEP 21: UPDATE LAND ROVER MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Range Rover Evoque' AND brand_id = (SELECT id FROM brands WHERE name = 'Land Rover');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Discovery Sport' AND brand_id = (SELECT id FROM brands WHERE name = 'Land Rover');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Defender' AND brand_id = (SELECT id FROM brands WHERE name = 'Land Rover');

UPDATE models SET default_seats = 5, default_body_type = 'Luxury SUV'
WHERE name = 'Range Rover Sport' AND brand_id = (SELECT id FROM brands WHERE name = 'Land Rover');

UPDATE models SET default_seats = 5, default_body_type = 'Luxury SUV'
WHERE name = 'Range Rover' AND brand_id = (SELECT id FROM brands WHERE name = 'Land Rover');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Range Rover Velar' AND brand_id = (SELECT id FROM brands WHERE name = 'Land Rover');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Discovery' AND brand_id = (SELECT id FROM brands WHERE name = 'Land Rover');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Freelander 2' AND brand_id = (SELECT id FROM brands WHERE name = 'Land Rover');

-- ============================================================
-- STEP 22: UPDATE LEXUS MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'ES' AND brand_id = (SELECT id FROM brands WHERE name = 'Lexus');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'NX' AND brand_id = (SELECT id FROM brands WHERE name = 'Lexus');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'RX' AND brand_id = (SELECT id FROM brands WHERE name = 'Lexus');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'ES 300h Exquisite' AND brand_id = (SELECT id FROM brands WHERE name = 'Lexus');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'LS' AND brand_id = (SELECT id FROM brands WHERE name = 'Lexus');

UPDATE models SET default_seats = 7, default_body_type = 'Luxury SUV'
WHERE name = 'LX' AND brand_id = (SELECT id FROM brands WHERE name = 'Lexus');

-- ============================================================
-- STEP 23: UPDATE JAGUAR MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'F-Pace' AND brand_id = (SELECT id FROM brands WHERE name = 'Jaguar');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'XE' AND brand_id = (SELECT id FROM brands WHERE name = 'Jaguar');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'XF' AND brand_id = (SELECT id FROM brands WHERE name = 'Jaguar');

UPDATE models SET default_seats = 5, default_body_type = 'Electric'
WHERE name = 'I-Pace' AND brand_id = (SELECT id FROM brands WHERE name = 'Jaguar');

-- ============================================================
-- STEP 24: UPDATE PORSCHE MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Luxury SUV'
WHERE name = 'Cayenne' AND brand_id = (SELECT id FROM brands WHERE name = 'Porsche');

UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Macan' AND brand_id = (SELECT id FROM brands WHERE name = 'Porsche');

UPDATE models SET default_seats = 4, default_body_type = 'Sports Car'
WHERE name = '911' AND brand_id = (SELECT id FROM brands WHERE name = 'Porsche');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Panamera' AND brand_id = (SELECT id FROM brands WHERE name = 'Porsche');

UPDATE models SET default_seats = 4, default_body_type = 'Electric'
WHERE name = 'Taycan' AND brand_id = (SELECT id FROM brands WHERE name = 'Porsche');

-- ============================================================
-- STEP 25: UPDATE MINI MODELS
-- ============================================================
UPDATE models SET default_seats = 4, default_body_type = 'Hatchback'
WHERE name = 'Cooper' AND brand_id = (SELECT id FROM brands WHERE name = 'Mini');

UPDATE models SET default_seats = 4, default_body_type = 'Hatchback'
WHERE name = 'Cooper S' AND brand_id = (SELECT id FROM brands WHERE name = 'Mini');

UPDATE models SET default_seats = 5, default_body_type = 'Compact SUV'
WHERE name = 'Countryman' AND brand_id = (SELECT id FROM brands WHERE name = 'Mini');

-- ============================================================
-- STEP 26: UPDATE BENTLEY MODELS
-- ============================================================
UPDATE models SET default_seats = 4, default_body_type = 'Coupe'
WHERE name = 'Continental GT' AND brand_id = (SELECT id FROM brands WHERE name = 'Bentley');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Flying Spur' AND brand_id = (SELECT id FROM brands WHERE name = 'Bentley');

UPDATE models SET default_seats = 5, default_body_type = 'Luxury SUV'
WHERE name = 'Bentayga' AND brand_id = (SELECT id FROM brands WHERE name = 'Bentley');

-- ============================================================
-- STEP 27: UPDATE LAMBORGHINI MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Luxury SUV'
WHERE name = 'Urus' AND brand_id = (SELECT id FROM brands WHERE name = 'Lamborghini');

UPDATE models SET default_seats = 2, default_body_type = 'Sports Car'
WHERE name = 'Huracan' AND brand_id = (SELECT id FROM brands WHERE name = 'Lamborghini');

UPDATE models SET default_seats = 2, default_body_type = 'Sports Car'
WHERE name = 'Revuelto' AND brand_id = (SELECT id FROM brands WHERE name = 'Lamborghini');

-- ============================================================
-- STEP 28: UPDATE MASERATI MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'SUV'
WHERE name = 'Levante' AND brand_id = (SELECT id FROM brands WHERE name = 'Maserati');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Ghibli' AND brand_id = (SELECT id FROM brands WHERE name = 'Maserati');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Quattroporte' AND brand_id = (SELECT id FROM brands WHERE name = 'Maserati');

-- ============================================================
-- STEP 29: UPDATE ROLLS-ROYCE MODELS
-- ============================================================
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Ghost' AND brand_id = (SELECT id FROM brands WHERE name = 'Rolls-Royce');

UPDATE models SET default_seats = 5, default_body_type = 'Luxury SUV'
WHERE name = 'Cullinan' AND brand_id = (SELECT id FROM brands WHERE name = 'Rolls-Royce');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Phantom' AND brand_id = (SELECT id FROM brands WHERE name = 'Rolls-Royce');

-- ============================================================
-- STEP 30: UPDATE OTHER BRAND MODELS
-- ============================================================

-- Chevrolet
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Cruze' AND brand_id = (SELECT id FROM brands WHERE name = 'Chevrolet');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Beat' AND brand_id = (SELECT id FROM brands WHERE name = 'Chevrolet');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Captiva' AND brand_id = (SELECT id FROM brands WHERE name = 'Chevrolet');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Sail U-VA' AND brand_id = (SELECT id FROM brands WHERE name = 'Chevrolet');

-- Datsun
UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Redi-Go' AND brand_id = (SELECT id FROM brands WHERE name = 'Datsun');

UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'GO' AND brand_id = (SELECT id FROM brands WHERE name = 'Datsun');

UPDATE models SET default_seats = 7, default_body_type = 'MPV'
WHERE name = 'GO Plus' AND brand_id = (SELECT id FROM brands WHERE name = 'Datsun');

-- Fiat
UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Punto' AND brand_id = (SELECT id FROM brands WHERE name = 'Fiat');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Linea' AND brand_id = (SELECT id FROM brands WHERE name = 'Fiat');

UPDATE models SET default_seats = 5, default_body_type = 'Crossover'
WHERE name = 'Avventura' AND brand_id = (SELECT id FROM brands WHERE name = 'Fiat');

-- Force Motors
UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Gurkha' AND brand_id = (SELECT id FROM brands WHERE name = 'Force Motors');

-- Isuzu
UPDATE models SET default_seats = 5, default_body_type = 'Pickup'
WHERE name = 'D-Max V-Cross' AND brand_id = (SELECT id FROM brands WHERE name = 'Isuzu');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'MU-X' AND brand_id = (SELECT id FROM brands WHERE name = 'Isuzu');

-- Mitsubishi
UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Pajero Sport' AND brand_id = (SELECT id FROM brands WHERE name = 'Mitsubishi');

UPDATE models SET default_seats = 7, default_body_type = 'SUV'
WHERE name = 'Outlander' AND brand_id = (SELECT id FROM brands WHERE name = 'Mitsubishi');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Lancer' AND brand_id = (SELECT id FROM brands WHERE name = 'Mitsubishi');

-- Opel
UPDATE models SET default_seats = 5, default_body_type = 'Hatchback'
WHERE name = 'Corsa' AND brand_id = (SELECT id FROM brands WHERE name = 'Opel');

-- Ashok Leyland
UPDATE models SET default_seats = 8, default_body_type = 'MPV'
WHERE name = 'Stile' AND brand_id = (SELECT id FROM brands WHERE name = 'Ashok Leyland');

-- Mahindra Renault
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Logan' AND brand_id = (SELECT id FROM brands WHERE name = 'Mahindra Renault');

-- Ambassador
UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Classic' AND brand_id = (SELECT id FROM brands WHERE name = 'Ambassador');

UPDATE models SET default_seats = 5, default_body_type = 'Sedan'
WHERE name = 'Grand' AND brand_id = (SELECT id FROM brands WHERE name = 'Ambassador');

-- ============================================================
-- STEP 31: VERIFICATION QUERY
-- ============================================================
SELECT 
    b.name AS brand,
    m.name AS model,
    m.default_seats,
    m.default_body_type
FROM models m
JOIN brands b ON m.brand_id = b.id
WHERE m.default_seats IS NOT NULL
ORDER BY b.sort_order, m.sort_order
LIMIT 50;

-- Count models with defaults set
SELECT 
    'Models with Defaults' AS metric,
    COUNT(*) AS count
FROM models
WHERE default_seats IS NOT NULL AND default_body_type IS NOT NULL;

-- Count models missing defaults
SELECT 
    'Models Missing Defaults' AS metric,
    COUNT(*) AS count
FROM models
WHERE default_seats IS NULL OR default_body_type IS NULL;
