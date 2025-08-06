import axios from 'axios';

class AmazonScraperApp {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentKeyword = '';
        this.searchStartTime = null;
        
        this.elements = {
            keywordInput: document.getElementById('keywordInput'),
            searchBtn: document.getElementById('searchBtn'),
            loadingSection: document.getElementById('loadingSection'),
            resultsSection: document.getElementById('resultsSection'),
            errorSection: document.getElementById('errorSection'),
            productsGrid: document.getElementById('productsGrid'),
            resultsTitle: document.getElementById('resultsTitle'),
            resultsCount: document.getElementById('resultsCount'),
            searchTime: document.getElementById('searchTime'),
            noResults: document.getElementById('noResults'),
            errorTitle: document.getElementById('errorTitle'),
            errorMessage: document.getElementById('errorMessage'),
            retryBtn: document.getElementById('retryBtn'),
            productModal: document.getElementById('productModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalContent: document.getElementById('modalContent'),
            closeModal: document.getElementById('closeModal')
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.showWelcomeMessage();
    }

    bindEvents() {
        this.elements.searchBtn.addEventListener('click', () => {
            this.performSearch();
        });

        this.elements.keywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        this.elements.retryBtn.addEventListener('click', () => {
            this.performSearch();
        });

        this.elements.closeModal.addEventListener('click', () => {
            this.closeModal();
        });

        this.elements.productModal.addEventListener('click', (e) => {
            if (e.target === this.elements.productModal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.productModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.elements.keywordInput.focus();
            }
        });
    }

    showWelcomeMessage() {
        console.log('🚀 Amazon Scraper iniciado com sucesso!');
    }

    async performSearch() {
        const keyword = this.elements.keywordInput.value.trim();
        
        if (!keyword) {
            this.showError('Por favor, digite um termo de busca.');
            this.elements.keywordInput.focus();
            return;
        }

        this.currentKeyword = keyword;
        this.searchStartTime = Date.now();
        
        this.showLoading();
        
        try {
            const response = await this.makeApiRequest(keyword);
            this.handleSearchSuccess(response.data);
        } catch (error) {
            this.handleSearchError(error);
        }
    }

    async makeApiRequest(keyword) {
        const url = `${this.apiBaseUrl}/scrape?keyword=${encodeURIComponent(keyword)}`;
        
        return await axios.get(url, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    handleSearchSuccess(data) {
        const searchTime = Date.now() - this.searchStartTime;
        
        if (data.success && data.products && data.products.length > 0) {
            this.displayResults(data, searchTime);
        } else {
            this.showNoResults();
        }
    }

    handleSearchError(error) {
        console.error('Erro na busca:', error.message);
        
        let errorMessage = 'Ocorreu um erro ao buscar os produtos.';
        let errorTitle = 'Erro na busca';
        
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            switch (status) {
                case 400:
                    errorTitle = 'Parâmetro inválido';
                    errorMessage = data.message || 'Por favor, verifique o termo de busca.';
                    break;
                case 429:
                    errorTitle = 'Muitas requisições';
                    errorMessage = 'Muitas requisições foram feitas. Tente novamente em alguns minutos.';
                    break;
                case 500:
                    errorTitle = 'Erro do servidor';
                    errorMessage = 'O servidor encontrou um erro. Tente novamente mais tarde.';
                    break;
                default:
                    errorMessage = data.message || errorMessage;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorTitle = 'Timeout';
            errorMessage = 'A requisição demorou muito para responder. Tente novamente.';
        } else if (error.code === 'NETWORK_ERROR') {
            errorTitle = 'Erro de conexão';
            errorMessage = 'Verifique sua conexão com a internet e tente novamente.';
        }
        
        this.showError(errorMessage, errorTitle);
    }

    displayResults(data, searchTime) {
        this.elements.resultsTitle.textContent = `Resultados para "${this.currentKeyword}"`;
        this.elements.resultsCount.textContent = `${data.totalProducts} produtos encontrados`;
        this.elements.searchTime.textContent = `Tempo de busca: ${this.formatTime(searchTime)}`;
        
        this.renderProducts(data.products);
        this.showResults();
        this.animateProducts();
    }

    renderProducts(products) {
        this.elements.productsGrid.innerHTML = '';
        
        products.forEach((product, index) => {
            const productCard = this.createProductCard(product, index);
            this.elements.productsGrid.appendChild(productCard);
        });
    }

    createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const stars = this.generateStars(product.rating);
        
        const priceDisplay = this.formatPriceDisplay(product.price, product.originalPrice);
        const ratingDisplay = this.formatRatingDisplay(product.rating, product.errors?.rating);
        const reviewsDisplay = this.formatReviewsDisplay(product.reviewCount, product.errors?.reviewCount);
        const imageDisplay = this.formatImageDisplay(product.imageUrl, product.errors?.imageUrl);
        
        card.innerHTML = `
            <div class="product-image">
                ${imageDisplay}
            </div>
            <div class="product-info">
                <h3 class="product-title">${this.escapeHtml(product.title)}</h3>
                <div class="product-rating">
                    ${ratingDisplay}
                </div>
                <div class="product-reviews">
                    ${reviewsDisplay}
                </div>
                <div class="product-price">
                    ${priceDisplay}
                </div>
                ${product.availability ? `<div class="product-availability">${product.availability}</div>` : ''}
                ${product.productUrl ? `<a href="${product.productUrl}" target="_blank" class="product-link">Ver na Amazon</a>` : ''}
            </div>
        `;
        
        if (product.productUrl) {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('product-link')) {
                    this.openProductModal(product);
                }
            });
        } else {
            card.addEventListener('click', () => {
                this.openProductModal(product);
            });
        }
        
        return card;
    }

    formatPriceDisplay(price, originalPrice) {
        if (price) {
            let priceHtml = `<div class="current-price">${price}</div>`;
            if (originalPrice && originalPrice !== price) {
                priceHtml += `<div class="original-price">${originalPrice}</div>`;
            }
            return priceHtml;
        }
        return '<div class="price-error">Preço não disponível</div>';
    }

    formatRatingDisplay(rating, error) {
        if (rating !== null) {
            const stars = this.generateStars(rating);
            return `
                <span class="stars">${stars}</span>
                <span class="rating-text">${rating}/5</span>
            `;
        }
        return '<span class="rating-error">Avaliação não disponível</span>';
    }

    formatReviewsDisplay(reviewCount, error) {
        if (reviewCount !== null) {
            return `${this.formatNumber(reviewCount)} avaliações`;
        }
        return '<span class="reviews-error">Avaliações não disponíveis</span>';
    }

    formatImageDisplay(imageUrl, error) {
        if (imageUrl) {
            return `<img src="${imageUrl}" alt="Produto" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i><div class=\\'image-error\\'>Imagem não carregada</div>';">`;
        }
        return '<i class="fas fa-image"></i><div class="image-error">Imagem não disponível</div>';
    }

    generateStars(rating) {
        if (rating <= 0) return '<i class="far fa-star"></i>'.repeat(5);
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        stars += '<i class="fas fa-star"></i>'.repeat(fullStars);
        if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
        stars += '<i class="far fa-star"></i>'.repeat(emptyStars);
        
        return stars;
    }

    openProductModal(product) {
        this.elements.modalTitle.textContent = 'Detalhes do Produto';
        
        const stars = this.generateStars(product.rating);
        const priceDisplay = this.formatPriceDisplay(product.price, product.originalPrice);
        const ratingDisplay = this.formatRatingDisplay(product.rating, product.errors?.rating);
        const reviewsDisplay = this.formatReviewsDisplay(product.reviewCount, product.errors?.reviewCount);
        
        this.elements.modalContent.innerHTML = `
            <div class="modal-product">
                <div class="modal-product-image">
                    ${this.formatImageDisplay(product.imageUrl, product.errors?.imageUrl)}
                </div>
                <div class="modal-product-info">
                    <h4>${this.escapeHtml(product.title)}</h4>
                    <div class="modal-product-rating">
                        ${ratingDisplay}
                    </div>
                    <p><strong>Avaliações:</strong> ${reviewsDisplay}</p>
                    <div class="modal-product-price">
                        <strong>Preço:</strong> ${priceDisplay}
                    </div>
                    ${product.availability ? `<p><strong>Disponibilidade:</strong> ${product.availability}</p>` : ''}
                    <p><strong>ID:</strong> ${product.id}</p>
                    <p><strong>Data de extração:</strong> ${new Date(product.timestamp).toLocaleString('pt-BR')}</p>
                    ${product.productUrl ? `<a href="${product.productUrl}" target="_blank" class="modal-product-link">Ver na Amazon</a>` : ''}
                </div>
            </div>
        `;
        
        this.elements.productModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.elements.productModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    showLoading() {
        this.hideAllSections();
        this.elements.loadingSection.classList.remove('hidden');
        this.elements.searchBtn.disabled = true;
        this.elements.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Buscando...</span>';
    }

    showResults() {
        this.hideAllSections();
        this.elements.resultsSection.classList.remove('hidden');
        this.resetSearchButton();
    }

    showError(message, title = 'Erro na busca') {
        this.hideAllSections();
        this.elements.errorSection.classList.remove('hidden');
        this.elements.errorTitle.textContent = title;
        this.elements.errorMessage.textContent = message;
        this.resetSearchButton();
    }

    showNoResults() {
        this.hideAllSections();
        this.elements.resultsSection.classList.remove('hidden');
        this.elements.noResults.classList.remove('hidden');
        this.elements.productsGrid.innerHTML = '';
        this.resetSearchButton();
    }

    hideAllSections() {
        this.elements.loadingSection.classList.add('hidden');
        this.elements.resultsSection.classList.add('hidden');
        this.elements.errorSection.classList.add('hidden');
        this.elements.noResults.classList.add('hidden');
    }

    resetSearchButton() {
        this.elements.searchBtn.disabled = false;
        this.elements.searchBtn.innerHTML = '<i class="fas fa-rocket"></i><span>Buscar</span>';
    }

    animateProducts() {
        const cards = this.elements.productsGrid.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    formatTime(ms) {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AmazonScraperApp();
});

export default AmazonScraperApp; 