import { useEffect, useRef } from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'main' | 'theme' | 'character' | 'motif';
}

interface Connection {
  from: string;
  to: string;
}

export function MindMapTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const nodes: Node[] = [
    { id: 'main', label: 'Na Drini ćuprija', x: 400, y: 300, type: 'main' },
    { id: 'theme1', label: 'Prolaznost vremena', x: 200, y: 150, type: 'theme' },
    { id: 'theme2', label: 'Sukob civilizacija', x: 600, y: 150, type: 'theme' },
    { id: 'theme3', label: 'Most kao simbol', x: 200, y: 450, type: 'theme' },
    { id: 'char1', label: 'Abidaga', x: 600, y: 400, type: 'character' },
    { id: 'char2', label: 'Fata Avdagina', x: 500, y: 500, type: 'character' },
    { id: 'motif1', label: 'Kapija', x: 100, y: 300, type: 'motif' },
    { id: 'motif2', label: 'Rijeka Drina', x: 700, y: 300, type: 'motif' },
  ];

  const connections: Connection[] = [
    { from: 'main', to: 'theme1' },
    { from: 'main', to: 'theme2' },
    { from: 'main', to: 'theme3' },
    { from: 'main', to: 'char1' },
    { from: 'main', to: 'char2' },
    { from: 'main', to: 'motif1' },
    { from: 'main', to: 'motif2' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = 'rgba(0, 207, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, []);

  const getNodeColor = (type: Node['type']) => {
    switch (type) {
      case 'main': return 'bg-[#00CFFF] text-[#0A0F18]';
      case 'theme': return 'bg-[#04245A] text-[#E6F0FF] border-[#00CFFF]/40';
      case 'character': return 'bg-[#04245A]/60 text-[#E6F0FF] border-[#00CFFF]/30';
      case 'motif': return 'bg-[#04245A]/40 text-[#E6F0FF]/80 border-[#00CFFF]/20';
    }
  };

  const getNodeSize = (type: Node['type']) => {
    return type === 'main' ? 'w-48 h-20' : 'w-40 h-16';
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#0A0F18] to-[#050A12] overflow-hidden">
      {/* Canvas for connections */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Nodes */}
      {nodes.map(node => (
        <div
          key={node.id}
          className={`absolute ${getNodeSize(node.type)} ${getNodeColor(node.type)} 
                     rounded-xl border-2 flex items-center justify-center
                     shadow-lg hover:shadow-[0_0_20px_rgba(0,207,255,0.4)]
                     transition-all duration-150 cursor-pointer`}
          style={{
            left: `${node.x}px`,
            top: `${node.y}px`,
            transform: 'translate(-50%, -50%)',
            fontFamily: node.type === 'main' ? 'Orbitron, sans-serif' : 'inherit',
          }}
        >
          <span className={`text-center px-4 ${node.type === 'main' ? 'text-base font-bold' : 'text-sm'}`}>
            {node.label}
          </span>
        </div>
      ))}

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 bg-[#04245A]/30 border border-[#04245A]/50 rounded-xl p-4 max-w-sm">
        <p className="text-xs text-[#E6F0FF]/60">
          <span className="text-[#00CFFF] font-semibold">Interaktivna mapa:</span> Kliknite na čvor da vidite detaljnije informacije o temi, karakteru ili motivu.
        </p>
      </div>
    </div>
  );
}
