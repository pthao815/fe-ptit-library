# PTIT Library — Frontend

Giao diện thư viện số PTIT dành cho bạn đọc (Reader), nhân viên thư viện (Staff) và quản trị viên (Admin): tra cứu tài liệu, đọc nội dung, tủ sách cá nhân và các màn hình nghiệp vụ thư viện.

**Trạng thái hiện tại:** prototype dùng dữ liệu mẫu trong `src/data` và trong component; chưa kết nối API backend. Có màn hình và tương tác không đồng nghĩa nghiệp vụ đã được lưu vào database.

## Công nghệ

Phiên bản dưới đây là khoảng phiên bản khai báo trong [package.json](./package.json), không phải phiên bản cài đặt cố định.

| Công nghệ | Khai báo |
| --- | --- |
| React / React DOM | `^19.0.0` |
| React Router DOM | `^7.18.4` |
| TypeScript | `^5.7.0` |
| Vite | `^8.0.5` |
| React plugin cho Vite | `^6.0.0` |
| Tailwind CSS / Vite plugin | `^4.0.0` |
| Oxfmt | `^0.2.0` |

Tailwind CSS được tích hợp qua Vite plugin. Alias `@` trỏ đến `src`; TypeScript bật `strict` và `noEmit`.

## Yêu cầu môi trường và package manager

- Theo `engines.node` của Vite và React plugin trong lockfile: Node.js `^20.19.0 || >=22.12.0` (nhánh 20 từ 20.19.0, hoặc từ 22.12.0 trở lên). Đây là yêu cầu từ dependency; dự án chưa khai báo `engines`, `packageManager`, `.nvmrc` hoặc `.node-version` riêng.
- Có cả [package-lock.json](./package-lock.json) và [pnpm-lock.yaml](./pnpm-lock.yaml), chưa thống nhất package manager. Hai lockfile không đồng bộ: phần importer của pnpm chưa khai báo `react-router-dom` đang có trong `package.json`; phiên bản khóa của Vite cũng khác nhau.
- Hướng dẫn bên dưới sử dụng npm và `package-lock.json`. Phiên bản npm chuẩn của dự án chưa được chỉ định. Không trộn npm và pnpm khi cập nhật dependency; cần thống nhất công cụ trước khi thay đổi lockfile.

## Cài đặt và chạy

Mở PowerShell tại thư mục `fe-library`, sau đó chạy:

```powershell
npm ci
npm run dev
```

Truy cập `http://localhost:8443`. Cấu hình hiện tại dùng HTTP, chưa bật HTTPS. Dev server bind `0.0.0.0`; `strictPort: true` khiến lệnh báo lỗi nếu cổng đã được sử dụng.

Đổi cổng trong phiên PowerShell hiện tại:

```powershell
$env:PORT = '5173'
npm run dev
```

Khi đó truy cập `http://localhost:5173`. Để trở lại mặc định cho lần chạy tiếp theo:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
```

`PORT` cũng áp dụng cho preview server. Preview không đặt `strictPort` tường minh; xem địa chỉ thực tế trong terminal nếu cổng bị chiếm.

## Các lệnh phát triển

Chạy trong `fe-library`, sau khi đã cài dependency:

| Lệnh | Loại | Chức năng |
| --- | --- | --- |
| `npm run dev` | npm script | Chạy Vite dev server |
| `npm run build` | npm script | Build bằng Vite, xuất mặc định vào `dist/` |
| `npm run preview` | npm script | Xem bản build tại máy; cần build trước |
| `npm run format` | npm script | Gọi Oxfmt; có thể thay đổi định dạng file |
| `npm exec -- tsc --noEmit` | Lệnh trực tiếp | Kiểm tra kiểu theo `tsconfig.json` bằng TypeScript đã cài |
| `git diff --check` | Lệnh Git | Kiểm tra lỗi khoảng trắng trong diff được Git theo dõi |

`build` hiện chỉ gọi `vite build`, không thay thế kiểm tra TypeScript riêng. Chưa có script `test`, `lint` hoặc `typecheck` trong `package.json`. Các lệnh này được đối chiếu từ cấu hình, chưa được thực thi để xác nhận kết quả trong lần viết README này.

## Cấu trúc mã nguồn

| Đường dẫn | Trách nhiệm |
| --- | --- |
| `src/main.tsx` | Mount React, bọc `BrowserRouter`, import CSS |
| `src/App.tsx` | Routing cấp cao cho Login, Reader, Staff và Admin |
| `src/layouts/` | Khung portal, sidebar và routing bên trong từng portal |
| `src/pages/auth/` | Giao diện đăng nhập |
| `src/pages/reader/` | Trang chủ, tìm kiếm, chi tiết, đọc tài liệu, đánh giá, tủ sách, hồ sơ, thông báo |
| `src/pages/staff/` | Dashboard, lưu thông, tài liệu, xử lý số, đặt trước, bạn đọc, báo cáo |
| `src/pages/workspace/` | Hồ sơ Staff/Admin |
| `src/components/` | Component giao diện dùng chung |
| `src/design-system.tsx` | Control và thành phần UI tái sử dụng |
| `src/data/` | Dữ liệu mẫu |
| `src/constants/`, `src/types/`, `src/utils/` | Danh mục, kiểu dữ liệu và tiện ích |
| `src/index.css` | CSS chung và giao diện responsive |
| `vite.config.ts`, `tsconfig.json` | Cấu hình dev/build, alias và TypeScript |

## Route và vai trò hiện tại

Các URL sau dùng đường dẫn thông thường, không dùng `#/`. Route đầy đủ được khai báo trong [App.tsx](./src/App.tsx), [ReaderPortal.tsx](./src/layouts/ReaderPortal.tsx) và [DashboardPortal.tsx](./src/layouts/DashboardPortal.tsx).

| Vai trò / khu vực | URL | Nội dung |
| --- | --- | --- |
| Đăng nhập | `/`, `/login` | Form tài khoản thư viện và Microsoft dạng mô phỏng |
| Reader | `/reader` | Trang chủ |
| Reader | `/reader/search`, `/reader/search-empty` | Tìm sách và trạng thái không có kết quả |
| Reader | `/reader/content-search`, `/reader/content-search-empty` | Tìm nội dung và trạng thái rỗng |
| Reader | `/reader/book-detail` | Chi tiết tài liệu mẫu, chưa nhận ID tài liệu |
| Reader | `/reader/book-detail/review`, các hậu tố `/edit`, `/login-required`, `/error` | Các trạng thái form đánh giá mẫu |
| Reader | `/reader/document/12` | Trang đọc mẫu; số `12` là trang ban đầu, không phải ID tài liệu |
| Reader | `/reader/my-library`, `/reader/my-library/history`, `/reader/my-library/reservations` | Tủ sách, lịch sử, đặt trước |
| Reader | `/reader/profile`, `/reader/profile/restricted` | Hồ sơ và trạng thái bị hạn chế mẫu |
| Reader | `/reader/notifications/:notificationId`, `/reader/guidelines` | Chi tiết thông báo mẫu và hướng dẫn |
| Staff | `/staff` | Dashboard mẫu |
| Staff | `/staff/circulation` | Cho mượn, nhận trả, gia hạn |
| Staff | `/staff/materials`, `/staff/materials/new`, `/staff/materials/edit/:id` | Danh sách và form biểu ghi mẫu |
| Staff | `/staff/digital-processing`, `/staff/reservations`, `/staff/readers`, `/staff/reports` | Xử lý số, đặt trước, bạn đọc, báo cáo |
| Staff/Admin | `/staff/profile`, `/admin/profile` | Hồ sơ workspace |
| Admin | `/admin/*` ngoài trang hồ sơ | Khung placeholder; chưa có trang quản trị chức năng riêng |

Menu Admin đã có “Cấu hình nghiệp vụ” và “Cấu hình tra cứu”, nhưng Module 2 chưa có trang, route riêng hoặc kết nối endpoint. Một số menu chỉ đổi state hiển thị placeholder. Route fallback không phải trang 404 chuyên biệt.

## Trạng thái chức năng và xác thực

- Các màn hình Reader/Staff, biểu đồ, mục lục và nội dung đọc sử dụng dữ liệu mẫu. Trang đọc hiện render HTML, chưa tích hợp PDF viewer tải tệp backend.
- Các thao tác lưu form, cập nhật hồ sơ, khóa thẻ, xử lý hàng chờ hoặc retry job hiện chủ yếu thay đổi state/thông báo; chưa lưu bền vững. Không nên dựa vào thông báo thành công trên UI để kết luận dữ liệu đã được lưu.
- [LoginPage.tsx](./src/pages/auth/LoginPage.tsx) kiểm tra trường nhập rồi dùng timer báo lỗi; cả đăng nhập thư viện và Microsoft đều chưa xác thực thực tế. “Ghi nhớ đăng nhập” chưa tạo phiên đăng nhập.
- Chưa có route guard hoặc kiểm tra quyền truy cập thật. Có thể mở trực tiếp URL Reader/Staff/Admin để xem prototype; vai trò layout không phải quyền đã được backend xác nhận.
- [logout.ts](./src/utils/logout.ts) xóa các khóa phiên/user/role định sẵn trong storage và chuyển về `/login`; chưa gọi API logout hoặc thu hồi token.

## Kết nối backend

Trong `src` hiện chưa có API client, lời gọi `fetch`/Axios hoặc cấu hình API base URL được sử dụng. Chưa có chức năng nào được xác nhận đã nối API backend; chạy frontend prototype hiện không cần backend.

`VITE_API_BASE_URL` **chưa được triển khai**: đặt biến này hiện không tự tạo kết nối. Khi tích hợp cần bổ sung API client, quản lý phiên/Bearer token, xử lý hợp đồng response và cấu hình CORS phía backend phù hợp origin frontend. Không đưa token hoặc mật khẩu vào mã nguồn hay README.

## Triển khai và tài liệu liên quan

Ứng dụng dùng `BrowserRouter` tại domain root. Host production cần phục vụ file tĩnh và fallback các route ứng dụng về `index.html`; nếu không, mở trực tiếp hoặc refresh URL con có thể trả 404. Nếu dùng chung host với API, tách đường dẫn API khỏi SPA fallback. Chưa cấu hình host production trong dự án.

- [DEPLOYMENT.md](./DEPLOYMENT.md): SPA fallback, ví dụ Nginx và kiểm tra điều hướng trước phát hành.
- [AGENTS.md](./AGENTS.md): cấu trúc, quy tắc sửa code và kiểm tra chất lượng.
- [CLAUDE.md](./CLAUDE.md): tham chiếu hướng dẫn repository.
- [README backend](../be-ptit-library/README.md): tài liệu dịch vụ backend độc lập.

README phản ánh mã nguồn tại thời điểm viết; chưa xác nhận cài đặt, build, trình duyệt hoặc tích hợp backend thành công bằng chạy thử.
