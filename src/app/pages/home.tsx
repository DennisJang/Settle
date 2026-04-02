import { motion } from 'motion/react';
import VisaWidget from '../components/widgets/VisaWidget';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] } },
};

/* ─── placeholder widgets (레퍼런스 확정 후 교체) ─── */

function ScanWidget({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-hidden"
      style={{
        background: '#fff',
        borderRadius: 28,
        padding: 20,
        boxShadow: '0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="absolute"
        style={{
          bottom: -12,
          right: -12,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #E8C0F0, #C0D0F8)',
          opacity: 0.2,
        }}
      />
      <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: '#A09088' }}>
        SCAN
      </p>
      <p className="m-0" style={{ fontSize: 16, fontWeight: 600, color: '#1A1A18', marginTop: 4 }}>
        Scan anything
      </p>
      <p className="m-0" style={{ fontSize: 12, color: '#A09890', marginTop: 4 }}>
        문서, 급여, 계약서
      </p>
    </motion.div>
  );
}

function FinanceWidget({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-hidden"
      style={{
        background: '#fff',
        borderRadius: 28,
        padding: 20,
        boxShadow: '0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="absolute"
        style={{
          bottom: -12,
          right: -12,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #B8E8C8, #C8D8F8)',
          opacity: 0.2,
        }}
      />
      <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: '#A09088' }}>
        금융
      </p>
      <p className="m-0" style={{ fontSize: 24, fontWeight: 600, color: '#1A1A18', marginTop: 4, letterSpacing: -0.5 }}>
        ₩2.4M
      </p>
      <p className="m-0" style={{ fontSize: 12, color: '#48A870', marginTop: 4 }}>
        받을 수 있는 돈
      </p>
    </motion.div>
  );
}

function HousingWidget({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-hidden"
      style={{
        background: '#fff',
        borderRadius: 28,
        padding: 20,
        boxShadow: '0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="absolute"
        style={{
          bottom: -12,
          right: -12,
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F8D0A0, #F0B8C0)',
          opacity: 0.2,
        }}
      />
      <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: '#A09088' }}>
        주거
      </p>
      <p className="m-0" style={{ fontSize: 16, fontWeight: 600, color: '#1A1A18', marginTop: 4 }}>
        전입신고
      </p>
      <p className="m-0" style={{ fontSize: 22, fontWeight: 600, color: '#D08030', marginTop: 2, letterSpacing: -0.5 }}>
        D-3
      </p>
    </motion.div>
  );
}

function LifeStyleWidget({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-hidden"
      style={{
        background: '#fff',
        borderRadius: 28,
        padding: 20,
        boxShadow: '0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="absolute"
        style={{
          bottom: -12,
          right: -12,
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F0B8C8, #C8B8F0)',
          opacity: 0.2,
        }}
      />
      <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: '#A09088' }}>
        LIFESTYLE
      </p>
      <p className="m-0" style={{ fontSize: 16, fontWeight: 600, color: '#1A1A18', marginTop: 4 }}>
        이번 주
      </p>
      <p className="m-0" style={{ fontSize: 12, color: '#8A8580', marginTop: 4 }}>
        안산 다문화축제 외 2건
      </p>
    </motion.div>
  );
}

function LabWidget({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer"
      style={{
        background: '#fff',
        borderRadius: 28,
        padding: '16px 20px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #D8C8F8, #C8E0F8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7868C0" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: '#A898C0' }}>
          LAB
        </p>
        <p className="m-0" style={{ fontSize: 15, fontWeight: 500, color: '#1A1A18', marginTop: 2 }}>
          어떤 기능이 필요하세요?
        </p>
      </div>
      <div
        style={{
          background: '#F4F2ED',
          borderRadius: 12,
          padding: '6px 12px',
        }}
      >
        <p className="m-0" style={{ fontSize: 11, fontWeight: 500, color: '#8A8580' }}>
          342표
        </p>
      </div>
    </motion.div>
  );
}

/* ─── main layout ─── */


export function Home() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#E8E6E1',
        padding: '20px 16px 32px',
      }}
    >
      {/* Header: greeting + profile */}
      <div className="flex justify-between items-center" style={{ marginBottom: 20, padding: '0 4px' }}>
        <div>
          <p className="m-0" style={{ fontSize: 14, color: '#8A8880', fontWeight: 400 }}>Good morning</p>
          <p className="m-0" style={{ fontSize: 22, fontWeight: 500, color: '#1A1A18', letterSpacing: -0.3, marginTop: 2 }}>
            Tran Minh
          </p>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Profile avatar placeholder */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F4C8A0, #A0B8F4)',
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* Widgets */}
      <motion.div variants={stagger} initial="hidden" animate="show">
        {/* Visa - full width */}
        <motion.div variants={fadeUp} style={{ marginBottom: 12 }}>
          <VisaWidget
            dDay={47}
            score={742}
            maxScore={900}
            docsReady={4}
            docsTotal={6}
            nextDoc="건강진단서"
            onClick={() => {/* navigate to visa detail */}}
          />
        </motion.div>

        {/* Scan + Finance - 2 col */}
        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
          <ScanWidget />
          <FinanceWidget />
        </div>

        {/* Housing + LifeStyle - 2 col */}
        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
          <HousingWidget />
          <LifeStyleWidget />
        </div>

        {/* Lab - full width */}
        <LabWidget />
      </motion.div>
    </div>
  );
}