import { API_BASE_URL } from './api.ts';

document.addEventListener('DOMContentLoaded', async () => {
    const isLoginPage = window.location.pathname.includes('login.html');

    try {
        // 1. Xác thực phiên đăng nhập hiện tại
        const response = await fetch(`${API_BASE_URL}/admin/verify`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' 
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            // Nếu đã đăng nhập mà còn ở trang login thì đẩy vào trang chủ admin
            if (isLoginPage) {
                window.location.href = 'mod.html';
                return;
            }

            // Hiển thị thông tin Admin lên giao diện
            const adminNameEl = document.getElementById('admin-display-name');
            const adminRoleEl = document.getElementById('admin-role-text'); // Sửa lại ID cho khớp với HTML bạn dùng
            
            if (adminNameEl) adminNameEl.textContent = data.data.display_name;
            if (adminRoleEl) adminRoleEl.textContent = data.data.role === 'admin' ? 'Quản trị viên' : 'Điều hành viên';

            localStorage.setItem('admin_role', data.data.role);
        } else {
            // Chưa đăng nhập mà vào các trang nội bộ thì đẩy ra login
            if (!isLoginPage) window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Lỗi xác thực Admin:", error);
        if (!isLoginPage) window.location.href = 'login.html';
    }

    // 2. Xử lý Đăng xuất Admin
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                try {
                    const res = await fetch(`${API_BASE_URL}/admin/logout`, {
                        method: 'GET', 
                        credentials: 'include'
                    });
                    
                    if (res.ok) {
                        localStorage.removeItem('admin_role');
                        window.location.href = 'login.html';
                    }
                } catch (err) {
                    console.error("Lỗi khi đăng xuất:", err);
                    // Force logout ở client nếu API lỗi
                    window.location.href = 'login.html';
                }
            }
        });
    }
});