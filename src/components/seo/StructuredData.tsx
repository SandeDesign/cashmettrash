import React from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'LocalBusiness' | 'Product' | 'Article';
  data: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const schemas = {
    Organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Vlottr',
      legalName: 'Vlottr Premium Auto Verhuur',
      url: 'https://vlottr.eu',
      logo: 'https://vlottr.eu/512x512.png',
      description: 'Premium auto verhuur per week in Nederland',
      email: 'info@vlottr.eu',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'NL',
        addressLocality: 'Nederland'
      },
      sameAs: [],
      ...data
    },
    WebSite: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Vlottr',
      url: 'https://vlottr.eu',
      description: 'Huur premium auto\'s per week',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://vlottr.eu/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      },
      ...data
    },
    LocalBusiness: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': 'https://vlottr.eu',
      name: 'Vlottr',
      image: 'https://vlottr.eu/512x512.png',
      priceRange: '€€',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'NL'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '52.3676',
        longitude: '4.9041'
      },
      url: 'https://vlottr.eu',
      telephone: '',
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00'
      },
      ...data
    },
    Product: data,
    Article: data
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas[type]) }}
    />
  );
};

export default StructuredData;
