const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const UserAgent = require('user-agents');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function randomDelay(min = 1000, max = 3000) {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

async function makeRequest(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} for URL: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });

      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch data after ${maxRetries} attempts: ${error.message}`);
      }
      
      await randomDelay(2000, 5000);
    }
  }
}

function formatPrice(priceText) {
  if (!priceText) return null;
  
  const cleanPrice = priceText.replace(/[^\d.,]/g, '');
  const priceMatch = cleanPrice.match(/(\d+(?:[.,]\d+)?)/);
  
  if (priceMatch) {
    const price = parseFloat(priceMatch[1].replace(',', '.'));
    if (!isNaN(price)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price);
    }
  }
  
  return null;
}

function isValidProductUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://www.amazon.com${url}`);
    return urlObj.hostname.includes('amazon') && urlObj.pathname.includes('/dp/');
  } catch (error) {
    return false;
  }
}

function extractProducts(dom) {
  const products = [];
  
  const productSelectors = [
    '[data-component-type="s-search-result"]',
    '.s-result-item[data-component-type="s-search-result"]',
    '.s-result-item',
    '[data-asin]'
  ];

  let productElements = [];
  
  for (const selector of productSelectors) {
    productElements = dom.querySelectorAll(selector);
    if (productElements.length > 0) {
      console.log(`Found ${productElements.length} products using selector: ${selector}`);
      break;
    }
  }

  productElements.forEach((element, index) => {
    try {
      const titleElement = element.querySelector('h2 a span') || 
                          element.querySelector('.a-size-medium') ||
                          element.querySelector('.a-size-base-plus') ||
                          element.querySelector('h2');
      
      const title = titleElement ? titleElement.textContent.trim() : null;

      const linkElement = element.querySelector('h2 a') || 
                         element.querySelector('a[href*="/dp/"]') ||
                         element.querySelector('a[data-asin]');
      
      let productUrl = '';
      if (linkElement) {
        const href = linkElement.getAttribute('href');
        if (href && isValidProductUrl(href)) {
          productUrl = href.startsWith('http') ? href : `https://www.amazon.com${href}`;
        }
      }

      const imgElement = element.querySelector('img[src]') || 
                        element.querySelector('img[data-src]');
      
      let imageUrl = '';
      if (imgElement) {
        imageUrl = imgElement.getAttribute('src') || 
                  imgElement.getAttribute('data-src') || 
                  imgElement.getAttribute('data-lazy-src') || '';
        
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }
      }

      const ratingElement = element.querySelector('.a-icon-alt') ||
                           element.querySelector('[aria-label*="stars"]') ||
                           element.querySelector('.a-icon-star');
      
      let rating = null;
      if (ratingElement) {
        const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label') || '';
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }
      }

      const reviewsElement = element.querySelector('.a-size-base') ||
                            element.querySelector('[aria-label*="reviews"]') ||
                            element.querySelector('.a-size-base.s-underline-text');
      
      let reviewCount = null;
      if (reviewsElement) {
        const reviewsText = reviewsElement.textContent || '';
        const reviewsMatch = reviewsText.match(/(\d+(?:,\d+)*)/);
        if (reviewsMatch) {
          reviewCount = parseInt(reviewsMatch[1].replace(/,/g, ''));
        }
      }

      const priceElement = element.querySelector('.a-price-whole') ||
                          element.querySelector('.a-price .a-offscreen') ||
                          element.querySelector('.a-price') ||
                          element.querySelector('.a-color-price');
      
      let price = null;
      let originalPrice = null;
      if (priceElement) {
        const priceText = priceElement.textContent.trim();
        price = formatPrice(priceText);
        
        const originalPriceElement = element.querySelector('.a-text-strike') ||
                                   element.querySelector('.a-price.a-text-price .a-offscreen');
        if (originalPriceElement) {
          const originalPriceText = originalPriceElement.textContent.trim();
          originalPrice = formatPrice(originalPriceText);
        }
      }

      const availabilityElement = element.querySelector('.a-color-success') ||
                                element.querySelector('.a-color-price');
      let availability = null;
      if (availabilityElement) {
        availability = availabilityElement.textContent.trim();
      }

      if (title) {
        products.push({
          id: index + 1,
          title,
          rating,
          reviewCount,
          imageUrl,
          price,
          originalPrice,
          availability,
          productUrl,
          timestamp: new Date().toISOString(),
          errors: {
            title: !title ? 'Título não encontrado' : null,
            rating: rating === null ? 'Avaliação não encontrada' : null,
            reviewCount: reviewCount === null ? 'Número de avaliações não encontrado' : null,
            imageUrl: !imageUrl ? 'Imagem não encontrada' : null,
            price: price === null ? 'Preço não encontrado' : null,
            productUrl: !productUrl ? 'Link do produto não encontrado' : null
          }
        });
      }
    } catch (error) {
      console.error(`Error extracting product ${index}:`, error.message);
    }
  });

  return products;
}

app.get('/api/scrape', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Keyword parameter is required',
        message: 'Please provide a valid search keyword'
      });
    }

    const sanitizedKeyword = encodeURIComponent(keyword.trim());
    const searchUrl = `https://www.amazon.com/s?k=${sanitizedKeyword}`;
    
    console.log(`Starting scrape for keyword: "${keyword}"`);
    console.log(`Search URL: ${searchUrl}`);

    await randomDelay(1000, 2000);
    
    const response = await makeRequest(searchUrl);
    
    if (!response.data) {
      throw new Error('No data received from Amazon');
    }

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const products = extractProducts(document);

    console.log(`Successfully extracted ${products.length} products`);

    res.json({
      success: true,
      keyword: keyword,
      totalProducts: products.length,
      products: products,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scraping error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Amazon',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Amazon Scraper API',
    version: '1.0.0',
    endpoints: {
      scrape: 'GET /api/scrape?keyword=yourKeyword',
      health: 'GET /api/health'
    }
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Amazon Scraper Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Scrape endpoint: http://localhost:${PORT}/api/scrape?keyword=yourKeyword`);
});

module.exports = app; 