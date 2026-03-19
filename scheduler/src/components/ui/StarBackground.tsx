export function StarBackground() {
    return (
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .chat-bg::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.65) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px);
          background-size: 180px 180px, 220px 220px, 290px 290px, 150px 150px, 340px 340px, 260px 260px;
          background-position: 20px 40px, 90px 130px, 55px 200px, 170px 70px, 30px 280px, 140px 20px;
          animation: twinkle 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
    );
  }