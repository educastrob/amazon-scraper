const axios = require('axios');

class ScrapingStrategies {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];

        this.proxyList = [];

        this.requestDelays = {
            min: 1000,
            max: 3000,
            retry: 2000
        };

        this.maxRetries = 3;
        this.timeout = 10000;
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    getRealisticHeaders() {
        return {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
            'Referer': 'https://www.amazon.com/',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
        };
    }

    async randomDelay(min = this.requestDelays.min, max = this.requestDelays.max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    async retryWithExponentialBackoff(requestFn, maxRetries = this.maxRetries) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                console.log(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                const delay = Math.pow(2, attempt) * this.requestDelays.retry;
                await this.randomDelay(delay, delay + 1000);
            }
        }
    }

    isRateLimited(response) {
        const status = response.status;
        const headers = response.headers;
        const body = response.data;
        
        if (status === 429 || status === 503) {
            return true;
        }
        
        if (headers['retry-after'] || headers['x-ratelimit-remaining'] === '0') {
            return true;
        }
        
        if (typeof body === 'string') {
            const indicators = [
                'captcha',
                'robot',
                'blocked',
                'rate limit',
                'too many requests',
                'access denied'
            ];
            
            return indicators.some(indicator => 
                body.toLowerCase().includes(indicator)
            );
        }
        
        return false;
    }

    extractProductsRobust(document) {
        const products = [];
        
        const selectors = [
            '[data-component-type="s-search-result"]',
            '.s-result-item[data-component-type="s-search-result"]',
            '.s-result-item',
            '[data-asin]',
            '.sg-col-inner .s-result-item',
            '.s-main-slot .s-result-item',
            '.s-desktop-toolbar .s-result-item'
        ];

        let productElements = [];
        
        for (const selector of selectors) {
            productElements = document.querySelectorAll(selector);
            if (productElements.length > 0) {
                console.log(`Found ${productElements.length} products using selector: ${selector}`);
                break;
            }
        }

        productElements.forEach((element, index) => {
            try {
                const product = this.extractSingleProduct(element, index);
                if (product && product.title) {
                    products.push(product);
                }
            } catch (error) {
                console.error(`Error extracting product ${index}:`, error.message);
            }
        });

        return products;
    }

    extractSingleProduct(element, index) {
        const titleSelectors = [
            'h2 a span',
            '.a-size-medium',
            '.a-size-base-plus',
            'h2',
            '.a-text-normal',
            '[data-cy="title-recipe"]'
        ];
        
        let title = '';
        for (const selector of titleSelectors) {
            const titleElement = element.querySelector(selector);
            if (titleElement && titleElement.textContent.trim()) {
                title = titleElement.textContent.trim();
                break;
            }
        }

        const imgSelectors = [
            'img[src]',
            'img[data-src]',
            'img[data-lazy-src]',
            'img[data-old-hires]'
        ];
        
        let imageUrl = '';
        for (const selector of imgSelectors) {
            const imgElement = element.querySelector(selector);
            if (imgElement) {
                imageUrl = imgElement.getAttribute('src') || 
                          imgElement.getAttribute('data-src') || 
                          imgElement.getAttribute('data-lazy-src') || 
                          imgElement.getAttribute('data-old-hires') || '';
                
                if (imageUrl) {
                    if (imageUrl.startsWith('//')) {
                        imageUrl = 'https:' + imageUrl;
                    }
                    break;
                }
            }
        }

        const ratingSelectors = [
            '.a-icon-alt',
            '[aria-label*="stars"]',
            '.a-icon-star',
            '.a-icon-star-small',
            '.a-star-rating'
        ];
        
        let rating = 0;
        for (const selector of ratingSelectors) {
            const ratingElement = element.querySelector(selector);
            if (ratingElement) {
                const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label') || '';
                const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
                if (ratingMatch) {
                    rating = parseFloat(ratingMatch[1]);
                    break;
                }
            }
        }

        const reviewSelectors = [
            '.a-size-base',
            '[aria-label*="reviews"]',
            '.a-size-base.s-underline-text',
            '.a-link-normal .a-size-base'
        ];
        
        let reviewCount = 0;
        for (const selector of reviewSelectors) {
            const reviewsElement = element.querySelector(selector);
            if (reviewsElement) {
                const reviewsText = reviewsElement.textContent || '';
                const reviewsMatch = reviewsText.match(/(\d+(?:,\d+)*)/);
                if (reviewsMatch) {
                    reviewCount = parseInt(reviewsMatch[1].replace(/,/g, ''));
                    break;
                }
            }
        }

        const priceSelectors = [
            '.a-price-whole',
            '.a-price .a-offscreen',
            '.a-price',
            '.a-price-range',
            '.a-color-price'
        ];
        
        let price = '';
        for (const selector of priceSelectors) {
            const priceElement = element.querySelector(selector);
            if (priceElement) {
                price = priceElement.textContent.trim();
                if (price) break;
            }
        }

        return {
            id: index + 1,
            title,
            rating,
            reviewCount,
            imageUrl,
            price,
            timestamp: new Date().toISOString()
        };
    }

    detectStructureChanges(document) {
        const indicators = [
            'captcha',
            'robot',
            'blocked',
            'access denied',
            'unusual traffic',
            'security check'
        ];
        
        const bodyText = document.body.textContent.toLowerCase();
        return indicators.some(indicator => bodyText.includes(indicator));
    }

    validateProduct(product) {
        if (!product.title || product.title.trim().length === 0) {
            return false;
        }

        if (product.rating < 0 || product.rating > 5) {
            return false;
        }

        if (product.reviewCount < 0) {
            return false;
        }

        return true;
    }

    logOperation(operation, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            operation,
            ...data
        };
        
        console.log(`[${timestamp}] ${operation}:`, logEntry);
    }

    updateConfig(config) {
        if (config.userAgents) {
            this.userAgents = [...this.userAgents, ...config.userAgents];
        }
        
        if (config.requestDelays) {
            this.requestDelays = { ...this.requestDelays, ...config.requestDelays };
        }
        
        if (config.maxRetries) {
            this.maxRetries = config.maxRetries;
        }
        
        if (config.timeout) {
            this.timeout = config.timeout;
        }
    }
}

module.exports = ScrapingStrategies; 