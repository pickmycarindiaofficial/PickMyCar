import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    noIndex?: boolean;
    structuredData?: Record<string, unknown>;
}

/**
 * SEOHead - Reusable component for dynamic page SEO
 * Handles meta tags, Open Graph, Twitter Cards, and structured data
 */
export const SEOHead = ({
    title = 'PickMyCar',
    description = 'Discover certified used cars across India with warranty assured, easy financing, and hassle-free insurance.',
    image = 'https://pickmycar.co.in/og-image.png',
    url = 'https://pickmycar.co.in/',
    type = 'website',
    noIndex = false,
    structuredData,
}: SEOHeadProps) => {
    const fullTitle = title === 'PickMyCar' ? title : `${title} | PickMyCar`;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            {/* Canonical URL */}
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="PickMyCar" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:site" content="@PickMyCar" />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

/**
 * Generate structured data for a car listing
 */
export const generateCarStructuredData = (car: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    imageUrl: string;
    kmsDriven: number;
    fuelType: string;
    description?: string;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: car.title,
    brand: {
        '@type': 'Brand',
        name: car.brand,
    },
    model: car.model,
    modelDate: car.year.toString(),
    vehicleModelDate: car.year.toString(),
    image: car.imageUrl,
    description: car.description || `${car.year} ${car.brand} ${car.model} - ${car.kmsDriven.toLocaleString()} km, ${car.fuelType}`,
    offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: car.price,
        availability: 'https://schema.org/InStock',
        url: `https://pickmycar.co.in/car/${car.id}`,
    },
    mileageFromOdometer: {
        '@type': 'QuantitativeValue',
        value: car.kmsDriven,
        unitCode: 'KMT',
    },
    fuelType: car.fuelType,
});

/**
 * Generate organization structured data
 */
export const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PickMyCar',
    url: 'https://pickmycar.co.in',
    logo: 'https://pickmycar.co.in/logo.png',
    sameAs: [
        'https://www.facebook.com/pickmycar',
        'https://www.instagram.com/pickmycar',
        'https://twitter.com/PickMyCar',
    ],
    contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English', 'Hindi'],
    },
};

export default SEOHead;
