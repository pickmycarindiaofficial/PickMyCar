
// Basic templates for car descriptions
const TEMPLATES = {
    intro: [
        "Unveil the power and elegance of this {year} {brand} {model}.",
        "Check out this well-maintained {year} {brand} {model} {variant}.",
        "Drive home your dream car with this {brand} {model} {variant}.",
        "Excellent condition {year} {brand} {model} looking for a new home."
    ],
    specs: [
        "Powered by a {fuel} engine paired with a {transmission} transmission.",
        "Features a reliable {fuel} engine and smooth {transmission} gearbox.",
        "This {fuel} variant comes with manual transmission for complete control."
    ],
    condition: [
        "Vehicle is in {condition} condition with {kms} kms on the odometer.",
        "Sparingly used, having covered only {kms} kms.",
        "Well driven: {kms} kms and counting."
    ],
    owner: [
        "Single owner vehicle.",
        "Currently with its {owner} owner.",
        "Direct from {owner} owner."
    ],
    closing: [
        "Contact us for a test drive today!",
        "Don't miss out on this deal.",
        "Call now to book a viewing."
    ]
};

const HIGHLIGHTS_POOL = [
    "Well Maintained", "Single Owner", "Service History Available",
    "Accident Free", "Original Paint", "Low Mileage",
    "New Tyres", "Recently Serviced", "Powerful AC",
    "Music System", "Power Windows", "Central Locking",
    "Airbags", "ABS", "Alloy Wheels",
    "Sunroof", "Leather Seats", "Reverse Camera",
    "Parking Sensors", "Bluetooth Connectivity"
];

function getRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

interface CarDetails {
    brand: string;
    model: string;
    variant: string;
    year: number;
    kms: number;
    fuel: string;
    transmission: string;
    color: string;
    condition: string;
    owner?: string;
}

export const MockAIService = {
    generateContent: async (type: 'description' | 'highlights', details: CarDetails) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (type === 'description') {
            const intro = getRandom(TEMPLATES.intro)
                .replace('{year}', details.year.toString())
                .replace('{brand}', details.brand)
                .replace('{model}', details.model)
                .replace('{variant}', details.variant);

            const specs = getRandom(TEMPLATES.specs)
                .replace('{fuel}', details.fuel)
                .replace('{transmission}', details.transmission);

            const condition = getRandom(TEMPLATES.condition)
                .replace('{condition}', details.condition)
                .replace('{kms}', details.kms.toLocaleString());

            const owner = details.owner ? getRandom(TEMPLATES.owner).replace('{owner}', details.owner) : '';

            const closing = getRandom(TEMPLATES.closing);

            return {
                description: `${intro} ${specs} ${condition} ${owner} ${closing}`
            };
        } else {
            // Return 5 random highlights
            const shuffled = [...HIGHLIGHTS_POOL].sort(() => 0.5 - Math.random());
            return {
                highlights: shuffled.slice(0, 5)
            };
        }
    }
};
