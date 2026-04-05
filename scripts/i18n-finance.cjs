// scripts/i18n-finance.cjs
// Finance 위젯 i18n 데이터 + tab 네이밍 업데이트
// 실행: node scripts/i18n-finance.cjs

const financeData = {
  en: {
    finance: {
      title: "Finance",
      tab_dashboard: "Salary",
      tab_refund: "Refund",
      tab_remittance: "Remit",
      tab_insurance: "Insurance",
      // Dashboard
      net_pay_label: "Net Pay",
      gross_label: "Gross",
      deductions_label: "Deductions",
      hourly_label: "Hourly",
      deductions_title: "Deduction Details",
      reference_rate: "Reference rate",
      cumulative: "Cumulative",
      refundable_departure: "Refundable upon departure",
      minimum_wage_label: "Minimum Wage",
      anomaly_net_change: "Net pay changed {{pct}}% from last month",
      no_payslip_title: "No payslip data yet",
      no_payslip_desc: "Scan your payslip to see your salary breakdown",
      scan_payslip: "Scan Payslip",
      // Context notes
      context_student_exempt: "Students (D-2) are exempt from national pension",
      context_departure_refund: "Refundable as lump sum upon departure from Korea",
      context_mutual_check: "Mutual agreement applies — check by nationality",
      context_student_reduction: "Student (D-2) health insurance reduction applies",
      context_employer_shared: "Shared equally with employer",
      context_not_applicable: "Not applicable for this visa type",
      // Refund
      total_refundable: "Total Refundable (est.)",
      refund_note: "Pension + Severance + Tax Savings",
      pension_title: "National Pension Refund",
      severance_title: "Severance Estimate",
      tax_saving_title: "19% Flat Tax Saving",
      eligibility: "Eligibility",
      months_contributed: "Months contributed",
      monthly_contribution: "Monthly contribution",
      months_worked: "Months worked",
      progressive: "Progressive",
      recommended: "Recommended",
      not_eligible: "Not eligible",
      requires_12_months: "Requires 12+ months of employment",
      // Insurance
      insurance_coming: "Insurance status coming soon",
      insurance_desc: "Scan your health insurance notice to track your payment status",
      scan_insurance: "Scan Insurance Notice",
      // Disclaimer
      disclaimer: "This information is for reference only and has no legal effect. Contact the relevant authority for exact amounts.",
    },
    nav: {
      tab_finance: "Finance",
    },
  },
  ko: {
    finance: {
      title: "금융",
      tab_dashboard: "급여",
      tab_refund: "받을 돈",
      tab_remittance: "송금",
      tab_insurance: "보험",
      net_pay_label: "실수령액",
      gross_label: "총 지급",
      deductions_label: "공제",
      hourly_label: "시급",
      deductions_title: "공제 상세",
      reference_rate: "기준 비율",
      cumulative: "누적",
      refundable_departure: "출국 시 환급 가능",
      minimum_wage_label: "최저임금",
      anomaly_net_change: "실수령액이 전월 대비 {{pct}}% 변동",
      no_payslip_title: "급여명세서 데이터 없음",
      no_payslip_desc: "급여명세서를 스캔하면 급여 내역을 확인할 수 있어요",
      scan_payslip: "급여명세서 스캔",
      context_student_exempt: "유학생(D-2)은 국민연금 가입 제외",
      context_departure_refund: "출국 시 반환일시금으로 수령 가능",
      context_mutual_check: "상호주의 적용 — 국적별 확인 필요",
      context_student_reduction: "유학생(D-2) 건강보험 경감률 적용",
      context_employer_shared: "사업주와 반반 부담",
      context_not_applicable: "이 비자 유형에는 해당 없음",
      total_refundable: "받을 수 있는 돈 (추정)",
      refund_note: "연금 + 퇴직금 + 절세",
      pension_title: "국민연금 환급",
      severance_title: "퇴직금 추정",
      tax_saving_title: "19% 단일세율 절세",
      eligibility: "자격",
      months_contributed: "납부 개월수",
      monthly_contribution: "월 납부액",
      months_worked: "근속 개월수",
      progressive: "누진세",
      recommended: "추천",
      not_eligible: "자격 없음",
      requires_12_months: "12개월 이상 근속 필요",
      insurance_coming: "보험 상태 확인 준비 중",
      insurance_desc: "건강보험 고지서를 스캔하면 납부 상태를 추적할 수 있어요",
      scan_insurance: "건보 고지서 스캔",
      disclaimer: "이 정보는 참고용이며 법적 효력이 없습니다. 정확한 금액은 관할 기관에 문의하세요.",
    },
    nav: {
      tab_finance: "금융",
    },
  },
  vi: {
    finance: {
      title: "Tài chính",
      tab_dashboard: "Lương",
      tab_refund: "Hoàn tiền",
      tab_remittance: "Chuyển tiền",
      tab_insurance: "Bảo hiểm",
      net_pay_label: "Lương thực nhận",
      gross_label: "Tổng lương",
      deductions_label: "Khấu trừ",
      hourly_label: "Theo giờ",
      deductions_title: "Chi tiết khấu trừ",
      reference_rate: "Tỷ lệ tham khảo",
      cumulative: "Tích lũy",
      refundable_departure: "Có thể hoàn lại khi xuất cảnh",
      minimum_wage_label: "Lương tối thiểu",
      anomaly_net_change: "Lương thực nhận thay đổi {{pct}}% so với tháng trước",
      no_payslip_title: "Chưa có dữ liệu phiếu lương",
      no_payslip_desc: "Quét phiếu lương để xem chi tiết lương",
      scan_payslip: "Quét phiếu lương",
      context_student_exempt: "Sinh viên (D-2) được miễn đóng lương hưu",
      context_departure_refund: "Có thể nhận lại khi rời Hàn Quốc",
      context_mutual_check: "Áp dụng thỏa thuận song phương — kiểm tra theo quốc tịch",
      context_student_reduction: "Giảm bảo hiểm y tế cho sinh viên (D-2)",
      context_employer_shared: "Chia đều với chủ sử dụng lao động",
      context_not_applicable: "Không áp dụng cho loại visa này",
      total_refundable: "Tổng có thể hoàn lại (ước tính)",
      refund_note: "Lương hưu + Trợ cấp thôi việc + Tiết kiệm thuế",
      pension_title: "Hoàn lương hưu quốc gia",
      severance_title: "Ước tính trợ cấp thôi việc",
      tax_saving_title: "Tiết kiệm thuế 19%",
      eligibility: "Điều kiện",
      months_contributed: "Số tháng đã đóng",
      monthly_contribution: "Đóng hàng tháng",
      months_worked: "Số tháng làm việc",
      progressive: "Lũy tiến",
      recommended: "Khuyến nghị",
      not_eligible: "Không đủ điều kiện",
      requires_12_months: "Cần 12 tháng trở lên",
      insurance_coming: "Trạng thái bảo hiểm sắp ra mắt",
      insurance_desc: "Quét giấy báo bảo hiểm y tế để theo dõi trạng thái thanh toán",
      scan_insurance: "Quét giấy báo bảo hiểm",
      disclaimer: "Thông tin này chỉ mang tính tham khảo và không có hiệu lực pháp lý.",
    },
    nav: {
      tab_finance: "Tài chính",
    },
  },
  zh: {
    finance: {
      title: "财务",
      tab_dashboard: "工资",
      tab_refund: "退款",
      tab_remittance: "汇款",
      tab_insurance: "保险",
      net_pay_label: "实收工资",
      gross_label: "总工资",
      deductions_label: "扣除",
      hourly_label: "时薪",
      deductions_title: "扣除详情",
      reference_rate: "参考比例",
      cumulative: "累计",
      refundable_departure: "出境时可退还",
      minimum_wage_label: "最低工资",
      anomaly_net_change: "实收工资较上月变动{{pct}}%",
      no_payslip_title: "暂无工资单数据",
      no_payslip_desc: "扫描工资单即可查看工资明细",
      scan_payslip: "扫描工资单",
      context_student_exempt: "留学生(D-2)免缴国民年金",
      context_departure_refund: "出境时可一次性领取退款",
      context_mutual_check: "适用互惠协议——按国籍确认",
      context_student_reduction: "留学生(D-2)健康保险减免",
      context_employer_shared: "与雇主各承担一半",
      context_not_applicable: "此签证类型不适用",
      total_refundable: "可退还总额（估算）",
      refund_note: "年金 + 退职金 + 节税",
      pension_title: "国民年金退款",
      severance_title: "退职金估算",
      tax_saving_title: "19%单一税率节税",
      eligibility: "资格",
      months_contributed: "缴纳月数",
      monthly_contribution: "月缴金额",
      months_worked: "工作月数",
      progressive: "累进税",
      recommended: "推荐",
      not_eligible: "不符合条件",
      requires_12_months: "需工作12个月以上",
      insurance_coming: "保险状态即将上线",
      insurance_desc: "扫描健康保险通知单以跟踪缴费状态",
      scan_insurance: "扫描保险通知单",
      disclaimer: "此信息仅供参考，不具有法律效力。请联系相关机构确认准确金额。",
    },
    nav: {
      tab_finance: "财务",
    },
  },
};

// Tab rename: tab_life → tab_finance
const tabRename = {
  en: { nav: { tab_life: undefined } },
  ko: { nav: { tab_life: undefined } },
  vi: { nav: { tab_life: undefined } },
  zh: { nav: { tab_life: undefined } },
};

const fs = require('fs');
const path = require('path');

const localeDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

for (const lang of ['en', 'ko', 'vi', 'zh']) {
  const filePath = path.join(localeDir, `${lang}.json`);
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Add finance namespace
  existing.finance = financeData[lang].finance;

  // Update tab name: tab_life → tab_finance
  if (existing.nav) {
    existing.nav.tab_finance = financeData[lang].nav.tab_finance;
    // Keep tab_life for backward compat (don't delete)
  }

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  console.log(`✅ ${lang}.json updated with finance namespace`);
}

console.log('\nDone! Run: pnpm build to verify.');
