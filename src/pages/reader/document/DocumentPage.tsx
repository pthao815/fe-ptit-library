import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button, Icon, IconButton } from "../../../design-system";
import { documentChapters, matchItems } from "../../../data/document";

export default function DocumentReader({ initialPage }: { initialPage: number }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(Math.min(Math.max(initialPage, 1), 148));
  const [zoomIndex, setZoomIndex] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const zoomLevels = [75, 100, 125, 150];
  const activeMatch = matchItems.find((item) => item.page === currentPage);
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), 148));
    setTocOpen(false);
    setMatchesOpen(false);
  };
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  return (
    <div className="document-reader">
      <header className="reader-toolbar">
        <div className="reader-document-identity">
          <span><Icon name="document" /></span>
          <div><strong>Trí tuệ nhân tạo trong đổi mới giáo dục đại học</strong><small>Nguyễn Thị Lan Hương · 2024</small></div>
        </div>
        <div className="reader-toolbar-center">
          <div className="page-control">
            <IconButton label="Trang trước" icon="chevron-left" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} />
            <label><input aria-label="Trang hiện tại" value={currentPage} onChange={(event) => goToPage(Number(event.target.value) || 1)} /><span>/ 148</span></label>
            <IconButton label="Trang sau" icon="chevron-right" disabled={currentPage === 148} onClick={() => goToPage(currentPage + 1)} />
          </div>
          <span className="toolbar-separator" />
          <div className="zoom-control">
            <IconButton label="Thu nhỏ" icon="zoom-out" disabled={zoomIndex === 0} onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))} />
            <span>{zoomLevels[zoomIndex]}%</span>
            <IconButton label="Phóng to" icon="zoom-in" disabled={zoomIndex === zoomLevels.length - 1} onClick={() => setZoomIndex(Math.min(zoomLevels.length - 1, zoomIndex + 1))} />
          </div>
        </div>
        <div className="reader-toolbar-actions">
          <IconButton label="Tìm trong tài liệu" icon="search" onClick={() => setSearchOpen(!searchOpen)} />
          <IconButton label="Toàn màn hình" icon="maximize" onClick={toggleFullscreen} />
          <IconButton label="Đóng tài liệu" icon="close" onClick={() => { navigate("/reader/book-detail"); }} />
        </div>
      </header>

      {searchOpen && <div className="document-search-bar"><Icon name="search" size={17} /><input autoFocus defaultValue="ứng dụng AI trong giáo dục đại học" aria-label="Tìm trong tài liệu" /><span>3 kết quả</span><IconButton label="Kết quả trước" icon="chevron-left" /><IconButton label="Kết quả sau" icon="chevron-right" /><IconButton label="Đóng tìm kiếm" icon="close" onClick={() => setSearchOpen(false)} /></div>}

      <div className="reader-workspace">
        <aside className={`toc-panel ${tocOpen ? "mobile-open" : ""}`}>
          <div className="reader-panel-heading"><div><p>MỤC LỤC</p><strong>Nội dung tài liệu</strong></div><IconButton label="Đóng mục lục" icon="close" onClick={() => setTocOpen(false)} /></div>
          <nav aria-label="Mục lục tài liệu">
            {documentChapters.map((chapter) => (
              <div className="toc-group" key={chapter.title}>
                <button className={currentPage >= chapter.page && currentPage < chapter.page + 12 ? "active" : ""} onClick={() => goToPage(chapter.page)}><span>{chapter.title}</span><small>{chapter.page}</small></button>
                {chapter.sections?.map((section) => <button className={`toc-section ${currentPage === section.page ? "active" : ""}`} key={section.title} onClick={() => goToPage(section.page)}><span>{section.title}</span><small>{section.page}</small></button>)}
              </div>
            ))}
          </nav>
          <div className="online-only"><Icon name="info" size={15} /><span><strong>Chỉ được xem trực tuyến</strong><small>Tài liệu được bảo vệ bản quyền</small></span></div>
        </aside>

        <main className="document-stage">
          <div className="mobile-reader-controls">
            <Button variant="secondary" size="sm" icon="menu" onClick={() => setTocOpen(true)}>Mục lục</Button>
            <Button variant="secondary" size="sm" icon="sparkle" onClick={() => setMatchesOpen(true)}>Đoạn khớp</Button>
          </div>
          <div className={`document-page zoom-${zoomLevels[zoomIndex]}`}>
            <div className="pdf-page-header"><span>CHƯƠNG 3</span><span>ỨNG DỤNG AI TRONG GIÁO DỤC ĐẠI HỌC</span></div>
            <h1>3.2. Cá nhân hóa trải nghiệm học tập</h1>
            <p className="pdf-lead">Sự phát triển của các mô hình học máy mở ra khả năng thiết kế những môi trường học tập có tính thích ứng cao, trong đó nội dung, nhịp độ và phương pháp hỗ trợ được điều chỉnh theo nhu cầu của từng người học.</p>
            <p>Trong những năm gần đây, <mark className={currentPage === 42 ? "active-match" : ""}>việc ứng dụng AI trong giáo dục đại học đang tạo ra những thay đổi đáng kể trong phương pháp giảng dạy và hỗ trợ người học.</mark> Các hệ thống phân tích dữ liệu học tập giúp giảng viên nhận diện sớm những sinh viên cần hỗ trợ, đồng thời cung cấp các gợi ý phù hợp với tiến độ cá nhân.</p>
            <p>Khác với mô hình đào tạo truyền thống, môi trường học tập thích ứng có khả năng liên tục thu nhận dữ liệu từ hoạt động học tập. Thông tin này không nhằm thay thế quyết định chuyên môn của giảng viên mà đóng vai trò như một nguồn tham khảo có cấu trúc.</p>
            <figure className="pdf-figure"><div><span>NGƯỜI HỌC</span><i /><span>PHÂN TÍCH DỮ LIỆU</span><i /><span>NỘI DUNG THÍCH ỨNG</span></div><figcaption>Hình 3.4. Chu trình cá nhân hóa trải nghiệm học tập bằng dữ liệu</figcaption></figure>
            <h2>Nguyên tắc triển khai</h2>
            <p>Việc triển khai cần bảo đảm tính minh bạch, khả năng giải thích và quyền kiểm soát dữ liệu của người học. Mỗi gợi ý do hệ thống tạo ra phải được xem xét trong bối cảnh sư phạm cụ thể và tuân thủ quy định của cơ sở giáo dục.</p>
            <div className="pdf-page-number">{currentPage}</div>
          </div>
        </main>

        <aside className={`matches-panel ${matchesOpen ? "mobile-open" : ""}`}>
          <div className="reader-panel-heading"><div><p>TÌM KIẾM NGỮ NGHĨA</p><strong>Đoạn nội dung khớp</strong></div><IconButton label="Đóng đoạn khớp" icon="close" onClick={() => setMatchesOpen(false)} /></div>
          <div className="match-query"><Icon name="search" size={15} /><span>“Tác động của trí tuệ nhân tạo đối với giáo dục đại học”</span></div>
          <p className="match-count">3 đoạn phù hợp trong tài liệu</p>
          <div className="document-match-list">
            {matchItems.map((item, index) => (
              <button key={item.page} className={currentPage === item.page ? "active" : ""} onClick={() => goToPage(item.page)}>
                <span className="match-index">0{index + 1}</span>
                <blockquote>…{item.before}<mark>{item.match}</mark>{item.after}…</blockquote>
                <dl><div><dt>Trang</dt><dd>{item.page}</dd></div><div><dt>Chương</dt><dd>{item.chapter}</dd></div><div><dt>Mục</dt><dd>{item.section}</dd></div></dl>
              </button>
            ))}
          </div>
          {activeMatch && <div className="active-match-note"><Icon name="success" size={16} /><span>Đang hiển thị đoạn khớp trên trang {activeMatch.page}</span></div>}
        </aside>
      </div>
      {(tocOpen || matchesOpen) && <button className="reader-mobile-scrim" aria-label="Đóng bảng điều khiển" onClick={() => { setTocOpen(false); setMatchesOpen(false); }} />}
    </div>
  );
}
