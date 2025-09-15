const DISNEYLAND_API = 'https://tokyo-disney.david082321.workers.dev/?service=tokyo-disneyland-attractions';
const DISNEYSEA_API = 'https://tokyo-disney.david082321.workers.dev/?service=tokyo-disneysea-attractions';
// const DISNEYLAND_API = 'https://api.dominicarrojado.com/theme-park-checker/theme-park-info?service=tokyo-disneyland-attractions';
// const DISNEYSEA_API = 'https://api.dominicarrojado.com/theme-park-checker/theme-park-info?service=tokyo-disneysea-attractions';
const DISNEY_DETAIL = './attractions.json'
// SVG 圖標常量
const ICONS = {
    // 愛心圖標 - 實心
    HEART_FILLED: 'M480-120l-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z',
    
    // 愛心圖標 - 空心
    HEART_OUTLINE: 'm480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z',
    
    // 勾勾圖標 - 實心
    CHECK_FILLED: 'm424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z',
    
    // 勾勾圖標 - 空心
    CHECK_OUTLINE: 'm424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z'
};

// 讀取網址參數並設置初始 API
function getInitialAPI() {
    const urlParams = new URLSearchParams(window.location.search);
    const park = urlParams.get('park');
    
    if (park === 'sea') {
        return DISNEYSEA_API;
    }
    return DISNEYLAND_API;
}

let currentAPI = getInitialAPI();

// 更新網址參數
function updateURLParameter() {
    const park = currentAPI === DISNEYLAND_API ? 'land' : 'sea';
    const newURL = new URL(window.location.href);
    newURL.searchParams.set('park', park);
    window.history.pushState({}, '', newURL);
}

async function fetchAttractions() {
    try {
        const response = await fetch(currentAPI, {
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching attractions:', error);
        return [];
    }
}

function togglePark() {
    const toggleButton = document.getElementById('toggleButton');
    if (currentAPI === DISNEYLAND_API) {
        currentAPI = DISNEYSEA_API;
        toggleButton.textContent = '切換至迪士尼樂園';
        document.getElementById('parkTitle').textContent = '東京迪士尼海洋遊樂設施';
    } else {
        currentAPI = DISNEYLAND_API;
        toggleButton.textContent = '切換至迪士尼海洋';
        document.getElementById('parkTitle').textContent = '東京迪士尼樂園遊樂設施';
    }
    updateURLParameter();
    updateAttractions();
}

async function fetchAttractionDetails() {
    try {
        const response = await fetch(DISNEY_DETAIL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching attraction details:', error);
        return {};
    }
}

function createAttractionCard(attraction) {
    const isMobile = window.innerWidth <= 768;
    const isCanceled = attraction.operatingStatus === '已截止' || attraction.operatingStatus === '取消營運';
    const isSuspended = attraction.operatingStatus === '暫停營運';
    const cardClass = isCanceled ? 'attraction-card canceled' : 
                     isSuspended ? 'attraction-card suspended' : 
                     'attraction-card';
    const statusClass = attraction.isOperating ? 'status-open' : 'status-closed';
    const dpaClass = attraction.dpaStatus?.includes('銷售中') ? 'status-available' : 'status-unavailable';
    const fsClass = attraction.fsStatus?.includes('現正發行') ? 'status-available' : 'status-unavailable';
    
    // 檢查是否已收藏或加入書籤
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const isFavorite = favorites.includes(attraction.id);
    const isBookmarked = bookmarks.includes(attraction.id);
    
    // 從 attractions.json 獲取詳細信息
    const details = window.attractionDetails[String(attraction.id)] || {};
    
    const tooltipContent = `
        <div class="attraction-tooltip">
            <p><strong>類型：</strong>${details.type || ''}</p>
            <p>${details.description || ''}</p>
            ${details.duration ? `<p><strong>所需時間：</strong>${details.duration}</p>` : ''}
            ${details.capacity ? `<p><strong>可容納人數：</strong>${details.capacity}</p>` : ''}
            ${details.features ? `<p><strong>特色：</strong>${details.features}</p>` : ''}
            ${details.img_url ? `<img src="${details.img_url}" loading="lazy" referrerpolicy="no-referrer" alt="${attraction.name}">` : ''}
        </div>
    `;

    return `
        <div class="${cardClass}">
            <div class="card-header">
                <div class="attraction-name" data-type="${details.type || ''}" 
                     data-description="${details.description || ''}" 
                     data-img="${details.img_url || ''}"
                     data-link="${details.link ? 'https://www.tokyodisneyresort.jp' + details.link : ''}"
                     onclick="handleAttractionClick(this, event)">
                    ${attraction.name}
                    ${!isMobile ? tooltipContent : ''}
                </div>
                <div class="card-actions">
                    <button class="btn-favorite ${isFavorite ? 'active' : ''}" 
                            onclick="toggleFavorite('${attraction.id}', this)">
                        <svg class="icon-heart" viewBox="0 -960 960 960">
                            <path d="${isFavorite ? ICONS.HEART_FILLED : ICONS.HEART_OUTLINE}"
                                fill="${isFavorite ? '#ff4081' : 'currentColor'}"/>
                        </svg>
                    </button>
                    <button class="btn-check ${isBookmarked ? 'active' : ''}" 
                            onclick="toggleBookmark('${attraction.id}', this)">
                        <svg class="icon-check" viewBox="0 -960 960 960">
                            <path d="${isBookmarked ? ICONS.CHECK_FILLED : ICONS.CHECK_OUTLINE}"
                                fill="${isBookmarked ? '#4caf50' : 'currentColor'}"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="attraction-status ${statusClass}">
                狀態：${attraction.operatingStatus}
            </div>
            ${attraction.standByTime ? `
                <div class="attraction-wait-time">
                    等候：${attraction.standByTime} 分
                </div>
            ` : ''}
            ${attraction.dpaStatus ? `
                <div class="attraction-dpa ${dpaClass}">
                    ${attraction.dpaStatus}
                </div>
            ` : ''}
            ${attraction.fsStatus ? `
                <div class="attraction-fs ${fsClass}">
                    ${attraction.fsStatus}
                </div>
            ` : ''}
            ${attraction.lastUpdatedTime ? `
                <div class="attraction-update-time">
                    更新：${attraction.lastUpdatedTime}
                </div>
            ` : ''}
            ${details.area ? `
                <div class="attraction-area">
                    ${details.area}
                </div>
            ` : ''}
        </div>
    `;
}

function handleAttractionClick(element, event) {
    const isMobile = window.innerWidth <= 768;
    const type = element.dataset.type;
    const description = element.dataset.description;
    const imgUrl = element.dataset.img;
    const link = element.dataset.link;
    const name = element.textContent.trim();
    
    // Get the attraction ID from the parent card
    const card = element.closest('.attraction-card');
    const favoriteButton = card.querySelector('.btn-favorite');
    const attractionId = favoriteButton.getAttribute('onclick').match(/'([^']+)'/)[1];
    const details = window.attractionDetails[String(attractionId)] || {};

    if (isMobile) {
        // 手機版顯示模態框
        showMobileModal(name, type, description, imgUrl, link, details);
    } else {
        // 電腦版顯示工具提示或跳轉
        if (event.type === 'click') {
            // 點擊時跳轉
            if (link) {
                const a = document.createElement('a');
                a.href = link;
                a.rel = 'noreferrer';
                a.target = '_blank';
                a.click();
            }
        }
    }
}

function showMobileModal(name, type, description, imgUrl, link, details) {
    console.log("What is details: ");
    console.log(details);
    const modal = document.createElement('div');
    modal.className = 'mobile-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${name}</h3>
            <p><strong>類型：</strong>${type}</p>
            <p>${description}</p>
            ${details.duration ? `<p><strong>所需時間：</strong>${details.duration}</p>` : ''}
            ${details.capacity ? `<p><strong>可容納人數：</strong>${details.capacity}</p>` : ''}
            ${details.features ? `<p><strong>特色：</strong>${details.features}</p>` : ''}
            <img src="${imgUrl}" loading="lazy" referrerpolicy="no-referrer" alt="${name}">
            <div class="modal-buttons">
                <button onclick="this.closest('.mobile-modal').remove()">關閉</button>
                ${link ? `<button onclick="window.open('${link}', '_blank', 'noreferrer')">查看詳情</button>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 切換收藏狀態
function toggleFavorite(id, button) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(id);
    const svg = button.querySelector('.icon-heart path');
    
    if (index === -1) {
        favorites.push(id);
        button.classList.add('active');
        svg.setAttribute('d', ICONS.HEART_FILLED);
        svg.setAttribute('fill', '#ff4081');
    } else {
        favorites.splice(index, 1);
        button.classList.remove('active');
        svg.setAttribute('d', ICONS.HEART_OUTLINE);
        svg.setAttribute('fill', 'currentColor');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// 切換書籤狀態
// 切換勾勾狀態
function toggleBookmark(id, button) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const index = bookmarks.indexOf(id);
    const svg = button.querySelector('.icon-check path');
    
    if (index === -1) {
        bookmarks.push(id);
        button.classList.add('active');
        svg.setAttribute('d', ICONS.CHECK_FILLED);
        svg.setAttribute('fill', '#4caf50');
    } else {
        bookmarks.splice(index, 1);
        button.classList.remove('active');
        svg.setAttribute('d', ICONS.CHECK_OUTLINE);
        svg.setAttribute('fill', 'currentColor');
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// 初始化時載入詳細信息
window.attractionDetails = {};
async function initializeApp() {
    window.attractionDetails = await fetchAttractionDetails();
    initializeUI();
    updateAttractions();
}

// 初始化頁面標題和按鈕文字
function initializeUI() {
    const toggleButton = document.getElementById('toggleButton');
    if (currentAPI === DISNEYSEA_API) {
        toggleButton.textContent = '切換至迪士尼樂園';
        document.getElementById('parkTitle').textContent = '東京迪士尼海洋遊樂設施';
    } else {
        toggleButton.textContent = '切換至迪士尼海洋';
        document.getElementById('parkTitle').textContent = '東京迪士尼樂園遊樂設施';
    }
}

async function updateAttractions() {
    const attractionsGrid = document.getElementById('attractionsGrid');
    const attractions = await fetchAttractions();
    
    if (attractions.length === 0) {
        attractionsGrid.innerHTML = '<p>無法載入景點資訊</p>';
        return;
    }

    attractionsGrid.innerHTML = attractions
        .map(attraction => createAttractionCard(attraction))
        .join('');
}

// 初始載入
// initializeUI();
// updateAttractions();
initializeApp();

// 每 5 分鐘更新一次
setInterval(updateAttractions, 5 * 60 * 1000);

