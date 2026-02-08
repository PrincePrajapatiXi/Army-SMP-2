import { useEffect } from 'react';

/**
 * StructuredData Component for JSON-LD Schema
 * Adds structured data to page head for better SEO and rich snippets
 */

// Organization Schema
const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Army SMP 2",
    "url": "https://store.armysmp.fun",
    "logo": "https://store.armysmp.fun/images/Army%20logo.png",
    "description": "Premium Minecraft server store offering ranks, kits, and accessories",
    "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "url": "https://discord.gg/EBmGM2jsdt"
    },
    "sameAs": [
        "https://discord.gg/EBmGM2jsdt"
    ]
};

// Website Schema
const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Army SMP 2",
    "url": "https://store.armysmp.fun",
    "potentialAction": {
        "@type": "SearchAction",
        "target": "https://store.armysmp.fun/store?search={search_term_string}",
        "query-input": "required name=search_term_string"
    }
};

// Helper function to create product schema
const createProductSchema = (product) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} for Army SMP 2 Minecraft server`,
    "image": product.image || "https://store.armysmp.fun/images/Army%20logo.png",
    "brand": {
        "@type": "Brand",
        "name": "Army SMP 2"
    },
    "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "seller": {
            "@type": "Organization",
            "name": "Army SMP 2"
        }
    }
});

// Helper function to create breadcrumb schema
const createBreadcrumbSchema = (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `https://store.armysmp.fun${item.path}`
    }))
});

/**
 * StructuredData Component
 * @param {string} type - Type of schema: 'organization', 'website', 'product', 'breadcrumb'
 * @param {object} data - Additional data for product or breadcrumb schemas
 */
const StructuredData = ({ type = 'organization', data = null }) => {
    useEffect(() => {
        let schema;

        switch (type) {
            case 'organization':
                schema = organizationSchema;
                break;
            case 'website':
                schema = websiteSchema;
                break;
            case 'product':
                if (data) {
                    schema = createProductSchema(data);
                }
                break;
            case 'breadcrumb':
                if (data && Array.isArray(data)) {
                    schema = createBreadcrumbSchema(data);
                }
                break;
            default:
                schema = organizationSchema;
        }

        if (!schema) return;

        // Create script element
        const scriptId = `structured-data-${type}`;
        let existingScript = document.getElementById(scriptId);

        if (existingScript) {
            existingScript.innerHTML = JSON.stringify(schema);
        } else {
            const script = document.createElement('script');
            script.id = scriptId;
            script.type = 'application/ld+json';
            script.innerHTML = JSON.stringify(schema);
            document.head.appendChild(script);
        }

        // Cleanup
        return () => {
            const script = document.getElementById(scriptId);
            if (script) {
                script.remove();
            }
        };
    }, [type, data]);

    return null;
};

export { createProductSchema, createBreadcrumbSchema };
export default StructuredData;

