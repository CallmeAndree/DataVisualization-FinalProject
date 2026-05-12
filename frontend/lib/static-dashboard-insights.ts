export type StaticDashboardKey =
  | "overview"
  | "short-form"
  | "channels"
  | "interaction"
  | "anomaly"
  | "economy";

export interface StaticDashboardInsight {
  title?: string;
  analysis: string[];
  insight: string;
  action?: string[];
}

export const STATIC_DASHBOARD_INSIGHTS: Record<StaticDashboardKey, StaticDashboardInsight> = {
  overview: {
    title: "Overview dashboard insight",
    analysis: [
      "Bieu do tron (Phan bo danh muc): 8 danh muc co luong video kha can bang (4.000-4.200 video), ngoai tru Am nhac (2.430) va Nhat ky doi song (3.346) co so luong thap hon mat bang chung.",
      "Bieu do duong (Luot xem theo nam): Co 3 giai doan ro ret. Dang chu y nhat la cu but pha ky luc nam 2024-2025, dat dinh 15,3 ty view (gap 3 lan trung binh truoc do).",
      "Bieu do mien xep chong (Ti le video ngan/dai): Giai doan 2015-2021 video dai thong tri. Nam 2022-2023, video ngan but pha chiem gan 50%. Tu 2024, hai dinh dang dat trang thai can bang dong."
    ],
    insight:
      "Cu but pha view nam 2024-2025 la su cong huong cua Short-form va YouTube Shopping. Cac creator khong chuyen dich triet de sang video ngan ma van hanh mo hinh hai tang linh hoat: dung Shorts de tiep can nhanh va Long-form de giu chieu sau.",
    action: []
  },
  "short-form": {
    title: "RO1 short-form insight",
    analysis: [
      "Heatmap (Ty le short-form): Short-form tham nhap khong dong deu. Nhom Am nhac tien phong tu 2015-2016. Hai, Thieu nhi, The thao tang manh sau 2022. Tro choi, Giao duc, Tin tuc thich nghi cham hon.",
      "Bieu do cot ghep (So luong): Video ngan bung no tu nam 2022, nhung trong suot toan bo giai doan (2015-2026), video dai van luon cao hon ve mat so luong tuyet doi."
    ],
    insight:
      "Muc do phu hop voi Short-form phu thuoc vao ban chat noi dung. Cac nhom khong can nhieu boi canh (Am nhac, Hai) de thich nghi hon cac nhom can khong gian ke chuyen (Tro choi, Vlog). Video ngan mang tinh cau truc nhung chi dong vai tro bo sung chu chua thay the video dai.",
    action: [
      "Creator can xay dung mo hinh ket hop (ngan de mo rong, dai de giu chieu sau).",
      "Nhom Tro choi, Giao duc, Tin tuc nen dung video ngan lam teaser bo tro; trong khi Am nhac, Hai, Thieu nhi co the dung lam kenh tang truong chinh."
    ]
  },
  channels: {
    title: "RO2 channels insight",
    analysis: [
      "Bieu do cot nhom (Phan bo thoi luong): Tuy danh muc se co cau truc rieng (Hai/Thieu nhi uu tien video ngan; Giao duc/Tro choi/Vlog uu tien video dai; The thao/Tin tuc phan bo deu).",
      "Heatmap (Tuong tac trung vi): Dinh dang dang nhieu nhat chua chac tuong tac tot nhat. Vi du dien hinh: Tro choi dang nhieu video dai, nhung nhom video thoi luong trung binh moi tao tuong tac manh nhat toan bieu do."
    ],
    insight:
      "Khong co cong thuc thoi luong chung cho toan YouTube. Su lech pha o nhom Tro choi cho thay dinh dang trung binh can bang tot hon giua giu nhip va truyen tai. Muc tuong tac thap o Tin tuc/The thao la do muc dich nguoi xem chi can nhan thong tin nhanh.",
    action: [
      "Toi uu do dai theo tung category.",
      "Nhom Tro choi nen thu nghiem video trung binh thay vi mac dinh video dai.",
      "Hai, Thieu nhi uu tien video ngan.",
      "Giao duc, Tin tuc ket hop ngan dai de keo chu y va giu chieu sau."
    ]
  },
  interaction: {
    title: "RO3 interaction insight",
    analysis: [
      "Heatmap (Luot xem trung vi): Vung nhiet dam nhat (luot xem cao nhat) roi vao 17h-18h va 21h, dac biet vao cac ngay can cuoi tuan (Thu Nam den Thu Bay).",
      "Bieu do duong (So luong video/gio): Hanh vi dang tai cua creator lai hoi tu tao thanh dinh cao nhat o khung 18h-19h (dat 1.000-1.400 video), tao ra su venh nhe so voi gio hieu suat cao nhat."
    ],
    insight:
      "Creator da nam duoc nhip sinh hoat, nhung don qua nhieu video vao 18h-19h khien khung gio nay tro thanh bien do canh tranh. Bai toan gio dang khong chi la chon luc dong nguoi xem, ma con la chon thoi diem it bi bao hoa.",
    action: [
      "Toi uu hoa gio dang dua tren ca hai yeu to: luong khan gia va mat do canh tranh.",
      "Thu nghiem dang lech pha sang cac khung 17h-18h hoac 21h (dac biet T5-T7) de tan dung nhu cau cao ma it bao hoa hon."
    ]
  },
  anomaly: {
    title: "RO4 anomaly insight",
    analysis: [
      "Bieu do truc kep (So luong & Ty le): Thieu nhi dung dau ve so luong video viral, nhung Am nhac moi la nhom dan dau ve ty le viral.",
      "Boxplot (Dong luong viral): Am nhac co dong luong lan truyen cao nhat (keo duoc view cho cac video sau). Nguoc lai, Thieu nhi du nhieu video viral nhung phan bo boxplot lai thap, cho thay hieu ung thieu on dinh."
    ],
    insight:
      "Viral nhieu va viral hieu qua la hai co che khac nhau (thang nho so luong vs thang nho ty le). Gia tri thuc su cua viral khong nam o su bung no cua 1 video, ma o kha nang chuyen hoa thanh dong luong tang truong keo dai cho ca kenh (momentum).",
    action: [
      "Creator Am nhac va Nhat ky doi song nen tan dung video viral de dan dat nguoi xem sang video khac trong kenh.",
      "Kenh Thieu nhi nen toi da hoa do phu thay vi ky vong da tang truong ben vung tu viral.",
      "Cac ngach khac xem viral la tin hieu hiem, khong phu thuoc lam chien luoc chinh."
    ]
  },
  economy: {
    title: "RO5 economy insight",
    analysis: [
      "Scatter plot (Quy mo vs Tuong tac): Khong co ty le thuan giua so subscriber va ty le tuong tac. Nhieu kenh Thieu nhi quy mo khong lo nhung o vung tuong tac rat thap; trong khi nhieu kenh Tro choi/Vlog tam trung lai co tuong tac cao (1,5% - 4%).",
      "Bubble chart (Ma tran chien luoc): Cac kenh phan chia ro: Goc \"It video/View cao\" (Am nhac, Vlog); Goc \"Nhieu video/View thap\" (Tin tuc, Giao duc); va Goc hiem \"Nhieu video/View cao\" (Thieu nhi)."
    ],
    insight:
      "Do lon kenh (subscriber) khong tu dong phan anh muc do gan ket thuc chat cua cong dong. Thanh cong den tu viec lua chon mo hinh tang truong phu hop voi dac thu noi dung chu khong co mot con duong duy nhat.",
    action: [
      "Khong dung luong subscriber lam chi bao duy nhat, can ket hop xem xet muc tuong tac va luot xem trung binh.",
      "Nhom Am nhac/Vlog nen tap trung chien luoc it nhung chat luong.",
      "Tin tuc/Giao duc nen duy tri tan suat xuat ban nhung phai kiem soat chat luong.",
      "Thieu nhi nen uu tien do phu va so luong."
    ]
  }
};
