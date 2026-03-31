import { motion, useAnimation } from "motion/react";
import { useEffect } from "react";
import { Logo } from "./logo";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const float = (delay: number, duration = 3.5) => ({
  y: [0, -6, 0, 6, 0],
  transition: { duration, repeat: Infinity, ease: "easeInOut" as const, delay },
});

/* ═══ STEP 1 ═══ */
export function Step1Illustration() {
  return (
    <div className="relative size-full flex items-center justify-center" style={{ gap: 24 }}>
      <div className="absolute" style={{ width: 200, height: 200, background: "radial-gradient(circle, rgba(99,91,255,0.08) 0%, transparent 70%)", filter: "blur(30px)" }} />
      <motion.div animate={float(0, 4)} style={{ position: "relative", zIndex: 1 }}><Logo size="medium" /></motion.div>
      <motion.div animate={float(0.5, 3.5)} className="relative" style={{ zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: "linear-gradient(135deg, rgba(99,91,255,0.45), rgba(59,130,246,0.4))", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 6px 16px rgba(99,102,241,0.2)" }} />
          <div style={{ width: 60, height: 44, borderRadius: "14px 14px 18px 18px", background: "linear-gradient(135deg, rgba(99,91,255,0.4), rgba(59,130,246,0.35))", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)", marginTop: -6, boxShadow: "0 10px 24px rgba(99,102,241,0.18)" }} />
        </div>
        <motion.div animate={float(1, 3)} style={{ position: "absolute", right: -36, top: 6, width: 44, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)", transform: "rotateY(-10deg) rotateX(5deg)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 6px 14px rgba(99,102,241,0.22)" }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>E-9</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ═══ STEP 2 ═══ */
export function Step2Illustration() {
  return (
    <div className="relative size-full flex items-center justify-center overflow-hidden">
      <motion.div animate={float(0, 5)} style={{ width: 240, height: 240 }}>
        <DotLottieReact src="https://lottie.host/c532eac6-df24-47d7-8f7f-95569ac16ec2/hQfbrG0Rk2.lottie" loop autoplay style={{ width: 240, height: 240 }} />
      </motion.div>
    </div>
  );
}

/* ═══ STEP 3 ═══ */
export function Step3Illustration() {
  return (
    <div className="relative size-full flex items-center justify-center" style={{ gap: 24 }}>
      <style>{`
        @keyframes sandDrop { 0%{transform:translateY(0);opacity:0.8;} 100%{transform:translateY(20px);opacity:0;} }
        @keyframes notifSlide { 0%,8%{opacity:0;transform:translateY(-8px);} 15%,75%{opacity:1;transform:translateY(0);} 85%,100%{opacity:0;transform:translateY(4px);} }
      `}</style>
      <motion.div animate={float(0, 4)}>
        <div style={{ position:"relative", width:48, height:68 }}>
          <div style={{ width:48,height:10,borderRadius:"50%",background:"linear-gradient(135deg,#8b5cf6,#6366f1)",boxShadow:"0 2px 8px rgba(99,102,241,0.2),inset 0 -1px 2px rgba(0,0,0,0.1),inset 0 2px 2px rgba(255,255,255,0.3)" }}/>
          <div style={{ width:40,height:22,margin:"0 auto",background:"linear-gradient(180deg,rgba(139,92,246,0.12) 0%,rgba(99,91,255,0.06) 100%)",borderRadius:"2px 2px 50% 50%/2px 2px 100% 100%",border:"1px solid rgba(139,92,246,0.1)",position:"relative",overflow:"hidden" }}>
            {[0,1,2].map(i=>(<div key={i} style={{ position:"absolute",left:18+(i-1)*3,bottom:0,width:3,height:3,borderRadius:"50%",background:"#F59E0B",animation:`sandDrop 1.8s ease-in ${i*0.5}s infinite` }}/>))}
          </div>
          <div style={{ width:6,height:4,margin:"0 auto",background:"rgba(139,92,246,0.15)",borderRadius:1 }}/>
          <div style={{ width:40,height:22,margin:"0 auto",background:"linear-gradient(0deg,rgba(245,158,11,0.15) 0%,rgba(99,91,255,0.04) 100%)",borderRadius:"50% 50% 2px 2px/100% 100% 2px 2px",border:"1px solid rgba(139,92,246,0.1)" }}/>
          <div style={{ width:48,height:10,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#3b82f6)",boxShadow:"0 4px 10px rgba(99,102,241,0.18),inset 0 2px 2px rgba(255,255,255,0.2),inset 0 -1px 2px rgba(0,0,0,0.1)" }}/>
          <div style={{ position:"absolute",bottom:-8,left:6,width:36,height:8,borderRadius:"50%",background:"rgba(99,102,241,0.08)",filter:"blur(4px)" }}/>
        </div>
      </motion.div>
      <motion.div animate={float(0.5, 3.8)}>
        <div style={{ width:110,height:160,borderRadius:18,background:"linear-gradient(180deg,#f8f8fa 0%,#fff 100%)",border:"2px solid rgba(99,91,255,0.12)",boxShadow:"0 10px 28px rgba(99,102,241,0.14),inset 0 1px 1px rgba(255,255,255,0.8)",padding:"12px 8px 8px",display:"flex",flexDirection:"column",gap:6,overflow:"hidden" }}>
          <div className="flex justify-between items-center" style={{ padding:"0 3px",marginBottom:3 }}>
            <div style={{ width:20,height:2,borderRadius:1,background:"rgba(0,0,0,0.15)" }}/>
            <div style={{ width:7,height:7,borderRadius:4,background:"rgba(0,0,0,0.08)" }}/>
          </div>
          {[
            { text:"갱신할 때 되지 않았나요?", delay:0, color:"rgba(99,91,255,0.06)" },
            { text:"서류, 미리 준비해둘까요?", delay:2, color:"rgba(16,185,129,0.06)" },
            { text:"안심하세요, 함께할게요", delay:4, color:"rgba(245,158,11,0.06)" },
          ].map((n,i)=>(
            <div key={i} style={{ background:n.color,borderRadius:10,padding:"7px 9px",animation:`notifSlide 6s ease-in-out ${n.delay}s infinite` }}>
              <div className="flex items-center gap-1.5" style={{ marginBottom:3 }}>
                <div style={{ width:12,height:12,borderRadius:4,background:"linear-gradient(135deg,#8b5cf6,#3b82f6)" }}/>
                <span style={{ fontSize:7,fontWeight:600,color:"#6B7294",fontFamily:"Inter, sans-serif" }}>Phivis</span>
              </div>
              <p style={{ fontSize:8.5,fontWeight:500,color:"#1A1D26",margin:0,lineHeight:1.35,fontFamily:"Inter, sans-serif" }}>{n.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══ STEP 4: Language — Kinetic Typography (Framer Motion sequential) ═══
   Apple rhythm: fast in (0.25s) → hold (1.2s) → fast out (0.2s)
   Nike direction: always left-to-right flow
   Google color shift: gray(KR) → indigo(translated)
*/
export function Step4Illustration() {
  const phase = useAnimation();
  const scroll = useAnimation();
  const sib = useAnimation(); // Simple is Best
  const w1kr = useAnimation();
  const w1tr = useAnimation();
  const w2kr = useAnimation();
  const w2tr = useAnimation();
  const w3kr = useAnimation();
  const w3tr = useAnimation();
  const midPhrase = useAnimation();
  const appUI = useAnimation();
  const endPhrase = useAnimation();

  useEffect(() => {
    const run = async () => {
      while (true) {
        // ═══ PHASE 1: Scroll + "Simple is Best" ═══
        scroll.set({ opacity: 1 });
        sib.set({ opacity: 0, scale: 0.7 });
        w1kr.set({ opacity: 0 }); w1tr.set({ opacity: 0 });
        w2kr.set({ opacity: 0 }); w2tr.set({ opacity: 0 });
        w3kr.set({ opacity: 0 }); w3tr.set({ opacity: 0 });
        midPhrase.set({ opacity: 0 }); appUI.set({ opacity: 0 }); endPhrase.set({ opacity: 0 });

        // Show scroll for 2s (fast, overwhelming)
        await new Promise(r => setTimeout(r, 2000));

        // "Simple is Best" — big overshoot entrance
        await sib.start({ opacity: 1, scale: [0.7, 1.06, 1.0], transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } });
        await new Promise(r => setTimeout(r, 1200));

        // Fade both out
        await Promise.all([
          scroll.start({ opacity: 0, transition: { duration: 0.3 } }),
          sib.start({ opacity: 0, transition: { duration: 0.3 } }),
        ]);

        await new Promise(r => setTimeout(r, 300));

        // ═══ PHASE 2: Translation — one word at a time ═══

        // Word 1: 체류자격변경 → Status Change
        await w1kr.start({ opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } });
        await new Promise(r => setTimeout(r, 1000));
        w1tr.set({ x: 60 });
        await Promise.all([
          w1kr.start({ opacity: 0, x: -60, transition: { duration: 0.15, ease: "easeIn" } }),
          w1tr.start({ opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }),
        ]);
        await new Promise(r => setTimeout(r, 900));
        await w1tr.start({ opacity: 0, transition: { duration: 0.15 } });

        await new Promise(r => setTimeout(r, 200));

        // Word 2: 출입국사실증명 → 出入境证明
        await w2kr.start({ opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } });
        await new Promise(r => setTimeout(r, 1000));
        w2tr.set({ x: 60 });
        await Promise.all([
          w2kr.start({ opacity: 0, x: -60, transition: { duration: 0.15, ease: "easeIn" } }),
          w2tr.start({ opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }),
        ]);
        await new Promise(r => setTimeout(r, 900));
        await w2tr.start({ opacity: 0, transition: { duration: 0.15 } });

        await new Promise(r => setTimeout(r, 200));

        // Word 3: 납세사실증명 → Chứng nhận thuế
        await w3kr.start({ opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } });
        await new Promise(r => setTimeout(r, 1000));
        w3tr.set({ x: 60 });
        await Promise.all([
          w3kr.start({ opacity: 0, x: -60, transition: { duration: 0.15, ease: "easeIn" } }),
          w3tr.start({ opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }),
        ]);
        await new Promise(r => setTimeout(r, 900));
        await w3tr.start({ opacity: 0, transition: { duration: 0.15 } });

        // "어려운 단어들도 쉽게"
        await midPhrase.start({ opacity: 1, scale: [0.85, 1.04, 1.0], transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } });
        await new Promise(r => setTimeout(r, 1500));
        await midPhrase.start({ opacity: 0, transition: { duration: 0.25 } });

        await new Promise(r => setTimeout(r, 300));

        // ═══ PHASE 3: App demo ═══
        await appUI.start({ opacity: 1, scale: 1, transition: { duration: 0.35 } });
        await new Promise(r => setTimeout(r, 4500));

        // "압도적이고 직관적인 UI"
        await endPhrase.start({ opacity: 1, scale: [0.85, 1.04, 1.0], transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } });
        await new Promise(r => setTimeout(r, 1500));

        // Fade all out and loop
        await Promise.all([
          appUI.start({ opacity: 0, transition: { duration: 0.3 } }),
          endPhrase.start({ opacity: 0, transition: { duration: 0.3 } }),
        ]);

        await new Promise(r => setTimeout(r, 500));
      }
    };
    run();
  }, [phase, scroll, sib, w1kr, w1tr, w2kr, w2tr, w3kr, w3tr, midPhrase, appUI, endPhrase]);

  const krStyle: React.CSSProperties = {
    fontSize: 24, fontWeight: 600, color: "#B0B8C8",
    fontFamily: "sans-serif", position: "absolute",
    whiteSpace: "nowrap",
  };
  const trStyle: React.CSSProperties = {
    fontSize: 28, fontWeight: 700, color: "#635BFF",
    fontFamily: "Inter, sans-serif", position: "absolute",
    whiteSpace: "nowrap",
  };

  return (
    <div className="relative size-full overflow-hidden flex items-center justify-center">
      <style>{`
        @keyframes fastScroll4 { 0%{transform:translateY(0);} 100%{transform:translateY(-55%);} }
        @keyframes cardTap4 { 0%,8%{transform:scale(1);} 10%{transform:scale(0.97);} 12%{transform:scale(1);} 100%{transform:scale(1);} }
        @keyframes expand4 { 0%,11%{max-height:0;opacity:0;} 16%,52%{max-height:40px;opacity:1;} 60%,100%{max-height:0;opacity:0;} }
        @keyframes check4 { 0%,56%{opacity:0;transform:scale(0);} 64%,100%{opacity:1;transform:scale(1);} }
      `}</style>

      {/* ── PHASE 1: Scroll ── */}
      <motion.div animate={scroll} className="absolute inset-0 flex items-center justify-center">
        <div style={{ width:240, height:260, overflow:"hidden", borderRadius:14, position:"relative", background:"rgba(255,255,255,0.35)", border:"1px solid rgba(200,200,210,0.25)" }}>
          <div style={{ padding:"5px 8px", borderBottom:"1px solid rgba(200,200,210,0.3)", background:"rgba(240,240,245,0.8)" }}>
            <div className="flex gap-1">{[0,1,2].map(i=><div key={i} style={{ width:5,height:5,borderRadius:3,background:"rgba(200,200,210,0.5)" }}/>)}</div>
          </div>
          <div style={{ animation:"fastScroll4 1.2s linear infinite", padding:"4px 12px" }}>
            {["체류자격변경허가신청서","여권 원본 및 사본","표준규격 사진 1매","수수료 (국내체류 6만원)","고용계약서 원본","납세사실증명원","건강진단서","출입국사실증명서","외국인등록증 앞뒷면 사본","재직증명서","사업자등록증 사본","기술자격증명서류","범죄경력증명서","토픽 성적증명서","소득금액증명원","체류자격변경허가신청서","여권 원본 및 사본","고용계약서 원본","납세사실증명원","건강진단서","출입국사실증명서","외국인등록증 앞뒷면 사본","재직증명서","사업자등록증 사본"].map((d,i)=>(
              <div key={i} style={{ fontSize:i%4===0?12:9, fontWeight:i%4===0?700:400, color:i%4===0?"#1A1D26":"#B0B4C8", fontFamily:"sans-serif", padding:"2.5px 0", whiteSpace:"nowrap", lineHeight:1.7 }}>{d}</div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* "Simple is Best" overlay */}
      <motion.div animate={sib} initial={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2, background: "rgba(248,248,250,0.9)" }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: "#635BFF", fontFamily: "Inter, sans-serif", letterSpacing: "-0.5px" }}>Simple is Best</span>
      </motion.div>

      {/* ── PHASE 2: Words ── */}
      {/* Word 1 */}
      <motion.div animate={w1kr} initial={{ opacity: 0, x: 0 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <span style={krStyle}>체류자격변경</span>
      </motion.div>
      <motion.div animate={w1tr} initial={{ opacity: 0, x: 60 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <span style={trStyle}>Status Change</span>
      </motion.div>

      {/* Word 2 */}
      <motion.div animate={w2kr} initial={{ opacity: 0, x: 0 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <span style={krStyle}>출입국사실증명</span>
      </motion.div>
      <motion.div animate={w2tr} initial={{ opacity: 0, x: 60 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <span style={trStyle}>出入境证明</span>
      </motion.div>

      {/* Word 3 */}
      <motion.div animate={w3kr} initial={{ opacity: 0, x: 0 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <span style={krStyle}>납세사실증명</span>
      </motion.div>
      <motion.div animate={w3tr} initial={{ opacity: 0, x: 60 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <span style={trStyle}>Chứng nhận thuế</span>
      </motion.div>

      {/* "어려운 단어들도 쉽게" */}
      <motion.div animate={midPhrase} initial={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#6B7294", fontFamily: "Inter, sans-serif" }}>어려운 단어들도 쉽게</span>
      </motion.div>

      {/* ── PHASE 3: App Demo ── */}
      <motion.div animate={appUI} initial={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <div style={{ width:240, borderRadius:16, background:"#fff", border:"1px solid rgba(99,91,255,0.08)", boxShadow:"0 4px 16px rgba(99,91,255,0.06)", padding:"12px 14px", overflow:"hidden" }}>
          <div className="flex items-center gap-2" style={{ marginBottom:10 }}>
            <div style={{ width:14,height:14,borderRadius:5,background:"linear-gradient(135deg,#8b5cf6,#3b82f6)" }}/>
            <span style={{ fontSize:10,fontWeight:600,color:"#1A1D26",fontFamily:"Inter, sans-serif" }}>Document Checklist</span>
            <div className="flex gap-0.5" style={{ marginLeft:"auto" }}>
              <span style={{ fontSize:7 }}>🇺🇸</span><span style={{ fontSize:7 }}>🇻🇳</span><span style={{ fontSize:7 }}>🇨🇳</span>
            </div>
          </div>
          {[
            { name:"Passport copy", desc:"Scan to auto-fill your info", icon:"📄", delay:"0s" },
            { name:"Employment contract", desc:"Upload photo — we extract details", icon:"📋", delay:"1.4s" },
            { name:"Health certificate", desc:"Find nearby hospitals on map", icon:"🏥", delay:"2.8s" },
          ].map((doc,i)=>(
            <div key={i} style={{ marginBottom:4 }}>
              <div style={{ borderRadius:10, padding:"7px 10px", background:"#F6F7F9", animation:`cardTap4 4.5s ease ${doc.delay} infinite`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize:11 }}>{doc.icon}</span>
                  <span style={{ fontSize:9,fontWeight:600,color:"#1A1D26",fontFamily:"Inter, sans-serif" }}>{doc.name}</span>
                </div>
                <div style={{ width:16,height:16,borderRadius:8,background:"rgba(16,185,129,0.12)",display:"flex",alignItems:"center",justifyContent:"center", animation:`check4 4.5s ease ${doc.delay} infinite` }}>
                  <span style={{ fontSize:9,color:"#10B981",fontWeight:700 }}>✓</span>
                </div>
              </div>
              <div style={{ overflow:"hidden",borderRadius:"0 0 10px 10px",background:"rgba(99,91,255,0.03)",paddingLeft:10,paddingRight:10,fontSize:8,color:"#6B7294",fontFamily:"Inter, sans-serif",lineHeight:1.4, animation:`expand4 4.5s ease ${doc.delay} infinite` }}>{doc.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* "압도적이고 직관적인 UI" */}
      <motion.div animate={endPhrase} initial={{ opacity: 0, scale: 0.9 }} className="absolute inset-x-0 bottom-4 flex justify-center" style={{ zIndex: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#635BFF", fontFamily: "Inter, sans-serif" }}>Simple is Best</span>
      </motion.div>
    </div>
  );
}

/* ═══ STEP 5 ═══ */
export function Step5Illustration() {
  return (
    <div className="relative size-full flex items-center justify-center" style={{ gap: 20 }}>
      <motion.div animate={float(0, 3)}>
        <div style={{ width:40,height:60,borderRadius:10,background:"linear-gradient(135deg,#8b5cf6,#6366f1,#3b82f6)",transform:"rotateY(-12deg) rotateX(5deg)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"inset 0 1px 1px rgba(255,255,255,0.3),inset 0 -1px 1px rgba(0,0,0,0.05),0 10px 24px rgba(99,102,241,0.2)" }}>
          <div style={{ width:30,height:46,borderRadius:6,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="flex items-end gap-0.5" style={{ height:16 }}>
              {[6,10,14].map((h,i)=>(<div key={i} style={{ width:3,height:h,borderRadius:1.5,background:"rgba(255,255,255,0.5)" }}/>))}
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div animate={float(0.4, 3.5)} className="relative" style={{ marginTop:-16 }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{ width:42,height:13,borderRadius:20,background:i===0?"linear-gradient(135deg,#F59E0B,#FBBF24)":`linear-gradient(135deg,rgba(245,158,11,${0.7-i*0.15}),rgba(251,191,36,${0.6-i*0.15}))`,marginTop:i>0?-4:0,boxShadow:i===0?"inset 0 1px 2px rgba(255,255,255,0.4),0 6px 14px rgba(245,158,11,0.22)":"0 2px 4px rgba(245,158,11,0.08)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            {i===0&&<span style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.85)" }}>₩</span>}
          </div>
        ))}
      </motion.div>
      <motion.div animate={float(0.8, 4)} style={{ marginTop:8,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
        <div className="flex items-center gap-1">
          {["₩","¥","$"].map((s,i)=>(
            <div key={s} style={{ width:24,height:24,borderRadius:6,background:`linear-gradient(135deg,rgba(99,91,255,${0.35-i*0.05}),rgba(59,130,246,${0.3-i*0.05}))`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",boxShadow:"0 3px 8px rgba(99,102,241,0.15)" }}>{s}</div>
          ))}
        </div>
        <span style={{ fontSize:10,color:"rgba(99,91,255,0.4)" }}>↔</span>
      </motion.div>
    </div>
  );
}