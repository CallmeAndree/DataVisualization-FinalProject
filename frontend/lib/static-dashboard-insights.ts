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
      "Biểu đồ tròn (Phân bố danh mục): 8 danh mục có lượng video khá cân bằng (4.000-4.200 video), ngoại trừ Âm nhạc (2.430) và Nhật ký đời sống (3.346) có số lượng thấp hơn mặt bằng chung.",
      "Biểu đồ đường (Lượt xem theo năm): Có 3 giai đoạn rõ rệt. Đáng chú ý nhất là cú bứt phá kỷ lục năm 2024-2025, đạt đỉnh 15,3 tỷ view (gấp 3 lần trung bình trước đó).",
      "Biểu đồ miền xếp chồng (Tỉ lệ video ngắn/dài): Giai đoạn 2015-2021 video dài thống trị. Năm 2022-2023, video ngắn bứt phá chiếm gần 50%. Từ 2024, hai diện đang đạt trạng thái cân bằng động."
    ],
    insight:
      "Cú bứt phá view năm 2024-2025 là sự cộng hưởng của Short-form và YouTube Shopping. Các creator không chuyển dịch triệt để sang video ngắn mà vẫn vận hành mô hình hai tầng linh hoạt: dùng Shorts để tiếp cận nhanh và Long-form để giữ chiều sâu.",
    action: []
  },
  "short-form": {
    title: "RO1 short-form insight",
    analysis: [
      "Heatmap (Tỉ lệ short-form): Short-form thâm nhập không đồng đều. Nhóm Âm nhạc tiên phong từ 2015-2016. Thiếu nhi, Thể thao tăng mạnh sau 2022. Trò chơi, Giáo dục, Tin tức thích nghi chậm hơn.",
      "Biểu đồ cột ghép (Số lượng): Video ngắn bùng nổ từ năm 2022, nhưng trong suốt toàn bộ giai đoạn (2015-2026), video dài vẫn luôn cao hơn về mặt số lượng tuyệt đối."
    ],
    insight:
      "Mức độ phù hợp với Short-form phụ thuộc vào bản chất nội dung. Các nhóm không cần nhiều bối cảnh (Âm nhạc, Hai) dễ thích nghi hơn các nhóm cần không gian kể chuyện (Trò chơi, Vlog). Video ngắn mang tính cấu trúc nhưng chỉ đóng vai trò bổ sung chứ chưa thay thế video dài.",
    action: [
      "Creator cần xây dựng mô hình kết hợp (ngắn để mở rộng, dài để giữ chiều sâu).",
      "Nhóm Trò chơi, Giáo dục, Tin tức nên dùng video ngắn làm teaser bổ trợ; trong khi Âm nhạc, Hai, Thiếu nhi có thể dùng làm kênh tăng trưởng chính."
    ]
  },
  channels: {
    title: "RO2 channels insight",
    analysis: [
      "Biểu đồ cột nhóm (Phân bố thời lượng): Tùy danh mục sẽ có cấu trúc riêng (Thiếu nhi ưu tiên video ngắn; Giáo dục/Trò chơi/Vlog ưu tiên video dài; Thể thao/Tin tức phân bố đều).",
      "Heatmap (Tương tác trung vị): Định dạng đang nhiều nhất chưa chắc tương tác tốt nhất. Ví dụ điển hình: Trò chơi đang nhiều video dài, nhưng nhóm video thời lượng trung bình mới tạo tương tác mạnh nhất toàn biểu đồ."
    ],
    insight:
      "Không có công thức thời lượng chung cho toàn YouTube. Sự lệch pha ở nhóm Trò chơi cho thấy định dạng trung bình cân bằng tốt hơn giữa giữ nhịp và truyền tải. Mức tương tác thấp ở Tin tức/Thể thao là do mục đích người xem chỉ cần nhận thông tin nhanh.",
    action: [
      "Tối ưu độ dài theo từng category.",
      "Nhóm Trò chơi nên thử nghiệm video trung bình thay vì mặc định video dài.",
      "Thiếu nhi ưu tiên video ngắn.",
      "Giáo dục, Tin tức kết hợp ngắn dài để kéo chú ý và giữ chiều sâu."
    ]
  },
  interaction: {
    title: "RO3 interaction insight",
    analysis: [
      "Heatmap (Lượt xem trung vị): Vùng nhiệt đậm nhất (lượt xem cao nhất) rơi vào 17h-18h và 21h, đặc biệt vào các ngày cận cuối tuần (Thứ Năm đến Thứ Bảy).",
      "Biểu đồ đường (Số lượng video/giờ): Hành vi đăng tải của creator lại hội tụ tạo thành đỉnh cao nhất ở khung 18h-19h (đạt 1.000-1.400 video), tạo ra sự vênh nhẹ so với giờ hiệu suất cao nhất."
    ],
    insight:
      "Creator đã nắm được nhịp sinh hoạt, nhưng dồn quá nhiều video vào 18h-19h khiến khung giờ này trở thành biên độ cạnh tranh. Bài toán giờ đăng không chỉ là chọn lúc đông người xem, mà còn là chọn thời điểm ít bị bão hòa."
    ,
    action: [
      "Tối ưu hóa giờ đăng dựa trên cả hai yếu tố: lượng khán giả và mật độ cạnh tranh.",
      "Thử nghiệm đăng lệch pha sang các khung 17h-18h hoặc 21h (đặc biệt T5-T7) để tận dụng nhu cầu cao mà ít bão hòa hơn."
    ]
  },
  anomaly: {
    title: "RO4 anomaly insight",
    analysis: [
      "Biểu đồ trục kép (Số lượng & Tỷ lệ): Thiếu nhi đứng đầu về số lượng video viral, nhưng Âm nhạc mới là nhóm dẫn đầu về tỷ lệ viral.",
      "Boxplot (Dòng lượng viral): Âm nhạc có dòng lượng lan truyền cao nhất (kéo được view cho các video sau). Ngược lại, Thiếu nhi dù nhiều video viral nhưng phân bố boxplot lại thấp, cho thấy hiệu ứng thiếu ổn định."
    ],
    insight:
      "Viral nhiều và viral hiệu quả là hai cơ chế khác nhau (thắng nhỏ số lượng vs thắng nhỏ tỷ lệ). Giá trị thực sự của viral không nằm ở sự bùng nổ của 1 video, mà ở khả năng chuyển hóa thành dòng lượng tăng trưởng kéo dài cho cả kênh (momentum).",
    action: [
      "Creator Âm nhạc và Nhật ký đời sống nên tận dụng video viral để dẫn dắt người xem sang video khác trong kênh.",
      "Kênh Thiếu nhi nên tối đa hóa độ phủ thay vì kỳ vọng đa tăng trưởng bền vững từ viral.",
      "Các ngách khác xem viral là tín hiệu hiếm, không phụ thuộc làm chiến lược chính."
    ]
  },
  economy: {
    title: "RO5 economy insight",
    analysis: [
      "Scatter plot (Quy mô vs Tương tác): Không có tỷ lệ thuận giữa số subscriber và tỷ lệ tương tác. Nhiều kênh Thiếu nhi quy mô khổng lồ nhưng ở vùng tương tác rất thấp; trong khi nhiều kênh Trò chơi/Vlog tầm trung lại có tương tác cao (1,5% - 4%).",
      "Bubble chart (Ma trận chiến lược): Các kênh phân chia rõ: Góc \"Ít video/View cao\" (Âm nhạc, Vlog); Góc \"Nhiều video/View thấp\" (Tin tức, Giáo dục); và Góc hiếm \"Nhiều video/View cao\" (Thiếu nhi)."
    ],
    insight:
      "Độ lớn kênh (subscriber) không tự động phản ánh mức độ gắn kết chất của cộng đồng. Thành công đến từ việc lựa chọn mô hình tăng trưởng phù hợp với đặc thù nội dung chứ không có một con đường duy nhất.",
    action: [
      "Không dùng lượng subscriber làm chỉ báo duy nhất, cần kết hợp xem xét mức tương tác và lượt xem trung bình.",
      "Nhóm Âm nhạc/Vlog nên tập trung chiến lược ít nhưng chất lượng.",
      "Tin tức/Giáo dục nên duy trì tần suất xuất bản nhưng phải kiểm soát chất lượng.",
      "Thiếu nhi nên ưu tiên độ phủ và số lượng."
    ]
  }
};
