import axios from 'axios';

// Helper for managing Cookies natively without external library
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const setCookie = (name, value, days = 365) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
};

// Generate and safely retrieve unique Client ID
const getClientId = () => {
    let clientId = getCookie('client_id');
    if (!clientId) {
        // Build a UUID
        try {
            clientId = 'user-' + crypto.randomUUID();
        } catch (e) {
            clientId = 'user-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
        }
        setCookie('client_id', clientId, 365);
    }
    return clientId;
};

/**
 * trackPageView - Records a visit to a specific page
 * @param {string} url - The current URL path
 */
export const trackPageView = async (url) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        await axios.post('http://localhost:5000/api/track/pageview', 
            { url, client_id: getClientId() }, 
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
            { client_id: getClientId() }, 
            { headers }
        );

        if (response.data.success && response.data.url) {
            window.open(response.data.url, '_blank', 'noopener,noreferrer');
        }
    } catch (error) {
        console.error('Click tracking failed:', error);
        // Fallback: If tracking fails, at least attempt a generic redirect
        const fallbackUrl = platform === 'shopee' ? 'https://shopee.co.id' : 'https://tiktok.com';
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
};
