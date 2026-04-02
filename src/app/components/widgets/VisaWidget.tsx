import { motion } from 'motion/react';

interface VisaWidgetProps {
  dDay: number;
  score: number;
  maxScore: number;
  docsReady: number;
  docsTotal: number;
  nextDoc: string;
  onClick?: () => void;
}

export default function VisaWidget({
  dDay = 47,
  score = 742,
  maxScore = 900,
  docsReady = 4,
  docsTotal = 6,
  nextDoc = '건강진단서',
  onClick,
}: VisaWidgetProps) {
  const progress = docsTotal > 0 ? (docsReady / docsTotal) * 100 : 0;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer"
      style={{
        background: '#fff',
        borderRadius: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.03)',
      }}
    >
      {/* Top section */}
      <div className="relative" style={{ padding: '22px 22px 0' }}>
        {/* Layer 3D object */}
        <img
          src="/layer-object.png"
          alt=""
          className="absolute"
          style={{
            top: 6,
            right: 6,
            width: 110,
            height: 110,
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />

        <p
          className="m-0"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.8px',
            color: '#A09088',
          }}
        >
          VISA
        </p>

        <p
          className="m-0"
          style={{
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: -2,
            color: '#1A1A18',
          }}
        >
          D-{dDay}
        </p>

        {/* Score pill */}
        <div
          className="inline-flex items-center gap-1"
          style={{
            background: '#F0EDE8',
            borderRadius: 10,
            padding: '5px 14px',
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: '#2A2A28' }}>
            {score}
          </span>
          <span style={{ fontSize: 11, color: '#A09890' }}>/ {maxScore}</span>
        </div>
      </div>

      {/* Document status card with shadow card behind */}
      <div className="relative" style={{ padding: '18px 12px 12px' }}>
        {/* Shadow card (stacked notification effect) */}
        <div
          className="absolute"
          style={{
            top: 24,
            left: 18,
            right: 18,
            bottom: 6,
            background: '#E8E5DF',
            borderRadius: 22,
          }}
        />

        {/* Main card */}
        <div
          className="relative"
          style={{
            background: '#FAFAF8',
            borderRadius: 22,
            padding: '16px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '0.5px solid rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
            <p className="m-0" style={{ fontSize: 14, fontWeight: 600, color: '#1A1A18' }}>
              서류 준비
            </p>
            <p className="m-0" style={{ fontSize: 15, fontWeight: 700, color: '#1A1A18' }}>
              {docsReady}
              <span style={{ color: '#A09890', fontWeight: 400 }}>/{docsTotal}</span>
            </p>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 5,
              background: '#ECEAE4',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #C084FC, #818CF8, #60A5FA)',
                borderRadius: 3,
              }}
            />
          </div>

          <p className="m-0" style={{ fontSize: 12, color: '#8A8580', marginTop: 8 }}>
            다음: <span style={{ fontWeight: 600, color: '#1A1A18' }}>{nextDoc}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}