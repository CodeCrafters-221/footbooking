import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, name='Footbooking', type='website', url='https://footbooking.online/' }) {
  const siteTitle = title ? `${title} - ${name}` : `${name} - Réservez vos terrains de sport en ligne`;
  const siteDescription = description || "Footbooking vous permet de trouver et réserver facilement des terrains de sport près de chez vous. Propriétaires, gérez vos réservations en toute simplicité.";

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name='description' content={siteDescription} />
      {/* End standard metadata tags */}

      {/* Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:url" content={url} />
      {/* End Facebook tags */}

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      {/* End Twitter tags */}

      {/* Canonical Link */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
