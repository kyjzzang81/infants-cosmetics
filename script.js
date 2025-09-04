let products = [];
let filteredProducts = [];
let isAuthenticated = false;
const PASSWORD = '8092#$%bambit@#111$%';

// JSON 파일 로드
async function loadProducts() {
    try {
        const response = await fetch('product_list_db_updated.json');
        products = await response.json();
        filteredProducts = [...products];
        
        populateCategoryFilters();
        displayProducts();
        updateStats();
        
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        document.getElementById('loading').innerHTML = '데이터를 불러올 수 없습니다.';
    }
}

// 패스워드 확인
function checkPassword() {
    const input = document.getElementById('passwordInput').value;
    const statusDiv = document.getElementById('passwordStatus');
    
    if (input === PASSWORD) {
        isAuthenticated = true;
        statusDiv.innerHTML = '<div class="password-success">✅ 인증 성공! 전체 제품을 볼 수 있습니다.</div>';
        document.getElementById('previewNotice').style.display = 'none';
        document.getElementById('passwordInput').value = '';
        displayProducts();
        updateStats();
    } else {
        isAuthenticated = false;
        statusDiv.innerHTML = '<div class="password-error">❌ 잘못된 패스워드입니다.</div>';
        document.getElementById('previewNotice').style.display = 'block';
        displayProducts();
        updateStats();
    }
}

// 카테고리 필터 옵션 생성
function populateCategoryFilters() {
    const categorySelect = document.getElementById('category');
    
    // 2차 카테고리 옵션 생성 (카테고리 번호 기준 오름차순 정렬)
    const categoryMap = new Map();
    products.forEach(product => {
        if (product['2차 카테고리'] && product['2차 카테고리 No']) {
            const categoryKey = `${product['1차 카테고리']} > ${product['2차 카테고리']}`;
            categoryMap.set(categoryKey, {
                category1: product['1차 카테고리'],
                category2: product['2차 카테고리'],
                number: product['2차 카테고리 No']
            });
        }
    });
    
    // 카테고리 번호 기준으로 오름차순 정렬
    const sortedCategories = Array.from(categoryMap.entries())
        .sort((a, b) => a[1].number - b[1].number);
    
    sortedCategories.forEach(([displayText, categoryData]) => {
        const option = document.createElement('option');
        option.value = `${categoryData.category1}|${categoryData.category2}`;
        option.textContent = `${displayText} (${categoryData.number})`;
        categorySelect.appendChild(option);
    });
}

// 제품 필터링
function filterProducts() {
    const categoryValue = document.getElementById('category').value;
    const searchTerm = document.getElementById('search').value.toLowerCase();

    filteredProducts = products.filter(product => {
        let matchesCategory = true;
        
        if (categoryValue) {
            const [category1, category2] = categoryValue.split('|');
            matchesCategory = product['1차 카테고리'] === category1 && 
                            product['2차 카테고리'] === category2;
        }
        
        const matchesSearch = !searchTerm || 
            (product['제품명_정제'] && product['제품명_정제'].toLowerCase().includes(searchTerm)) ||
            (product['브랜드명_kor'] && product['브랜드명_kor'].toLowerCase().includes(searchTerm));

        return matchesCategory && matchesSearch;
    });

    displayProducts();
    updateStats();
}

// 제품 목록 표시
function displayProducts() {
    const grid = document.getElementById('product-grid');
    const noResults = document.getElementById('no-results');
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    
    // 인증되지 않은 경우 상위 3개만 표시
    const productsToShow = isAuthenticated ? filteredProducts : filteredProducts.slice(0, 3);
    
    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <div class="product-title">${product['제품명_정제'] || '제품명 없음'}</div>
            <div class="product-brand">${product['브랜드명_kor'] || ''} ${product['브랜드명_eng'] || ''}</div>
            <div class="product-category">${product['1차 카테고리'] || ''} > ${product['2차 카테고리'] || ''}</div>
            ${product['제품링크'] ? `<a href="${product['제품링크']}" target="_blank" class="product-link">제품 보기</a>` : ''}
            ${product['전성분_processed'] ? `
                <div class="ingredients">
                    <h4>주요 성분</h4>
                    <div class="ingredients-list">${product['전성분_processed'].slice(0, 200)}${product['전성분_processed'].length > 200 ? '...' : ''}</div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 통계 업데이트
function updateStats() {
    const totalProducts = isAuthenticated ? filteredProducts.length : Math.min(filteredProducts.length, 3);
    document.getElementById('total-count').textContent = totalProducts;
    
    const categoryValue = document.getElementById('category').value;
    const searchTerm = document.getElementById('search').value;
    
    let filterText = '전체';
    if (categoryValue || searchTerm) {
        const filters = [];
        if (categoryValue) {
            const [category1, category2] = categoryValue.split('|');
            filters.push(`카테고리: ${category1} > ${category2}`);
        }
        if (searchTerm) filters.push(`검색: ${searchTerm}`);
        filterText = filters.join(', ');
    }
    
    if (!isAuthenticated && filteredProducts.length > 3) {
        filterText += ` (미리보기: ${totalProducts}/${filteredProducts.length})`;
    }
    
    document.getElementById('current-filter').textContent = filterText;
}

// 이벤트 리스너 등록
function initializeEventListeners() {
    // 엔터키로 패스워드 확인
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    // 카테고리 및 검색 필터
    document.getElementById('category').addEventListener('change', filterProducts);
    document.getElementById('search').addEventListener('input', filterProducts);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadProducts();
});
