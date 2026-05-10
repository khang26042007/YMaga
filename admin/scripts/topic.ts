import { API_BASE_URL } from './api.ts';

let topicsData: any[] = [];
let isEditing = false;
let currentTopicId: string | null = null;
let currentTopicSlug: string = '';

// Quản lý trạng thái Link
let currentLinksData: any[] = [];
let editingLinkId: string | null = null;

let searchTimeout: number;

document.addEventListener('DOMContentLoaded', () => {
    fetchTopics();
    setupSearch();
    setupModalCore();
    setupTabs();
    setupTopicFormActions();
    setupLinkActions();
    
    // Live preview cover
    document.getElementById('topic-cover')?.addEventListener('input', (e) => {
        const url = (e.target as HTMLInputElement).value.trim();
        const prev = document.getElementById('topic-cover-preview') as HTMLImageElement;
        if (url) { prev.src = url; prev.style.display = 'block'; }
        else { prev.src = ''; prev.style.display = 'none'; }
    });
});

// ==========================================
// 1. TẢI DANH SÁCH & TÌM KIẾM
// ==========================================
async function fetchTopics() {
    const container = document.getElementById('topic-list-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/topics?limit=100&offset=1`, { credentials: 'include' });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            topicsData = data.data || [];
            renderTopicCards(topicsData);
        } else {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:#EF4444;">${data.msg || 'Lỗi tải dữ liệu'}</div>`;
        }
    } catch (err) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:#EF4444;">Lỗi kết nối máy chủ!</div>`;
    }
}

async function searchTopicsByBackend(keyword: string) {
    const container = document.getElementById('topic-list-container');
    try {
        const res = await fetch(`${API_BASE_URL}/admin/search/topics?keyword=${encodeURIComponent(keyword)}`, { credentials: 'include' });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            renderTopicCards(data.data.result || []);
        }
    } catch (err) { }
}

function setupSearch() {
    const input = document.getElementById('searchInput') as HTMLInputElement;
    input?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = window.setTimeout(() => {
            const kw = (e.target as HTMLInputElement).value.trim();
            if (kw) searchTopicsByBackend(kw);
            else fetchTopics();
        }, 500);
    });
}

function renderTopicCards(topics: any[]) {
    const container = document.getElementById('topic-list-container');
    if (!container) return;

    if (topics.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--gy);">Không tìm thấy chủ đề nào.</div>`;
        return;
    }

    container.innerHTML = topics.map(t => `
        <div class="t-crd" data-id="${t.id}">
            ${t.cover ? `<img src="${t.cover}" class="tc-ic">` : `<div class="tc-ic">${(t.name || t.title || 'C').charAt(0)}</div>`}
            <div class="tc-in">
                <h4>${t.name || t.title}</h4>
                <span>${t.posts_count || t.post_count || 0} bài viết</span>
                <p>${t.description || ''}</p>
            </div>
        </div>
    `).join('');

    // Bấm vào Thẻ -> Mở Modal Edit
    document.querySelectorAll('.t-crd').forEach(card => {
        card.addEventListener('click', () => openEditModal(card.getAttribute('data-id') || ''));
    });
}

// ==========================================
// 2. MODAL & TABS LOGIC
// ==========================================
function setupModalCore() {
    const modal = document.getElementById('topic-modal');
    
    document.getElementById('btn-create-topic')?.addEventListener('click', () => {
        isEditing = false;
        currentTopicId = null;
        currentTopicSlug = '';

        // Reset dữ liệu Info
        (document.getElementById('modal-title') as HTMLElement).textContent = 'Tạo Chủ đề mới';
        (document.getElementById('topic-name') as HTMLInputElement).value = '';
        (document.getElementById('topic-cover') as HTMLInputElement).value = '';
        (document.getElementById('topic-desc') as HTMLTextAreaElement).value = '';
        (document.getElementById('topic-cover-preview') as HTMLElement).style.display = 'none';
        
        // Ẩn các nút xoá và Ẩn tab Links/Posts vì chưa tạo topic
        document.getElementById('btn-del-topic')!.style.display = 'none';
        document.getElementById('tab-links-btn')!.style.display = 'none';
        document.getElementById('tab-posts-btn')!.style.display = 'none';
        
        // Mở tab Info mặc định
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('act'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('act'));
        document.querySelector('[data-target="tab-info"]')?.classList.add('act');
        document.getElementById('tab-info')?.classList.add('act');

        modal?.classList.add('show');
    });

    const closeModal = () => modal?.classList.remove('show');
    document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetId = (e.currentTarget as HTMLElement).getAttribute('data-target');
            
            tabs.forEach(t => t.classList.remove('act'));
            contents.forEach(c => c.classList.remove('act'));
            
            (e.currentTarget as HTMLElement).classList.add('act');
            document.getElementById(targetId || '')?.classList.add('act');
        });
    });
}

// ==========================================
// 3. API CHỦ ĐỀ CHÍNH (GET/POST/PUT/DELETE)
// ==========================================
async function openEditModal(id: string) {
    try {
        // Lấy chi tiết chủ đề và link
        const res = await fetch(`${API_BASE_URL}/admin/topic/${id}`, { credentials: 'include' });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            const topic = data.data;
            isEditing = true;
            currentTopicId = topic.id;
            currentTopicSlug = topic.slug || '';

            (document.getElementById('modal-title') as HTMLElement).textContent = 'Cập nhật Chủ đề';
            (document.getElementById('topic-name') as HTMLInputElement).value = topic.name || '';
            (document.getElementById('topic-desc') as HTMLTextAreaElement).value = topic.description || '';
            (document.getElementById('topic-cover') as HTMLInputElement).value = topic.cover || '';
            
            const prevImg = document.getElementById('topic-cover-preview') as HTMLImageElement;
            if (topic.cover) { prevImg.src = topic.cover; prevImg.style.display = 'block'; }
            else { prevImg.style.display = 'none'; }

            // Hiện đủ các Tab
            document.getElementById('tab-links-btn')!.style.display = 'block';
            document.getElementById('tab-posts-btn')!.style.display = 'block';
            document.getElementById('btn-del-topic')!.style.display = 'block';

            // Reset tab về Info
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('act'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('act'));
            document.querySelector('[data-target="tab-info"]')?.classList.add('act');
            document.getElementById('tab-info')?.classList.add('act');

            document.getElementById('topic-modal')?.classList.add('show');

            // Render dữ liệu các Tab phụ
            currentLinksData = topic.links || [];
            renderLinksList();
            fetchTopicPosts(id);
        }
    } catch (err) { alert("Lỗi tải chi tiết chủ đề!"); }
}

function setupTopicFormActions() {
    const btnSave = document.getElementById('btn-save-topic');
    const btnDel = document.getElementById('btn-del-topic');

    btnSave?.addEventListener('click', async () => {
        const name = (document.getElementById('topic-name') as HTMLInputElement).value.trim();
        const cover = (document.getElementById('topic-cover') as HTMLInputElement).value.trim();
        const description = (document.getElementById('topic-desc') as HTMLTextAreaElement).value.trim();

        if (!name) return alert("Vui lòng nhập tên chủ đề.");

        const btnEl = btnSave as HTMLButtonElement;
        btnEl.disabled = true; btnEl.textContent = 'Đang lưu...';

        try {
            // Đúng Endpoint POST và PUT theo file ảnh update
            const url = isEditing ? `${API_BASE_URL}/admin/topic/${currentTopicId}` : `${API_BASE_URL}/admin/topic`;
            const method = isEditing ? 'PUT' : 'POST';
            
            const payload: any = { name, description, cover };
            if (isEditing) payload.slug = currentTopicSlug; 

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(isEditing ? "Cập nhật thành công!" : "Tạo chủ đề thành công!");
                document.getElementById('topic-modal')?.classList.remove('show');
                fetchTopics();
            } else {
                const data = await res.json();
                alert(data.msg || "Lỗi xử lý!");
            }
        } catch (err) { alert("Lỗi mạng!"); } 
        finally { btnEl.disabled = false; btnEl.textContent = 'Lưu thay đổi'; }
    });

    btnDel?.addEventListener('click', async () => {
        if (!currentTopicId || !confirm("Xác nhận XOÁ chủ đề này và toàn bộ bài viết bên trong?")) return;
        
        const btnEl = btnDel as HTMLButtonElement;
        btnEl.disabled = true; btnEl.textContent = 'Đang xoá...';

        try {
            const res = await fetch(`${API_BASE_URL}/admin/topic/${currentTopicId}`, { method: 'DELETE', credentials: 'include' });
            if (res.ok) {
                alert("Đã xoá chủ đề!");
                document.getElementById('topic-modal')?.classList.remove('show');
                fetchTopics();
            }
        } catch (err) { alert("Lỗi kết nối!"); }
        finally { btnEl.disabled = false; btnEl.textContent = 'Xóa Chủ đề'; }
    });
}

// ==========================================
// 4. API LIÊN KẾT (LINKS) BÊN TRONG MODAL
// ==========================================
function renderLinksList() {
    const container = document.getElementById('links-list-container');
    if (!container) return;

    if (currentLinksData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--gy); font-size:13px; font-style:italic;">Chưa có liên kết nào.</div>`;
        return;
    }

    container.innerHTML = currentLinksData.map(link => `
        <div class="link-it">
            <div class="link-it-in">
                <b>${link.title}</b>
                <a href="${link.url}" target="_blank">${link.url}</a>
            </div>
            <div class="link-acts">
                <button class="link-btn ed" onclick="window.prepareEditLink('${link.id}', '${link.title}', '${link.url}')">Sửa</button>
                <button class="link-btn rm" onclick="window.deleteLink('${link.id}')">Xóa</button>
            </div>
        </div>
    `).join('');
}

function setupLinkActions() {
    const btnSaveLink = document.getElementById('btn-save-link');
    const inputTitle = document.getElementById('link-title') as HTMLInputElement;
    const inputUrl = document.getElementById('link-url') as HTMLInputElement;

    btnSaveLink?.addEventListener('click', async (e) => {
        e.preventDefault();
        const title = inputTitle.value.trim();
        const url = inputUrl.value.trim();

        if (!title || !url) return alert("Vui lòng nhập đủ Tiêu đề và URL!");

        const btnEl = btnSaveLink as HTMLButtonElement;
        btnEl.disabled = true;

        try {
            // Check thêm hay sửa
            const endpoint = editingLinkId 
                ? `${API_BASE_URL}/admin/topic-link/${editingLinkId}`  // PUT
                : `${API_BASE_URL}/admin/topic/${currentTopicId}/add-link`; // POST
            
            const method = editingLinkId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, url })
            });

            if (res.ok) {
                // Thành công -> Gọi lại chi tiết topic để lấy list link mới
                inputTitle.value = ''; inputUrl.value = '';
                editingLinkId = null;
                btnEl.textContent = 'Lưu Link';
                
                const detailRes = await fetch(`${API_BASE_URL}/admin/topic/${currentTopicId}`, { credentials: 'include' });
                const detailData = await detailRes.json();
                currentLinksData = detailData.data?.links || [];
                renderLinksList();
            } else {
                const data = await res.json();
                alert(data.msg || "Lỗi khi lưu link!");
            }
        } catch (err) { alert("Lỗi mạng!"); }
        finally { btnEl.disabled = false; }
    });
}

// Expose ra window để HTML onclick gọi được
(window as any).prepareEditLink = (id: string, title: string, url: string) => {
    editingLinkId = id;
    (document.getElementById('link-title') as HTMLInputElement).value = title;
    (document.getElementById('link-url') as HTMLInputElement).value = url;
    const btn = document.getElementById('btn-save-link');
    if (btn) btn.textContent = 'Cập nhật Link';
};

(window as any).deleteLink = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa liên kết này?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/admin/topic-link/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
            currentLinksData = currentLinksData.filter(l => l.id !== id);
            renderLinksList();
        }
    } catch (err) { alert("Lỗi xoá link!"); }
};

// ==========================================
// 5. API LẤY DANH SÁCH BÀI VIẾT CỦA CHỦ ĐỀ
// ==========================================
async function fetchTopicPosts(topicId: string) {
    const container = document.getElementById('posts-list-container');
    if (container) container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--gy); font-size:13px;">Đang tải bài viết...</div>`;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/topic/${topicId}/posts?limit=50&offset=1`, { credentials: 'include' });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            const posts = data.data.posts || [];
            if (posts.length === 0 && container) {
                container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--gy); font-size:13px; font-style:italic;">Chưa có bài viết nào thuộc chủ đề này.</div>`;
                return;
            }

            if (container) {
                container.innerHTML = posts.map((p: any) => `
                    <div class="post-it">
                        <div class="post-in">
                            <h4>${p.title}</h4>
                            <span>${p.created_at ? p.created_at.substring(0,10) : ''} | ${p.status === 'published' ? 'Đã đăng' : 'Nháp'}</span>
                        </div>
                        <a href="post.html" style="font-size:12px; color:var(--p); font-weight:600;">Xem chi tiết &rarr;</a>
                    </div>
                `).join('');
            }
        }
    } catch (err) { }
}