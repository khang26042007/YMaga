import { API_BASE_URL } from './api.ts';

const svgBookmark = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
let currentUserUsername: string | null = null; 
let currentSidebarPage = 1;
const SIDEBAR_LIMIT = 5;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserVerify();
    fetchTopicsList();
    fetchTopicsWithPosts();
    fetchFavoriteTopicsSidebar(currentSidebarPage);
    setupGlobalTopicInteractions();
});

async function fetchUserVerify() {
    try {
        const res = await fetch(`${API_BASE_URL}/user/verify`, { method: 'GET', credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.data) currentUserUsername = data.data.username;
        }
    } catch (err) {}
}

// 1. Grid danh sách chủ đề trên cùng
async function fetchTopicsList() {
    const container = document.getElementById('topics-grid-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/home/topics?limit=10&offset=1`);
        const data = await res.json();
        
        if (res.ok && data.data && data.data.topics) {
            container.innerHTML = '';
            data.data.topics.forEach((topic: any) => {
                const bmkBtn = `
                    <div class="btn-bmk-topic topic-bm-${topic.id}" data-id="${topic.id}" title="Lưu chủ đề">
                        ${svgBookmark} <span class="topic-like-cnt-${topic.id}">0</span>
                    </div>
                `;

                const iconHtml = topic.cover 
                    ? `<img src="${topic.cover}" style="width:48px; height:48px; border-radius:8px; object-fit:cover;">`
                    : `<div class="t-ic">⌘</div>`;

                container.innerHTML += `
                    <div class="t-crd" onclick="window.location.href='topic-detail.html?id=${topic.id}'">
                        <div class="t-crd-top">
                            ${iconHtml}
                            <div class="t-in">
                                <h4>${topic.name}</h4>
                                <p>${topic.post_count || 0} bài viết</p>
                            </div>
                        </div>
                        <div class="t-crd-bot">
                            <span style="font-size:11px; color:var(--gy);">Chủ đề nổi bật</span>
                            ${bmkBtn}
                        </div>
                    </div>
                `;
            });
            
            // Gọi âm thầm để lấy trạng thái Bookmark & Số Like
            data.data.topics.forEach((t: any) => fetchTopicFavoriteStatus(t.id));
        }
    } catch (err) {}
}

// 2. Load các Slider chứa Bài viết bên trong Topic
async function fetchTopicsWithPosts() {
    const container = document.getElementById('topics-posts-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/home/topics?limit=3&offset=1`);
        const data = await res.json();
        
        if (res.ok && data.data && data.data.topics) {
            container.innerHTML = '';
            const topics = data.data.topics;
            
            for (const topic of topics) {
                try {
                    const postRes = await fetch(`${API_BASE_URL}/topic/${topic.id}/posts?limit=8&offset=1`);
                    const postData = await postRes.json();
                    const posts = postData.data?.posts || [];

                    if (posts.length > 0) {
                        let postsHTML = posts.map((p: any) => `
                            <a href="post-detail.html?id=${p.id}" class="p-card">
                                <img src="${p.cover || 'default.jpg'}" alt="img">
                                <div class="p-inf">
                                    <h3>${p.title}</h3>
                                </div>
                            </a>
                        `).join('');

                        const bmkBtn = `
                            <div class="btn-bmk-topic topic-bm-${topic.id}" data-id="${topic.id}" title="Lưu chủ đề">
                                ${svgBookmark} <span class="topic-like-cnt-${topic.id}">0</span>
                            </div>
                        `;

                        container.innerHTML += `
                            <div class="cat-sec">
                                <div class="cat-hd">
                                    <h2><a href="topic-detail.html?id=${topic.id}">${topic.name}</a></h2>
                                    ${bmkBtn}
                                </div>
                                <div class="slider-wrap">
                                    <button class="slider-btn prev" onclick="slidePosts(this, -1)">❮</button>
                                    <div class="slider-track">${postsHTML}</div>
                                    <button class="slider-btn next" onclick="slidePosts(this, 1)">❯</button>
                                </div>
                            </div>
                        `;
                    }
                } catch(err) {}
            }
            topics.forEach((t: any) => fetchTopicFavoriteStatus(t.id));
        }
    } catch (err) {}
}

(window as any).slidePosts = (btn: HTMLElement, direction: number) => {
    const wrap = btn.closest('.slider-wrap');
    if (!wrap) return;
    const track = wrap.querySelector('.slider-track') as HTMLElement;
    if (track) {
        const scrollAmount = track.clientWidth * 0.8;
        track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
};

// ==========================================
// 3. SIDEBAR "CHỦ ĐỀ ĐÃ LƯU" SIÊU CHUẨN
// ==========================================
async function fetchFavoriteTopicsSidebar(page: number) {
    const guestPrompt = document.getElementById('guest-fav-prompt');
    const likedSidebarWrap = document.getElementById('liked-topics-sidebar');
    const listContainer = document.getElementById('liked-topics-list');
    const paginationContainer = document.getElementById('liked-topics-pagination');
    
    if (!guestPrompt || !likedSidebarWrap || !listContainer || !paginationContainer) return;

    try {
        // _t=Date.now() ngăn trình duyệt trả về data cũ
        const res = await fetch(`${API_BASE_URL}/user/liked-topics?limit=${SIDEBAR_LIMIT}&offset=${page}&_t=${Date.now()}`, { 
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
        });
        
        if (res.status === 401) {
            guestPrompt.style.display = 'flex';
            likedSidebarWrap.style.display = 'none';
            return;
        }

        if (res.ok) {
            guestPrompt.style.display = 'none';
            likedSidebarWrap.style.display = 'flex';

            const result = await res.json();
            
            // BỘ LỌC CẤU TRÚC DỮ LIỆU: Bắt mọi trường hợp Backend có thể trả về
            let topics = [];
            if (Array.isArray(result.data)) topics = result.data;
            else if (result.data?.topics) topics = result.data.topics;
            else if (result.data?.result) topics = result.data.result;
            else if (result.data?.data) topics = result.data.data;
            
            const totalItems = result.data?.count || topics.length;
            
            if (topics.length > 0) {
                listContainer.innerHTML = '';
                topics.forEach((topic: any) => {
                    const iconHtml = topic.cover 
                        ? `<img src="${topic.cover}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; flex-shrink:0;">`
                        : `<div style="width:50px; height:50px; background:#E5F6FF; color:#0095FF; border-radius:4px; display:flex; justify-content:center; align-items:center; font-weight:700; flex-shrink:0;">⌘</div>`;

                    listContainer.innerHTML += `
                        <a href="topic-detail.html?id=${topic.id}" style="display:flex; gap:12px; align-items:center; background:#FFF; padding:8px; border-radius:8px; border:1px solid var(--bd);">
                            ${iconHtml}
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <h4 style="font-size:13px; font-weight:600; color:var(--dk); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${topic.name}</h4>
                            </div>
                        </a>
                    `;
                });
                
                const totalPages = Math.ceil(totalItems / SIDEBAR_LIMIT);
                renderPagination(totalPages, page, paginationContainer);
                
            } else {
                listContainer.innerHTML = `<div style="text-align:center; color:var(--gy); font-size:14px; padding: 40px 0;">Bạn chưa lưu chủ đề nào.</div>`;
                paginationContainer.innerHTML = '';
            }
        }
    } catch (err) {}
}

function renderPagination(totalPages: number, currentPage: number, container: HTMLElement) {
    container.innerHTML = '';
    if (totalPages <= 1) return; 

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `pg-btn ${i === currentPage ? 'act' : ''}`;
        btn.textContent = i.toString();
        
        btn.addEventListener('click', () => {
            currentSidebarPage = i;
            fetchFavoriteTopicsSidebar(currentSidebarPage);
        });
        
        container.appendChild(btn);
    }
}

async function fetchTopicFavoriteStatus(topicId: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/topic/${topicId}/favorite`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            const isFav = data.data?.favorite || false;
            const likeCnt = data.data?.like_count || 0;
            
            document.querySelectorAll(`.topic-bm-${topicId}`).forEach(btn => {
                if (isFav) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            document.querySelectorAll(`.topic-like-cnt-${topicId}`).forEach(el => el.textContent = likeCnt.toString());
        }
    } catch(err) {}
}

// ==========================================
// 4. EVENT DELEGATION BẮT CLICK LƯU CHỦ ĐỀ
// ==========================================
function setupGlobalTopicInteractions() {
    document.addEventListener('click', async (e) => {
        const targetBtn = (e.target as Element).closest('.btn-bmk-topic') as HTMLElement;
        if (!targetBtn) return;
        
        e.preventDefault(); e.stopPropagation();

        const topicId = targetBtn.getAttribute('data-id');
        if (!topicId) return;

        if (!currentUserUsername) {
            alert("Vui lòng đăng nhập để lưu chủ đề nhé!");
            window.location.href = 'login.html';
            return;
        }

        // Tạm đổi UI (Thêm bớt class Active và Tăng giảm số Like)
        const btns = document.querySelectorAll(`.topic-bm-${topicId}`);
        const isActiveNow = !btns[0]?.classList.contains('active');
        
        btns.forEach(btn => {
            btn.classList.toggle('active');
            const cntSpan = btn.querySelector(`.topic-like-cnt-${topicId}`);
            if (cntSpan) {
                let currCnt = parseInt(cntSpan.textContent || '0');
                cntSpan.textContent = (isActiveNow ? currCnt + 1 : Math.max(0, currCnt - 1)).toString();
            }
        });

        try {
            const res = await fetch(`${API_BASE_URL}/topic/${topicId}/update-favorite`, {
                method: 'POST',
                credentials: 'include' 
            });

            if (res.status === 401) {
                // Hoàn tác
                btns.forEach(btn => btn.classList.toggle('active')); 
                alert("Vui lòng đăng nhập để lưu chủ đề!");
                window.location.href = 'login.html';
                return;
            }

            if (res.ok) {
                const data = await res.json();
                if(data.data) {
                    const isFav = data.data.favorite;
                    const realLikeCnt = data.data.like_count;
                    
                    btns.forEach(btn => {
                        if(isFav) btn.classList.add('active'); else btn.classList.remove('active');
                        const cntSpan = btn.querySelector(`.topic-like-cnt-${topicId}`);
                        if (cntSpan) cntSpan.textContent = realLikeCnt;
                    });
                    
                    // LÀM MỚI SIDEBAR TỨC THÌ
                    fetchFavoriteTopicsSidebar(currentSidebarPage);
                }
            } else {
                btns.forEach(btn => btn.classList.toggle('active')); 
            }
        } catch (err) {
            btns.forEach(btn => btn.classList.toggle('active')); 
        }
    });
}