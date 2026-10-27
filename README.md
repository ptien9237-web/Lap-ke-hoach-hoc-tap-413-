# ỨNG DỤNG LẬP KẾ HOẠCH HỌC TẬP (STUDENT STUDY PLANNER)

> **Đồ án cuối kỳ môn:** Lập trình Mobile  
> **Sinh viên thực hiện:** Nguyễn Văn Tiến  
> **Mã số sinh viên (MSSV):** 1923050413  
> **Công nghệ:** React Native (Expo SDK 58, Expo Router, TypeScript Strict), Express.js Backend, SQLite (WAL mode).

---

## 1. TỔNG QUAN HỆ THỐNG

Ứng dụng **Student Study Planner** là giải pháp hỗ trợ sinh viên đại học quản lý đồng thời 5–7 học phần, theo dõi hạn nộp bài tập, quản lý thời gian biểu theo tuần, thống kê tiến độ học tập và bảo đảm an toàn dữ liệu ngoại tuyến (offline persistence & background sync).

### Điểm nổi bật về kiến trúc & kỹ thuật:
- **Mobile Client:** Xây dựng trên **Expo SDK 58**, **TypeScript Strict** (`"strict": true`), kiến trúc **Expo Router** (Tabs, Dynamic routes `assignment/[id]`, Modal routes `(modal)/assignment-form`, 404 Route `+not-found.tsx`).
- **Quản lý trạng thái:** **Zustand** kết hợp granular selectors (tránh re-render thừa), **TanStack Query (React Query v5)** cho server cache & invalidation.
- **Bảo mật:** Lưu trữ JWT an toàn bằng **Expo SecureStore** (phần cứng mã hóa Keystore/Keychain), cấm tuyệt đối lưu thông tin bí mật trong AsyncStorage.
- **Hệ thống Token Màu tập trung:** Độc quyền định nghĩa tại `mobile/src/constants/theme.ts` cho cả Light Mode & Dark Mode; không dùng mã màu hex thô trong bất kỳ component nào; độ tương phản đạt chuẩn WCAG AA >= 4.5:1; vùng chạm tối thiểu 44×44 pt.
- **Xử lý ngày giờ múi giờ an toàn:** Sử dụng `date-fns` xử lý chặt chẽ ranh giới nửa đêm (23:30 / 00:01), hiển thị ngày tương đối tiếng Việt, tuần bắt đầu từ Thứ Hai.
- **Ngoại tuyến & Đồng bộ Idempotent:** Tự động cache dữ liệu khi online; khi mất mạng vẫn có thể tạo/sửa/đánh dấu hoàn thành bài tập vào hàng đợi cục bộ (`offlineQueue`); khi có mạng trở lại, hệ thống tự động batch sync lên server với UUID idempotency không gây trùng lặp.
- **Thông báo cục bộ (Local Notifications):** Lên lịch thông báo trước hạn nộp qua `expo-notifications`, tự động hủy/cập nhật khi trạng thái bài tập thay đổi, hỗ trợ deep link nhấn vào thông báo mở thẳng chi tiết bài tập.
- **Backend API riêng biệt:** Viết bằng Node.js + Express + TypeScript, cơ sở dữ liệu SQLite chuẩn ACID với WAL mode (`journal_mode = WAL; busy_timeout = 5000;`), phân quyền và cô lập tài khoản chống IDOR triệt để.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
1923050413_project/
├── package.json                 # Root orchestration scripts (dev, test, tsc, lint)
├── README.md                    # Tài liệu hướng dẫn thiết lập & nghiệm thu
├── AI_LOG.md                    # Nhật ký tương tác & quyết định kỹ thuật AI
├── MOBILE_PROJECT_COMPLETION_REPORT.txt # Báo cáo tổng kết đồ án chi tiết (A-K)
├── impeccable/                  # Bộ skill khảo sát thiết kế & quy chuẩn kiểm thử
│
├── backend/                     # Backend API & Database SQLite
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example             # Mẫu cấu hình môi trường
│   ├── .env                     # Cấu hình môi trường nội bộ
│   ├── data/
│   │   └── planner.sqlite       # Cơ sở dữ liệu SQLite (WAL mode)
│   ├── src/
│   │   ├── config.ts            # Quản lý biến môi trường
│   │   ├── index.ts             # Entry point máy chủ HTTP
│   │   ├── app.ts               # Express application cấu hình CORS, JSON parser
│   │   ├── db/
│   │   │   ├── database.ts      # Quản lý kết nối SQLite Node 24 native
│   │   │   ├── schema.sql       # DDL bảng dữ liệu
│   │   │   └── seed.ts          # Script khởi tạo dữ liệu mẫu
│   │   ├── middleware/
│   │   │   ├── auth.ts          # Xác thực JWT & kiểm tra blacklist thu hồi
│   │   │   ├── validation.ts    # Zod schema validation
│   │   │   └── error.ts         # Chuẩn hóa envelope lỗi API
│   │   └── routes/
│   │       ├── auth.routes.ts   # /api/auth (register, login, logout, me)
│   │       ├── course.routes.ts # /api/courses (CRUD học phần)
│   │       ├── assignment.routes.ts # /api/assignments (CRUD bài tập, lọc, toggle)
│   │       ├── stats.routes.ts  # /api/stats (tính toán tiến độ động)
│   │       └── sync.routes.ts   # /api/sync (batch sync mutation ngoại tuyến)
│   └── tests/                   # 4 test suites: auth, assignments, isolation, stats
│
└── mobile/                      # Ứng dụng di động Expo SDK 58
    ├── package.json
    ├── tsconfig.json            # TypeScript Strict Mode ("strict": true)
    ├── eslint.config.js         # Cấu hình flat ESLint Expo
    ├── vitest.config.ts         # Cấu hình kiểm thử Mobile
    ├── src/
    │   ├── constants/
    │   │   └── theme.ts         # Single Source of Truth token màu & typography
    │   ├── types/               # Type definitions (API, Course, Assignment, Stats)
    │   ├── stores/              # Zustand stores (Auth, Theme, Filter, Offline)
    │   ├── services/            # SecureStore, API Client, OfflineStorage, Notifications
    │   ├── hooks/               # Custom hooks (useCourses, useAssignments, useProgressStats)
    │   ├── utils/               # dateUtils (xử lý ngày giờ, timezone, week interval)
    │   ├── components/          # Reusable components (Common, Assignments, Calendar, Stats)
    │   └── app/                 # Expo Router file-based navigation
    │       ├── _layout.tsx      # Root Layout (Session Guard & QueryClient)
    │       ├── +not-found.tsx   # 404 Not Found Screen
    │       ├── (auth)/          # Auth Stack (Login, Register)
    │       ├── (tabs)/          # Main Bottom Tabs (Tổng quan, Bài tập, Lịch tuần, Tiến độ, Học phần)
    │       ├── assignment/      # Dynamic Route ([id].tsx chi tiết bài tập)
    │       └── (modal)/         # Modal Route (assignment-form.tsx tạo/sửa)
    └── __tests__/               # 4 test suites: dateUtils, statsUtils, filterStore, offlineSync
```

---

## 3. YÊU CẦU MÔI TRƯỜNG

Trước khi cài đặt, hãy đảm bảo máy tính đã cài:
- **Node.js**: Phiên bản `>= 20.x` (khuyến nghị Node 22 hoặc 24 LTS).
- **npm**: Phiên bản `>= 10.x`.
- **Git**: Đã cài đặt để quản lý phiên bản.
- **Thiết bị chạy Mobile**:
  - Điện thoại thật: Cài đặt ứng dụng **Expo Go** (từ Google Play hoặc Apple App Store).
  - Hoặc Android Emulator (Android Studio) / iOS Simulator (macOS Xcode) / Web Browser.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN CHO MÁY MỚI

### Bước 1: Clone và Cài đặt Dependencies

Mở terminal tại thư mục gốc của dự án:

```bash
# 1. Cài đặt dependencies cho Backend
cd backend
npm install

# 2. Cài đặt dependencies cho Mobile
cd ../mobile
npm install

# 3. Quay lại thư mục gốc
cd ..
```

### Bước 2: Cấu hình Biến Môi trường Backend

Tại thư mục `backend/`, copy file `.env.example` thành `.env`:

```bash
cd backend
cp .env.example .env
```

Nội dung file `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_student_planner_1923050413
JWT_EXPIRES_IN=7d
DATABASE_PATH=./data/planner.sqlite
```

### Bước 3: Khởi tạo Cơ sở dữ liệu và Nạp Dữ liệu Mẫu (Seeding)

Chạy lệnh seed để tạo bảng và nạp tài khoản sinh viên mẫu:

```bash
npm run seed:backend
# Hoặc: cd backend && npm run seed
```

**Tài khoản demo đã tạo sẵn:**
- **Email:** `student@study.edu.vn`
- **Mật khẩu:** `Password123!`
- Dữ liệu có sẵn: 6 học phần đại học thực tế (Lập trình Mobile, Cơ sở dữ liệu, Mạng máy tính, Kiến trúc phần mềm, Trí tuệ nhân tạo, Kỹ năng mềm) và 8 bài tập tương ứng phân bố từ quá hạn, đến hạn hôm nay, 48 giờ tới và tuần sau.

### Bước 4: Khởi chạy Backend Server

Tại thư mục gốc:
```bash
npm run dev:backend
```
Backend API sẽ lắng nghe tại cổng `http://localhost:5000`.

### Bước 5: Khởi chạy Ứng dụng Mobile

Mở một cửa sổ terminal mới tại thư mục gốc:

```bash
npm run dev:mobile
```

- Nhấn `a` để mở trên Android Emulator.
- Nhấn `i` để mở trên iOS Simulator (nếu dùng macOS).
- Nhấn `w` để mở giao diện Web trên trình duyệt (`http://localhost:8081`).
- Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại thật (lưu ý điện thoại và máy tính cùng mạng Wi-Fi; cấu hình IP máy host trong `mobile/src/services/api.ts` nếu cần).

---

## 5. KIỂM THỬ VÀ KIỂM TRA CHẤT LƯỢNG MÃ NGUỒN

Dự án đáp ứng 100% các tiêu chí kiểm tra nghiêm ngặt:

### 1. Kiểm tra TypeScript Strict Mode
Chạy lệnh kiểm tra TypeScript trên toàn bộ dự án từ thư mục gốc:
```bash
npm run tsc
```
*(Kết quả: 0 lỗi. Cả Backend và Mobile đều biên dịch sạch sẽ ở chế độ Strict).*

### 2. Kiểm tra Linting Mobile
```bash
npm run lint:mobile
```
*(Kết quả: 0 errors, 0 warnings với cấu hình Expo Flat ESLint).*

### 3. Chạy Toàn Bộ Test Suites Tự Động
```bash
npm test
```
- **Backend Tests (20 tests passed):**
  - `tests/auth.test.ts`: Đăng ký, đăng nhập sai/đúng mật khẩu, kiểm tra phiên `/me`, đăng xuất và chặn token bị thu hồi.
  - `tests/isolation.test.ts`: Bảo vệ quyền sở hữu dữ liệu, chống IDOR tuyệt đối giữa các tài khoản khác nhau.
  - `tests/assignments.test.ts`: CRUD bài tập, lọc theo học phần, lọc theo trạng thái, cập nhật trạng thái toggle.
  - `tests/stats.test.ts`: Tính toán tiến độ động theo từng học phần và tổng thể, xử lý học phần không có bài tập.
- **Mobile Tests (26 tests passed):**
  - `__tests__/dateUtils.test.ts`: Kiểm tra logic biên ngày giờ (23:30 / 00:01), múi giờ, ISO 8601, cảnh báo hạn chót 48h.
  - `__tests__/statsUtils.test.ts`: Kiểm tra tỷ lệ hoàn thành %, làm tròn số học, học phần rỗng.
  - `__tests__/filterStore.test.ts`: Bộ lọc bài tập kết hợp Zustand selectors (tìm kiếm từ khóa, học phần, trạng thái).
  - `__tests__/offlineSync.test.ts`: Lưu trữ hàng đợi đột biến ngoại tuyến (`offlineStorage`), xóa mutation sau khi sync thành công.

---

## 6. HƯỚNG DẪN XÁC MINH CÁC CHỨC NĂNG BẮT BUỘC

1. **Đăng nhập & Phiên làm việc:**
   - Đăng nhập bằng `student@study.edu.vn` / `Password123!`.
   - Đóng ứng dụng hoặc reload web (`F5`), ứng dụng tự động kiểm tra phiên lưu trong `SecureStore` và giữ nguyên trạng thái đăng nhập.
   - Nhấn icon Đăng xuất ở header: token bị thu hồi trên backend và xóa khỏi SecureStore; ứng dụng tự động điều hướng về màn hình Login.

2. **Quản lý học phần:**
   - Vào tab **Học phần**: Hiển thị danh sách 6 học phần có màu sắc định danh.
   - Thêm học phần mới với mã môn, tên môn và bảng chọn màu trực quan.
   - Sửa thông tin hoặc xóa học phần (kèm cảnh báo xác nhận).

3. **Quản lý bài tập:**
   - Vào tab **Bài tập**: Danh sách bài tập hiển thị rõ badge học phần, tiêu đề, hạn chót dạng tương đối tiếng Việt, icon trạng thái.
   - Chạm vào checkbox/icon tròn để toggle hoàn thành/chưa hoàn thành tức thì.
   - Chạm vào bài tập để mở màn hình chi tiết (`assignment/[id]`).
   - Nhấn nút (+) ở góc phải dưới để mở modal thêm bài tập mới (`(modal)/assignment-form`).
   - Hỗ trợ đính kèm ảnh ghi chú/bảng trắng qua camera hoặc thư viện ảnh.

4. **Lịch tuần (Weekly Calendar):**
   - Vào tab **Lịch tuần**: Thanh trượt tuần hiển thị 7 ngày từ Thứ Hai đến Chủ Nhật với chấm màu chỉ báo bài tập đến hạn.
   - Có các nút điều hướng: Tuần trước, Tuần sau, và nút quay về **Hôm nay**.
   - Chạm vào từng ngày để xem danh sách bài tập của riêng ngày đó.

5. **Thống kê tiến độ (Progress Stats):**
   - Vào tab **Tiến độ**: Banner tổng quan hiển thị tổng số bài, số bài hoàn thành, số bài đang làm và thanh tiến độ tổng thể %.
   - Danh sách chi tiết tiến độ từng môn học có thanh phần trăm màu tương ứng.

6. **Chế độ Ngoại tuyến & Đồng bộ (Offline Mode):**
   - Tắt kết nối mạng hoặc ngắt backend server.
   - Ứng dụng ngay lập tức hiển thị **Banner màu cam**: *"Đang ở chế độ ngoại tuyến. Các thay đổi sẽ được lưu vào bộ nhớ máy và tự động đồng bộ khi có mạng."*
   - Người dùng vẫn có thể tạo bài tập mới hoặc toggle trạng thái bài tập bình thường.
   - Bật lại mạng/backend: Nhấn nút **Đồng bộ ngay** trên banner hoặc kéo để làm mới (Pull-to-Refresh), hàng đợi ngoại tuyến tự động gửi mutation lên `/api/sync/batch` và cập nhật dữ liệu máy chủ.

7. **Giao diện Sáng/Tối (Light & Dark Theme):**
   - Nhấn nút mặt trăng/mặt trời trên góc phải màn hình Tổng quan để chuyển đổi tức thì giữa Light Mode và Dark Mode.
   - Tất cả màu sắc, độ tương phản và viền chuyển đổi mượt mà dựa trên file `constants/theme.ts`.

---

## 7. THÔNG TIN BẢN QUYỀN & TÁC GIẢ

- **Đồ án môn:** Lập trình Mobile
- **Sinh viên:** Nguyễn Văn Tiến
- **MSSV:** 1923050413
- **Email:** ptien9237@gmail.com
- **Khóa luận/Kỳ thi:** Final Exam Project 2026.
