# BẢN BÁO CÁO GÓC NHÌN BGK (Vòng chung kết) — KOLA - Trợ lý sức khỏe số  
**Căn cứ:** Phụ lục 3 — Tiêu chí đánh giá vòng chung kết (mục 3)

---

## I. Điểm thuyết trình trên sân khấu (20) — *chưa thể hiện “điểm rơi demo/độ hoàn thiện hiện tại”*
**Hạn chế có thể bị trừ điểm:**
- Hồ sơ/đề án hiện thiên về mô tả ý tưởng. BGK cần thấy **sản phẩm đã đạt mức nào để trình diễn** (demo luồng chat, hiển thị kết quả triage/phác đồ, cơ chế cảnh báo giới hạn an toàn, cách hệ thống vận hành độc lập).
- Phần **phản biện** có rủi ro vì thiếu “dữ liệu phản biện” để trả lời các câu hỏi trọng tâm y khoa/triage (ví dụ: độ chính xác, nguồn dữ liệu y khoa, quy trình kiểm soát nội dung nguy cơ, điều kiện dừng trả lời/điều hướng đến cơ sở y tế).
- Chưa có thông tin để BGK đánh giá trọn tiêu chí **kỹ năng thiết kế Slide** (nội dung slide có thể đang là mô tả kế hoạch; chưa chuyển được thành “bằng chứng” như ảnh demo, kết quả mẫu, metric).
- Chưa có các **con số/đầu ra mẫu** để bài thuyết trình “ấn tượng” dựa trên minh chứng, thay vì dựa vào mô tả định tính.

---

## II. Video clip giới thiệu dự án (10) — *rủi ro do thiếu minh chứng tiến trình thực tế*
**Hạn chế có thể bị trừ điểm:**
- Chưa có thông tin để BGK nhìn thấy **quá trình hình thành dự án** (timeline: đã làm gì theo tuần/tháng, demo ra sao ở mỗi mốc).
- Thiếu các bằng chứng “nhìn thấy được” cho tiêu chí video:
  - sản phẩm đã vận hành độc lập ở mức nào,
  - mô tả rõ ràng input → xử lý → output của sản phẩm,
  - thể hiện giá trị cốt lõi qua một luồng sử dụng/ca minh họa cụ thể (để BGK “thấy được” hơn là “nghe được”).

---

## III. Điểm đánh giá bản thuyết minh dự án (50)
### 1) Hiệu quả tích hợp và mở rộng (10) — *đang ở bước thiết kế/chuẩn bị, chưa có đối tác cụ thể & chưa chứng minh tích hợp*
**Nhận xét trọng tâm theo rubric:**
- Tiêu chí yêu cầu **đối tác hoặc nền tảng kết nối cụ thể** và **bằng chứng về khả năng tích hợp/mở rộng**.
- Trong hồ sơ, phần “tích hợp” chủ yếu nêu theo hướng **định hướng** (ví dụ: MoMo/Grab/Zalo/Apple Watch; API-first; thiết kế bộ tài liệu API/bộ nhúng), tuy nhiên:
  - **chưa nêu được đối tác cụ thể** (tên đơn vị, vai trò, phạm vi POC, trạng thái đàm phán/ký kết),
  - **chưa có bằng chứng hợp tác thực tế** (POC đã chạy/sandbox tích hợp/mẫu request-response/kết quả thử nghiệm),
  - **chưa chứng minh mức độ sẵn sàng tích hợp** (mức hoàn thiện về auth/xác thực, chuẩn dữ liệu, logging/trace, rate limit, versioning, xử lý lỗi… ở mức nào).
- Có điểm dễ gây hiểu nhầm giữa định hướng “không phụ thuộc bên thứ ba” và mô tả tích hợp hệ sinh thái (Apple Health/Google Fit, mini-app). Hồ sơ hiện **chưa làm rõ dữ liệu đi qua kênh nào, phần nào giữ nội bộ, ai chịu trách nhiệm y khoa với dữ liệu**.
- Phần “khả năng mở rộng/sao chép mô hình” mới mô tả mục tiêu, chưa mô tả cách triển khai lặp lại cho đối tác mới (onboarding kỹ thuật, chuẩn dữ liệu chung, yêu cầu compliance theo từng nhóm nền tảng).

> **Kết luận chấm:** khả năng “tích hợp/mở rộng” hiện được trình bày ở mức “sẽ làm/chuẩn bị”, nên rủi ro không đạt nhóm “đã có đối tác hoặc đã có chứng cứ tích hợp”.

---

### 2) Giải pháp chuyên biệt & mức độ đổi mới sáng tạo (10) — *có khác biệt, nhưng thiếu cơ chế an toàn y khoa & minh chứng đo lường*
**Hạn chế/chưa làm rõ:**
- Hồ sơ khẳng định AI “không tự bịa”, “chỉ dựa trên phác đồ đã duyệt”, nhưng **chưa mô tả cơ chế vận hành** ở mức đủ để BGK kiểm chứng, ví dụ:
  - nguồn dữ liệu y khoa chuẩn được dùng là gì,
  - cơ chế đối chiếu triage theo rule-based hay RAG/lookup nào,
  - guardrails: khi nào dừng trả lời, khi nào chuyển hướng khẩn cấp,
  - cập nhật/phiên bản hóa guideline và cách kiểm soát sai lệch.
- Khác biệt so với thị trường mới nêu định tính; BGK cần **ví dụ ca thử/output mẫu** hoặc **metric** để thấy “đặc sắc hơn” nằm ở khả năng triage, cảnh báo sớm, luồng nhắc nhở theo ngày hay chất lượng lời khuyên.

---

### 3) Tính khả thi & năng lực đội ngũ (10) — *đội ngũ có, nhưng thiếu mentor/role y khoa rõ ràng và thiếu chứng minh năng lực triển khai*
**Hạn chế/chưa làm rõ:**
- Rubric yêu cầu **mentor (nếu có)**: hồ sơ hiện chưa nêu tên/ chức danh/ chuyên môn mentor cụ thể.
- Vai trò y khoa hiện chủ yếu nằm ở kế hoạch thuê chuyên gia kiểm định giai đoạn sau; hồ sơ chưa làm rõ:
  - ở giai đoạn MVP, ai chịu trách nhiệm rà soát/duyệt nội dung triage,
  - quy trình “human-in-the-loop” (có/không, áp dụng ở bước nào).
- Năng lực tài chính có nêu tổng chi phí theo giai đoạn, nhưng thiếu **giả định tài chính theo rubric** (cần bao nhiêu tiền, nhóm đã có bao nhiêu thực tế, cần vay/đầu tư thêm bao nhiêu; kế hoạch dòng tiền có công thức/logic).
- **Tinh thần khởi nghiệp** được mô tả định tính, nhưng thiếu “minh chứng hành động” có thể kiểm chứng (tiến độ cụ thể theo mốc, kết quả POC/khảo sát thử nghiệm sớm, số lượng người dùng thử, các bài học rút ra và cách điều chỉnh kế hoạch).

---

### 4) Mô hình kinh doanh (10) — *thiếu định lượng hóa kế hoạch kinh doanh/marketing/tài chính*
**Hạn chế/chưa làm rõ theo từng mục rubric:**

a) **Kế hoạch sản xuất/phát triển**
- Có quy trình tổng quát, nhưng chưa rõ:
  - nguồn tài nguyên dữ liệu y khoa cụ thể,
  - tiêu chí đo mức “hoạt động độc lập và kết nối” (đến đâu, milestone nào, cách kiểm chứng).
  
b) **Kế hoạch kinh doanh & marketing**
- Kênh tiếp cận có nêu, nhưng thiếu **KPI định lượng và lịch triển khai**:
  - ngân sách theo kênh, kỳ vọng conversion,
  - tỷ lệ chuyển đổi Freemium → Premium,
  - mục tiêu MAU/DAU/churn theo từng giai đoạn (kèm giả định tăng trưởng).

c) **Kế hoạch tài chính**
- Có số dự kiến theo giai đoạn, nhưng rubric yêu cầu **giả định tài chính + kế hoạch doanh thu/chi phí + quản lý dòng tiền**:
  - hồ sơ chưa thấy giả định số user/ARPU/biên lợi nhuận,
  - chưa có kế hoạch quản lý dòng tiền chi tiết hoặc bảng cân đối tài sản như rubric đề cập.

d) **Kế hoạch nhân sự**
- Có kế hoạch tuyển sau khi đạt lợi nhuận, nhưng chưa **phân lập nhiệm vụ ban điều hành ngay từ giai đoạn hiện tại** (ai chịu trách nhiệm pháp lý/dữ liệu/y khoa/guardrails/vận hành sản phẩm/growth).
- **Khả năng tăng trưởng và nhân rộng**: kế hoạch scale-up chưa được định lượng hóa và chưa mô tả rõ “cơ chế nhân rộng” (roadmap tăng trưởng theo mốc, giả định tăng trưởng, cách sao chép mô-đun/logic triage/API sang đối tác/nền tảng mới).

---

### 5) Hiệu quả kinh tế & tác động xã hội (5) — *tốt về định hướng, nhưng thiếu minh chứng và chỉ số tác động*
**Hạn chế/chưa làm rõ:**
- Có mô tả SDG3 và lợi ích cộng đồng (sàng lọc sớm, giảm quá tải y tế), tuy nhiên:
  - thiếu số liệu/khảo sát/pilot để chứng minh mức độ giải quyết vấn đề thực tế,
  - thiếu chỉ số tác động dự kiến (ví dụ số lượt triage; tỷ lệ điều hướng phù hợp; mức giảm lượt khám không cần thiết) và cách đo.

---

### 6) Thị trường tiềm năng (5) — *chưa đủ dữ liệu kiểm chứng cung-cầu và đối thủ cụ thể*
**Hạn chế/chưa làm rõ:**
- Có phân khúc người dùng, nhưng thiếu dữ liệu:
  - quy mô thị trường/nhu cầu có số liệu hay khảo sát không,
  - phân tích đối thủ cạnh tranh **cụ thể** và lợi thế cạnh tranh có thể kiểm chứng.
- Thiếu minh chứng “đã thử nghiệm” (pilot/landing test/user early feedback/đơn hàng/feedback beta).

---

## IV. Điểm đánh giá khu vực trưng bày sản phẩm (20) — *chưa xác định rõ mức độ hoàn thiện để trưng bày*
**Hạn chế có thể bị trừ điểm (theo 2 tiêu chí con):**

1) **Thể hiện nổi bật sản phẩm/dịch vụ (10)**
- Rubric chấm theo mức độ hoàn thiện sản phẩm hiện tại so với mục tiêu.
- Hồ sơ hiện mô tả hướng phát triển; để trưng bày đạt điểm cao cần có:
  - sản phẩm demo chạy được (ít nhất 1 luồng triage mẫu + phần cảnh báo giới hạn),
  - cách người xem tương tác/quan sát output rõ ràng và liên quan trực tiếp giá trị cốt lõi,
  - thông điệp “KOLA làm được gì” thể hiện nhanh trong 1–2 phút.

2) **Tính thẩm mỹ/sáng tạo/thu hút khu vực trưng bày (10)**
- Chưa có thông tin để BGK đánh giá yếu tố thẩm mỹ/thu hút.
- Nếu chỉ trưng bày dạng thuyết minh giấy/chữ, rủi ro không đạt 10 điểm; cần trình bày bố cục, hình ảnh, demo screen đủ nổi bật để thu hút quan sát trực tiếp.

---

# TÓM LẠI (theo góc nhìn BGK)
- **Điểm mạnh:** Ý tưởng rõ, hướng giải quyết đúng “nút thắt” sàng lọc sớm; có định hướng hệ sinh thái và mô hình thu phí.
- **Điểm trừ/rủi ro lớn:** các tiêu chí vòng chung kết cần **bằng chứng tích hợp/đối tác cụ thể**, **demo sản phẩm đã đạt mức độc lập**, **cơ chế an toàn y khoa đủ kiểm chứng**, và **kế hoạch tài chính/marketing định lượng**.
- Theo phản hồi của bạn, phần tích hợp ở hiện trạng đang là **chuẩn bị API/đi tìm đối tác**, nên báo cáo đã nhấn mạnh rủi ro “chưa đạt mức chứng cứ tích hợp” để tránh bị chấm thấp ở mục “Hiệu quả tích hợp và mở rộng”.
