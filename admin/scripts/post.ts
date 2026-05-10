import { API_BASE_URL } from './api.ts';

// Biến lưu trữ dữ liệu từ server
let postsData: any[] = [];
let topicsData: any[] = [];

// Trạng thái điều khiển Modal
let isEditing = false;
let currentPostId: string | null = null;
let currentPostSlug: string = ''; // Backend yêu cầu slug khi PUT cập nhật bài viết

let searchTimeout: number; // Bộ đếm giờ cho tính năng tìm kiếm (Debounce)

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    await fetchTopics(); 
    await fetchPosts();  
    setupModalEvents();
    setupFilters();
}

// 1. Lấy danh sách Chủ đề từ Backend để đổ vào Dropdown
async function fetchTopics() {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/topics?limit=100&offset=1`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            topicsData = data.data || [];
            populateTopicSelects();
        }
    } catch (err) {
        console.error("Lỗi lấy danh sách chủ đề:", err);
    }
}

function populateTopicSelects() {
    const filterSel = document.getElementById('topicFilter') as HTMLSelectElement;
    const modalSel = document.getElementById('post-topic') as HTMLSelectElement;
    if (!filterSel || !modalSel) return;

    filterSel.innerHTML = '<option value="all">Tất cả chủ đề</option>';
    modalSel.innerHTML = ''; 

    topicsData.forEach(topic => {
        // Lưu topic.id làm value để gửi API cho chuẩn xác
        filterSel.innerHTML += `<option value="${topic.id}">${topic.name}</option>`;
        modalSel.innerHTML += `<option value="${topic.id}">${topic.name}</option>`;
    });
}

// 2. Lấy danh sách Bài viết mặc định
async function fetchPosts() {
    const tbody = document.getElementById('post-table-body');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--gy);">Đang tải dữ liệu bài viết...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/posts?limit=50&offset=1`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            postsData = data.data.posts || [];
            applyDropdownFilters(); 
        } else {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#EF4444;">${data.msg || 'Lỗi tải dữ liệu'}</td></tr>`;
        }
    } catch (err) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#EF4444;">Lỗi kết nối máy chủ!</td></tr>`;
    }
}

// 3. TÌM KIẾM BÀI VIẾT BẰNG API BACKEND
async function searchPostsByBackend(keyword: string) {
    const tbody = document.getElementById('post-table-body');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--gy);">Đang tìm kiếm...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/search/posts?keyword=${encodeURIComponent(keyword)}`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            postsData = data.data.result || []; // Lấy mảng result từ API tìm kiếm
            applyDropdownFilters();
        } else {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#EF4444;">${data.msg || 'Lỗi tìm kiếm'}</td></tr>`;
        }
    } catch (err) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#EF4444;">Lỗi kết nối máy chủ!</td></tr>`;
    }
}

// Thiết lập sự kiện Lọc & Tìm kiếm
function setupFilters() {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const topicFilter = document.getElementById('topicFilter') as HTMLSelectElement;
    const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement;

    // Gõ phím tới đâu, gọi API tìm kiếm tới đó (có độ trễ 500ms để tránh giật lag)
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = window.setTimeout(() => {
            const keyword = (e.target as HTMLInputElement).value.trim();
            if (keyword !== '') {
                searchPostsByBackend(keyword);
            } else {
                fetchPosts(); // Nếu xóa trắng ô tìm kiếm thì load lại toàn bộ
            }
        }, 500);
    });

    // Lọc bằng Dropdown thao tác trực tiếp trên mảng hiện tại
    topicFilter?.addEventListener('change', applyDropdownFilters);
    statusFilter?.addEventListener('change', applyDropdownFilters);
}

function applyDropdownFilters() {
    const topicVal = (document.getElementById('topicFilter') as HTMLSelectElement)?.value || 'all';
    const statusVal = (document.getElementById('statusFilter') as HTMLSelectElement)?.value || 'all';

    const result = postsData.filter(post => {
        const postTopicId = post.topic?.topic_id || post.topic_id || '';
        const matchTopic = topicVal === 'all' || postTopicId === topicVal;
        
        // API search có thể không trả về status, ta quy ước pass điều kiện nếu không có trường này
        const matchStatus = statusVal === 'all' || post.status === statusVal || !post.status; 
        
        return matchTopic && matchStatus;
    });

    renderPostsToTable(result);
}

// 4. HIỂN THỊ BẢNG VÀ GẮN SỰ KIỆN NÚT BẤM
function renderPostsToTable(posts: any[]) {
    const tbody = document.getElementById('post-table-body');
    if (!tbody) return;

    if (posts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--gy);">Không có bài viết nào phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = posts.map(post => {
        const isPublished = post.status === 'published';
        const statusHtml = isPublished 
            ? `<div class="td-stt c-gr"><span class="dot d-gr"></span> Đã đăng</div>`
            : (post.status ? `<div class="td-stt c-gray"><span class="dot d-gray"></span> Nháp</div>` : `<div class="td-stt c-gray">---</div>`);

        const dateObj = new Date(post.created_at);
        const displayDate = isNaN(dateObj.getTime()) ? (post.created_at || '---') : 
            `${dateObj.toLocaleDateString('vi-VN')} ${dateObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;

        // Lấy tên chủ đề để hiển thị
        const topicName = topicsData.find(t => t.id === (post.topic?.topic_id || post.topic_id))?.name || 'Chung';

        return `
            <tr>
                <td class="td-tit">${post.title}</td>
                <td class="td-auth">
                    <h4>${post.author_name || 'Ban biên tập'}</h4>
                </td>
                <td><span class="tag-topic">${topicName}</span></td>
                <td class="td-date">${displayDate}</td>
                <td>${statusHtml}</td>
                <td class="td-acts">
                    <button class="act-btn btn-edit" data-id="${post.id}">Sửa</button>
                    <button class="act-btn act-del btn-del" data-id="${post.id}">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');

    attachTableListeners();
}

function attachTableListeners() {
    const modal = document.getElementById('postModal');

    // Nút Sửa: Bắt buộc gọi API GET chi tiết để lấy trường "body"
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
            if (!id) return;
            
            const btnEl = e.currentTarget as HTMLButtonElement;
            const oldText = btnEl.textContent;
            btnEl.textContent = '...';

            try {
                const res = await fetch(`${API_BASE_URL}/admin/post/${id}`, { credentials: 'include' });
                const data = await res.json();
                
                if (res.ok && data.status === 'success') {
                    const post = data.data;
                    isEditing = true;
                    currentPostId = post.id;
                    currentPostSlug = post.slug || ''; // Lưu lại để dùng cho PUT
                    
                    (document.getElementById('modal-title-text') as HTMLElement).textContent = 'Chỉnh sửa bài viết';
                    (document.getElementById('post-title') as HTMLInputElement).value = post.title || '';
                    (document.getElementById('post-topic') as HTMLSelectElement).value = post.topic?.topic_id || post.topic_id || '';
                    (document.getElementById('post-desc') as HTMLInputElement).value = post.subtitle || '';
                    (document.getElementById('post-content') as HTMLTextAreaElement).value = post.body || '';
                    
                    modal?.classList.add('show');
                } else {
                    alert('Không lấy được thông tin chi tiết bài viết!');
                }
            } catch (err) {
                alert('Lỗi kết nối máy chủ!');
            } finally {
                btnEl.textContent = oldText;
            }
        });
    });

    // Nút Xóa
    document.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
            if (confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
                try {
                    const res = await fetch(`${API_BASE_URL}/admin/post/${id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (res.ok) {
                        // Cập nhật lại UI sau khi xóa
                        postsData = postsData.filter(p => p.id !== id);
                        applyDropdownFilters();
                    } else {
                        const err = await res.json();
                        alert(err.msg || "Không thể xóa bài viết.");
                    }
                } catch (err) { alert("Lỗi kết nối máy chủ!"); }
            }
        });
    });
}

// 5. THÊM / CẬP NHẬT BÀI VIẾT (POST & PUT)
function setupModalEvents() {
    const modal = document.getElementById('postModal');
    const btnNew = document.getElementById('btn-create-post');
    const btnClose = document.getElementById('btn-close-modal');

    btnNew?.addEventListener('click', () => {
        isEditing = false;
        currentPostId = null;
        currentPostSlug = '';
        (document.getElementById('modal-title-text') as HTMLElement).textContent = 'Tạo bài viết mới';
        (document.getElementById('post-title') as HTMLInputElement).value = '';
        (document.getElementById('post-desc') as HTMLInputElement).value = '';
        (document.getElementById('post-content') as HTMLTextAreaElement).value = '';
        modal?.classList.add('show');
    });

    btnClose?.addEventListener('click', () => modal?.classList.remove('show'));

    document.getElementById('btn-save-draft')?.addEventListener('click', () => handleSavePost('draft'));
    document.getElementById('btn-publish')?.addEventListener('click', () => handleSavePost('published'));
}

async function handleSavePost(status: string) {
    const title = (document.getElementById('post-title') as HTMLInputElement).value.trim();
    const topic_id = (document.getElementById('post-topic') as HTMLSelectElement).value;
    const subtitle = (document.getElementById('post-desc') as HTMLInputElement).value.trim();
    const body = (document.getElementById('post-content') as HTMLTextAreaElement).value.trim();

    if (!title) return alert("Vui lòng nhập tiêu đề bài viết.");

    // Chuẩn hóa tên trường theo yêu cầu Backend (topic_id, subtitle, body)
    const payload: any = { 
        topic_id, 
        title, 
        subtitle, 
        body, 
        status,
        cover: "", // Có thể nâng cấp ô input nhập link cover sau
        tags: [] 
    };

    if (isEditing) {
        payload.slug = currentPostSlug; // Thuộc tính bắt buộc khi PUT update
    }

    const btnDraft = document.getElementById('btn-save-draft') as HTMLButtonElement;
    const btnPub = document.getElementById('btn-publish') as HTMLButtonElement;
    
    btnDraft.disabled = true; btnPub.disabled = true;

    try {
        const url = isEditing ? `${API_BASE_URL}/admin/post/${currentPostId}` : `${API_BASE_URL}/admin/post`;
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            alert(isEditing ? "Đã cập nhật bài viết thành công!" : "Tạo bài viết mới thành công!");
            document.getElementById('postModal')?.classList.remove('show');
            fetchPosts(); // Tải lại danh sách mới nhất
        } else {
            alert(data.msg || "Có lỗi xảy ra khi lưu bài viết.");
        }
    } catch (err) {
        alert("Lỗi kết nối máy chủ!");
    } finally {
        btnDraft.disabled = false; btnPub.disabled = false;
    }
}