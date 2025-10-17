// Security utilities for the weather app

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Safely set innerHTML with sanitization
 * @param {HTMLElement} element - Element to update
 * @param {string} content - Content to set
 */
export function safeSetInnerHTML(element, content) {
    if (!element || typeof content !== 'string') return;
    element.innerHTML = sanitizeHTML(content);
}

/**
 * Validate user input
 * @param {string} input - Input to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} - Whether input is valid
 */
export function validateInput(input, maxLength = 1000) {
    if (typeof input !== 'string') return false;
    if (input.length > maxLength) return false;
    
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Generate a secure random string for user IDs
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
export function generateSecureId(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const crypto = window.crypto || window.msCrypto;
    
    if (crypto && crypto.getRandomValues) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            result += chars[array[i] % chars.length];
        }
    } else {
        // Fallback for older browsers
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    return result;
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }
    
    isAllowed(key) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        
        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => now - time < this.windowMs);
        
        if (validRequests.length >= this.maxRequests) {
            return false;
        }
        
        validRequests.push(now);
        this.requests.set(key, validRequests);
        return true;
    }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter(20, 60000); // 20 requests per minute
