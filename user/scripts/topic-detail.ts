import { API_BASE_URL } from './api.ts';

let CURRENT_TOPIC_ID = '';
let currentUserUsername: string | null = null;
let currentSidebarPage = 1;
const SIDEBAR_LIMIT = 5;

const svgComment = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`;
const svgBookmark = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
const svgStar = `<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--star)" stroke="var(--star)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('vi-VN');
};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    CURRENT_TOPIC_ID = urlParams.get('id') || '';

    if (!CURRENT_TOPIC_ID) {
        alert("Không tìm thấy chủ đề!");
        window.location.href = 'topic.html';
        return;
    }

    await fetchUserVerify();
    
    fetchTopicDetail();
    fetchTopicPosts();
    fetchTopicInteractions(); 
    setupTopicFavoriteToggle();
    fetchFavoriteTopicsSidebar(currentSidebarPage);
    
    if (currentUserUsername) {
        const ratingArea = document.getElementById('topic-rating-input-area');
        if (ratingArea) ratingArea.style.display = 'block';
        setupStarSelector();
        setupSubmitTopicRating();
    }
    
    setupGlobalPostBookmarkLogic();
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

async function fetchTopicDetail() {
    try {
        const res = await fetch(`${API_BASE_URL}/topic/${CURRENT_TOPIC_ID}`);
        const data = await res.json();
        
        if (res.ok && data.data) {
            const topic = data.data;
            document.getElementById('topic-hero-title')!.textContent = topic.name;
            document.getElementById('info-topic-title')!.textContent = topic.name;
            
            if (topic.cover) document.getElementById('topic-hero-bg')!.style.backgroundImage = `url('${topic.cover}')`;
            if (topic.description) document.getElementById('info-topic-desc')!.textContent = topic.description;
            
            if (topic.links && topic.links.length > 0) {
                const linksHTML = topic.links.map((lnk: any) => `<li><a href="${lnk.url}" target="_blank" style="color:var(--p); text-decoration:underline;">${lnk.title}</a></li>`).join('');
                document.getElementById('info-topic-links')!.innerHTML = linksHTML;
            } else {
                document.getElementById('info-topic-links')!.innerHTML = '<li style="color:var(--gy); font-style:italic;">Chưa có link liên quan</li>';
            }
        }
    } catch (err) {}
}

async function fetchTopicPosts() {
    try {
        const res = await fetch(`${API_BASE_URL}/topic/${CURRENT_TOPIC_ID}/posts?limit=10&offset=1`);
        const data = await res.json();
        
        const posts = data.data?.posts || [];
        const container = document.getElementById('topic-posts-list');
        const mainContainer = document.getElementById('featured-post-container');
        
        if (posts.length === 0) {
            if(container) container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--gy);">Chưa có bài viết nào trong chủ đề này.</div>';
            return;
        }

        const mainPost = posts[0];
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div class="feat-post">
                    <a href="post-detail.html?id=${mainPost.id}"><img src="${mainPost.cover || 'default.jpg'}" alt="img"></a>
                    <div class="p-in">
                        <h2><a href="post-detail.html?id=${mainPost.id}">${mainPost.title}</a></h2>
                        <p style="color:var(--gy); font-size:14px; margin-bottom:12px;">${mainPost.subtitle || ''}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                            <span style="font-size:12px; color:var(--gy); font-weight:500;">${formatDate(mainPost.timestamp)}</span>
                            <div class="act-btns">
                                <div class="act-btn" title="Điểm Đánh giá">${svgStar} <span class="star-cnt-${mainPost.id}">0.0</span></div>
                                <a href="post-detail.html?id=${mainPost.id}#cmt-section" class="act-btn">${svgComment} <span class="cmt-cnt-${mainPost.id}">0</span></a>
                                <div class="act-btn btn-bookmark post-bm-${mainPost.id}" data-id="${mainPost.id}">${svgBookmark} Lưu</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (container) {
            container.innerHTML = '';
            for (let i = 1; i < posts.length; i++) {
                const p = posts[i];
                container.innerHTML += `
                    <div class="l-crd">
                        <a href="post-detail.html?id=${p.id}"><img src="${p.cover || 'default.jpg'}" alt="img"></a>
                        <div class="p-in">
                            <h3><a href="post-detail.html?id=${p.id}">${p.title}</a></h3>
                            <p style="font-size:12px; color:var(--gy); margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.subtitle || ''}</p>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                                <span style="font-size:12px; color:var(--gy); font-weight:500;">${formatDate(p.timestamp)}</span>
                                <div class="act-btns">
                                    <div class="act-btn" title="Điểm Đánh giá">${svgStar} <span class="star-cnt-${p.id}">0.0</span></div>
                                    <a href="post-detail.html?id=${p.id}#cmt-section" class="act-btn" title="Bình luận">${svgComment} <span class="cmt-cnt-${p.id}">0</span></a>
                                    <div class="act-btn btn-bookmark post-bm-${p.id}" data-id="${p.id}" title="Lưu">${svgBookmark}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        posts.forEach((p: any) => fetchPostInteractions(p.id));
    } catch (err) {}
}

async function fetchPostInteractions(postId: string) {
    try {
        const resFav = await fetch(`${API_BASE_URL}/post/${postId}/favorite`, { credentials: 'include' });
        if (resFav.ok) {
            const data = await resFav.json();
            const isBookmarked = data.data?.favorite || false;
            document.querySelectorAll(`.post-bm-${postId}`).forEach(btn => {
                if(isBookmarked) btn.classList.add('active'); else btn.classList.remove('active');
            });
        }
    } catch(err) {}

    try {
        const resCmt = await fetch(`${API_BASE_URL}/post/${postId}/comments?limit=1&offset=1`);
        if (resCmt.ok) {
            const data = await resCmt.json();
            document.querySelectorAll(`.cmt-cnt-${postId}`).forEach(el => el.textContent = (data.data?.count || 0).toString());
            document.querySelectorAll(`.star-cnt-${postId}`).forEach(el => el.textContent = Number(data.data?.avg_rating || 0).toFixed(1));
        }
    } catch(err) {}
}

async function fetchTopicInteractions() {
    try {
        const resFav = await fetch(`${API_BASE_URL}/topic/${CURRENT_TOPIC_ID}/favorite`, { credentials: 'include' });
        if (resFav.ok) {
            const data = await resFav.json();
            if (data.data) {
                const btn = document.getElementById('btn-toggle-topic-fav');
                const txt = document.getElementById('txt-fav-topic');
                document.getElementById('topic-like-cnt')!.textContent = data.data.like_count || 0;
                
                if (data.data.favorite) {
                    btn?.classList.add('active');
                    if (txt) txt.textContent = 'Đã lưu chủ đề';
                }
            }
        }
    } catch (err) {}

    try {
        const resRate = await fetch(`${API_BASE_URL}/topic/${CURRENT_TOPIC_ID}/ratings`, { credentials: 'include' });
        if (resRate.ok) {
            const data = await resRate.json();
            console.log(data.data)
            if (data.data) {
                document.getElementById('topic-avg-rating')!.textContent = Number(data.data.avg_rating || 0).toFixed(1);
                document.getElementById('topic-rating-cnt')!.textContent = data.data.count || 0;
                
                if (currentUserUsername && data.data.your_rating) {
                    const container = document.getElementById('topic-star-selector');
                    if (container) {
                        container.setAttribute('data-val', data.data.your_rating);
                        container.querySelectorAll('svg').forEach(s => {
                            const idx = parseInt(s.getAttribute('data-idx') || '0');
                            s.classList.toggle('selected', idx <= data.data.your_rating);
                        });
                    }
                }
            }
        }
    } catch(err) {}
}

function setupTopicFavoriteToggle() {
    const btn = document.getElementById('btn-toggle-topic-fav');
    btn?.addEventListener('click', async () => {
        if (!currentUserUsername) {
            alert("Vui lòng đăng nhập để lưu chủ đề!");
            window.location.href = 'login.html';
            return;
        }

        // Tạm đổi UI (Optimistic UI)
        btn.classList.toggle('active'); 
        const txt = document.getElementById('txt-fav-topic');
        const cnt = document.getElementById('topic-like-cnt');
        const isFavNow = btn.classList.contains('active');
        
        if (txt) txt.textContent = isFavNow ? 'Đã lưu chủ đề' : 'Yêu thích';
        if (cnt) {
            let currentCount = parseInt(cnt.textContent || '0');
            cnt.textContent = (isFavNow ? currentCount + 1 : Math.max(0, currentCount - 1)).toString();
        }

        try {
            const res = await fetch(`${API_BASE_URL}/topic/${CURRENT_TOPIC_ID}/update-favorite`, {
                method: 'POST', credentials: 'include'
            });

            if (res.status === 401) {
                btn.classList.toggle('active');
                if (txt) txt.textContent = btn.classList.contains('active') ? 'Đã lưu chủ đề' : 'Yêu thích';
                if (cnt) cnt.textContent = (parseInt(cnt.textContent || '0') + (btn.classList.contains('active') ? 1 : -1)).toString();
                return;
            }

            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    if (data.data.favorite) {
                        btn.classList.add('active');
                        if (txt) txt.textContent = 'Đã lưu chủ đề';
                    } else {
                        btn.classList.remove('active');
                        if (txt) txt.textContent = 'Yêu thích';
                    }
                    if (cnt) cnt.textContent = data.data.like_count;
                }
                
                // LÀM MỚI NGAY LẬP TỨC SIDEBAR
                fetchFavoriteTopicsSidebar(currentSidebarPage); 
            } else {
                btn.classList.toggle('active');
                if (txt) txt.textContent = btn.classList.contains('active') ? 'Đã lưu chủ đề' : 'Yêu thích';
                if (cnt) cnt.textContent = (parseInt(cnt.textContent || '0') + (btn.classList.contains('active') ? 1 : -1)).toString();
            }
        } catch (err) {
            btn.classList.toggle('active');
            if (txt) txt.textContent = btn.classList.contains('active') ? 'Đã lưu chủ đề' : 'Yêu thích';
        }
    });
}

function setupStarSelector() {
    const container = document.getElementById('topic-star-selector');
    if (!container) return;
    const stars = container.querySelectorAll('svg');
    
    const updateStars = (val: number, isHover: boolean) => {
        stars.forEach(s => {
            const idx = parseInt(s.getAttribute('data-idx') || '0');
            if (isHover) s.classList.toggle('hovered', idx <= val);
            else s.classList.toggle('selected', idx <= val);
        });
    };

    stars.forEach(star => {
        star.addEventListener('mouseover', () => updateStars(parseInt(star.getAttribute('data-idx') || '0'), true));
        star.addEventListener('mouseout', () => stars.forEach(s => s.classList.remove('hovered')));
        star.addEventListener('click', () => {
            const val = parseInt(star.getAttribute('data-idx') || '0');
            container.setAttribute('data-val', val.toString());
            updateStars(val, false);
        });
    });
}

function setupSubmitTopicRating() {
    const btn = document.getElementById('btn-submit-topic-rating') as HTMLButtonElement;
    const container = document.getElementById('topic-star-selector');
    
    btn?.addEventListener('click', async () => {
        if (!currentUserUsername) return;
        const rating = parseInt(container?.getAttribute('data-val') || '0');
        if (rating === 0) { alert("Vui lòng chọn số sao để đánh giá!"); return; }

        btn.disabled = true; btn.textContent = 'Đang gửi...';
        try {
            const res = await fetch(`${API_BASE_URL}/topic/${CURRENT_TOPIC_ID}/rating`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rating })
            });

            if (res.ok) {
                alert("Cảm ơn bạn đã đánh giá chủ đề này!");
                fetchTopicInteractions(); 
            } else {
                alert("Lỗi gửi đánh giá, vui lòng thử lại!");
            }
        } catch(err) {}
        finally { btn.disabled = false; btn.textContent = 'Gửi Đánh Giá'; }
    });
}


// ==========================================
// 3. SIDEBAR "CHỦ ĐỀ ĐÃ LƯU" ĐỒNG BỘ TRANG HOME
// ==========================================
async function fetchFavoriteTopicsSidebar(page: number) {
    const guestPrompt = document.getElementById('guest-fav-prompt');
    const likedSidebarWrap = document.getElementById('liked-topics-sidebar');
    const listContainer = document.getElementById('liked-topics-list');
    const paginationContainer = document.getElementById('liked-topics-pagination');
    
    if (!guestPrompt || !likedSidebarWrap || !listContainer || !paginationContainer) return;

    try {
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
            
            // BỘ LỌC CẤU TRÚC DỮ LIỆU
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


// ==========================================
// 4. EVENT DELEGATION BÀI VIẾT BÊN TRONG TOPIC
// ==========================================
function setupGlobalPostBookmarkLogic() {
    document.addEventListener('click', async (e) => {
        const targetBtn = (e.target as Element).closest('.btn-bookmark') as HTMLElement;
        if (!targetBtn) return;
        
        e.preventDefault(); e.stopPropagation();

        const postId = targetBtn.getAttribute('data-id');
        if (!postId) return;

        if (!currentUserUsername) {
            alert("Vui lòng đăng nhập để lưu bài viết nhé!");
            window.location.href = 'login.html';
            return;
        }

        const btns = document.querySelectorAll(`.post-bm-${postId}`);
        btns.forEach(btn => btn.classList.toggle('active')); 

        try {
            const res = await fetch(`${API_BASE_URL}/post/${postId}/update-favorite`, {
                method: 'POST', credentials: 'include' 
            });

            if (res.ok) {
                const data = await res.json();
                if(data.data) {
                    btns.forEach(btn => {
                        if(data.data.favorite) btn.classList.add('active');
                        else btn.classList.remove('active');
                    });
                }
            } else { btns.forEach(btn => btn.classList.toggle('active')); }
        } catch (err) { btns.forEach(btn => btn.classList.toggle('active')); }
    });
}