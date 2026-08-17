import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export default function SEO({
  title,
  description,
  image = 'https://delivo.co.ke/delivo.jpg',
  type = 'website',
  schema,
}) {
  const { pathname } = useLocation();
  const canonicalUrl = `https://delivo.co.ke${pathname}`;
  const fullTitle = title ? `${title} | Delivo` : 'Delivo - Delicious Food Delivered Fast';

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  return (
    <Helmet>
      {/* HTML elements */}
      <html lang="en" />

      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Delivo" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@DelivoApp" />

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
