/**
 * SubmissionGuide.tsx — Phase 3-B Sprint 3
 * 제출 가이드: 관서 선택 + 제출 경로 안내 + 하이코리아 가이드
 *
 * Plan C 방식: 관서를 유저가 직접 선택 (외국인등록증에 적혀 있음)
 * jurisdiction_keywords 기반 추천은 보너스.
 *
 * Sprint 1 변경 (Phase 4 Layer 2):
 * - logEvent import + 관서 선택 시 'guide_viewed' 이벤트 기록
 *
 * Dennis 규칙:
 * #26 비즈니스 로직 건드리지 않음
 * #32 컬러 하드코딩 금지 → 시맨틱 토큰
 * #34 i18n — defaultValue fallback
 * #39 "서류 준비 도구" 포지셔닝
 * #41 immigration_offices 공개 읽기
 */

import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin, Phone, Printer, ExternalLink, ChevronDown,
  Globe, Building2, CheckCircle2, Circle, Search, Navigation,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { logEvent } from "../../../lib/eventLog"; // ★ Sprint 1

// ─── Types ───

interface ImmigrationOffice {
  id: string;
  name_ko: string;
  name_en: string;
  fax_number: string | null;
  phone_number: string | null;
  address_ko: string | null;
  address_en: string | null;
  jurisdiction_keywords: string[] | null;
  is_active: boolean;
}

interface SubmissionChannel {
  method: "online" | "visit" | "fax";
  labelKey: string;
  descKey: string;
  icon: typeof Globe;
  available: boolean;
  url?: string;
}

interface SubmissionGuideProps {
  visaType: string | null;
  civilType: string;
  userAddress?: string | null;
  completeness: number;
  intentId?: string | null; // ★ Sprint 1: for event logging
}

// ─── Submission channel config per civil_type ───

const CHANNEL_CONFIG: Record<string, { online: boolean; visit: boolean; fax: boolean }> = {
  extension: { online: true, visit: true, fax: true },
  status_change: { online: false, visit: true, fax: true },
  info_change: { online: true, visit: true, fax: false },
  reentry: { online: true, visit: true, fax: false },
  workplace_change: { online: false, visit: true, fax: true },
  activities_permission: { online: false, visit: true, fax: false },
};

const HIKOREA_URL = "https://www.hikorea.go.kr";

// ─── Component ───

export function SubmissionGuide({
  visaType,
  civilType,
  userAddress,
  completeness,
  intentId,
}: SubmissionGuideProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const [offices, setOffices] = useState<ImmigrationOffice[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Checklist state
  const [checklist, setChecklist] = useState({
    documents: false,
    office: false,
    method: false,
  });

  // ─── Fetch offices ───
  useEffect(() => {
    async function fetchOffices() {
      setLoading(true);
      const { data } = await supabase
        .from("immigration_offices")
        .select("id, name_ko, name_en, fax_number, phone_number, address_ko, address_en, jurisdiction_keywords, is_active")
        .eq("is_active", true)
        .order("name_ko");
      if (data) setOffices(data as ImmigrationOffice[]);
      setLoading(false);
    }
    fetchOffices();
  }, []);

  // ─── Auto-suggest based on address ───
  const suggestedOffice = useMemo(() => {
    if (!userAddress || !offices.length) return null;
    const addr = userAddress.toLowerCase();
    for (const office of offices) {
      if (!office.jurisdiction_keywords) continue;
      for (const kw of office.jurisdiction_keywords) {
        if (addr.includes(kw.toLowerCase()) || addr.includes(kw.replace(/시$|구$|군$|도$/, "").toLowerCase())) {
          return office;
        }
      }
    }
    return null;
  }, [userAddress, offices]);

  // Auto-select suggested office
  useEffect(() => {
    if (suggestedOffice && !selectedOfficeId) {
      setSelectedOfficeId(suggestedOffice.id);
      setChecklist((prev) => ({ ...prev, office: true }));
    }
  }, [suggestedOffice, selectedOfficeId]);

  const selectedOffice = offices.find((o) => o.id === selectedOfficeId) ?? null;

  // ─── Filtered offices for dropdown ───
  const filteredOffices = useMemo(() => {
    if (!searchQuery.trim()) return offices;
    const q = searchQuery.toLowerCase();
    return offices.filter(
      (o) =>
        o.name_ko.toLowerCase().includes(q) ||
        o.name_en.toLowerCase().includes(q) ||
        o.address_ko?.toLowerCase().includes(q) ||
        o.jurisdiction_keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [offices, searchQuery]);

  // ─── Submission channels ───
  const channels: SubmissionChannel[] = useMemo(() => {
    const config = CHANNEL_CONFIG[civilType] ?? CHANNEL_CONFIG.extension;
    return [
      {
        method: "online" as const,
        labelKey: "visa:submit_guide.channel_online",
        descKey: "visa:submit_guide.channel_online_desc",
        icon: Globe,
        available: config.online,
        url: HIKOREA_URL,
      },
      {
        method: "visit" as const,
        labelKey: "visa:submit_guide.channel_visit",
        descKey: "visa:submit_guide.channel_visit_desc",
        icon: Building2,
        available: config.visit,
      },
      {
        method: "fax" as const,
        labelKey: "visa:submit_guide.channel_fax",
        descKey: "visa:submit_guide.channel_fax_desc",
        icon: Printer,
        available: config.fax,
      },
    ];
  }, [civilType]);

  // ─── Checklist completion ───
  const checklistComplete =
    checklist.documents && checklist.office && checklist.method;

  // Auto-check documents when completeness >= 60
  useEffect(() => {
    setChecklist((prev) => ({ ...prev, documents: completeness >= 60 }));
  }, [completeness]);

  // ★ Sprint 1: Layer 2 Event Log — guide_viewed on office select
  const handleOfficeSelect = (officeId: string) => {
    setSelectedOfficeId(officeId);
    setDropdownOpen(false);
    setSearchQuery("");
    setChecklist((prev) => ({ ...prev, office: true }));

    // ★ Sprint 1: Log guide_viewed event
    logEvent(intentId ?? null, "guide_viewed", {
      office_id: officeId,
    });
  };

  const officeName = (office: ImmigrationOffice) =>
    lang === "ko" ? office.name_ko : office.name_en;

  const officeAddress = (office: ImmigrationOffice) =>
    lang === "ko"
      ? office.address_ko ?? office.address_en ?? ""
      : office.address_en ?? office.address_ko ?? "";

  if (!visaType) return null;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface-primary)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Navigation
            size={20}
            style={{ color: "var(--color-action-primary)" }}
          />
          <h3
            className="text-[17px] leading-[22px]"
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {t("visa:submit_guide.title", {
              defaultValue: "Submission guide",
            })}
          </h3>
        </div>
        <p
          className="text-[13px] leading-[18px]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t("visa:submit_guide.subtitle", {
            defaultValue: "Where and how to submit your documents",
          })}
        </p>
      </div>

      {/* ─── Office Selector ─── */}
      <div className="px-4 pb-3">
        <label
          className="text-[13px] leading-[18px] mb-1.5 block"
          style={{
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}
        >
          {t("visa:submit_guide.select_office", {
            defaultValue: "Immigration office",
          })}
        </label>

        {/* Dropdown trigger */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-3 rounded-2xl transition-all"
          style={{
            backgroundColor: "var(--color-surface-secondary)",
            border: dropdownOpen
              ? "2px solid var(--color-action-primary)"
              : "2px solid transparent",
          }}
        >
          <span
            className="text-[15px] leading-[20px] truncate"
            style={{
              color: selectedOffice
                ? "var(--color-text-primary)"
                : "var(--color-text-tertiary)",
              fontWeight: selectedOffice ? 500 : 400,
            }}
          >
            {selectedOffice
              ? officeName(selectedOffice)
              : t("visa:submit_guide.select_placeholder", {
                  defaultValue: "Select your immigration office",
                })}
          </span>
          <ChevronDown
            size={16}
            style={{
              color: "var(--color-text-tertiary)",
              transform: dropdownOpen ? "rotate(180deg)" : "none",
              transition: "transform 200ms",
            }}
          />
        </button>

        {/* Suggestion badge */}
        {suggestedOffice &&
          selectedOfficeId === suggestedOffice.id && (
            <div
              className="mt-1.5 flex items-center gap-1"
            >
              <MapPin
                size={12}
                style={{ color: "var(--color-action-primary)" }}
              />
              <span
                className="text-[12px] leading-[16px]"
                style={{
                  color: "var(--color-action-primary)",
                  fontWeight: 500,
                }}
              >
                {t("visa:submit_guide.auto_suggested", {
                  defaultValue: "Auto-suggested based on your address",
                })}
              </span>
            </div>
          )}

        {/* Dropdown list */}
        {dropdownOpen && (
          <div
            className="mt-2 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface-primary)",
              border: "1px solid var(--color-border-default)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{
                borderBottom: "1px solid var(--color-border-default)",
              }}
            >
              <Search
                size={16}
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("visa:submit_guide.search_placeholder", {
                  defaultValue: "Search by name or region...",
                })}
                className="flex-1 text-[14px] leading-[20px] bg-transparent outline-none"
                style={{
                  color: "var(--color-text-primary)",
                }}
                autoFocus
              />
            </div>

            {/* Office list */}
            <div
              className="max-h-[240px] overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {loading ? (
                <div
                  className="py-4 text-center text-[13px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Loading...
                </div>
              ) : filteredOffices.length === 0 ? (
                <div
                  className="py-4 text-center text-[13px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {t("visa:submit_guide.no_results", {
                    defaultValue: "No offices found",
                  })}
                </div>
              ) : (
                filteredOffices.map((office) => {
                  const isSelected = office.id === selectedOfficeId;
                  const isSuggested =
                    suggestedOffice?.id === office.id;
                  return (
                    <button
                      key={office.id}
                      onClick={() => handleOfficeSelect(office.id)}
                      className="w-full text-left px-3 py-2.5 transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(0,122,255,0.08)"
                          : "transparent",
                        borderBottom:
                          "1px solid var(--color-border-default)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[14px] leading-[20px] truncate"
                            style={{
                              fontWeight: isSelected ? 600 : 400,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {officeName(office)}
                            {isSuggested && (
                              <span
                                className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    "rgba(0,122,255,0.1)",
                                  color:
                                    "var(--color-action-primary)",
                                  fontWeight: 500,
                                }}
                              >
                                {t(
                                  "visa:submit_guide.recommended",
                                  { defaultValue: "Recommended" }
                                )}
                              </span>
                            )}
                          </p>
                          {office.jurisdiction_keywords && (
                            <p
                              className="text-[12px] leading-[16px] truncate"
                              style={{
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {office.jurisdiction_keywords
                                .slice(0, 3)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            size={16}
                            style={{
                              color: "var(--color-action-primary)",
                            }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Selected Office Card ─── */}
      {selectedOffice && !dropdownOpen && (
        <div className="px-4 pb-3">
          <div
            className="rounded-2xl p-3"
            style={{
              backgroundColor: "var(--color-surface-secondary)",
            }}
          >
            <p
              className="text-[15px] leading-[20px] mb-2"
              style={{
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              {officeName(selectedOffice)}
            </p>

            <div className="space-y-1.5">
              {officeAddress(selectedOffice) && (
                <div className="flex items-start gap-2">
                  <MapPin
                    size={14}
                    style={{ color: "var(--color-text-secondary)", marginTop: 2 }}
                  />
                  <p
                    className="text-[13px] leading-[18px]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {officeAddress(selectedOffice)}
                  </p>
                </div>
              )}

              {selectedOffice.phone_number && (
                <a
                  href={`tel:${selectedOffice.phone_number}`}
                  className="flex items-center gap-2"
                >
                  <Phone
                    size={14}
                    style={{ color: "var(--color-action-primary)" }}
                  />
                  <span
                    className="text-[13px] leading-[18px]"
                    style={{
                      color: "var(--color-action-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {selectedOffice.phone_number}
                  </span>
                </a>
              )}

              {selectedOffice.fax_number && (
                <div className="flex items-center gap-2">
                  <Printer
                    size={14}
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                  <span
                    className="text-[13px] leading-[18px]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    FAX {selectedOffice.fax_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Submission Channels ─── */}
      <div className="px-4 pb-3">
        <p
          className="text-[13px] leading-[18px] mb-2"
          style={{
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}
        >
          {t("visa:submit_guide.how_to_submit", {
            defaultValue: "How to submit",
          })}
        </p>

        <div className="space-y-2">
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.method}
                className="flex items-start gap-3 rounded-2xl p-3"
                style={{
                  backgroundColor: ch.available
                    ? "var(--color-surface-secondary)"
                    : "transparent",
                  opacity: ch.available ? 1 : 0.4,
                }}
              >
                <Icon
                  size={18}
                  style={{
                    color: ch.available
                      ? "var(--color-action-primary)"
                      : "var(--color-text-tertiary)",
                    marginTop: 1,
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-[14px] leading-[20px]"
                      style={{
                        fontWeight: 500,
                        color: ch.available
                          ? "var(--color-text-primary)"
                          : "var(--color-text-tertiary)",
                      }}
                    >
                      {t(ch.labelKey, {
                        defaultValue:
                          ch.method === "online"
                            ? "Online (HiKorea)"
                            : ch.method === "visit"
                            ? "Visit in person"
                            : "Fax (supplementary)",
                      })}
                    </p>
                    {!ch.available && (
                      <span
                        className="text-[11px] px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--color-surface-secondary)",
                          color: "var(--color-text-tertiary)",
                          fontWeight: 500,
                        }}
                      >
                        {t("visa:submit_guide.not_available", {
                          defaultValue: "Not available",
                        })}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[12px] leading-[16px] mt-0.5"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {t(ch.descKey, {
                      defaultValue:
                        ch.method === "online"
                          ? "Submit through HiKorea e-Government portal"
                          : ch.method === "visit"
                          ? "Visit your immigration office with documents"
                          : "Fax supplementary documents to your office",
                    })}
                  </p>
                  {ch.available && ch.url && (
                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-[13px]"
                      style={{
                        color: "var(--color-action-primary)",
                        fontWeight: 500,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("visa:submit_guide.open_hikorea", {
                        defaultValue: "Open HiKorea",
                      })}
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Readiness Checklist ─── */}
      <div className="px-4 pb-4">
        <p
          className="text-[13px] leading-[18px] mb-2"
          style={{
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}
        >
          {t("visa:submit_guide.readiness", {
            defaultValue: "Submission readiness",
          })}
        </p>

        <div className="space-y-2">
          {[
            {
              key: "documents" as const,
              label: t("visa:submit_guide.check_docs", {
                defaultValue: "Documents prepared",
              }),
              sublabel:
                completeness >= 60
                  ? `${completeness}% ${t("visa:submit_guide.complete", { defaultValue: "complete" })}`
                  : t("visa:submit_guide.docs_incomplete", {
                      defaultValue: "Prepare documents above first",
                    }),
              auto: true,
            },
            {
              key: "office" as const,
              label: t("visa:submit_guide.check_office", {
                defaultValue: "Office selected",
              }),
              sublabel: selectedOffice
                ? officeName(selectedOffice)
                : t("visa:submit_guide.select_above", {
                    defaultValue: "Select your office above",
                  }),
              auto: true,
            },
            {
              key: "method" as const,
              label: t("visa:submit_guide.check_method", {
                defaultValue: "Submission method confirmed",
              }),
              sublabel: t("visa:submit_guide.check_method_desc", {
                defaultValue: "Tap to confirm you've chosen how to submit",
              }),
              auto: false,
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                if (!item.auto) {
                  setChecklist((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key],
                  }));
                }
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                backgroundColor: checklist[item.key]
                  ? "rgba(52,199,89,0.06)"
                  : "var(--color-surface-secondary)",
              }}
            >
              {checklist[item.key] ? (
                <CheckCircle2
                  size={18}
                  style={{ color: "var(--color-action-success)" }}
                />
              ) : (
                <Circle
                  size={18}
                  style={{ color: "var(--color-text-tertiary)" }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] leading-[20px]"
                  style={{
                    fontWeight: 500,
                    color: checklist[item.key]
                      ? "var(--color-action-success)"
                      : "var(--color-text-primary)",
                  }}
                >
                  {item.label}
                </p>
                <p
                  className="text-[12px] leading-[16px] truncate"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {item.sublabel}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Ready banner */}
        {checklistComplete && (
          <div
            className="mt-3 p-3 rounded-2xl flex items-center gap-2"
            style={{ backgroundColor: "rgba(52,199,89,0.1)" }}
          >
            <CheckCircle2
              size={18}
              style={{ color: "var(--color-action-success)" }}
            />
            <p
              className="text-[14px] leading-[20px]"
              style={{
                fontWeight: 600,
                color: "var(--color-action-success)",
              }}
            >
              {t("visa:submit_guide.ready", {
                defaultValue: "Ready to submit!",
              })}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p
          className="text-[11px] leading-[13px] mt-3 text-center"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {t("visa:submit_guide.disclaimer", {
            defaultValue:
              "This guide is for reference only. Verify submission requirements with your immigration office.",
          })}
        </p>
      </div>
    </div>
  );
}