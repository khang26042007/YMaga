import { API_BASE_URL } from './api.ts';

document.addEventListener('DOMContentLoaded', async () => {
    const guestUi = document.getElementById('guest-ui'); // Cụm nút Đăng nhập/Đăng ký
    const userUiWrap = document.getElementById('user-ui-wrap'); // Cụm Avatar + Tên user
    const navUsername = document.getElementById('nav-username');
    const uProBtn = document.getElementById('u-pro-btn');
    const dropdownMenu = document.getElementById('u-dropdown');
    const btnLogout = document.getElementById('btn-logout'); // Nút đăng xuất trong dropdown

    // ==========================================
    // 1. GỌI API KIỂM TRA SESSION ĐĂNG NHẬP
    // ==========================================
    try {
        const res = await fetch(`${API_BASE_URL}/user/verify`, {
            method: 'GET',
            credentials: 'include' // Gửi kèm HttpOnly Cookie
        });

        const result = await res.json();

        // Nếu Đã đăng nhập
        if (res.ok && result.status === 'success' && result.data) {
            if (guestUi) guestUi.style.display = 'none';
            if (userUiWrap) userUiWrap.style.display = 'flex'; // Thường dùng flex để căn chỉnh avatar
            if (navUsername) navUsername.textContent = result.data.display_name || result.data.username;
        } 
        // Nếu Chưa đăng nhập
        else {
            if (guestUi) guestUi.style.display = 'flex';
            if (userUiWrap) userUiWrap.style.display = 'none';
        }
    } catch (error) {
        // Lỗi mạng -> Hiển thị UI như chưa đăng nhập
        if (guestUi) guestUi.style.display = 'flex';
        if (userUiWrap) userUiWrap.style.display = 'none';
    }

    // ==========================================
    // 2. XỬ LÝ ĐĂNG XUẤT (LOGOUT)
    // ==========================================
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                try {
                    const res = await fetch(`${API_BASE_URL}/user/logout`, {
                        method: 'GET',
                        credentials: 'include'
                    });

                    if (res.ok) {
                        // Xóa dữ liệu tạm và tải lại trang hoặc về trang chủ
                        window.location.href = 'home.html'; 
                    } else {
                        alert('Lỗi khi đăng xuất, vui lòng thử lại.');
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    // Force logout ở client nếu lỗi mạng
                    window.location.href = 'home.html';
                }
            }
        });
    }

    // ==========================================
    // 3. HIỆU ỨNG DROPDOWN MENU TÀI KHOẢN
    // ==========================================
    if (uProBtn && dropdownMenu) {
        uProBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => {
        if (dropdownMenu?.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });

    // ==========================================
    // 4. TÌM KIẾM TOÀN CỤC (GLOBAL SEARCH BAR)
    // ==========================================
    const globalSearchInput = document.querySelector('.src input') as HTMLInputElement;
    const isSearchPage = window.location.pathname.includes('search.html');
    
    if (globalSearchInput && !isSearchPage) {
        globalSearchInput.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const keyword = globalSearchInput.value.trim();
                
                if (keyword) {
                    window.location.href = `search.html?q=${encodeURIComponent(keyword)}`;
                }
            }
        });
    }
});
