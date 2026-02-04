-- ============================================================
-- PickMyCar - Car Brands & Models Seed Script
-- WITH POPULARITY RANKINGS (Based on Indian Market Sales)
-- ============================================================
-- This script populates the brands and models tables with 
-- comprehensive Indian car market data, sorted by popularity.
-- 
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste & Run
--
-- Safe to run multiple times (uses ON CONFLICT handling)
-- ============================================================

-- ============================================================
-- STEP 1: ADD SORT_ORDER COLUMNS IF NOT EXISTS
-- ============================================================
DO $$ 
BEGIN
    -- Add sort_order to brands table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'brands' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE brands ADD COLUMN sort_order INTEGER DEFAULT 999;
    END IF;
    
    -- Add sort_order to models table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE models ADD COLUMN sort_order INTEGER DEFAULT 999;
    END IF;
END $$;

-- ============================================================
-- STEP 2: ENSURE UNIQUE CONSTRAINTS EXIST
-- ============================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'brands_name_unique'
    ) THEN
        ALTER TABLE brands ADD CONSTRAINT brands_name_unique UNIQUE (name);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'models_name_brand_unique'
    ) THEN
        ALTER TABLE models ADD CONSTRAINT models_name_brand_unique UNIQUE (name, brand_id);
    END IF;
END $$;

-- ============================================================
-- STEP 3: INSERT ALL BRANDS WITH POPULARITY RANKING
-- (Ranked by Indian market share and sales volume)
-- ============================================================
INSERT INTO brands (name, is_active, is_luxury, sort_order) VALUES
-- Top Popular Brands (by market share in India)
('Maruti Suzuki', true, false, 1),    -- #1 Market leader ~42% share
('Hyundai', true, false, 2),          -- #2 ~15% market share
('Tata', true, false, 3),             -- #3 Rising fast ~14% share
('Mahindra', true, false, 4),         -- #4 ~10% share
('Kia', true, false, 5),              -- #5 Fast growing
('Toyota', true, false, 6),           -- #6 Strong premium segment
('Honda', true, false, 7),            -- #7 City sedan leader
('MG', true, false, 8),               -- #8 EV and SUV growth
('Skoda', true, false, 9),            -- #9 Premium mass market
('Volkswagen', true, false, 10),      -- #10 Premium hatchbacks
('Renault', true, false, 11),
('Nissan', true, false, 12),
('Jeep', true, false, 13),
('Ford', true, false, 14),            -- Exited but models still sold
('Chevrolet', true, false, 15),
('Datsun', true, false, 16),
('Fiat', true, false, 17),
('Force Motors', true, false, 18),
('Isuzu', true, false, 19),
('Mitsubishi', true, false, 20),
('Opel', true, false, 21),
('Ashok Leyland', true, false, 22),
('Mahindra Renault', true, false, 23),
('Ambassador', true, false, 24),

-- Luxury Brands (sorted by Indian luxury market sales)
('Mercedes-Benz', true, true, 101),   -- #1 Luxury brand in India
('BMW', true, true, 102),             -- #2 Luxury
('Audi', true, true, 103),            -- #3 Luxury
('Volvo', true, true, 104),           -- #4 Luxury - Safety focused
('Lexus', true, true, 105),
('Land Rover', true, true, 106),
('Jaguar', true, true, 107),
('Porsche', true, true, 108),
('Mini', true, true, 109),
('Maserati', true, true, 110),
('Bentley', true, true, 111),
('Lamborghini', true, true, 112),
('Rolls-Royce', true, true, 113)

ON CONFLICT (name) DO UPDATE SET 
    is_active = EXCLUDED.is_active,
    is_luxury = EXCLUDED.is_luxury,
    sort_order = EXCLUDED.sort_order;

-- ============================================================
-- STEP 4: INSERT ALL MODELS WITH POPULARITY RANKING
-- (Ranked by sales within each brand)
-- ============================================================

-- Maruti Suzuki Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Wagon R', 1),       -- Best seller
    ('Swift', 2),         -- #2 best seller
    ('Baleno', 3),        -- Premium hatchback leader
    ('Dzire', 4),         -- Sedan leader
    ('Ertiga', 5),        -- MPV leader
    ('Brezza', 6),        -- Popular compact SUV
    ('Alto', 7),
    ('Alto K10', 8),
    ('Alto 800', 9),
    ('Celerio', 10),
    ('Celerio X', 11),
    ('Grand Vitara', 12), -- New premium SUV
    ('Ignis', 13),
    ('XL6', 14),
    ('S-Cross', 15),
    ('Vitara Brezza', 16),
    ('Swift Dzire', 17),
    ('Eeco', 18),
    ('Omni', 19)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Maruti Suzuki'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Hyundai Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Creta', 1),         -- #1 SUV in India
    ('Venue', 2),         -- Compact SUV leader
    ('i20', 3),           -- Premium hatchback
    ('Grand i10 Nios', 4),
    ('Verna', 5),         -- Sedan
    ('Aura', 6),
    ('i10', 7),
    ('Grand i10', 8),
    ('i20 N Line', 9),
    ('i20 Active', 10),
    ('Santro', 11),
    ('Kona Electric', 12),
    ('Elantra', 13),
    ('Xcent', 14),
    ('Eon', 15)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Hyundai'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Tata Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Nexon', 1),         -- #1 Tata bestseller, EV leader
    ('Punch', 2),         -- Micro SUV hit
    ('Tiago', 3),
    ('Altroz', 4),        -- Premium hatchback
    ('Harrier', 5),       -- Premium SUV
    ('Safari', 6),        -- Flagship SUV
    ('Tigor', 7),
    ('Safari Storme', 8),
    ('Hexa', 9),
    ('Zest', 10),
    ('Bolt', 11),
    ('Aria', 12),
    ('Sumo', 13)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Tata'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Mahindra Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Scorpio N', 1),     -- Bestseller
    ('XUV700', 2),        -- Premium SUV hit
    ('Thar', 3),          -- Lifestyle icon
    ('XUV300', 4),
    ('Bolero', 5),        -- Rural workhorse
    ('Scorpio', 6),
    ('XUV500', 7),
    ('Bolero Neo', 8),
    ('Marazzo', 9),
    ('Alturas G4', 10),
    ('KUV100 NXT', 11),
    ('TUV300', 12),
    ('Verito', 13),
    ('Verito Vibe', 14)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Mahindra'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Kia Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Seltos', 1),        -- Bestseller compact SUV
    ('Sonet', 2),         -- Sub-compact SUV
    ('Carens', 3),        -- MPV
    ('Carnival', 4),      -- Premium MPV
    ('EV6', 5),           -- Premium EV
    ('Carens Clavis', 6),
    ('Carens EV', 7),
    ('EV9', 8),
    ('EV5', 9),
    ('EV3', 10),
    ('Cerato', 11)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Kia'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Toyota Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Innova Crysta', 1), -- MPV king
    ('Fortuner', 2),      -- Full-size SUV leader
    ('Glanza', 3),        -- Baleno rebadge
    ('Urban Cruiser', 4), -- Brezza rebadge
    ('Innova', 5),
    ('Camry', 6),         -- Hybrid sedan
    ('Vellfire', 7),      -- Luxury MPV
    ('Yaris', 8),
    ('Corolla Altis', 9),
    ('Etios', 10),
    ('Etios Liva', 11),
    ('Etios Cross', 12)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Toyota'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Honda Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('City', 1),          -- Sedan king
    ('Amaze', 2),         -- Compact sedan
    ('WR-V', 3),
    ('Jazz', 4),
    ('CR-V', 5),
    ('Civic', 6),
    ('BR-V', 7),
    ('Brio', 8),
    ('Mobilio', 9)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Honda'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- MG Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Hector', 1),        -- Connected car pioneer
    ('Astor', 2),
    ('ZS EV', 3),         -- Popular EV
    ('Hector Plus', 4),
    ('Gloster', 5),       -- Premium SUV
    ('Comet EV', 6),
    ('Windsor EV', 7),
    ('Cyberster', 8),
    ('M9', 9)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'MG'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Skoda Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Kushaq', 1),        -- Bestseller
    ('Slavia', 2),        -- Sedan
    ('Kodiaq', 3),
    ('Octavia', 4),
    ('Superb', 5),
    ('Kushaq Facelift', 6),
    ('Kylaq', 7),
    ('Karoq', 8),
    ('Rapid', 9),
    ('Fabia', 10),
    ('Fabia Scout', 11),
    ('Laura', 12),
    ('Yeti', 13),
    ('Enyaq', 14),
    ('Elroq', 15)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Skoda'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Volkswagen Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Virtus', 1),        -- New sedan
    ('Taigun', 2),        -- SUV (adding this popular model)
    ('Polo', 3),
    ('Vento', 4),
    ('Tiguan', 5),
    ('Ameo', 6),
    ('Jetta', 7),
    ('Beetle', 8)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Volkswagen'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Renault Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Kiger', 1),         -- Bestseller
    ('Triber', 2),        -- Affordable MPV
    ('Duster', 3),
    ('Kwid', 4),          -- Adding popular entry model
    ('Captur', 5),
    ('Lodgy', 6),
    ('Koleos', 7),
    ('Scala', 8),
    ('Pulse', 9)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Renault'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Nissan Models (by sales popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Magnite', 1),       -- Only current model, bestseller
    ('Kicks', 2),         -- Adding this model
    ('Terrano', 3),
    ('Micra', 4),
    ('Sunny', 5)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Nissan'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Ford Models (by sales popularity - discontinued but still in used market)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('EcoSport', 1),
    ('Endeavour', 2),
    ('Figo', 3),
    ('Aspire', 4),
    ('Freestyle', 5),
    ('Fiesta', 6)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Ford'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Jeep Models
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Compass', 1),
    ('Meridian', 2),
    ('Wrangler', 3)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Jeep'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- LUXURY BRAND MODELS
-- ============================================================

-- Mercedes-Benz Models (by popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('C-Class', 1),       -- Bestseller luxury sedan
    ('E-Class', 2),       -- Executive sedan
    ('GLC', 3),           -- SUV bestseller
    ('A-Class', 4),
    ('GLA', 5),
    ('GLE', 6),
    ('S-Class', 7),       -- Flagship
    ('GLS', 8),
    ('CLA', 9),
    ('B-Class', 10)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Mercedes-Benz'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- BMW Models (by popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('3 Series', 1),           -- Bestseller
    ('5 Series', 2),
    ('X1', 3),                 -- Entry SUV
    ('X3', 4),
    ('X5', 5),
    ('2 Series Gran Coupe', 6),
    ('3 Series Gran Limousine', 7),
    ('7 Series', 8),
    ('X7', 9),
    ('iX', 10),                -- EV
    ('i7', 11),
    ('X4', 12),
    ('X6', 13),
    ('Z4', 14),
    ('M Series', 15),
    ('1 Series', 16),
    ('2 Series', 17),
    ('3 Series GT', 18),
    ('4 Series', 19),
    ('5 Series GT', 20),
    ('6 Series', 21),
    ('6 Series GT', 22),
    ('X4 M40i', 23),
    ('X5 M', 24)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'BMW'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Audi Models (by popularity)
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Q3', 1),            -- Entry SUV
    ('A4', 2),            -- Sedan
    ('Q5', 3),
    ('A6', 4),
    ('Q7', 5),
    ('A3', 6),
    ('Q8', 7),
    ('e-tron GT', 8),
    ('Q8 e-tron', 9),
    ('RS Q8', 10),
    ('A3 Cabriolet', 11),
    ('A5', 12),
    ('A7', 13),
    ('A8', 14),
    ('S5', 15),
    ('Q3 Sportback', 16),
    ('Q8 Sportback e-tron', 17)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Audi'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Volvo Models
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('XC40', 1),          -- Bestseller, adding this
    ('XC60', 2),
    ('XC90', 3),
    ('S60', 4),           -- Adding sedan
    ('S90', 5)            -- Adding flagship sedan
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Volvo'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Land Rover Models
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Range Rover Evoque', 1),
    ('Discovery Sport', 2),
    ('Defender', 3),
    ('Range Rover Sport', 4),
    ('Range Rover', 5),
    ('Range Rover Velar', 6),
    ('Discovery', 7),
    ('Freelander 2', 8)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Land Rover'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Lexus Models
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('ES', 1),
    ('NX', 2),            -- Adding popular SUV
    ('RX', 3),            -- Adding SUV
    ('ES 300h Exquisite', 4),
    ('LS', 5),            -- Adding flagship
    ('LX', 6)             -- Adding full-size SUV
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Lexus'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Jaguar Models
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('F-Pace', 1),
    ('XE', 2),            -- Adding sedan
    ('XF', 3),            -- Adding sedan
    ('I-Pace', 4)         -- Adding EV
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Jaguar'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Porsche Models
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Cayenne', 1),
    ('Macan', 2),         -- Adding popular SUV
    ('911', 3),           -- Adding sports car
    ('Panamera', 4),      -- Adding sedan
    ('Taycan', 5)         -- Adding EV
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Porsche'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Mini Models
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Cooper', 1),        -- Adding base model
    ('Cooper S', 2),
    ('Countryman', 3)     -- Adding SUV variant
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Mini'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Other Luxury Brands (single/few models)

-- Bentley
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Continental GT', 1),
    ('Flying Spur', 2),
    ('Bentayga', 3)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Bentley'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Lamborghini
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Urus', 1),          -- SUV bestseller
    ('Huracan', 2),
    ('Revuelto', 3)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Lamborghini'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Maserati
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Levante', 1),
    ('Ghibli', 2),
    ('Quattroporte', 3)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Maserati'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Rolls-Royce
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Ghost', 1),
    ('Cullinan', 2),      -- SUV
    ('Phantom', 3)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Rolls-Royce'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- OTHER BRANDS (Less popular / Discontinued)
-- ============================================================

-- Chevrolet
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Cruze', 1),
    ('Beat', 2),
    ('Captiva', 3),
    ('Sail U-VA', 4)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Chevrolet'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Datsun
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Redi-Go', 1),
    ('GO', 2),
    ('GO Plus', 3)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Datsun'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Fiat
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Punto', 1),
    ('Linea', 2),
    ('Avventura', 3)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Fiat'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Force Motors
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Gurkha', 1)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Force Motors'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Isuzu
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('D-Max V-Cross', 1),
    ('MU-X', 2)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Isuzu'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Mitsubishi
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Pajero Sport', 1),
    ('Outlander', 2),
    ('Lancer', 3)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Mitsubishi'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Opel
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Corsa', 1)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Opel'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Ashok Leyland
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Stile', 1)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Ashok Leyland'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Mahindra Renault
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Logan', 1)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Mahindra Renault'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- Ambassador
INSERT INTO models (name, brand_id, is_active, sort_order)
SELECT m.name, b.id, true, m.sort_order
FROM (VALUES 
    ('Classic', 1),
    ('Grand', 2)
) AS m(name, sort_order)
CROSS JOIN brands b WHERE b.name = 'Ambassador'
ON CONFLICT (name, brand_id) DO UPDATE SET is_active = true, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================================

-- Count total brands
SELECT 'Total Brands' as metric, COUNT(*) as count FROM brands;

-- Count total models
SELECT 'Total Models' as metric, COUNT(*) as count FROM models;

-- Count luxury brands
SELECT 'Luxury Brands' as metric, COUNT(*) as count FROM brands WHERE is_luxury = true;

-- Top 10 brands by popularity
SELECT 
    name as brand_name,
    is_luxury,
    sort_order as popularity_rank
FROM brands
ORDER BY sort_order ASC
LIMIT 10;

-- Models per brand (sorted by brand popularity)
SELECT 
    b.name as brand_name,
    b.sort_order as brand_rank,
    COUNT(m.id) as model_count
FROM brands b
LEFT JOIN models m ON m.brand_id = b.id
GROUP BY b.id, b.name, b.sort_order
ORDER BY b.sort_order ASC;
