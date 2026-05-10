import { API_BASE_URL } from './api.ts';

// Biến lưu trữ dữ liệu từ Backend để phục vụ tính năng tìm kiếm/lọc ở Client-side
let usersData: any[] = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminUsers();
    setupAddUserModal();
    setupFilters();
});

// Gọi API lấy danh sách tài khoản Admin/Mod
async function fetchAdminUsers() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--gy);">Đang tải dữ liệu...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            usersData = data.data || [];
            applyCurrentFilters(); // Áp dụng bộ lọc hiện tại (nếu có) và render bảng
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#EF4444;">${data.msg || 'Lỗi lấy dữ liệu'}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#EF4444;">Lỗi kết nối máy chủ!</td></tr>`;
        console.error(err);
    }
}

// Render dữ liệu ra bảng HTML
function renderTable(users: any[]) {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--gy);">Không có dữ liệu phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const roleBadge = user.role === 'admin' 
            ? `<span class="badge bdg-ad">Admin</span>` 
            : `<span class="badge bdg-md">Moderator</span>`;

        return `
            <tr>
                <td>
                    <div class="td-user">
                        <div class="td-avt">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div class="td-in">
                            <h4>${user.display_name}</h4>
                            <p>@${user.username}</p>
                        </div>
                    </div>
                </td>
                <td class="td-mail">${user.username}@ymaga.vn</td>
                <td>${roleBadge}</td>
                <td>
                    <div class="role-sel-wrap">
                        <select class="role-sel" data-username="${user.username}">
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="mod" ${user.role === 'mod' ? 'selected' : ''}>Moderator</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    setupRoleChangeListeners();
}

// Xử lý API thay đổi quyền (Chỉ chấp nhận admin hoặc mod theo Backend)
function setupRoleChangeListeners() {
    const selects = document.querySelectorAll('.role-sel');
    selects.forEach(select => {
        select.addEventListener('change', async (e) => {
            const target = e.target as HTMLSelectElement;
            const username = target.getAttribute('data-username');
            const newRole = target.value; // Chắc chắn là 'admin' hoặc 'mod'

            if (!username) return;

            const confirmChange = confirm(`Xác nhận đổi quyền của @${username} thành ${newRole.toUpperCase()}?`);
            if (!confirmChange) {
                applyCurrentFilters(); // Hoàn tác UI nếu user bấm Cancel
                return;
            }

            target.disabled = true;

            try {
                // PUT /admin/user
                const res = await fetch(`${API_BASE_URL}/admin/user`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, role: newRole })
                });
                
                const data = await res.json();
                
                if (res.ok && data.status === 'success') {
                    alert('Cập nhật quyền thành công!');
                    fetchAdminUsers(); // Lấy lại dữ liệu mới nhất từ server
                } else {
                    alert(data.msg || 'Lỗi khi thay đổi quyền!');
                    applyCurrentFilters(); // Hoàn tác UI
                }
            } catch (err) {
                alert('Lỗi kết nối máy chủ!');
                applyCurrentFilters(); // Hoàn tác UI
                console.error(err);
            } finally {
                target.disabled = false;
            }
        });
    });
}

// Xử lý API thêm thành viên
function setupAddUserModal() {
    const modal = document.getElementById('add-modal');
    const form = document.getElementById('add-user-form') as HTMLFormElement;
    const errMsg = document.getElementById('add-err-msg');
    const btnSubmit = document.getElementById('btn-submit-add') as HTMLButtonElement;

    document.getElementById('btn-open-modal')?.addEventListener('click', () => modal?.classList.add('show'));

    document.getElementById('btn-close-modal')?.addEventListener('click', () => {
        modal?.classList.remove('show');
        form.reset();
        if (errMsg) errMsg.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const display_name = (document.getElementById('add-name') as HTMLInputElement).value.trim();
        const username = (document.getElementById('add-username') as HTMLInputElement).value.trim();
        const password = (document.getElementById('add-password') as HTMLInputElement).value;
        const role = (document.getElementById('add-role') as HTMLSelectElement).value;

        if (errMsg) errMsg.style.display = 'none';
        
        // Validation khắt khe theo đúng tài liệu Backend
        if (!/^[a-z0-9]+$/.test(username)) {
            if (errMsg) {
                errMsg.textContent = 'Tên đăng nhập viết liền không dấu, không hoa, không ký tự đặc biệt.';
                errMsg.style.display = 'block';
            }
            return;
        }

        if (password.length < 8) {
            if (errMsg) {
                errMsg.textContent = 'Mật khẩu phải có tối thiểu 8 ký tự.';
                errMsg.style.display = 'block';
            }
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Đang xử lý...';

        try {
            // POST /admin/user
            const res = await fetch(`${API_BASE_URL}/admin/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ display_name, username, password, role })
            });
            
            const data = await res.json();
            
            if (res.ok && data.status === 'success') {
                alert('Đã thêm thành viên thành công!');
                modal?.classList.remove('show');
                form.reset();
                fetchAdminUsers(); // Lấy lại danh sách thành viên mới
            } else {
                if (errMsg) {
                    errMsg.textContent = data.msg || 'Thêm tài khoản thất bại!';
                    errMsg.style.display = 'block';
                }
            }
        } catch (err) {
            if (errMsg) {
                errMsg.textContent = 'Lỗi kết nối máy chủ!';
                errMsg.style.display = 'block';
            }
            console.error(err);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Lưu';
        }
    });
}

// Xử lý Lọc & Tìm kiếm ở giao diện (Frontend)
function setupFilters() {
    document.getElementById('searchInput')?.addEventListener('input', applyCurrentFilters);
    document.getElementById('roleFilter')?.addEventListener('change', applyCurrentFilters);
}

function applyCurrentFilters() {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const roleFilter = document.getElementById('roleFilter') as HTMLSelectElement;
    
    const keyword = searchInput?.value.toLowerCase() || '';
    const roleVal = roleFilter?.value || 'all';
    
    const filtered = usersData.filter(user => {
        const matchName = user.display_name.toLowerCase().includes(keyword) || user.username.toLowerCase().includes(keyword);
        const matchRole = roleVal === 'all' || user.role === roleVal;
        return matchName && matchRole;
    });

    renderTable(filtered);
}