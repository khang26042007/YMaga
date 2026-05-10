import { API_BASE_URL } from './api.ts';

// Helper tạo SVG Icons
const getIcon = (type: string, size: number = 18) => {
    if(type === 'comment') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`;
    if(type === 'star') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="var(--star)" stroke="var(--star)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    if(type === 'bookmark') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
    return '';
};

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('vi-VN');
};

let currentSidebarPage = 1;
const SIDEBAR_LIMIT = 5;
let currentUserUsername: string | null = null; // Biến ngầm kiểm tra xem đã đăng nhập chưa

document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserVerify(); // Kiểm tra phiên đăng nhập ngay khi mở trang
    
    fetchFeaturedPosts();
    fetchLatestPosts();
    fetchFavoriteSidebar(currentSidebarPage);
    setupGlobalInteractions(); // Kích hoạt bộ lắng nghe sự kiện Bookmark toàn cục
});

// ==========================================
// 1. FETCH & RENDER BÀI VIẾT NỔI BẬT / MỚI NHẤT
// ==========================================
async function fetchUserVerify() {
    try {
        const res = await fetch(`${API_BASE_URL}/user/verify`, { method: 'GET', credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.data) {
                currentUserUsername = data.data.username;
            }
        }
    } catch (err) {}
}

async function fetchFeaturedPosts() {
    try {
        const res = await fetch(`${API_BASE_URL}/home/featured`);
        const data = await res.json();
        if (res.ok && data.data && data.data.posts) {
            renderFeaturedUI(data.data.posts);
            // Kích hoạt lấy trạng thái Sao, Cmt, Bookmark cho từng bài mà KHÔNG can thiệp vào event click
            data.data.posts.forEach((p: any) => fetchPostInteractions(p.id));
        }
    } catch (err) { console.error("Lỗi tải bài nổi bật:", err); }
}

async function fetchLatestPosts() {
    try {
        const res = await fetch(`${API_BASE_URL}/home/latest`);
        const data = await res.json();
        if (res.ok && data.data && data.data.posts) {
            renderLatestUI(data.data.posts);
            data.data.posts.forEach((p: any) => fetchPostInteractions(p.id));
        }
    } catch (err) { console.error("Lỗi tải bài mới nhất:", err); }
}

function renderFeaturedUI(posts: any[]) {
    if(!posts || posts.length === 0) return;
    
    const main = posts[0];
    const mainContainer = document.getElementById('feat-main-container');
    if (mainContainer) {
        mainContainer.innerHTML = `
            <a href="post-detail.html?id=${main.id}"><img src="${main.cover}" alt="img"></a>
            <div class="p-in">
                <h3><a href="post-detail.html?id=${main.id}">${main.title}</a></h3>
                <p style="font-size:14px; color:var(--gy); margin: 8px 0; line-height: 1.5;">${main.subtitle || ''}</p>
                <div style="font-size:12px; color:var(--gy);">${formatDate(main.timestamp)}</div>
                
                <div class="act-btns">
                    <div class="act-btn btn-star" title="Đánh giá trung bình">
                        ${getIcon('star')} <span class="star-cnt-${main.id}">0.0</span>
                    </div>
                    <a href="post-detail.html?id=${main.id}#cmt-section" class="act-btn" title="Bình luận">
                        ${getIcon('comment')} <span class="cmt-cnt-${main.id}">0</span>
                    </a>
                    <div class="act-btn btn-bookmark btn-bm-${main.id}" data-id="${main.id}" title="Lưu bài">
                        ${getIcon('bookmark')} Lưu
                    </div>
                </div>
            </div>
        `;
    }

    const sideContainer = document.getElementById('feat-side-container');
    if (sideContainer) {
        let sideHTML = '';
        for(let i=1; i<=4; i++) {
            if(!posts[i]) break;
            sideHTML += `
                <div class="card feat-side-crd">
                    <a href="post-detail.html?id=${posts[i].id}"><img src="${posts[i].cover}"></a>
                    <div class="p-in" style="display:flex; flex-direction:column; justify-content:space-between; height:100%;">
                        <h4 style="margin-bottom:8px;"><a href="post-detail.html?id=${posts[i].id}">${posts[i].title}</a></h4>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                            <span style="font-size:11px; color:var(--gy);">${formatDate(posts[i].timestamp)}</span>
                            <div class="act-btns" style="margin-top:0;">
                                <div class="act-btn btn-star" title="Đánh giá">${getIcon('star', 15)} <span class="star-cnt-${posts[i].id}" style="font-size:11px;">0.0</span></div>
                                <a href="post-detail.html?id=${posts[i].id}#cmt-section" class="act-btn" title="Bình luận">${getIcon('comment', 15)} <span class="cmt-cnt-${posts[i].id}" style="font-size:11px;">0</span></a>
                                <div class="act-btn btn-bookmark btn-bm-${posts[i].id}" data-id="${posts[i].id}" title="Lưu bài">${getIcon('bookmark', 15)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        sideContainer.innerHTML = sideHTML;
    }

    const botContainer = document.getElementById('feat-bottom-container');
    if (botContainer) {
        let botHTML = '';
        for(let i=5; i<=8; i++) {
            if(!posts[i]) break;
            botHTML += `
                <div class="card feat-bot-crd">
                    <a href="post-detail.html?id=${posts[i].id}"><img src="${posts[i].cover}"></a>
                    <div class="p-in">
                        <h4><a href="post-detail.html?id=${posts[i].id}">${posts[i].title}</a></h4>
                        <p style="font-size:12px; color:var(--gy); margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${posts[i].subtitle || ''}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:12px;">
                            <span style="font-size:11px; color:var(--gy);">${formatDate(posts[i].timestamp)}</span>
                            <div class="act-btns" style="margin-top:0;">
                                <div class="act-btn btn-star" title="Đánh giá">${getIcon('star', 15)} <span class="star-cnt-${posts[i].id}" style="font-size:11px;">0.0</span></div>
                                <a href="post-detail.html?id=${posts[i].id}#cmt-section" class="act-btn" title="Bình luận">${getIcon('comment', 15)} <span class="cmt-cnt-${posts[i].id}" style="font-size:11px;">0</span></a>
                                <div class="act-btn btn-bookmark btn-bm-${posts[i].id}" data-id="${posts[i].id}" title="Lưu bài">${getIcon('bookmark', 15)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        botContainer.innerHTML = botHTML;
    }
}

function renderLatestUI(posts: any[]) {
    const container = document.getElementById('latest-posts-container');
    if (!container) return;
    container.innerHTML = '';
    posts.forEach(p => {
        container.innerHTML += `
            <div class="card c-rw">
                <a href="post-detail.html?id=${p.id}"><img src="${p.cover}" alt="img"></a>
                <div class="cnt">
                    <h3><a href="post-detail.html?id=${p.id}">${p.title}</a></h3>
                    <p style="font-size:13px; color:var(--dk); margin: 8px 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.subtitle || ''}</p>
                    <div style="font-size:12px; color:var(--gy); margin-bottom:16px;">${formatDate(p.timestamp)}</div>
                    
                    <div style="display:flex; justify-content:flex-end; align-items:center; margin-top:auto;">
                        <div class="act-btns" style="margin-top:0;">
                            <div class="act-btn btn-star" title="Đánh giá trung bình">${getIcon('star')} <span class="star-cnt-${p.id}">0.0</span></div>
                            <a href="post-detail.html?id=${p.id}#cmt-section" class="act-btn" title="Bình luận">${getIcon('comment')} <span class="cmt-cnt-${p.id}">0</span></a>
                            <div class="act-btn btn-bookmark btn-bm-${p.id}" data-id="${p.id}" title="Lưu bài">${getIcon('bookmark')} Lưu</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}


// ==========================================
// 2. GỌI API LẤY SỐ LƯỢNG (SAO, CMT) & TRẠNG THÁI BOOKMARK 
// ==========================================
async function fetchPostInteractions(postId: string) {
    // Chỉ cập nhật trạng thái UI, KHÔNG đính kèm event listener ở đây nữa
    try {
        const resFav = await fetch(`${API_BASE_URL}/post/${postId}/favorite`, { credentials: 'include' });
        if (resFav.ok) {
            const data = await resFav.json();
            const isBookmarked = data.data?.favorite || false;

            document.querySelectorAll(`.btn-bm-${postId}`).forEach(btn => {
                if(isBookmarked) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        }
    } catch(err) {}

    try {
        const resCmt = await fetch(`${API_BASE_URL}/post/${postId}/comments?limit=1&offset=1`);
        if (resCmt.ok) {
            const data = await resCmt.json();
            const cmtCnt = data.data?.count || 0;
            const avgRating = data.data?.avg_rating || 0;
            
            document.querySelectorAll(`.cmt-cnt-${postId}`).forEach(el => el.textContent = cmtCnt.toString());
            document.querySelectorAll(`.star-cnt-${postId}`).forEach(el => el.textContent = Number(avgRating).toFixed(1));
        }
    } catch(err) {}
}


// ==========================================
// 3. XỬ LÝ SỰ KIỆN CLICK LƯU BÀI (EVENT DELEGATION)
// ==========================================
function setupGlobalInteractions() {
    // Dùng Event Delegation: Bắt mọi cú click trên trang
    document.addEventListener('click', async (e) => {
        // Tìm xem người dùng có click vào nút Bookmark hoặc phần tử con của nó không
        const targetBtn = (e.target as Element).closest('.btn-bookmark') as HTMLElement;
        if (!targetBtn) return; // Nếu click chỗ khác thì bỏ qua
        
        e.preventDefault();
        e.stopPropagation();

        const postId = targetBtn.getAttribute('data-id');
        if (!postId) return;

        // Bắt buộc đăng nhập
        if (!currentUserUsername) {
            alert("Vui lòng đăng nhập để lưu bài viết nhé!");
            window.location.href = 'login.html';
            return;
        }

        // 1. Tìm tất cả các nút Bookmark của bài viết này và thay đổi UI ngay lập tức
        const btns = document.querySelectorAll(`.btn-bm-${postId}`);
        btns.forEach(btn => btn.classList.toggle('active'));

        try {
            // 2. Gọi API để lưu trạng thái
            const res = await fetch(`${API_BASE_URL}/post/${postId}/update-favorite`, {
                method: 'POST',
                credentials: 'include' 
            });

            if (res.status === 401) {
                btns.forEach(btn => btn.classList.toggle('active')); // Hoàn tác nếu bị lỗi Auth
                alert("Vui lòng đăng nhập để lưu bài viết!");
                window.location.href = 'login.html';
                return;
            }

            if (res.ok) {
                const data = await res.json();
                if(data.data) {
                    const isFav = data.data.favorite;
                    // Cập nhật lại màu sắc chuẩn xác từ Backend cho toàn bộ các nút
                    btns.forEach(btn => {
                        if(isFav) btn.classList.add('active');
                        else btn.classList.remove('active');
                    });
                    
                    // Tải lại thanh Sidebar bên phải
                    fetchFavoriteSidebar(currentSidebarPage);
                }
            } else {
                btns.forEach(btn => btn.classList.toggle('active')); // Hoàn tác nếu lỗi Server
            }
        } catch (err) {
            btns.forEach(btn => btn.classList.toggle('active')); // Hoàn tác nếu đứt mạng
        }
    });
}


// ==========================================
// 4. SIDEBAR BÀI VIẾT ĐÃ LƯU & PHÂN TRANG
// ==========================================
async function fetchFavoriteSidebar(page: number) {
    const guestPrompt = document.getElementById('guest-fav-prompt');
    const likedSidebarWrap = document.getElementById('liked-posts-sidebar');
    const listContainer = document.getElementById('liked-posts-list');
    const paginationContainer = document.getElementById('liked-posts-pagination');
    
    if (!guestPrompt || !likedSidebarWrap || !listContainer || !paginationContainer) return;

    try {
        const res = await fetch(`${API_BASE_URL}/user/liked-posts?limit=${SIDEBAR_LIMIT}&offset=${page}`, { 
            method: 'GET',
            credentials: 'include' 
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
            const posts = result.data?.topics || result.data?.posts || []; 
            const totalItems = result.data?.count || 0;
            
            if (posts.length > 0) {
                listContainer.innerHTML = '';
                posts.forEach((p: any) => {
                    listContainer.innerHTML += `
                        <a href="post-detail.html?id=${p.id}" style="display:flex; gap:12px; align-items:center; background:#FFF; padding:8px; border-radius:8px; border:1px solid var(--bd);">
                            <img src="${p.cover || 'default.jpg'}" style="width:70px; height:50px; object-fit:cover; flex-shrink: 0; border-radius:4px;">
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <h4 style="font-size:13px; font-weight:600; color:var(--dk); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.title}</h4>
                                <span style="font-size:10px; color:var(--gy);">${formatDate(p.published_at || p.timestamp)}</span>
                            </div>
                        </a>
                    `;
                });
                
                const totalPages = Math.ceil(totalItems / SIDEBAR_LIMIT);
                renderPagination(totalPages, page, paginationContainer);
                
            } else {
                listContainer.innerHTML = `<div style="text-align:center; color:var(--gy); font-size:14px; padding: 20px 0;">Bạn chưa có bài viết đã lưu nào ở trang này.</div>`;
                paginationContainer.innerHTML = '';
            }
        }
    } catch (err) { console.error("Lỗi tải sidebar đã lưu:", err); }
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
            fetchFavoriteSidebar(currentSidebarPage);
        });
        
        container.appendChild(btn);
    }
}