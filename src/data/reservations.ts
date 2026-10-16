export type ReservationReader = {
  id: number;
  name: string;
  code: string;
  registered: string;
  status: "Đang chờ" | "Đã sẵn sàng";
  holdUntil?: string;
};

export type ReservationGroup = {
  id: number;
  title: string;
  author: string;
  record: string;
  cover: string;
  copies: string;
  available: boolean;
  queue: ReservationReader[];
};

export const initialReservationGroups: ReservationGroup[] = [
  {
    id: 601,
    title: "Machine Learning cơ bản",
    author: "Phạm Hoàng Anh",
    record: "BIB-0002518",
    cover: "cover-red",
    copies: "1 / 4 bản có sẵn",
    available: true,
    queue: [
      { id: 1, name: "Nguyễn Văn A", code: "SV-B21DCAT018", registered: "02/10/2026 · 09:14", status: "Đang chờ" },
      { id: 2, name: "Trần Văn B", code: "SV-B21DCCN042", registered: "03/10/2026 · 14:26", status: "Đang chờ" },
      { id: 3, name: "Lê Thu Trang", code: "SV-B22DCVT091", registered: "04/10/2026 · 08:52", status: "Đang chờ" },
    ],
  },
  {
    id: 602,
    title: "Cấu trúc dữ liệu và giải thuật",
    author: "Nguyễn Đức Nghĩa",
    record: "BIB-0001108",
    cover: "cover-charcoal",
    copies: "1 bản đang được giữ",
    available: false,
    queue: [
      { id: 4, name: "Đỗ Minh Quân", code: "SV-B20DCCN116", registered: "29/09/2026 · 10:05", status: "Đã sẵn sàng", holdUntil: "10/10/2026 · 17:00" },
      { id: 5, name: "Vũ Ngọc Mai", code: "SV-B21DCAT064", registered: "01/10/2026 · 15:32", status: "Đang chờ" },
    ],
  },
  {
    id: 603,
    title: "Mạng máy tính và hệ thống phân tán",
    author: "Lê Nhật Quang",
    record: "BIB-0002016",
    cover: "cover-slate",
    copies: "0 / 4 bản có sẵn",
    available: false,
    queue: [
      { id: 6, name: "Hoàng Đức Long", code: "HV-CH23CNTT08", registered: "04/10/2026 · 11:47", status: "Đang chờ" },
      { id: 7, name: "Nguyễn Thảo Linh", code: "SV-B22DCCN028", registered: "05/10/2026 · 09:21", status: "Đang chờ" },
      { id: 8, name: "Phan Quang Huy", code: "SV-B21DCVT077", registered: "06/10/2026 · 16:03", status: "Đang chờ" },
      { id: 9, name: "Trịnh Hà My", code: "SV-B23DCAT103", registered: "07/10/2026 · 08:16", status: "Đang chờ" },
    ],
  },
];
