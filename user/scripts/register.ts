import { API_BASE_URL } from './api.ts';

interface RegisterResponse {
    status: 'success' | 'error';
    msg?: string;
}

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm') as HTMLFormElement | null;
    const errorMsg = document.getElementById('errorMsg') as HTMLDivElement | null;
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();

        const displayName = (document.getElementById('display_name') as HTMLInputElement | null)?.value.trim() || '';
        const username = (document.getElementById('username') as HTMLInputElement | null)?.value.trim() || '';
        const password = (document.getElementById('password') as HTMLInputElement | null)?.value || '';
        const termsCheckbox = document.getElementById('terms') as HTMLInputElement | null;
        const terms = termsCheckbox ? termsCheckbox.checked : false;

        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
        }

        if (!displayName || !username || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Vui lòng điền đầy đủ thông tin.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        if (!terms) {
            if (errorMsg) {
                errorMsg.textContent = 'Bạn cần đồng ý với Điều khoản sử dụng.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        // Bắt lỗi theo chuẩn Backend: Tên người dùng viết liền không dấu, không hoa, không ký tự đặc biệt
        if (!/^[a-z0-9]+$/.test(username)) {
            if (errorMsg) {
                errorMsg.textContent = 'Tên đăng nhập phải viết liền không dấu, không hoa, không ký tự đặc biệt.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        if (password.length < 8) {
            if (errorMsg) {
                errorMsg.textContent = 'Mật khẩu phải có tối thiểu 8 ký tự.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang xử lý...';
            }

            const response = await fetch(`${API_BASE_URL}/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    display_name: displayName,
                    username: username,
                    password: password
                })
            });

            const data: RegisterResponse = await response.json();

            // Đăng ký thành công -> Bắt buộc đẩy về trang Login để người dùng tự đăng nhập lại
            if (response.ok && data.status === 'success') {
                alert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
                window.location.href = 'login.html';
                return;
            }

            if (errorMsg) {
                errorMsg.textContent = data.msg || 'Đăng ký thất bại!';
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
                submitBtn.textContent = 'Đăng ký';
            }
        }
    });
});