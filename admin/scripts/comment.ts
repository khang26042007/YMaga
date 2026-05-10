import { API_BASE_URL } from './api.ts';

// Biến lưu trữ dữ liệu từ Backend
let commentsData: any[] = [];
let currentPage = 1;
const LIMIT = 50; // Lấy 50 bình luận mỗi trang để kiểm duyệt

document.addEventListener('DOMContentLoaded', () => {
    fetchComments();
    setupFilters();
    // setupMassActions();
});

const reason_map: Record<string, string> = {
    "spam": "Spam / Ngôn từ đả kích",
    "toxic": "ngôn từ xúc phạm",
    "hate": "ngôn từ công kích",
    "image": "hình ảnh không phù hợp"
}

// 1. GỌI API LẤY DANH SÁCH BÌNH LUẬN CHỜ DUYỆT
async function fetchComments() {
    const tbody = document.getElementById('comment-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--gy);">Đang tải dữ liệu...</td></tr>`;

    try {
        // Cập nhật URL chính xác theo Backend: có limit và offset
        const res = await fetch(`${API_BASE_URL}/admin/flagged-comments?limit=${LIMIT}&offset=${currentPage}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            // const commentsList = [...data.data?.ai?.comments, ...data.data?.users?.comments];
            const aiCmtList = data.data?.ai?.comments;
            const userCmtList = data.data?.users?.comments;
            // console.log(commentsList)
            
            // Chuẩn hóa dữ liệu API trả về để khớp với UI
            commentsData = aiCmtList.map((cmt: any, index: number) => {
                // TẠM THỜI gán mock cho các trường giao diện cần nhưng API chưa trả về=
                return {
                    cmt_id: cmt.id,
                    post_id: cmt.article_id,
                    username: cmt.username,
                    content: cmt.content,
                    
                    // -- Phần Mock UI --
                    mock_date: cmt.updated_at || "Vừa xong",
                    mock_title: `${cmt.article_title}`, // Đợi API trả về tên bài thật
                    mock_source: 'ai', // Đợi API trả về nguồn thật
                    mock_report_text: 'Tự động: AI',
                    mock_reason: "AI báo cáo",
                    current_status: 'review' // Luôn là review vì đang nằm trong hàng đợi
                };
            });
            commentsData.push(...userCmtList.map((cmt: any, index: number) => {
                // TẠM THỜI gán mock cho các trường giao diện cần nhưng API chưa trả về
                return {
                    cmt_id: cmt.id,
                    post_id: cmt.article_id,
                    username: cmt.username,
                    content: cmt.content,
                    
                    // -- Phần Mock UI --
                    mock_date: cmt.updated_at || "Vừa xong",
                    mock_title: `${cmt.article_title}`, // Đợi API trả về tên bài thật
                    mock_source: 'user', // Đợi API trả về nguồn thật
                    mock_report_text: 'Báo cáo từ User',
                    mock_reason: reason_map[cmt.reason],
                    current_status: 'review' // Luôn là review vì đang nằm trong hàng đợi
                };
            }));
            renderComments(commentsData);
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#EF4444;">${data.msg || 'Lỗi tải dữ liệu kiểm duyệt'}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#EF4444;">Lỗi kết nối máy chủ!</td></tr>`;
        console.error("Lỗi lấy danh sách cmt:", err);
    }
}

// 2. RENDER BẢNG GIAO DIỆN
function renderComments(comments: any[]) {
    const tbody = document.getElementById('comment-table-body');
    if (!tbody) return;

    if (comments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--gy);">Tuyệt vời! Không còn bình luận nào cần kiểm duyệt.</td></tr>`;
        return;
    }
    console.log(comments)

    tbody.innerHTML = comments.map(cmt => {
        const sourceHtml = cmt.mock_source === 'ai' 
            ? `<span class="src-badge src-ai">${cmt.mock_report_text}</span>`
            : `<span class="src-badge src-usr">${cmt.mock_report_text}</span>`;

        const statusHtml = `<div class="td-stt c-og"><span class="dot d-og"></span> Chờ xử lý</div>`;

        // Action block/allow khớp đúng với giá trị string Backend mong đợi
        const buttonsHtml = `
            <button class="btn-sm b-fil-rd btn-act" data-id="${cmt.cmt_id}" data-action="block">Chặn</button>
            <button class="btn-sm b-out-gr btn-act" data-id="${cmt.cmt_id}" data-action="allow">An toàn</button>
        `;

        return `
            <tr>
                <td class="td-cmt">
                    <div class="cmt-head">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <div>
                            <h4>${cmt.username}</h4>
                            <span>${cmt.mock_date}</span>
                        </div>
                    </div>
                    <div class="cmt-box">${cmt.content}</div>
                </td>
                <td class="td-post">${cmt.mock_title}</td>
                <td>${sourceHtml}</td>
                <td class="td-rsn">${cmt.mock_reason}</td>
                <td>${statusHtml}</td>
                <td class="td-acts">
                    ${buttonsHtml}
                    <button class="btn-del" data-id="${cmt.cmt_id}" title="Bỏ qua (Ẩn khỏi danh sách)">✖</button>
                </td>
            </tr>
        `;
    }).join('');

    setupActionListeners();
}

// 3. XỬ LÝ CÁC NÚT THAO TÁC CÁ NHÂN (GỌI API)
function setupActionListeners() {
    const actionBtns = document.querySelectorAll('.btn-act');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const target = e.target as HTMLButtonElement;
            const cmtId = target.getAttribute('data-id');
            const newStatus = target.getAttribute('data-action'); 

            if (!cmtId || !newStatus) return;

            // Vô hiệu hóa nút để tránh spam click
            target.disabled = true;
            target.style.opacity = '0.5';

            try {
                // Gọi API chuẩn theo tài liệu: PUT /admin/comment-moderate/{cmt-id}
                const res = await fetch(`${API_BASE_URL}/admin/comment-moderate/${cmtId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ status: newStatus })
                });

                const data = await res.json();
                
                if (res.ok && data.status === 'success') {
                    // Nếu API báo thành công -> Xóa khỏi mảng cục bộ và render lại
                    commentsData = commentsData.filter(c => c.cmt_id !== cmtId);
                    applyFilters(); 
                } else {
                    alert(data.msg || 'Không thể thay đổi trạng thái bình luận');
                    target.disabled = false;
                    target.style.opacity = '1';
                }
            } catch (err) {
                console.error(err);
                alert('Lỗi kết nối đến máy chủ');
                target.disabled = false;
                target.style.opacity = '1';
            }
        });
    });

    // Xử lý nút X (Chỉ ẩn khỏi UI, không gọi API - dành cho việc bỏ qua)
    const delBtns = document.querySelectorAll('.btn-del');
    delBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLButtonElement;
            const cmtId = target.getAttribute('data-id');
            
            commentsData = commentsData.filter(c => c.cmt_id !== cmtId);
            applyFilters();
        });
    });
}

// 4. XỬ LÝ NÚT CHẶN HÀNG LOẠT (GỌI NHIỀU API CÙNG LÚC)
// function setupMassActions() {
//     const btnBlockAI = document.getElementById('btn-block-ai');
//     const btnBlockUser = document.getElementById('btn-block-user');

//     const handleMassBlock = async (sourceType: string, confirmMsg: string) => {
//         // Lấy ra các bình luận khớp với nguồn
//         const targets = commentsData.filter(cmt => cmt.mock_source === sourceType);
        
//         if (targets.length === 0) {
//             alert("Không có bình luận nào phù hợp để chặn.");
//             return;
//         }

//         if (!confirm(confirmMsg)) return;

//         let successCount = 0;
        
//         // Cập nhật text nút để báo đang xử lý
//         const btn = sourceType === 'ai' ? btnBlockAI : btnBlockUser;
//         if (btn) {
//             (btn as HTMLButtonElement).disabled = true;
//             btn.textContent = 'Đang xử lý...';
//         }

//         // Gọi API lần lượt cho từng bình luận
//         for (const cmt of targets) {
//             try {
//                 const res = await fetch(`${API_BASE_URL}/admin/comment-moderate/${cmt.cmt_id}`, {
//                     method: 'PUT',
//                     headers: { 'Content-Type': 'application/json' },
//                     credentials: 'include',
//                     body: JSON.stringify({ status: 'block' })
//                 });
                
//                 if (res.ok) {
//                     successCount++;
//                     // Xóa dần khỏi mảng sau mỗi lần thành công
//                     commentsData = commentsData.filter(c => c.cmt_id !== cmt.cmt_id);
//                 }
//             } catch (err) {
//                 console.error("Lỗi chặn hàng loạt cmt_id:", cmt.cmt_id, err);
//             }
//         }

//         // Render lại bảng
//         applyFilters();
//         alert(`Đã xử lý chặn thành công ${successCount}/${targets.length} bình luận.`);

//         // Trả lại trạng thái nút ban đầu
//         if (btn) {
//             (btn as HTMLButtonElement).disabled = false;
//             btn.textContent = sourceType === 'ai' ? 'Chặn tất cả nội dung do AI duyệt' : 'Chặn tất cả nội dung do user báo cáo';
//         }
//     };

//     btnBlockAI?.addEventListener('click', () => {
//         handleMassBlock('ai', `Bạn có chắc chắn muốn CHẶN toàn bộ bình luận do AI gắn cờ không?`);
//     });

//     btnBlockUser?.addEventListener('click', () => {
//         handleMassBlock('user', `Bạn có chắc chắn muốn CHẶN toàn bộ bình luận do người dùng báo cáo không?`);
//     });
// }

// 5. XỬ LÝ LỌC VÀ TÌM KIẾM TRÊN FRONTEND
function setupFilters() {
    document.getElementById('searchCmt')?.addEventListener('input', applyFilters);
    document.getElementById('srcFilter')?.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchVal = (document.getElementById('searchCmt') as HTMLInputElement)?.value.toLowerCase() || '';
    const srcVal = (document.getElementById('srcFilter') as HTMLSelectElement)?.value || 'all';

    const filtered = commentsData.filter(cmt => {
        const matchSearch = cmt.username.toLowerCase().includes(searchVal) || cmt.content.toLowerCase().includes(searchVal);
        const matchSrc = srcVal === 'all' || cmt.mock_source === srcVal;
        
        return matchSearch && matchSrc;
    });

    renderComments(filtered);
}
