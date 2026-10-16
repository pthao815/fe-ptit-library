export type ManagedReader = {
  id: number;
  code: string;
  name: string;
  type: string;
  program: string;
  cardStatus: "Hoạt động" | "Bị khóa" | "Sắp hết hạn";
  loans: number;
  debt: number;
  email: string;
  phone: string;
  birthDate: string;
  cardExpiry: string;
  lockReason?: string;
  lockUntil?: string;
};

export const initialManagedReaders: ManagedReader[] = [
  { id: 701, code: "SV-B21DCAT018", name: "Nguyễn Văn An", type: "Sinh viên chính quy", program: "Công nghệ thông tin", cardStatus: "Hoạt động", loans: 6, debt: 0, email: "an.nv@student.ptit.edu.vn", phone: "0986 214 078", birthDate: "18/04/2003", cardExpiry: "31/12/2026" },
  { id: 702, code: "SV-B20DCCN116", name: "Đỗ Minh Quân", type: "Sinh viên chính quy", program: "Khoa học máy tính", cardStatus: "Bị khóa", loans: 3, debt: 64000, email: "quan.dm@student.ptit.edu.vn", phone: "0974 882 165", birthDate: "02/11/2002", cardExpiry: "31/12/2025", lockReason: "Có tài liệu quá hạn trên 30 ngày và công nợ chưa thanh toán.", lockUntil: "Đến khi hoàn trả tài liệu và hoàn tất công nợ" },
  { id: 703, code: "GV-CB00428", name: "Trần Thu Hà", type: "Cán bộ, giảng viên", program: "Điện tử viễn thông", cardStatus: "Hoạt động", loans: 4, debt: 0, email: "hatt@ptit.edu.vn", phone: "0912 664 320", birthDate: "27/08/1986", cardExpiry: "Không thời hạn" },
  { id: 704, code: "HV-CH23CNTT08", name: "Hoàng Đức Long", type: "Học viên cao học", program: "Công nghệ thông tin", cardStatus: "Sắp hết hạn", loans: 2, debt: 12000, email: "long.hd@stu.ptit.edu.vn", phone: "0963 420 815", birthDate: "11/06/1998", cardExpiry: "15/07/2025" },
  { id: 705, code: "NCS-22ATTT03", name: "Lê Ngọc Mai", type: "Nghiên cứu sinh", program: "An toàn thông tin", cardStatus: "Hoạt động", loans: 5, debt: 0, email: "mai.ln@stu.ptit.edu.vn", phone: "0904 731 266", birthDate: "09/01/1994", cardExpiry: "30/09/2027" },
  { id: 706, code: "SV-B22DCVT091", name: "Phạm Gia Huy", type: "Sinh viên chính quy", program: "Điện tử viễn thông", cardStatus: "Hoạt động", loans: 1, debt: 0, email: "huy.pg@student.ptit.edu.vn", phone: "0981 205 447", birthDate: "21/12/2004", cardExpiry: "31/12/2027" },
];
