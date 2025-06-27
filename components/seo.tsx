import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

const defaultMeta = {
  title: 'TOKO SEMBAKO SRI REJEKI UTAMA - Belanja Dekat, Lebih Hemat',
  description: 'Toko online sembako dan voucher digital dengan harga terjangkau. Belanja mudah via WhatsApp, pengiriman cepat, dan berbagai promo menarik.',
  keywords: 'toko sembako, voucher digital, belanja online, toko online murah, voucher game, sembako murah',
  ogImage: '/og-image.jpg',
  ogType: 'website',
};

export function SEO({
  title,
  description,
  keywords,
  ogImage,
  ogType,
  canonicalUrl,
  noindex = false,
}: SEOProps) {
  const meta = {
    title: title ? `${title} | ${defaultMeta.title}` : defaultMeta.title,
    description: description || defaultMeta.description,
    keywords: keywords || defaultMeta.keywords,
    ogImage: ogImage || defaultMeta.ogImage,
    ogType: ogType || defaultMeta.ogType,
  };

  return (
    <Head>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Open Graph */}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content={meta.ogType} />
      <meta property="og:image" content={meta.ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.ogImage} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    </Head>
  );
}
