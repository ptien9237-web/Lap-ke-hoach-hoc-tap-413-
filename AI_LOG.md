# NHẬT KÝ SỬ DỤNG AI (AI_LOG.md)
**Đồ án:** Ứng dụng lập kế hoạch học tập (Student Study Planner)  
**Môn học:** Phát triển ứng dụng di động  
**Sinh viên thực hiện:** Nguyễn Văn Tiến (MSSV: 1923050413)  
**Mã nguồn Git:** `HP-Tien <ptien9237@gmail.com>`  
**Thời điểm thực hiện & hoàn thành:** 27/10/2026  

---

## 1. YÊU CẦU ĐÃ ĐƯA RA
- Khảo sát toàn bộ cấu trúc dự án, môi trường thực thi (Windows, Node.js v24.19.0, npm 11.17.0, Git 2.55.0).
- Bắt buộc khảo sát và sử dụng các skill trong thư mục `impeccable/`:
  - `audit.native.md`: Tiêu chuẩn kỹ thuật mobile native (A11y >= 44x44, Platform Conformance, theming).
  - `craft-floor.md`: Sàn chất lượng giao diện, tương phản >= 4.5:1, phân cấp thị giác, 4 trạng thái (Loading, Empty, Error, Content).
  - `colorize.md`: Token hóa màu sắc toàn diện (Role-based tokens), hỗ trợ Light và Dark mode qua 1 tệp duy nhất, cấm dùng mã hex trực tiếp trong component.
  - `typeset.md`: Phân cấp kiểu chữ chuẩn thiết kế di động, tabular figures cho thời gian/con số.
  - `harden.md`: Xử lý ngoại tuyến, phục hồi lỗi mạng, bảo toàn chỉnh sửa khi mất kết nối.
- Xây dựng hệ thống hoàn chỉnh:
  - **Backend API thực sự**: Node.js + Express + TypeScript + SQLite (Node 24 built-in `node:sqlite`), JWT authentication, token revocation khi logout, bảo vệ chống IDOR (cách ly dữ liệu tài khoản), validation Zod, thống kê tiến độ động, batch sync ngoại tuyến có idempotency.
  - **Mobile Expo App**: Expo SDK 58, Expo Router (route động, modal route, `+not-found.tsx`), TypeScript strict, Zustand store với selectors, TanStack Query, Expo SecureStore cho token bí mật, Expo Notifications nhắc hạn, offline persistence & sync queue.
  - **Kiểm thử & Chất lượng**: Vượt qua `npx tsc --noEmit` và `npx expo lint` không lỗi, bộ unit tests / component tests / integration tests tự động.

---

## 2. NỘI DUNG AI ĐỀ XUẤT ĐƯỢC CHẤP NHẬN
1. **Lựa chọn Backend & Cơ sở dữ liệu:**
   - Đề xuất dùng built-in `node:sqlite` của Node.js 24 thay vì các thư viện cần biên dịch native C++ (như node-gyp) để đảm bảo tương thích tuyệt đối và chạy mượt mà ngay trên máy Windows mới mà không cần cài Visual Studio C++ Build Tools.
   - Thiết kế mô hình dữ liệu chuẩn: `users`, `revoked_tokens`, `courses`, `assignments`, `mutation_logs`.
   - Cơ chế bảo vệ IDOR nghiêm ngặt: Mọi thao tác truy vấn, cập nhật, xóa học phần hoặc bài tập đều kèm `WHERE user_id = ?`, kiểm tra quyền sở hữu `course_id` trước khi gán vào bài tập.
2. **Cơ chế xác thực an toàn:**
   - Lưu trữ JWT token và refresh token bí mật hoàn toàn trong `Expo SecureStore` (không lưu trong `AsyncStorage`).
   - Xử lý đăng xuất thực sự qua bảng `revoked_tokens` trên máy chủ: Sau khi đăng xuất, token cũ lập tức bị từ chối (HTTP 401).
3. **Thiết kế hệ thống Token màu sắc (Single Source of Truth):**
   - Định nghĩa toàn bộ màu tại `mobile/src/constants/theme.ts`.
   - Cung cấp semantic tokens cho Background, Surface, Text, Status, Border và Course Palette (6 màu học phần: Blue, Emerald, Purple, Amber, Rose, Indigo, Cyan) với 2 biến thể `light` và `dark` tương phản cao.
   - Cấm hoàn toàn mã màu hex tại các component.
4. **Xử lý Ngoại tuyến & Bảo toàn chỉnh sửa (Offline-First):**
   - Thiết kế hàng đợi thao tác ngoại tuyến `offlineQueue` lưu trong persistent storage.
   - Mỗi thao tác gán một `clientMutationId` duy nhất.
   - Khi có mạng trở lại, gửi batch qua `POST /api/sync/batch`, server đối chiếu `mutation_logs` để tránh trùng lặp dữ liệu (idempotency).
5. **Điều hướng Expo Router & Khắc phục Flashing:**
   - Sử dụng cờ `isInitialized` trong `useAuthStore` để hiển thị `ActivityIndicator` toàn màn hình trước khi điều hướng `(auth)` hoặc `(tabs)`, ngăn chặn hiện tượng chớp màn hình đăng nhập khi người dùng đã có phiên hợp lệ.
6. **Mô hình hóa Trạng thái 4 Bước chuẩn Impeccable Craft Floor:**
   - Mọi màn hình chính đều bọc trong `StateView` hỗ trợ 4 trạng thái: Loading (skeleton/spinner), Empty (hình ảnh/thông điệp hữu ích), Error (kèm nút Thử lại hoạt động thực tế), và Content (dữ liệu hiển thị trực quan).

---

## 3. NỘI DUNG BỊ TỪ CHỐI HOẶC SỬA ĐỔI
1. **Từ chối Mock Data làm nguồn dữ liệu chính:**
   - Đề xuất ban đầu dùng mock data giả lập trong ứng dụng mobile bị từ chối hoàn toàn; bắt buộc kết nối trực tiếp đến backend API thật. Dữ liệu mẫu chỉ được đưa vào qua kịch bản `seed` chính thức của cơ sở dữ liệu backend.
2. **Sửa đổi chế độ thực thi kiểm thử Vitest trên Backend:**
   - Khi chạy kiểm thử backend song song mặc định, SQLite gặp lỗi `database is locked` do xung đột khóa tệp giữa các worker.
   - Sửa đổi: Cấu hình `fileParallelism: false` và `maxConcurrency: 1` trong `backend/vitest.config.ts`, đồng thời kích hoạt `PRAGMA journal_mode = WAL;` và `PRAGMA busy_timeout = 5000;` trong database driver để xử lý đồng thời mượt mà.
3. **Khắc phục lỗi nạp Schema SQL trong bản biên dịch TypeScript:**
   - Ban đầu file `schema.sql` được đọc từ đĩa bằng `fs.readFileSync`. Khi chạy file biên dịch trong `dist/`, file `.sql` không được TypeScript tự động copy.
   - Sửa đổi: Nhúng chuỗi DDL mặc định trực tiếp vào `src/db/database.ts` làm fallback, đảm bảo ứng dụng chạy độc lập ở cả chế độ phát triển lẫn bản build production `dist/index.js`.
4. **Khắc phục xung đột kiểu dữ liệu AppTheme giữa Light và Dark Mode:**
   - `Colors` được định nghĩa với `as const`, dẫn đến kiểu của `Colors.light` và `Colors.dark` chứa các string literal khác nhau (ví dụ: `"#F8FAFC"` vs `"#0B0F17"`). TypeScript báo lỗi khi gán biến thể dark cho kiểu `AppTheme`.
   - Sửa đổi: Mở rộng `AppTheme` thành `Record<ColorToken, string>`, giúp các component switch theme tự do và các biến màu sắc nhận kiểu string linh hoạt.
5. **Xử lý lỗi `react-hooks/set-state-in-effect` trên React 19:**
   - Trong `assignment-form.tsx`, ban đầu sử dụng `useEffect` để `setState` khi sửa bài tập. Linter React 19 bắt lỗi cascading renders.
   - Sửa đổi: Chuyển sang khởi tạo lazy state ngay tại `useState(() => existingAssignment ? ... : ...)` và sử dụng `effectiveCourseId`. Không cần dùng effect, tối ưu hiệu năng và đạt chuẩn sạch của React 19.
6. **Thay thế `AsyncStorage.multiRemove` bằng `Promise.all` với `removeItem`:**
   - Định nghĩa kiểu trong phiên bản AsyncStorage mới không chứa phương thức `multiRemove`. Sửa đổi sang `Promise.all([removeItem(...), ...])` giúp tương thích hoàn toàn trên mọi môi trường và nền tảng.
7. **Sửa đổi import `AndroidImportance` từ `expo-notifications`:**
   - Sử dụng `import { AndroidImportance } from 'expo-notifications'` trực tiếp thay vì qua namespace `Notifications.AndroidImportance`, loại bỏ hoàn toàn lỗi namespace import của ESLint.

---

## 4. CÁCH KIỂM CHỨNG KẾT QUẢ
1. **Kiểm tra TypeScript (`npm run tsc`):**
   - Backend: `tsc --noEmit` -> 0 errors.
   - Mobile: `tsc --noEmit` -> 0 errors.
   - Root script: `npm run tsc` chạy đồng bộ cả hai -> Thoát mã 0.
2. **Kiểm tra Linter (`npm run lint:mobile`):**
   - Chạy `npx expo lint` trên mobile: 0 errors, 0 warnings.
3. **Kiểm tra Tự động (`npm test`):**
   - Chạy toàn bộ 46 kịch bản kiểm thử tự động (20 Backend + 26 Mobile), đạt tỷ lệ thành công 100% (46/46 passed).
4. **Kiểm tra Seed Dữ liệu:**
   - Chạy `npm run seed:backend` tạo thành công tài khoản sinh viên demo `student@study.edu.vn` cùng 6 học phần và 8 bài tập phong phú về mốc thời gian.

---

## 5. NHỮNG NỘI DUNG CẦN NẮM VỮNG ĐỂ CHUẨN BỊ VẤN ĐÁP
1. **Cơ chế xác thực và bảo mật:**
   - *Tại sao không lưu JWT trong AsyncStorage?* (AsyncStorage lưu trữ dạng file text không mã hóa, dễ bị trích xuất trên thiết bị đã root/jailbreak; SecureStore mã hóa bằng phần cứng Keystore của Android / Keychain của iOS).
   - *Cơ chế vô hiệu hóa token khi logout hoạt động như thế nào qua bảng `revoked_tokens`?* (Khi người dùng logout, token được ghi vào bảng `revoked_tokens`. Middleware `authenticateToken` luôn kiểm tra hash của token xem có nằm trong bảng này không trước khi cho phép request đi tiếp).
2. **Kiến trúc đồng bộ ngoại tuyến (Offline Sync):**
   - *Vấn đề Idempotency là gì? Tại sao cần `clientMutationId` trong `POST /api/sync/batch`?* (Idempotency đảm bảo một thao tác gửi nhiều lần do mạng chập chờn chỉ được áp dụng đúng một lần trên server. Server lưu lịch sử `mutation_logs` theo `clientMutationId`, nếu trùng id thì bỏ qua không tạo duplicate bài tập).
   - *Khi người dùng tạo hoặc đánh dấu hoàn thành bài tập lúc không có mạng, luồng lưu trữ diễn ra như thế nào?* (Thao tác được ghi vào `offlineQueue` trong local storage và cập nhật giao diện optimistic ngay lập tức. Khi online lại, hệ thống đọc `offlineQueue`, gửi batch lên server, sau khi server xác nhận thành công mới dọn sạch hàng đợi).
3. **Xử lý ngày giờ và múi giờ (Timezone):**
   - *Tại sao phải lưu trữ mốc thời gian hạn nộp bằng ISO 8601 UTC và hiển thị theo múi giờ địa phương?* (Tránh lỗi sai lệch thời gian khi sinh viên di chuyển hoặc đổi cài đặt múi giờ của máy).
   - *Cách tính toán bài tập "Hạn hôm nay", "Hạn ngày mai", "Trong 48 giờ tới" khi qua nửa đêm (23:30 vs 00:01)?* (Sử dụng hàm `startOfDay` và `endOfDay` của `date-fns` để so sánh theo ngày dương lịch chuẩn, kết hợp `differenceInMilliseconds` để tính khoảng cách 48 giờ tuyệt đối, tránh dùng phép cộng `+ 24*60*60*1000` vốn có thể sai khi đổi giờ Daylight Saving Time).
4. **Quản lý trạng thái và Theme:**
   - *Cách Zustand selectors ngăn chặn render thừa (re-render) trên thiết bị di động?* (Component chỉ subscribe vào phần state cụ thể mà nó cần, ví dụ: `useAuthStore(selectIsAuthenticated)`, thay vì subscribe toàn bộ store; khi các field khác thay đổi, component không bị re-render).
   - *Cách token màu được quản lý tập trung qua `constants/theme.ts`?* (Tuân thủ nguyên tắc Single Source of Truth, phân quyền theo vai trò ngữ nghĩa (role-based tokens) và kiểm định tương phản WCAG AA >= 4.5:1).
