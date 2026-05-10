import { API_BASE_URL } from './api.ts';

interface LoginResponse {
    status: 'success' | 'error';
    msg?: string;
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
    const errorMsg = document.getElementById('errorMsg') as HTMLDivElement | null;
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();

        const username = (document.getElementById('username') as HTMLInputElement | null)?.value.trim() || '';
        const password = (document.getElementById('password') as HTMLInputElement | null)?.value || '';
        
        // Tự động kiểm tra nếu trên giao diện HTML có checkbox remember
        const rememberCheckbox = document.getElementById('remember') as HTMLInputElement | null;
        const remember = rememberCheckbox ? rememberCheckbox.checked : false;

        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
        }

        if (!username || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Vui lòng nhập đầy đủ thông tin.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang đăng nhập...';
            }

            const response = await fetch(`${API_BASE_URL}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Bắt buộc để nhận HttpOnly Cookie
                body: JSON.stringify({ username, password, remember })
            });

            const data: LoginResponse = await response.json();

            // Nếu Backend trả về mã 200 và success -> Đẩy vào trang chủ
            if (response.ok && data.status === 'success') {
                window.location.href = 'home.html';
                return;
            }

            // Xử lý lỗi trả về từ Backend (sai pass, không tồn tại user...)
            if (errorMsg) {
                errorMsg.textContent = data.msg || 'Đăng nhập thất bại!';
                errorMsg.style.display = 'block';
            }
        } catch {
            if (errorMsg) {
                errorMsg.textContent = 'Không thể kết nối máy chủ.';
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