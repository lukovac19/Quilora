import { motion } from './ui/motion';
import { Terminal, Play, Settings, Download } from 'lucide-react';
import { useState } from 'react';

export function DemoSandbox() {
  const [activeTab, setActiveTab] = useState<'code' | 'output'>('code');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setActiveTab('output');
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <section id="demo" className="relative py-24 bg-[#0A0A0A] overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#0FB2FF]/10 rounded-full blur-[120px]" />
      
      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 
            className="text-[#E6F0FF] mb-4"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.02em'
            }}
          >
            Try It Live
          </h2>
          <p className="text-[#E6F0FF]/70 max-w-2xl mx-auto text-lg">
            Experience the power of our AI platform with this interactive sandbox.
          </p>
        </motion.div>

        {/* Interactive sandbox */}
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="rounded-2xl bg-gradient-to-br from-[#001F54]/40 to-[#001F54]/20 border border-white/[0.03] overflow-hidden shadow-[0_0_50px_rgba(0,209,255,0.1)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#001F54]/60 border-b border-white/[0.03]">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-[#00D1FF]" />
                <span className="text-[#E6F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  AI Playground
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  className="p-2 rounded-lg hover:bg-[#00D1FF]/10 text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
                <motion.button
                  className="p-2 rounded-lg hover:bg-[#00D1FF]/10 text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={handleRun}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] text-[#0A0A0A] hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-shadow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <Play className="w-4 h-4" />
                  Run
                </motion.button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 bg-[#0A0A0A]/40">
              <button
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === 'code'
                    ? 'bg-[#001F54]/60 text-[#00D1FF] border-t border-x border-[#00D1FF]/30'
                    : 'text-[#E6F0FF]/50 hover:text-[#E6F0FF]/70'
                }`}
                onClick={() => setActiveTab('code')}
              >
                Code
              </button>
              <button
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === 'output'
                    ? 'bg-[#001F54]/60 text-[#00D1FF] border-t border-x border-[#00D1FF]/30'
                    : 'text-[#E6F0FF]/50 hover:text-[#E6F0FF]/70'
                }`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </button>
            </div>

            {/* Content area */}
            <div className="p-6 bg-[#0A0A0A]/40 min-h-[400px]">
              {activeTab === 'code' ? (
                <pre className="text-[#E6F0FF] font-mono text-sm leading-relaxed">
                  <code>
                    <span className="text-[#00D1FF]">import</span> {`{ AIFlow }`} <span className="text-[#00D1FF]">from</span> <span className="text-[#0FB2FF]">'@aiflow/sdk'</span>;{'\n'}
                    {'\n'}
                    <span className="text-[#E6F0FF]/50">// Initialize AI model</span>{'\n'}
                    <span className="text-[#00D1FF]">const</span> model = <span className="text-[#00D1FF]">new</span> AIFlow.NeuralNet({'{'}
                    {'\n'}  layers: [<span className="text-[#0FB2FF]">128</span>, <span className="text-[#0FB2FF]">64</span>, <span className="text-[#0FB2FF]">32</span>],{'\n'}
                    {'  '}activation: <span className="text-[#0FB2FF]">'relu'</span>,{'\n'}
                    {'}'});{'\n'}
                    {'\n'}
                    <span className="text-[#E6F0FF]/50">// Train on your data</span>{'\n'}
                    <span className="text-[#00D1FF]">await</span> model.train(trainingData, {'{'}
                    {'\n'}  epochs: <span className="text-[#0FB2FF]">100</span>,{'\n'}
                    {'  '}batchSize: <span className="text-[#0FB2FF]">32</span>,{'\n'}
                    {'}'});{'\n'}
                    {'\n'}
                    <span className="text-[#E6F0FF]/50">// Make predictions</span>{'\n'}
                    <span className="text-[#00D1FF]">const</span> result = <span className="text-[#00D1FF]">await</span> model.predict(inputData);
                  </code>
                </pre>
              ) : (
                <div className="space-y-3">
                  {isRunning ? (
                    <div className="flex items-center gap-3 text-[#00D1FF]">
                      <div className="w-4 h-4 border-2 border-[#00D1FF] border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <div className="text-[#00D1FF]">✓ Model initialized successfully</div>
                      <div className="text-[#00D1FF]">✓ Training completed in 1.2s</div>
                      <div className="text-[#00D1FF]">✓ Accuracy: 98.7%</div>
                      <div className="mt-6 p-4 rounded-lg bg-[#001F54]/40 border border-[#00D1FF]/20">
                        <div className="text-[#E6F0FF]/70 mb-2">Prediction Result:</div>
                        <div className="text-[#00D1FF] font-mono">
                          {`{ confidence: 0.987, class: "positive", latency: "23ms" }`}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}