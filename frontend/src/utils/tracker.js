import axios from 'axios';

/**
 * trackPageView - Records a visit to a specific page
 * @param {string} url - The current URL path
 */
export const trackPageView = async (url) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        await axios.post('http://localhost:5000/api/track/pageview', 
            { url }, 
            { headers }
        );
    } catch (error) {
        console.error('Page tracking failed:', error);
    }
};

/**
 * trackLinkClick - Records a click on a shop link and redirects the user
 * @param {string} platform - 'shopee' or 'tiktok'
 */
export const trackLinkClick = async (platform) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await axios.post(`http://localhost:5000/api/track/click/${platform}`, 
            {}, 
            { headers }
        );

        if (response.data.success && response.data.url) {
            // Open the external link in a new tab
            window.open(response.data.url, '_blank', 'noopener,noreferrer');
        }
    } catch (error) {
        console.error('Click tracking failed:', error);
        // Fallback: If tracking fails, at least attempt a generic redirect
        const fallbackUrl = platform === 'shopee' ? 'https://shopee.co.id' : 'https://tiktok.com';
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
};
