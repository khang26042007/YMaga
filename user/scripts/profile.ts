import { API_BASE_URL } from './api.ts';

const svgComment = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`;
const svgBookmarkActive = `<svg width="15" height="15" viewBox="0 0 24 24" fill="var(--p)" stroke="var(--p)" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

let currentPostPage = 1;
let currentTopicPage = 1;
const POST_LIMIT = 5;
const TOPIC_LIMIT = 5;

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('vi-VN');
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra xác thực ngầm qua Cookie
    const isLogged = await checkLoginSession();
    if (!isLogged) {
        alert("Bạn cần đăng nhập để xem trang cá nhân!");
        window.location.href = 'login.html';
        return;
    }

    fetchUserProfile();
    fetchFavoritePosts(currentPostPage);
    fetchFavoriteTopics(currentTopicPage);
    setupModals();
    setupGlobalRemoveInteractions();
});

// ==========================================
// 1. API GIAO TIẾP DỮ LIỆU
// ==========================================
async function checkLoginSession() {
    try {
        const res = await fetch(`${API_BASE_URL}/user/verify`, { method: 'GET', credentials: 'include' });
        return res.ok;
    } catch (err) { return false; }
}

async function fetchUserProfile() {
    try {
        // Lấy Profile để render UI
        const res = await fetch(`${API_BASE_URL}/user/verify`, { method: 'GET', credentials: 'include' });
        
        // Fallback sang user/verify nếu Khang chưa làm endpoint profile
        const data = await res.json();

        if (data.data) {
            const user = data.data;
            const nameEl = document.getElementById('profile-name');
            const handleEl = document.getElementById('profile-handle');
            const bioEl = document.getElementById('profile-bio');
            const avatarEl = document.getElementById('profile-avatar') as HTMLImageElement;
            const navUsername = document.getElementById('nav-username');

            // Hỗ trợ cả display_name và name tùy theo Backend
            const displayName = user.display_name || user.username || 'Người dùng';
            if (nameEl) nameEl.textContent = displayName;
            if (navUsername) navUsername.textContent = displayName;
            if (handleEl) handleEl.textContent = `@${user.username || displayName.replace(/\s+/g, '').toLowerCase()}`;
            
            if (bioEl && user.bio) {
                bioEl.textContent = `"${user.bio}"`;
                bioEl.style.display = 'block';
            }

            const avatarUrl = user.avatar_url || user.avatar || `https://ui-avatars.com/api/?name=${displayName}&background=E4E4E4&color=10100E`;
            if (avatarEl) avatarEl.src = avatarUrl;

            // Đẩy dữ liệu vào Form Edit
            (document.getElementById('edit-name') as HTMLInputElement).value = displayName;
            (document.getElementById('edit-usr') as HTMLTextAreaElement).value = user.username || '';
            (document.getElementById('edit-avt') as HTMLInputElement).value = user.avatar_url || user.avatar || '';
        }
    } catch (err) { console.error("Lỗi lấy Profile:", err); }
}

async function fetchFavoritePosts(page: number) {
    const container = document.getElementById('liked-posts-container');
    const pagination = document.getElementById('liked-posts-pagination');
    if (!container || !pagination) return;

    try {
        const res = await fetch(`${API_BASE_URL}/user/liked-posts?limit=${POST_LIMIT}&offset=${page}&_t=${Date.now()}`, { 
            method: 'GET', credentials: 'include', cache: 'no-store' 
        });
        const data = await res.json();

        const posts = data.data?.posts || data.data?.result || data.data || [];
        const totalItems = data.data?.count || posts.length;

        if (posts.length > 0) {
            container.innerHTML = '';
            posts.forEach((p: any) => {
                container.innerHTML += `
                    <div class="pc-crd" id="saved-post-${p.id}">
                        <a href="post-detail.html?id=${p.id}"><img src="${p.cover || 'default.jpg'}" alt="img"></a>
                        <div class="pc-in">
                            <div>
                                <span class="pc-tg">${p.topic?.name || 'Tin tức'}</span>
                                <h3 class="pc-tt"><a href="post-detail.html?id=${p.id}">${p.title}</a></h3>
                                <div class="pc-mt">🗓 ${formatDate(p.published_at || p.timestamp)}</div>
                            </div>
                            <div class="pc-bt">
                                <div></div>
                                <div class="pc-ac">
                                    <div onclick="window.location.href='post-detail.html?id=${p.id}#cmt-section'" title="Bình luận">${svgComment}</div>
                                    <div class="btn-rm-post" data-id="${p.id}" title="Bỏ lưu bài">${svgBookmarkActive}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            renderPagination(Math.ceil(totalItems / POST_LIMIT), page, pagination, 'post');
        } else {
            container.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--gy); font-style:italic; border:1px dashed var(--bd); border-radius:8px;">Bạn chưa lưu bài viết nào.</div>`;
            pagination.innerHTML = '';
        }
    } catch (err) {}
}

async function fetchFavoriteTopics(page: number) {
    const container = document.getElementById('liked-topics-container');
    const pagination = document.getElementById('liked-topics-pagination');
    if (!container || !pagination) return;

    try {
        const res = await fetch(`${API_BASE_URL}/user/liked-topics?limit=${TOPIC_LIMIT}&offset=${page}&_t=${Date.now()}`, { 
            method: 'GET', credentials: 'include', cache: 'no-store' 
        });
        const data = await res.json();

        const topics = data.data?.topics || data.data?.result || data.data || [];
        const totalItems = data.data?.count || topics.length;

        if (topics.length > 0) {
            container.innerHTML = '';
            topics.forEach((topic: any) => {
                const iconHtml = topic.cover 
                    ? `<img src="${topic.cover}" style="width:36px; height:36px; border-radius:6px; object-fit:cover; flex-shrink:0;">`
                    : `<div class="t-ic" style="width:36px; height:36px; font-size:16px;">⌘</div>`;

                container.innerHTML += `
                    <div class="t-crd-sm" id="saved-topic-${topic.id}" onclick="window.location.href='topic-detail.html?id=${topic.id}'">
                        ${iconHtml}
                        <div class="t-in">
                            <h4>${topic.name}</h4>
                            <p>${topic.posts_count || topic.post_count || 0} bài viết</p>
                        </div>
                        <div class="btn-rm-topic" data-id="${topic.id}" style="color:var(--p); padding:4px; cursor:pointer;" title="Bỏ lưu chủ đề">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                    </div>
                `;
            });
            renderPagination(Math.ceil(totalItems / TOPIC_LIMIT), page, pagination, 'topic');
        } else {
            container.innerHTML = `<div style="text-align:center; color:var(--gy); font-size:13px; font-style:italic; padding:20px 0;">Chưa có chủ đề yêu thích.</div>`;
            pagination.innerHTML = '';
        }
    } catch (err) {}
}

function renderPagination(totalPages: number, currentPage: number, container: HTMLElement, type: 'post' | 'topic') {
    container.innerHTML = '';
    if (totalPages <= 1) return; 

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `pg-btn ${i === currentPage ? 'act' : ''}`;
        btn.textContent = i.toString();
        
        btn.addEventListener('click', () => {
            if (type === 'post') { currentPostPage = i; fetchFavoritePosts(i); }
            else { currentTopicPage = i; fetchFavoriteTopics(i); }
        });
        
        container.appendChild(btn);
    }
}

// ==========================================
// 2. TƯƠNG TÁC BỎ LƯU TRỰC TIẾP
// ==========================================
function setupGlobalRemoveInteractions() {
    document.addEventListener('click', async (e) => {
        const targetPost = (e.target as Element).closest('.btn-rm-post') as HTMLElement;
        const targetTopic = (e.target as Element).closest('.btn-rm-topic') as HTMLElement;
        
        // 1. Xóa Bài Viết
        if (targetPost) {
            e.preventDefault(); e.stopPropagation();
            const id = targetPost.getAttribute('data-id');
            const card = document.getElementById(`saved-post-${id}`);
            if (card) card.style.display = 'none'; // Ẩn tức thì

            try {
                await fetch(`${API_BASE_URL}/post/${id}/update-favorite`, { method: 'POST', credentials: 'include' });
                fetchFavoritePosts(currentPostPage); // Reload data ngầm
            } catch (err) { if(card) card.style.display = 'flex'; } // Hoàn tác nếu lỗi
        }

        // 2. Xóa Chủ Đề
        if (targetTopic) {
            e.preventDefault(); e.stopPropagation();
            const id = targetTopic.getAttribute('data-id');
            const card = document.getElementById(`saved-topic-${id}`);
            if (card) card.style.display = 'none'; 

            try {
                await fetch(`${API_BASE_URL}/topic/${id}/update-favorite`, { method: 'POST', credentials: 'include' });
                fetchFavoriteTopics(currentTopicPage); 
            } catch (err) { if(card) card.style.display = 'flex'; } 
        }
    });
}

// ==========================================
// 3. QUẢN LÝ POPUP EDIT VÀ ĐỔI MẬT KHẨU
// ==========================================
function setupModals() {
    const editModal = document.getElementById('edit-modal');
    const pwdModal = document.getElementById('pwd-modal');
    
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
        if(editModal) editModal.classList.add('show');
    });
    document.getElementById('open-pwd-btn')?.addEventListener('click', () => {
        if(editModal) editModal.classList.remove('show');
        if(pwdModal) pwdModal.classList.add('show');
    });
    document.getElementById('close-edit-btn')?.addEventListener('click', () => { if(editModal) editModal.classList.remove('show'); });
    document.getElementById('close-pwd-btn')?.addEventListener('click', () => { if(pwdModal) pwdModal.classList.remove('show'); });

    // LƯU PROFILE (Gửi display_name, avatar, bio theo chuẩn Backend)
    document.getElementById('save-edit-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('save-edit-btn');
        if(btn) btn.textContent = 'Đang lưu...';

        const display_name = (document.getElementById('edit-name') as HTMLInputElement).value;
        const username = (document.getElementById('edit-usr') as HTMLInputElement).value;

        try {
            const res = await fetch(`${API_BASE_URL}/user/edit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ display_name, username }) // Gửi bọc phòng hờ các key API
            });
            if (res.ok) {
                alert('Cập nhật trang cá nhân thành công!');
                window.location.reload();
                if(editModal) editModal.classList.remove('show');
                fetchUserProfile(); // Load lại UI
            } else { alert('Lỗi cập nhật!'); }
        } catch (err) { alert('Có lỗi xảy ra khi kết nối máy chủ!'); } 
        finally { if(btn) btn.textContent = 'Lưu thay đổi'; }
    });

    // ĐỔI MẬT KHẨU (Gửi old_password, new_password theo chuẩn Backend)
    document.getElementById('save-pwd-btn')?.addEventListener('click', async () => {
        const oldPwd = (document.getElementById('pwd-old') as HTMLInputElement).value;
        const newPwd = (document.getElementById('pwd-new') as HTMLInputElement).value;
        const cfPwd = (document.getElementById('pwd-cf') as HTMLInputElement).value;

        if (!oldPwd || !newPwd || !cfPwd) { alert('Vui lòng điền đủ thông tin!'); return; }
        if (newPwd !== cfPwd) { alert('Mật khẩu xác nhận không khớp!'); return; }

        const btn = document.getElementById('save-pwd-btn');
        if(btn) btn.textContent = 'Đang xử lý...';

        try {
            const res = await fetch(`${API_BASE_URL}/user/password-change`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ old_password: oldPwd, new_password: newPwd, confirm_new_password: cfPwd })
            });
            const data = await res.json();
            
            if (res.ok) {
                alert('Đổi mật khẩu thành công!');
                if(pwdModal) pwdModal.classList.remove('show');
            } else {
                alert(data.msg || data.message || 'Lỗi đổi mật khẩu, vui lòng kiểm tra lại mật khẩu cũ.');
            }
        } catch (err) { console.error(err); } 
        finally {
            if(btn) btn.textContent = 'Cập nhật';
            (document.getElementById('pwd-old') as HTMLInputElement).value = '';
            (document.getElementById('pwd-new') as HTMLInputElement).value = '';
            (document.getElementById('pwd-cf') as HTMLInputElement).value = '';
        }
    });
}