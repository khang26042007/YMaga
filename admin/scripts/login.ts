import { API_BASE_URL } from './api.ts';

// Định nghĩa cấu trúc dữ liệu trả về từ Backend theo admin_ui.md
interface AdminLoginResponse {
    status: 'success' | 'error';
    msg?: string;
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm') as HTMLFormElement | null;
    const errorMsg = document.getElementById('errorMsg') as HTMLDivElement | null;
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username') as HTMLInputElement | null;
        const passwordInput = document.getElementById('password') as HTMLInputElement | null;
        
        const username = usernameInput?.value.trim() || '';
        const password = passwordInput?.value || '';
        
        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
        }

        if (!username || !password) { 
            if (errorMsg) {
                errorMsg.textContent = 'Vui lòng nhập đầy đủ thông tin đăng nhập.'; 
                errorMsg.style.display = 'block';
            }
            return; 
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true; 
                submitBtn.textContent = 'Đang xác thực...';
            }
            
            // Gọi API Login Admin, credentials: 'include' để trình duyệt tự lưu Cookie token
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data: AdminLoginResponse = await response.json();
            
            // Theo tài liệu: Thành công trả về status: "success" (mã 200)
            if (response.ok && data.status === 'success') {
                window.location.href = 'mod.html';
                return;
            } 
            
            // Theo tài liệu: Lỗi trả về status: "error" kèm msg (mã 401, 5xx)
            if (errorMsg) {
                errorMsg.textContent = data.msg || 'Đăng nhập thất bại! Vui lòng kiểm tra lại.';
                errorMsg.style.display = 'block';
            }
            
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = 'Không thể kết nối đến máy chủ Backend.';
                errorMsg.style.display = 'block';
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false; 
                submitBtn.textContent = 'Đăng nhập';
            }
        }
    });
});