import { useEffect } from 'react';

/**
 * SEO Component for dynamic meta tags
 * Updates document head with page-specific meta information
 */
const SEO = ({
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    author = 'Army SMP 2',
    noIndex = false
}) => {
    const siteTitle = 'Army SMP 2';
    const defaultDescription = 'Shop premium Minecraft ranks, kits, and accessories at Army SMP 2. Secure UPI payments, instant delivery, and exclusive deals.';
    const defaultImage = 'https://armysmp2.vercel.app/images/Army%20logo.jpg';
    const siteUrl = 'https://armysmp2.vercel.app';

    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const finalDescription = description || defaultDescription;
    const finalImage = image || defaultImage;
    const finalUrl = url ? `${siteUrl}${url}` : siteUrl;

    useEffect(() => {
        // Update document title
        document.title = fullTitle;

        // Helper to update or create meta tag
        const updateMeta = (attribute, value, content) => {
            let element = document.querySelector(`meta[${attribute}="${value}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, value);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Update primary meta tags
        updateMeta('name', 'description', finalDescription);
        updateMeta('name', 'author', author);

        if (keywords) {
            updateMeta('name', 'keywords', keywords);
        }

        if (noIndex) {
            updateMeta('name', 'robots', 'noindex, nofollow');
        } else {
            updateMeta('name', 'robots', 'index, follow');
        }

        // Update Open Graph tags
        updateMeta('property', 'og:title', fullTitle);
        updateMeta('property', 'og:description', finalDescription);
        updateMeta('property', 'og:image', finalImage);
        updateMeta('property', 'og:url', finalUrl);
        updateMeta('property', 'og:type', type);

        // Update Twitter tags
        updateMeta('property', 'twitter:title', fullTitle);
        updateMeta('property', 'twitter:description', finalDescription);
        updateMeta('property', 'twitter:image', finalImage);
        updateMeta('property', 'twitter:url', finalUrl);

        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', finalUrl);

        // Cleanup - reset to defaults on unmount
        return () => {
            document.title = siteTitle;
        };
    }, [fullTitle, finalDescription, finalImage, finalUrl, keywords, author, type, noIndex]);

    return null; // This component doesn't render anything
};

export default SEO;
