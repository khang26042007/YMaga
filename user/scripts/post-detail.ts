import { API_BASE_URL } from './api.ts';

let CURRENT_POST_ID = '';
let currentUserUsername: string | null = null; 
let currentCmtPage = 1;
const CMT_LIMIT = 10;

// Các Helper tạo Icon chuẩn Sao vàng
const getStarIcon = (filled: boolean, size: number = 16) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${filled ? 'var(--star)' : 'none'}" stroke="${filled ? 'var(--star)' : 'var(--gy)'}" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`;

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    CURRENT_POST_ID = urlParams.get('id') || '';

    if (!CURRENT_POST_ID) {
        alert("Không tìm thấy bài viết!");
        window.location.href = 'home.html';
        return;
    }

    // 1. Xác thực và lưu username (dùng đối chiếu quyền sửa/xóa bình luận)
    await fetchUserVerify();

    // 2. Chạy tải các API chính của bài viết
    fetchPostDetail();
    fetchFavoriteStatus();
    setupFavoriteToggle();
    
    // 3. Khởi tạo chức năng bình luận & UI đánh giá
    checkLoginAndRenderCommentUI();
    setupStarSelectors(); 
    fetchComments(currentCmtPage);
    setupCommentForm();
    setupGlobalCommentActions(); // Khắc phục lỗi sự kiện click cho nút sửa/xóa
});

// ==========================================
// 1. XÁC THỰC VÀ LẤY THÔNG TIN
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

async function fetchPostDetail() {
    try {
        // GET /post/{id}
        const res = await fetch(`${API_BASE_URL}/post/${CURRENT_POST_ID}`);
        const data = await res.json();
        
        if (res.ok && data.data) {
            const post = data.data;
            document.getElementById('post-cat')!.setAttribute("href", `topic-detail.html?id=${post.topic?.topic_id}`);
            document.getElementById('post-cat')!.textContent = post.topic?.name || 'Tin tức';
            document.getElementById('post-tit')!.textContent = post.title;
            document.getElementById('post-subtit')!.textContent = post.subtitle || '';
            document.getElementById('post-time')!.textContent = formatDate(post.timestamp);
            document.getElementById('post-content')!.innerHTML = post.body;

            // Render Ảnh bìa theo chuẩn API
            const coverImg = document.getElementById('post-cover') as HTMLImageElement;
            if (coverImg && post.cover) {
                coverImg.src = post.cover;
                coverImg.style.display = 'block';
            }

            // Render Thẻ Hashtag
            const tagContainer = document.getElementById('post-tags');
            if (tagContainer && post.tags && post.tags.length > 0) {
                tagContainer.innerHTML = post.tags.map((t: string) => `<span class="tag" style="background:#F2F2F2; color:var(--dk); font-weight:500;">#${t}</span>`).join('');
            }
        }
    } catch (err) { console.error("Lỗi tải bài viết:", err); }
}

async function fetchFavoriteStatus() {
    try {
        // GET /post/{id}/favorite
        const res = await fetch(`${API_BASE_URL}/post/${CURRENT_POST_ID}/favorite`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            if (data.data) updateFavoriteUI(data.data.favorite || false);
        }
    } catch (err) {}
}

function updateFavoriteUI(isFav: boolean) {
    const btnSave = document.getElementById('btn-save-post');
    const textSpan = btnSave?.querySelector('#fav-text');
    
    if (isFav) {
        btnSave?.classList.add('active');
        if (textSpan) textSpan.textContent = 'Đã lưu bài';
    } else {
        btnSave?.classList.remove('active');
        if (textSpan) textSpan.textContent = 'Lưu bài';
    }
}

function setupFavoriteToggle() {
    const btnSave = document.getElementById('btn-save-post');
    btnSave?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!currentUserUsername) {
            alert("Vui lòng đăng nhập để lưu bài viết nhé!");
            window.location.href = 'login.html';
            return;
        }
        
        btnSave.classList.toggle('active');

        try {
            // POST /post/{id}/update-favorite
            const res = await fetch(`${API_BASE_URL}/post/${CURRENT_POST_ID}/update-favorite`, {
                method: 'POST',
                credentials: 'include'
            });

            if (res.status === 401) {
                btnSave.classList.toggle('active');
                alert("Vui lòng đăng nhập để lưu bài viết!");
                window.location.href = 'login.html';
                return;
            }

            if (res.ok) {
                const data = await res.json();
                if (data.data) updateFavoriteUI(data.data.favorite);
            } else {
                btnSave.classList.toggle('active');
            }
        } catch (err) {
            btnSave.classList.toggle('active');
        }
    });
}

// ==========================================
// 2. HỆ THỐNG BÌNH LUẬN & ĐÁNH GIÁ SAO
// ==========================================
function checkLoginAndRenderCommentUI() {
    const guestPrompt = document.getElementById('cmt-guest-prompt');
    const userInput = document.getElementById('cmt-user-input');
    
    if (guestPrompt && userInput) {
        if (currentUserUsername) {
            guestPrompt.style.display = 'none';
            userInput.style.display = 'flex';
        } else {
            guestPrompt.style.display = 'block'; 
            userInput.style.display = 'none';
        }
    }
}

function setupStarSelectors(root: HTMLElement | Document = document) {
    const selectors = root.querySelectorAll('.star-selector:not(.initialized)');
    selectors.forEach(container => {
        container.classList.add('initialized');
        const stars = container.querySelectorAll('svg');
        const updateStars = (val: number, isHover: boolean) => {
            stars.forEach(s => {
                const idx = parseInt(s.getAttribute('data-idx') || '0');
                if (isHover) s.classList.toggle('hovered', idx <= val);
                else s.classList.toggle('selected', idx <= val);
            });
        };
        const initialVal = parseInt(container.getAttribute('data-val') || '5');
        updateStars(initialVal, false);
        stars.forEach(star => {
            star.addEventListener('mouseover', () => updateStars(parseInt(star.getAttribute('data-idx') || '0'), true));
            star.addEventListener('mouseout', () => stars.forEach(s => s.classList.remove('hovered')));
            star.addEventListener('click', () => {
                const val = parseInt(star.getAttribute('data-idx') || '0');
                container.setAttribute('data-val', val.toString());
                updateStars(val, false);
            });
        });
    });
}

async function fetchComments(page: number) {
    const container = document.getElementById('cmt-list-container');
    const pagination = document.getElementById('cmt-pagination');
    if (!container || !pagination) return;

    try {
        // GET /post/{id}/comments
        const res = await fetch(`${API_BASE_URL}/post/${CURRENT_POST_ID}/comments?limit=${CMT_LIMIT}&offset=${page}`);
        const data = await res.json();
        
        if (res.ok && data.data) {
            document.getElementById('avg-rating')!.textContent = (data.data.avg_rating || 0).toFixed(1);
            document.getElementById('cmt-count')!.textContent = data.data.count || 0;

            const comments = data.data.comments || [];
            const totalItems = data.data.count || 0;
            
            if (comments.length === 0) {
                container.innerHTML = '<div style="color:var(--gy); text-align:center; padding: 20px; font-style:italic;">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ góc nhìn!</div>';
                pagination.innerHTML = '';
                return;
            }

            container.innerHTML = '';
            comments.forEach((cmt: any) => {
                let actionButtons = '';
                // Dùng id và user từ API Backend
                if (currentUserUsername) {
                    if (cmt.user === currentUserUsername) {
                        actionButtons = `<span class="btn-edit" data-id="${cmt.id}" style="cursor:pointer;">Sửa</span> <span class="btn-del" data-id="${cmt.id}" style="cursor:pointer; color:#EB5757;">Xóa</span>`;
                    } else {
                        actionButtons = `<span class="btn-rep" data-id="${cmt.id}" style="cursor:pointer;">Báo cáo vi phạm</span>`;
                    }
                }

                const avatarUrl = `https://ui-avatars.com/api/?name=${cmt.display_name}&background=E4E4E4&color=10100E`;
                const starHTML = Array.from({length: 5}, (_, i) => getStarIcon(i < (cmt.rating || 0), 12)).join('');

                container.innerHTML += `
                    <div class="cmt-it" style="display:flex; gap:16px;">
                        <img src="${avatarUrl}" style="width:40px; height:40px; border-radius:50%; flex-shrink:0;">
                        <div style="flex:1; background:#FFF; padding:16px; border-radius:12px; border:1px solid var(--bd);">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="font-weight:700; font-size:14px; color:var(--dk);">${cmt.display_name || cmt.username}</span>
                                        ${cmt.edited ? '<span style="font-size:11px; color:var(--gy); font-style:italic;">(đã chỉnh sửa)</span>' : ''}
                                    </div>
                                    <div style="display:flex; gap:2px;">${starHTML}</div>
                                </div>
                                <span style="font-size:12px; color:var(--gy);">${formatDate(cmt.timestamp)}</span>
                            </div>
                            <div style="font-size:15px; color:var(--dk); margin-bottom:16px; line-height:1.6; white-space: pre-wrap;" id="txt-${cmt.id}">${cmt.content}</div>
                            
                            <div id="edit-form-${cmt.id}" style="display:none; margin-bottom:16px;">
                                <textarea id="edit-input-${cmt.id}" style="width:100%; padding:12px; border-radius:8px; border:1px solid var(--p); outline:none; font-family:inherit; font-size:14px; min-height:80px; margin-bottom:8px; resize:vertical;"></textarea>
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <div class="star-selector" id="edit-stars-${cmt.id}" data-val="${cmt.rating || 5}">
                                        <svg data-idx="1" width="18" height="18" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                        <svg data-idx="2" width="18" height="18" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                        <svg data-idx="3" width="18" height="18" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                        <svg data-idx="4" width="18" height="18" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                        <svg data-idx="5" width="18" height="18" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <button class="btn-save-edit" data-id="${cmt.id}" style="padding:6px 16px; background:var(--p); color:#FFF; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Lưu</button>
                                        <button class="btn-cancel-edit" data-id="${cmt.id}" style="padding:6px 16px; background:#F5F5F5; color:var(--dk); border:1px solid var(--bd); border-radius:6px; font-weight:600; cursor:pointer;">Hủy</button>
                                    </div>
                                </div>
                            </div>

                            <div style="display:flex; gap:16px; font-size:12px; color:var(--gy); font-weight:600;" id="act-${cmt.id}">
                                ${actionButtons}
                            </div>
                        </div>
                    </div>
                `;
            });

            setupStarSelectors(container);

            const totalPages = Math.ceil(totalItems / CMT_LIMIT);
            pagination.innerHTML = '';
            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    const btn = document.createElement('button');
                    btn.className = `pg-btn ${i === page ? 'act' : ''}`;
                    btn.textContent = i.toString();
                    btn.addEventListener('click', () => { currentCmtPage = i; fetchComments(currentCmtPage); });
                    pagination.appendChild(btn);
                }
            }
        }
    } catch (err) { console.error("Lỗi tải bình luận:", err); }
}

// POST: Gửi bình luận chuẩn mã 202/403
function setupCommentForm() {
    const btnSubmit = document.getElementById('btn-submit-cmt') as HTMLButtonElement;
    const inputCmt = document.getElementById('cmt-input') as HTMLTextAreaElement;
    const alertBox = document.getElementById('cmt-alert') as HTMLDivElement;
    const starSelector = document.getElementById('new-cmt-stars');

    btnSubmit?.addEventListener('click', async () => {
        if (!currentUserUsername) return; 
        const content = inputCmt.value.trim();
        const rating = parseInt(starSelector?.getAttribute('data-val') || '5');
        if (!content) { alertBox.textContent = 'Vui lòng nhập nội dung đánh giá!'; alertBox.style.display = 'block'; return; }

        alertBox.style.display = 'none';
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Đang gửi...';

        try {
            // POST /post/{id}/comment
            const res = await fetch(`${API_BASE_URL}/post/${CURRENT_POST_ID}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content, rating, img_url: null })
            });
            const data = await res.json();

            if (res.status === 200) {
                inputCmt.value = ''; fetchComments(1); 
            } else {
                // Hiển thị msg từ Backend (202 Chờ duyệt, 403 Bị chặn)
                alertBox.textContent = data.msg; alertBox.style.display = 'block';
                if (res.status === 202) inputCmt.value = ''; 
            }
        } catch (err) { alertBox.textContent = 'Lỗi kết nối mạng.'; alertBox.style.display = 'block'; }
        finally { btnSubmit.disabled = false; btnSubmit.textContent = 'Gửi bình luận'; }
    });
}

// Xử lý Sự kiện Click toàn cục cho Khu vực Bình luận (Sửa / Xóa / Báo cáo)
function setupGlobalCommentActions() {
    const container = document.getElementById('cmt-list-container');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const cmtId = target.getAttribute('data-id');
        if (!cmtId) return;

        // BẬT FORM SỬA
        if (target.classList.contains('btn-edit')) {
            const txtDiv = document.getElementById(`txt-${cmtId}`);
            const editForm = document.getElementById(`edit-form-${cmtId}`);
            const editInput = document.getElementById(`edit-input-${cmtId}`) as HTMLTextAreaElement;
            if (txtDiv && editForm && editInput) {
                editInput.value = txtDiv.textContent || '';
                txtDiv.style.display = 'none'; editForm.style.display = 'block'; 
                const starCont = document.getElementById(`edit-stars-${cmtId}`);
                if (starCont) {
                    const rating = parseInt(starCont.getAttribute('data-val') || '5');
                    starCont.querySelectorAll('svg').forEach(s => {
                        const idx = parseInt(s.getAttribute('data-idx')||'0');
                        s.classList.toggle('selected', idx <= rating);
                    });
                }
            }
        }

        // HỦY SỬA
        if (target.classList.contains('btn-cancel-edit')) {
            const txtDiv = document.getElementById(`txt-${cmtId}`);
            const editForm = document.getElementById(`edit-form-${cmtId}`);
            if (txtDiv && editForm) { txtDiv.style.display = 'block'; editForm.style.display = 'none'; }
        }

        // LƯU SỬA (PUT) -> Dùng id theo chuẩn
        if (target.classList.contains('btn-save-edit')) {
            const editInput = document.getElementById(`edit-input-${cmtId}`) as HTMLTextAreaElement;
            const starCont = document.getElementById(`edit-stars-${cmtId}`);
            const newContent = editInput?.value.trim();
            const newRating = parseInt(starCont?.getAttribute('data-val') || '5');

            if (newContent) {
                target.textContent = '...';
                try {
                    // PUT /post/{id}/comment
                    const res = await fetch(`${API_BASE_URL}/post/${CURRENT_POST_ID}/comment`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ id: cmtId, content: newContent, rating: newRating, img_url: null })
                    });
                    const data = await res.json();
                    if (res.status === 200 || res.status === 202) {
                        if (res.status === 202) alert(data.msg); fetchComments(currentCmtPage);
                    } else { alert(data.msg || 'Không thể chỉnh sửa'); target.textContent = 'Lưu'; }
                } catch (err) { target.textContent = 'Lưu'; }
            }
        }

        // XÓA BÌNH LUẬN (DELETE) -> Dùng Path Variable {cmt-id}
        if (target.classList.contains('btn-del')) {
            if (confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) {
                try {
                    // DELETE /post/{id}/comment/{cmt-id}
                    const res = await fetch(`${API_BASE_URL}/post/${CURRENT_POST_ID}/comment/${cmtId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if(res.ok) fetchComments(currentCmtPage);
                    else alert("Lỗi khi xóa bình luận.");
                } catch (err) { }
            }
        }

        // BÁO CÁO VI PHẠM (POST) -> Dùng cmt_id
        if (target.classList.contains('btn-rep')) {
            const choice = prompt("1. Từ ngữ thù ghét (hate)\n2. Xúc phạm (toxic)\n3. Spam\n4. Hình ảnh nhạy cảm (image)\n\nNhập 1-4 để báo cáo:");
            let reason = choice === '1' ? 'hate' : choice === '2' ? 'toxic' : choice === '3' ? 'spam' : choice === '4' ? 'image' : '';
            if (reason !== '') {
                try {
                    // POST /post/report-comment
                    const res = await fetch(`${API_BASE_URL}/post/report-comment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ comment_id: cmtId, reason: reason }) 
                    });
                    if (res.ok) {
                        alert("YMaga đã ghi nhận báo cáo và sẽ xem xét sớm nhất.");
                        const actDiv = document.getElementById(`act-${cmtId}`);
                        if (actDiv) actDiv.innerHTML = `<span style="color:#EB5757; pointer-events:none;">Đã báo cáo</span>`;
                    }
                } catch (err) { }
            }
        }
    });
}