interface TimelinePoint {
  label: string;
  page: number;
}

const TIMELINE_POINTS: TimelinePoint[] = [
  { label: 'Početak', page: 1 },
  { label: 'Konflikt', page: 45 },
  { label: 'Preokret', page: 98 },
  { label: 'Klimaks', page: 167 },
  { label: 'Rasplet', page: 215 }
];

export function BookTimeline() {
  return (
    <div className="p-6 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}>
      <h3 className="text-[#E6F0FF] mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Vremenska linija knjige
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00D1FF]/20 via-[#00D1FF]/40 to-[#00D1FF]/20" />
        
        {/* Timeline points */}
        <div className="relative flex justify-between items-start">
          {TIMELINE_POINTS.map((point, index) => (
            <div key={index} className="flex flex-col items-center" style={{ flex: 1 }}>
              {/* Dot */}
              <div className="w-4 h-4 rounded-full bg-[#00D1FF] border-2 border-[#0A0A0A] shadow-[0_0_10px_rgba(0,209,255,0.5)] z-10" />
              
              {/* Label */}
              <div className="mt-4 text-center">
                <p className="text-[#E6F0FF] text-sm mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {point.label}
                </p>
                <span className="text-[#00D1FF]/70 text-xs px-2 py-1 rounded bg-[#00D1FF]/10 border border-[#00D1FF]/30">
                  str. {point.page}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
