# PTIT Library — Frontend

Giao diện thư viện số PTIT dành cho bạn đọc (Reader), nhân viên thư viện (Staff) và quản trị viên (Admin): tra cứu tài liệu, đọc nội dung, tủ sách cá nhân và các màn hình nghiệp vụ thư viện.

**Trạng thái hiện tại:** Module 2 đã có service HTTP cho 7 endpoint backend, không fallback mock; chưa kiểm chứng với backend/database thật. Các module khác vẫn dùng dữ liệu mẫu. Đăng nhập Module 1 chưa được tích hợp vào nhánh này.

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

`build` hiện chỉ gọi `vite build`, không thay thế kiểm tra TypeScript riêng. Chưa có script `test`, `lint` hoặc `typecheck` trong `package.json`. TypeScript, production build và kiểm tra whitespace đã qua trong lần tích hợp Module 2; build vẫn cảnh báo chunk JavaScript lớn hơn 500 kB.

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
| Admin/Staff | `/admin/policies`, `/staff/policies` | Chính sách mượn trả qua API; Librarian chỉ xem |
| Admin/Staff | `/admin/penalty-types`, `/staff/penalty-types` | Loại hình phạt qua API; Librarian chỉ xem |
| Admin | `/admin/search-configs` | Xem và kích hoạt cấu hình tìm kiếm qua API |
| Admin | Các mục còn lại ngoài hồ sơ và Module 2 | Khung placeholder |

Menu Module 2 dẫn tới route riêng, active theo URL và hỗ trợ Back/Forward. Một số menu khác chỉ đổi state hiển thị placeholder. Route fallback không phải trang 404 chuyên biệt.

### Module 2 — cấu trúc theo nghiệp vụ

```text
src/shared/api/http-client.ts                 # HTTP/envelope, không biết nghiệp vụ
src/shared/auth/auth-session.ts               # Adapter phiên, không login/refresh/logout
src/features/library-settings/
  api/settings.api.ts                         # 7 endpoint + quyền theo resource
  api/index.ts                                # Ghép base URL từ Vite với HTTP client
  model/                                      # Types, constants, parsers, validation, form model
  hooks/                                      # Tải dữ liệu và vòng đời form
  components/                                 # Khung trang, bảng trạng thái, form và dialog
  pages/                                      # LoanPoliciesPage, PenaltyTypesPage, SearchConfigsPage
  devtools/DevelopmentAccessPanel.tsx           # Token tạm, chỉ development
  settings.css
src/integration/module2-session.ts             # Re-export tương thích cho Module 1
```

- Các route hiện có được giữ nguyên. ADMIN được ghi trong portal Admin; LIBRARIAN chỉ xem policy/penalty. Role chưa có hoặc READER không được gọi API. Backend quyết định quyền cuối cùng.
- HTTP dùng chung không chứa endpoint whitelist, field form hoặc lỗi phí phạt. Feature chịu trách nhiệm kiểm tra quyền, parser response và mapping lỗi nghiệp vụ.
- Mỗi trang có dữ liệu tải riêng; form policy/penalty và dialog kích hoạt riêng. Không giữ cache giữa tài khoản. Không có fallback mock, seed hoặc ID tự sinh; mock cũ đã được loại khỏi phạm vi này.
- Validation và form model giữ bản nháp khi lưu lỗi, chặn gửi lặp. Không retry request ghi tự động. Nếu mất xác nhận khi ghi, tải lại để kiểm tra trước khi gửi lại.
- Response có null, enum không hỗ trợ hoặc số ngoài miền an toàn sẽ báo lỗi dữ liệu, không tự ép thành mặc định. Mã docType là chuỗi theo catalog thật, không phải danh mục mock.
- Sau ghi policy/penalty, bảng dùng DTO server trả về. Sau kích hoạt, tải lại toàn bộ danh sách. Kích hoạt không tự lập chỉ mục lại.

### Cấu hình kết nối và chạy khi Module 1 chưa merge

1. Sao chép [.env.example](./.env.example) thành file local như `.env.local` và đặt `VITE_API_BASE_URL=http://localhost:8080` (chỉ origin, không thêm `/api`). Để trống nếu API cùng origin. Khởi động lại Vite sau khi đổi biến môi trường.
2. Backend phải được người phụ trách khởi chạy trong môi trường thử được cho phép. Cấu hình `CORS_ALLOWED_ORIGINS` cần chứa đúng origin frontend, ví dụ `http://localhost:8443` (hoặc `http://localhost:5173` nếu đổi PORT). Không tắt Spring Security. Frontend này không sửa CORS/backend.
3. Chạy `npm run dev`, mở một trong năm route Module 2. Mở **Kết nối phiên development (chờ Module 1)**, nhập access token được cấp từ công cụ kiểm thử/Module 1. Không nhập refresh token hoặc token production vào môi trường không tin cậy.
4. Role và user ID được đọc từ JWT cho UI; đây không phải xác minh chữ ký. Backend xác minh quyền. Token chỉ ở bộ nhớ, không ghi storage/log; refresh phải nhập lại. Ô token chỉ có trong Vite development, không có trong production build hoặc preview.
5. Chỉ thử ghi khi đã xác nhận database và bản ghi thử được phép thay đổi. Không tự tạo seed/policy/search config từ frontend.

### Bàn giao cho Module 1

Adapter chính tại [auth-session.ts](./src/shared/auth/auth-session.ts). Đường import [module2-session.ts](./src/integration/module2-session.ts) vẫn tương thích và trỏ cùng một singleton:

```ts
import { module2Session } from "./integration/module2-session";

// Gọi trên login, thay token, đổi tài khoản hoặc khôi phục phiên.
module2Session.setSession({ accessToken, userId: user.id, role: user.role });
// role chuẩn: ADMIN | LIBRARIAN | READER; token phải là access JWT backend.

// Gọi khi Module 1 logout/hủy phiên. Module 2 không tự triển khai logout.
module2Session.setSession(null);

// Tùy chọn nối UI điều hướng/thông báo của Module 1; callback không chứa token.
const unsubscribe = module2Session.onAuthError((status) => {
  // 401: phiên Module 2 đã bị xóa; Module 1 quyết định xử lý tiếp.
  // 403: không xóa phiên, hiển thị thiếu quyền.
});
// Hủy subscription khi host teardown: unsubscribe();
```

Module 1 phải cung cấp userId/role khớp token và thông báo mọi thay đổi phiên. Adapter chỉ đọc JWT để định tuyến UI, không xác minh chữ ký và không thay thế backend.

- `version`: mốc thông tin xác thực, tăng mỗi lần cấp phiên/token. Response 401/403 dùng token cũ không được hủy phiên mới và không tự gửi lại request.
- `identityVersion`: chỉ đổi khi user ID/quyền thay đổi hoặc logout/login. React dùng mốc này để reset dữ liệu và bản nháp; thay token cùng user/quyền giữ modal và bản nháp, kể cả request đang chờ. Response thành công cùng danh tính vẫn được nhận; đổi danh tính hoặc rời trang thì bỏ qua.
- Module 1 có thể import `authSession` trực tiếp từ shared/auth/auth-session.ts; alias `module2Session`, `sessionFromAccessToken`, `setSession` và callback 401/403 cũ vẫn giữ nguyên. Không triển khai login/refresh/logout ở feature.
- Khi production chưa nối adapter, trang chỉ báo cần phiên và không gửi request. Panel development không xuất hiện trong production/preview.
- Khi client dùng chung của Module 1 sẵn sàng, thay chỗ khởi tạo HTTP trong api/index.ts; giữ contract API feature và các trang.

## Trạng thái chức năng và xác thực

- Các màn hình Reader/Staff, biểu đồ, mục lục và nội dung đọc sử dụng dữ liệu mẫu. Trang đọc hiện render HTML, chưa tích hợp PDF viewer tải tệp backend.
- Ngoài Module 2, các thao tác lưu form, cập nhật hồ sơ, khóa thẻ, xử lý hàng chờ hoặc retry job hiện chủ yếu thay đổi state/thông báo; chưa lưu bền vững. Không nên dựa vào thông báo thành công trên UI để kết luận dữ liệu đã được lưu.
- [LoginPage.tsx](./src/pages/auth/LoginPage.tsx) kiểm tra trường nhập rồi dùng timer báo lỗi; cả đăng nhập thư viện và Microsoft đều chưa xác thực thực tế. “Ghi nhớ đăng nhập” chưa tạo phiên đăng nhập.
- Chưa có route guard hoặc kiểm tra quyền truy cập thật. Có thể mở trực tiếp URL Reader/Staff/Admin để xem prototype; vai trò layout không phải quyền đã được backend xác nhận.
- [logout.ts](./src/utils/logout.ts) xóa các khóa phiên/user/role định sẵn trong storage và chuyển về `/login`; chưa gọi API logout hoặc thu hồi token.

## Kết nối backend

Module 2 đã dùng fetch qua service riêng và VITE_API_BASE_URL; các màn hình còn lại chưa nối API. Không có cơ chế tự gọi login/refresh trong Module 2.

Không đưa token hoặc mật khẩu vào biến VITE_*, mã nguồn hoặc README. Biến VITE_* được đóng gói vào frontend, chỉ đặt thông tin công khai như base URL.

## Triển khai và tài liệu liên quan

Ứng dụng dùng `BrowserRouter` tại domain root. Host production cần phục vụ file tĩnh và fallback các route ứng dụng về `index.html`; nếu không, mở trực tiếp hoặc refresh URL con có thể trả 404. Nếu dùng chung host với API, tách đường dẫn API khỏi SPA fallback. Chưa cấu hình host production trong dự án.

- [DEPLOYMENT.md](./DEPLOYMENT.md): SPA fallback, ví dụ Nginx và kiểm tra điều hướng trước phát hành.
- [AGENTS.md](./AGENTS.md): cấu trúc, quy tắc sửa code và kiểm tra chất lượng.
- [CLAUDE.md](./CLAUDE.md): tham chiếu hướng dẫn repository.
- [README backend](../be-ptit-library/README.md): tài liệu dịch vụ backend độc lập.

Kiểm chứng service cô lập: `node --experimental-strip-types --test tests/library-settings.test.mjs` (chỉ dùng fetch giả lập, không mạng/DB). Kiểm tra kiểu: `node node_modules/typescript/bin/tsc --noEmit`; build: `npm run build`; whitespace: `git diff --check`. Chưa kiểm chứng các request với backend thật, CORS, JWT server hoặc persistence DB; mock HTTP pass không chứng minh tích hợp end-to-end.

Test dùng Node 22.15 đang có và khả năng TypeScript type stripping (có cảnh báo experimental), không VM loader, không dependency mới. Test kiểm tra hợp đồng HTTP, phân quyền, tách identity/token, form model giữ bản nháp, chặn gửi lặp và xử lý response cũ. Đây là test service/state model, chưa phải test tương tác component hoặc end-to-end trên trình duyệt.
