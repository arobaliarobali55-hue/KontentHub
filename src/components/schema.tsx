interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// HTML-escape JSON to prevent XSS
const escapeJson = (json: string): string =>
  json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

// Static schemas moved to module scope
const organizationSchemaData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "KontentHub",
  "url": baseUrl,
  "logo": `${baseUrl}/logo.png`,
  "sameAs": [
    "https://linkedin.com/company/kontenthub",
  ]
};

const softwareApplicationSchemaData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "KontentHub",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Generate authentic LinkedIn posts tailored to your professional brand.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJson(JSON.stringify(organizationSchemaData)) }}
      suppressHydrationWarning
    />
  );
}

export function SoftwareApplicationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJson(JSON.stringify(softwareApplicationSchemaData)) }}
      suppressHydrationWarning
    />
  );
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${baseUrl}${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJson(JSON.stringify(schema)) }}
      suppressHydrationWarning
    />
  );
}

export function FAQSchema({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJson(JSON.stringify(schema)) }}
      suppressHydrationWarning
    />
  );
}
