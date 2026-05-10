import { API_BASE_URL } from './api.ts';

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('vi-VN');
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialKeyword = urlParams.get('q');
    
    if (initialKeyword && initialKeyword.trim() !== '') {
        updateSearchTitle(initialKeyword);
        performSearch(initialKeyword);
        
        const globalSearchInput = document.querySelector('.src input') as HTMLInputElement;
        if (globalSearchInput) {
            globalSearchInput.value = initialKeyword;
        }
    } else {
        showEmptyState('Vui lòng nhập từ khóa để tìm kiếm bài viết và chủ đề.');
    }

    // Lắng nghe sự kiện Enter ở thanh Search bar trên Header
    const globalSearchInput = document.querySelector('.src input') as HTMLInputElement;
    if (globalSearchInput) {
        globalSearchInput.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const newKeyword = globalSearchInput.value.trim();
                if (newKeyword) {
                    // PushState thay vì reload trang để trải nghiệm mượt hơn
                    window.history.pushState({}, '', `?q=${encodeURIComponent(newKeyword)}`);
                    updateSearchTitle(newKeyword);
                    performSearch(newKeyword);
                }
            }
        });
    }
});

function updateSearchTitle(keyword: string) {
    const searchTitle = document.getElementById('search-title');
    if (searchTitle) {
        searchTitle.textContent = `Kết quả cho: "${keyword}"`;
    }
}

function showEmptyState(message: string) {
    const searchTitle = document.getElementById('search-title');
    const postsContainer = document.getElementById('search-results-container');
    const topicsContainer = document.getElementById('topics-container');
    
    if (searchTitle) searchTitle.textContent = message;
    if (postsContainer) postsContainer.innerHTML = `<div class="emp">${message}</div>`;
    if (topicsContainer) topicsContainer.innerHTML = `<div class="emp" style="padding:20px; font-size:14px;">Không có chủ đề.</div>`;
}

async function performSearch(keyword: string) {
    const postsContainer = document.getElementById('search-results-container');
    const topicsContainer = document.getElementById('topics-container');
    
    if (!postsContainer || !topicsContainer) return;

    postsContainer.innerHTML = `<div class="emp" style="color: var(--gy)">Đang tải bài viết...</div>`;
    topicsContainer.innerHTML = `<div class="emp" style="padding:20px; font-size:14px; color: var(--gy)">Đang tải chủ đề...</div>`;

    try {
        // GỌI API THEO ĐÚNG TÀI LIỆU
        const res = await fetch(`${API_BASE_URL}/search/query?keyword=${encodeURIComponent(keyword)}`);
        const data = await res.json();

        if (res.ok && data.status === 'success' && data.data) {
            
            // 1. LẤY & RENDER DANH SÁCH BÀI VIẾT (POSTS)
            const posts = data.data.posts?.result || [];
            if (posts.length > 0) {
                postsContainer.innerHTML = '';
                posts.forEach((post: any) => {
                    postsContainer.innerHTML += `
                        <a href="post-detail.html?id=${post.id}" class="c-rw">
                            <img src="${post.cover || 'default-cover.jpg'}" alt="cover">
                            <div class="cnt">
                                <h3>${post.title}</h3>
                                <p style="color: var(--gy); font-size: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${post.subtitle || 'Chưa có mô tả cho bài viết này...'}
                                </p>
                                <div style="font-size:12px; color:var(--gy); margin-top:12px;">${formatDate(post.timestamp)}</div>
                            </div>
                        </a>
                    `;
                });
            } else {
                postsContainer.innerHTML = `<div class="emp">Không tìm thấy bài viết nào phù hợp với "${keyword}".</div>`;
            }

            // 2. LẤY & RENDER DANH SÁCH CHỦ ĐỀ (TOPICS) LÊN SIDEBAR
            const topics = data.data.topics?.result || [];
            if (topics.length > 0) {
                topicsContainer.innerHTML = '';
                topics.forEach((topic: any) => {
                    // Nếu có cover thì hiện ảnh, không thì hiện Icon chữ cái đầu
                    const coverHtml = topic.cover 
                        ? `<img src="${topic.cover}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; flex-shrink:0;">`
                        : `<div class="tp-ic">${topic.name.charAt(0)}</div>`;

                    topicsContainer.innerHTML += `
                        <a href="topic-detail.html?id=${topic.id}" class="tp-it">
                            ${coverHtml}
                            <div class="tp-in">
                                <h4>${topic.name}</h4>
                                <p>${topic.posts_count || 0} bài viết</p>
                            </div>
                        </a>
                    `;
                });
            } else {
                topicsContainer.innerHTML = `<div class="emp" style="padding:20px; font-size:14px;">Không tìm thấy chủ đề liên quan.</div>`;
            }

        } else {
            showEmptyState(`Không tìm thấy kết quả nào cho "${keyword}".`);
        }
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        postsContainer.innerHTML = `<div class="emp" style="color: #EB5757;">Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.</div>`;
        topicsContainer.innerHTML = `<div class="emp" style="padding:20px; font-size:14px; color: #EB5757;">Lỗi tải chủ đề.</div>`;
    }
}