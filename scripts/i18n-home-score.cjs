// merge-i18n-home-score.cjs
// 실행: node merge-i18n-home-score.cjs
// home + score 네임스페이스 키를 4개 locale 파일에 병합

const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "src", "i18n", "locales");

const newKeys = {
  ko: {
    "home:greeting_morning": "좋은 아침이에요",
    "home:greeting_afternoon": "좋은 오후예요",
    "home:greeting_evening": "좋은 저녁이에요",
    "home:user_default": "사용자",
    "home:upcoming_deadlines": "다가오는 마감일",
    "home:card_scan": "Scan",
    "home:card_scan_sub": "서류를 찍으면 해석해 줘요",
    "home:card_documents": "서류 정리",
    "home:card_documents_sub": "비자 서류 체크리스트",
    "home:card_finance": "금융 & 정보",
    "home:card_finance_sub": "급여·환급·송금",
    "home:card_first30": "첫 30일",
    "home:card_first30_sub": "한국 정착 가이드",
    "home:card_lab": "Lab",
    "home:card_lab_sub": "다음에 만들 기능 투표",
    "score:calculating": "점수 계산 중...",
    "score:vs_last": "지난 대비",
    "score:no_data": "아직 점수가 없어요",
    "score:disclaimer": "이 점수는 참고용 자가 진단이며, 공식 신용평가가 아닙니다.",
    "score:grade_excellent": "매우 안정",
    "score:grade_stable": "안정",
    "score:grade_moderate": "보통",
    "score:grade_caution": "주의",
    "score:grade_risk": "위험",
  },
  en: {
    "home:greeting_morning": "Good morning",
    "home:greeting_afternoon": "Good afternoon",
    "home:greeting_evening": "Good evening",
    "home:user_default": "User",
    "home:upcoming_deadlines": "Upcoming deadlines",
    "home:card_scan": "Scan",
    "home:card_scan_sub": "Snap a document, get it explained",
    "home:card_documents": "Documents",
    "home:card_documents_sub": "Visa document checklist",
    "home:card_finance": "Finance & Info",
    "home:card_finance_sub": "Payslip · Refund · Remittance",
    "home:card_first30": "First 30 Days",
    "home:card_first30_sub": "Korea settlement guide",
    "home:card_lab": "Lab",
    "home:card_lab_sub": "Vote on what we build next",
    "score:calculating": "Calculating score...",
    "score:vs_last": "vs last",
    "score:no_data": "No score yet",
    "score:disclaimer": "This score is a self-assessment reference, not an official credit evaluation.",
    "score:grade_excellent": "Very stable",
    "score:grade_stable": "Stable",
    "score:grade_moderate": "Moderate",
    "score:grade_caution": "Caution",
    "score:grade_risk": "At risk",
  },
  vi: {
    "home:greeting_morning": "Chào buổi sáng",
    "home:greeting_afternoon": "Chào buổi chiều",
    "home:greeting_evening": "Chào buổi tối",
    "home:user_default": "Người dùng",
    "home:upcoming_deadlines": "Hạn sắp đến",
    "home:card_scan": "Quét",
    "home:card_scan_sub": "Chụp tài liệu, nhận giải thích",
    "home:card_documents": "Hồ sơ",
    "home:card_documents_sub": "Danh sách giấy tờ visa",
    "home:card_finance": "Tài chính",
    "home:card_finance_sub": "Lương · Hoàn thuế · Chuyển tiền",
    "home:card_first30": "30 ngày đầu",
    "home:card_first30_sub": "Hướng dẫn định cư Hàn Quốc",
    "home:card_lab": "Lab",
    "home:card_lab_sub": "Bình chọn tính năng tiếp theo",
    "score:calculating": "Đang tính điểm...",
    "score:vs_last": "so với lần trước",
    "score:no_data": "Chưa có điểm",
    "score:disclaimer": "Điểm này chỉ mang tính tham khảo, không phải đánh giá tín dụng chính thức.",
    "score:grade_excellent": "Rất ổn định",
    "score:grade_stable": "Ổn định",
    "score:grade_moderate": "Bình thường",
    "score:grade_caution": "Cần chú ý",
    "score:grade_risk": "Nguy hiểm",
  },
  zh: {
    "home:greeting_morning": "早上好",
    "home:greeting_afternoon": "下午好",
    "home:greeting_evening": "晚上好",
    "home:user_default": "用户",
    "home:upcoming_deadlines": "即将到期",
    "home:card_scan": "扫描",
    "home:card_scan_sub": "拍摄文件，获取解释",
    "home:card_documents": "文件整理",
    "home:card_documents_sub": "签证文件清单",
    "home:card_finance": "金融信息",
    "home:card_finance_sub": "工资·退款·汇款",
    "home:card_first30": "前30天",
    "home:card_first30_sub": "韩国定居指南",
    "home:card_lab": "实验室",
    "home:card_lab_sub": "投票决定下一个功能",
    "score:calculating": "正在计算分数...",
    "score:vs_last": "与上次相比",
    "score:no_data": "暂无分数",
    "score:disclaimer": "此分数仅供自我评估参考，不是官方信用评估。",
    "score:grade_excellent": "非常稳定",
    "score:grade_stable": "稳定",
    "score:grade_moderate": "一般",
    "score:grade_caution": "注意",
    "score:grade_risk": "危险",
  },
};

let totalAdded = 0;
let totalSkipped = 0;

for (const [lang, keys] of Object.entries(newKeys)) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`✗ ${filePath} not found`);
    continue;
  }

  const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let added = 0;
  let skipped = 0;

  for (const [key, value] of Object.entries(keys)) {
    if (key in existing) {
      skipped++;
    } else {
      existing[key] = value;
      added++;
    }
  }

  // 키 정렬 후 저장
  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => a.localeCompare(b))
  );
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + "\n", "utf-8");

  console.log(`✓ ${lang}.json — added: ${added}, skipped (existing): ${skipped}`);
  totalAdded += added;
  totalSkipped += skipped;
}

console.log(`\nDone. Total added: ${totalAdded}, skipped: ${totalSkipped}`);
