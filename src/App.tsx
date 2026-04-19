import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Type, 
  Box, 
  Zap, 
  Layout, 
  Sparkles,
  Settings2,
  Edit3,
  Eye,
  User,
  Send,
  ArrowRight,
  RotateCcw,
  Download,
  FileDown,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  X,
  Save,
  Trash2,
  Plus,
  FileText
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Types ---

interface DesignOptions {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  boxStyle: 'none' | 'neon' | 'glass' | 'brutalist' | 'holographic' | 'blueprint' | 'glitch' | 'retro';
  fontSize: number;
  padding: number;
  glowIntensity: number;
  title: string;
  footerName: string;
  footerHandle: string;
  showAvatar: boolean;
  avatarUrl: string;
  showBoxFill: boolean;
  showSpaceBg: boolean;
  fontFamily: 'serif' | 'sans' | 'mono' | 'tech';
  paperSize: 'a4' | 'square' | 'wide';
}

const PAPER_SIZES = {
  a4: { width: '420px', minHeight: '600px', aspect: '1 / 1.414' },
  square: { width: '420px', minHeight: '420px', aspect: '1 / 1' },
  wide: { width: '560px', minHeight: '400px', aspect: '1.414 / 1' },
};

const FONTS = {
  serif: 'Georgia, serif',
  sans: '"Outfit", sans-serif',
  mono: '"JetBrains Mono", monospace',
  tech: '"Space Grotesk", sans-serif',
};

// --- Components ---

const StarField = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(100)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: Math.random() }}
          animate={{ opacity: [0.1, 1, 0.1] }}
          transition={{ 
            duration: 2 + Math.random() * 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute bg-white rounded-full shadow-[0_0_5px_white]"
          style={{
            width: (Math.random() > 0.8 ? 3 : 1) + 'px',
            height: (Math.random() > 0.8 ? 3 : 1) + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
          }}
        />
      ))}
    </div>
  );
};

const NeonButton = ({ 
  children, 
  onClick, 
  icon: Icon, 
  variant = 'cyan',
  className = '' 
}: { 
  children: ReactNode; 
  onClick?: () => void; 
  icon?: any;
  variant?: 'cyan' | 'pink' | 'lime';
  className?: string;
}) => {
  const styles = {
    cyan: 'bg-black/40 border border-neon-cyan/50 text-neon-cyan shadow-[0_0_10px_rgba(0,242,255,0.1)]',
    pink: 'bg-black/40 border border-neon-pink/50 text-neon-pink shadow-[0_0_10px_rgba(255,0,234,0.1)]',
    lime: 'bg-black/40 border border-neon-lime/50 text-neon-lime shadow-[0_0_10px_rgba(188,255,0,0.1)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[13px] font-semibold uppercase tracking-[1px] transition-all duration-300 ${styles[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </motion.button>
  );
};

export default function App() {
  const [latex, setLatex] = useState<string>(`#Матан |

[[
Вычислите предел функции или докажите,
что предела не существует
$$\\lim_{(x,y) \\to (0,0)} \\frac{x^3 + y^3}{x^2 + y^2}$$
]]

Для проверки существования предела исследуем поведение
функции вдоль различных путей

Путь $y = 0$:
[[
$$\\frac{x^3 + 0^3}{x^2 + 0^2} = \\frac{x^3}{x^2} = x$$
]]

При $x \\to 0$, выражение $x$ стремится к 0`);
  
  const [options, setOptions] = useState<DesignOptions>({
    backgroundColor: '#0d0d0f',
    textColor: '#ffffff',
    accentColor: '#00f2ff',
    boxStyle: 'neon',
    fontSize: 18,
    padding: 40,
    glowIntensity: 0.5,
    title: '#Матан |',
    footerName: 'Азарий Родионов',
    footerHandle: '@DeMaths',
    showAvatar: false,
    avatarUrl: 'https://picsum.photos/seed/hamster/100/100',
    showBoxFill: false,
    showSpaceBg: true,
    fontFamily: 'serif',
    paperSize: 'a4',
  });

  const resetDesign = () => {
    setOptions(prev => ({
      ...prev,
      backgroundColor: '#0d0d0f',
      textColor: '#ffffff',
      accentColor: '#00f2ff',
      boxStyle: 'neon',
      fontSize: 18,
      padding: 40,
      glowIntensity: 0.5,
      showAvatar: false,
      avatarUrl: 'https://picsum.photos/seed/hamster/100/100',
      showBoxFill: false,
      showSpaceBg: true,
      fontFamily: 'serif',
      paperSize: 'a4',
    }));
  };

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'controls'>('editor');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDocFocused, setIsDocFocused] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [presets, setPresets] = useState<{name: string, options: DesignOptions}[]>([]);
  const [presetName, setPresetName] = useState('');
  const [documents, setDocuments] = useState<{name: string, content: string, options: DesignOptions}[]>([]);
  const [docSaveName, setDocSaveName] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  // --- Storage Logic ---
  useEffect(() => {
    const savedPresets = localStorage.getItem('neotex-presets');
    const savedDocs = localStorage.getItem('neotex-documents');
    
    if (savedPresets) {
      try { setPresets(JSON.parse(savedPresets)); } catch (e) { console.error(e); }
    }
    if (savedDocs) {
      try { setDocuments(JSON.parse(savedDocs)); } catch (e) { console.error(e); }
    }
  }, []);

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPresets = [...presets, { name: presetName, options: { ...options } }];
    setPresets(newPresets);
    localStorage.setItem('neotex-presets', JSON.stringify(newPresets));
    setPresetName('');
  };

  const deletePreset = (index: number) => {
    const newPresets = presets.filter((_, i) => i !== index);
    setPresets(newPresets);
    localStorage.setItem('neotex-presets', JSON.stringify(newPresets));
  };

  const loadPreset = (presetOptions: DesignOptions) => {
    setOptions({
      ...presetOptions,
      title: options.title, // Keep user info
      footerName: options.footerName,
      footerHandle: options.footerHandle,
      avatarUrl: options.avatarUrl
    });
  };

  // --- Document Logic ---
  const saveDocument = () => {
    if (!docSaveName.trim()) return;
    const newDocs = [...documents, { 
      name: docSaveName.trim(), 
      content: latex, 
      options: { ...options } 
    }];
    setDocuments(newDocs);
    localStorage.setItem('neotex-documents', JSON.stringify(newDocs));
    setDocSaveName('');
  };

  const loadDocument = (doc: {content: string, options: DesignOptions}) => {
    setLatex(doc.content);
    setOptions({ ...doc.options });
    setActiveTab('editor');
  };

  const deleteDocument = (index: number) => {
    const newDocs = documents.filter((_, i) => i !== index);
    setDocuments(newDocs);
    localStorage.setItem('neotex-documents', JSON.stringify(newDocs));
  };

  const exportAsImage = async () => {
    setIsExporting(true);
    const pages = document.querySelectorAll('.doc-page');
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i] as HTMLElement, {
        backgroundColor: options.backgroundColor,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `neotex-page-${i + 1}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    }
    setIsExporting(false);
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    const pages = document.querySelectorAll('.doc-page');
    const pdf = new jsPDF({
      orientation: options.paperSize === 'wide' ? 'landscape' : 'portrait',
      unit: 'px',
      format: [
        parseInt(PAPER_SIZES[options.paperSize].width),
        parseInt(PAPER_SIZES[options.paperSize].minHeight)
      ]
    });

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i] as HTMLElement, {
        backgroundColor: options.backgroundColor,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    pdf.save('neotex-document.pdf');
    setIsExporting(false);
  };

  // --- Keyboard Events ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const renderContent = (content: string) => {
    // Match Display Math: $$...$$, \[...\]
    // Match Inline Math: $...$, \(...\)
    // Match Bold: \textbf{...}
    // Match Italic: \textit{...}
    const regex = /(\$\$.*?\$\$|\\\[.*?\\\]|\$.*?\$|\\\(.*?\\\)|\\textbf\{.*?\}|\\textit\{.*?\})/gs;
    const parts = content.split(regex);
    
    return parts.map((part, index) => {
      if (!part) return null;

      if (part.startsWith('$$') || part.startsWith('\\[')) {
        const math = part.replace(/^(\$\$|\\\[)/, '').replace(/(\$\$|\\\])$/, '');
        return <BlockMath key={index} math={math} />;
      } else if (part.startsWith('$') || part.startsWith('\\(')) {
        const math = part.replace(/^(\$|\\\()/, '').replace(/(\$|\\\))$/, '');
        return <InlineMath key={index} math={math} />;
      } else if (part.startsWith('\\textbf{')) {
        const text = part.match(/\\textbf\{(.*?)\}/)?.[1] || '';
        return <strong key={index}>{renderContent(text)}</strong>;
      } else if (part.startsWith('\\textit{')) {
        const text = part.match(/\\textit\{(.*?)\}/)?.[1] || '';
        return <em key={index}>{renderContent(text)}</em>;
      } else {
        return part.split('\n').map((line, i) => (
          <span key={`${index}-${i}`}>
            {line}
            {i !== part.split('\n').length - 1 && <br />}
          </span>
        ));
      }
    });
  };

  const renderLatex = (text: string) => {
    // Split by custom box tags [[ ... ]] and color tags {{ ... }}
    const syntaxRegex = /(\[\[.*?\]\]|\{\{.*?\}\})/gs;
    const segments = text.split(syntaxRegex);

    return segments.map((segment, i) => {
      if (!segment) return null;
      
      const isBoxed = segment.startsWith('[[');
      const isColored = segment.startsWith('{{');
      
      if (isBoxed) {
        const cleanContent = segment.slice(2, -2);
        return (
          <div 
            key={i} 
            className="p-6 relative my-8 transition-colors duration-200"
            style={getBoxStyles()}
          >
            {options.showAvatar && (
              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full border-2 safe-border-white-20 bg-bg-dark overflow-hidden shadow-xl z-10 hidden sm:block">
                 <img 
                  src={options.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            {options.boxStyle === 'blueprint' && (
              <>
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: options.accentColor }} />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: options.accentColor }} />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: options.accentColor }} />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: options.accentColor }} />
              </>
            )}
            <div className="relative z-0">
              {renderContent(cleanContent)}
            </div>
          </div>
        );
      } else if (isColored) {
        const cleanContent = segment.slice(2, -2);
        return (
          <span key={i} style={{ color: options.accentColor }} className="transition-colors duration-200">
            {renderContent(cleanContent)}
          </span>
        );
      } else {
        return (
          <div key={i} className="relative z-0">
            {renderContent(segment)}
          </div>
        );
      }
    });
  };

  const getBoxStyles = () => {
    const baseBackground = options.showBoxFill 
      ? `linear-gradient(135deg, ${options.accentColor}15, transparent)`
      : 'rgba(255, 255, 255, 0.02)';

    switch (options.boxStyle) {
      case 'neon':
        return {
          border: `1.5px solid ${options.accentColor}`,
          boxShadow: `0 0 ${15 * options.glowIntensity}px ${options.accentColor}33, inset 0 0 ${10 * options.glowIntensity}px ${options.accentColor}11`,
          borderRadius: '20px',
          background: baseBackground,
        };
      case 'glass':
        return {
          background: options.showBoxFill 
            ? `linear-gradient(135deg, ${options.accentColor}25, rgba(255, 255, 255, 0.03))`
            : 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, ${0.3 * options.glowIntensity})`,
          borderRadius: '12px',
        };
      case 'holographic':
        return {
          border: '1.5px solid transparent',
          backgroundImage: `linear-gradient(${options.backgroundColor}, ${options.backgroundColor}), linear-gradient(to right, #00f2ff, #ff00ea, #bcff00, #00f2ff)`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `0 0 ${25 * options.glowIntensity}px rgba(0, 242, 255, ${0.2 * options.glowIntensity}), 0 0 ${15 * options.glowIntensity}px rgba(255, 0, 234, ${0.2 * options.glowIntensity})`,
          borderRadius: '24px',
          background: options.showBoxFill ? `linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(255, 0, 234, 0.05))` : baseBackground,
        };
      case 'blueprint':
        return {
          border: `1px solid ${options.accentColor}44`,
          background: options.showBoxFill 
            ? `linear-gradient(${options.accentColor}11 1px, transparent 1px), linear-gradient(90deg, ${options.accentColor}11 1px, transparent 1px)`
            : 'transparent',
          backgroundSize: '20px 20px',
          borderRadius: '4px',
          boxShadow: `inset 0 0 20px ${options.accentColor}05`,
          position: 'relative' as const,
        };
      case 'glitch':
        return {
          border: `1.5px solid ${options.accentColor}`,
          boxShadow: `${-3 * options.glowIntensity}px ${-3 * options.glowIntensity}px 0px #ff00ea, ${3 * options.glowIntensity}px ${3 * options.glowIntensity}px 0px #00f2ff`,
          borderRadius: '2px',
          background: options.showBoxFill ? 'rgba(0,0,0,0.8)' : 'transparent',
          transform: `skewX(${-1 * options.glowIntensity}deg)`,
        };
      case 'retro':
        return {
          border: '4px double #ffffff',
          boxShadow: `inset 0 0 10px ${options.accentColor}33`,
          background: options.showBoxFill ? `${options.accentColor}22` : '#000000',
          borderRadius: '0px',
          outline: `2px solid ${options.accentColor}`,
          outlineOffset: '2px',
          fontFamily: FONTS.mono,
        };
      case 'brutalist':
        return {
          border: `3px solid ${options.accentColor}`,
          boxShadow: `6px 6px 0px ${options.accentColor}`,
          borderRadius: '0px',
          background: options.showBoxFill ? `${options.accentColor}10` : 'transparent',
        };
      default:
        return {};
    }
  };

  return (
    <div 
      className="h-screen bg-[#050505] flex flex-col overflow-hidden relative"
      onClick={() => setIsDocFocused(false)}
    >
      {/* Global Starfield Background */}
      <div className="absolute inset-0 pointer-events-none bg-starfield opacity-40 z-0" />

      {/* Atmospheric Nebula Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-cyan-700/30 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-700/30 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-5%] w-[600px] h-[600px] bg-blue-800/30 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Floating Animated Space Elements removed */}

      {/* Header */}
      {!isFullscreen && (
        <header className="h-[60px] border-b border-white/5 flex items-center justify-between px-4 sm:px-6 bg-[#050505] z-50 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="logo text-lg sm:text-xl font-extrabold tracking-[1px] sm:tracking-[2px] text-neon-cyan neon-text-cyan">
              DE-TEX <span className="hidden sm:inline">// DESIGN</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <NeonButton 
              onClick={exportAsImage} 
              icon={ImageIcon} 
              variant="pink" 
              className="px-3"
            >
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'JPEG'}</span>
            </NeonButton>
            <NeonButton 
              onClick={exportAsPDF} 
              icon={FileDown} 
              variant="cyan" 
              className="px-3"
            >
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'PDF'}</span>
            </NeonButton>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${isFullscreen ? '' : 'lg:grid lg:grid-cols-[320px_1fr_280px]'} gap-[1px] bg-transparent overflow-hidden relative`}>
        
        {/* Mobile Tabs */}
        {!isFullscreen && (
          <div className="lg:hidden flex border-b border-white/5 bg-[#08080a] shrink-0">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'editor' ? 'text-neon-cyan bg-white/5' : 'text-text-muted'}`}
            >
              <Edit3 size={14} /> Editor
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'preview' ? 'text-neon-cyan bg-white/5' : 'text-text-muted'}`}
            >
              <Eye size={14} /> Preview
            </button>
            <button 
              onClick={() => setActiveTab('controls')}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'controls' ? 'text-neon-cyan bg-white/5' : 'text-text-muted'}`}
            >
              <Settings2 size={14} /> Design
            </button>
          </div>
        )}

        {/* Editor Area */}
        <section className={`panel bg-[#0a0a0c] flex flex-col overflow-hidden ${isFullscreen ? 'hidden' : activeTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="panel-header px-4 py-3 text-[11px] uppercase tracking-[2px] text-text-muted border-b border-glass-border bg-[#050505] flex justify-between items-center hidden lg:flex">
            <span>LaTeX Source Editor</span>
            <div className="flex gap-2">
              <button onClick={() => setLatex(prev => prev + ' \\textbf{bold}')} className="hover:text-white transition-colors">B</button>
              <button onClick={() => setLatex(prev => prev + ' \\textit{italic}')} className="hover:text-white transition-colors italic">I</button>
              <button 
                onClick={() => setLatex(prev => prev + ' {{ Color Text }}')}
                className="hover:text-white transition-colors text-[10px] font-bold border border-white/20 px-1 rounded-sm"
                title="Colored Text"
              >
                T
              </button>
              <button onClick={() => setLatex(prev => prev + ' [[ Box ]]')}>[]</button>
              <button onClick={() => setLatex(prev => prev + ' \n\\newpage\n')}>Page</button>
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-[#08080a] overflow-hidden">
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              spellCheck={false}
              className="flex-1 bg-transparent p-4 sm:p-6 font-mono text-sm text-[#a0c0ff] focus:outline-none resize-none leading-relaxed"
              placeholder="Enter LaTeX code here... Use \\\\ for new lines."
            />
          </div>
        </section>

        {/* Preview Area */}
        <section className={`panel flex flex-col overflow-hidden relative ${isFullscreen ? 'flex flex-1 h-full' : activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          {!isFullscreen && (
            <div className="panel-header px-4 py-3 text-[11px] uppercase tracking-[2px] text-text-muted border-b border-glass-border bg-[#1a1a1c] flex justify-between items-center hidden lg:flex">
              <span>Live Preview</span>
              <button 
                onClick={() => setIsFullscreen(true)}
                className="hover:text-white transition-colors"
                title="Fullscreen Mode"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          )}

          {isFullscreen && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsFullscreen(false)}
              className="fixed top-6 right-6 z-[100] w-10 h-10 rounded-full bg-black/60 border border-neon-cyan/50 text-neon-cyan flex items-center justify-center hover:bg-neon-cyan hover:text-black transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 size={20} />
            </motion.button>
          )}

          <div className={`flex-1 overflow-auto ${isFullscreen ? 'pt-10 pb-10' : 'pt-24 pb-24'} px-4 sm:px-10 flex flex-col items-center bg-[#121214] gap-10`}>
            {latex.split('\\newpage').map((pageContent, pageIndex) => (
              <div 
                key={pageIndex}
                ref={pageIndex === 0 ? previewRef : null}
                tabIndex={0}
                onFocus={() => setIsDocFocused(true)}
                onBlur={() => setIsDocFocused(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDocFocused(true);
                }}
                className={`doc-page shrink-0 transition-shadow duration-300 overflow-hidden safe-bg-doc border safe-border-white-5 safe-shadow-doc flex flex-col relative outline-none cursor-pointer ${isDocFocused ? 'neon-border-active' : ''}`}
                style={{ 
                  backgroundColor: options.backgroundColor,
                  padding: `${options.padding}px`,
                  width: PAPER_SIZES[options.paperSize].width,
                  minHeight: PAPER_SIZES[options.paperSize].minHeight,
                  fontFamily: FONTS[options.fontFamily],
                }}
              >
                {/* Doc Space Background Layer */}
                {options.showSpaceBg && (
                  <div className="absolute inset-0 pointer-events-none mix-blend-lighten overflow-hidden bg-starfield opacity-50" />
                )}

                {/* Doc Title (Only on first page) */}
                {options.title && pageIndex === 0 && (
                  <div className="mb-8 border-b safe-border-white-10 pb-4">
                    <h2 className={`text-xl font-bold tracking-tight safe-text-white transition-shadow duration-300 ${isDocFocused ? 'text-glow-active' : ''}`}>{options.title}</h2>
                  </div>
                )}

                {/* Main Content */}
                <div 
                  className={`latex-render flex-1 transition-shadow duration-300 ${isDocFocused ? 'text-glow-active' : ''}`}
                  style={{ 
                    color: options.textColor,
                    fontSize: `${options.fontSize}px`,
                    lineHeight: 1.4
                  }}
                >
                  {renderLatex(pageContent)}
                </div>

                {/* Doc Footer */}
                {(options.footerName || options.footerHandle) && (
                  <div className={`mt-12 pt-6 border-t safe-border-white-10 flex justify-between items-end text-[11px] safe-text-muted transition-shadow duration-300 ${isDocFocused ? 'text-glow-active' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Send size={12} className="text-neon-cyan" />
                      <span>{options.footerHandle}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white/60">{options.footerName}</div>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <ArrowRight size={10} className="text-neon-pink" />
                        <span className="opacity-50">Page {pageIndex + 1}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Designer Sidebar */}
        <section className={`panel bg-[#0a0a0c] flex flex-col overflow-hidden ${isFullscreen ? 'hidden' : activeTab === 'controls' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="panel-header px-4 py-3 text-[11px] uppercase tracking-[2px] text-text-muted border-b border-glass-border bg-[#050505] hidden lg:block">
            Design Controls
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 pb-20 lg:pb-5">
            
            <div className="control-group">
              <label className="block text-[10px] text-text-muted uppercase mb-4 tracking-wider">Project Documents</label>
              
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <FileText size={12} className="absolute left-2 top-2.5 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Document Name"
                    value={docSaveName}
                    onChange={(e) => setDocSaveName(e.target.value)}
                    className="w-full bg-white/5 border border-glass-border p-2 pl-8 text-[11px] rounded-[4px] focus:outline-none focus:border-neon-cyan text-white"
                  />
                </div>
                <button 
                  onClick={saveDocument}
                  disabled={!docSaveName.trim()}
                  className="bg-neon-lime/20 border border-neon-lime text-neon-lime p-2 rounded-[4px] hover:bg-neon-lime hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Save Current Document & Style"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-y-auto mb-6 custom-scrollbar pr-1">
                {documents.length === 0 && (
                  <div className="text-[10px] text-text-muted text-center py-6 italic border border-dashed border-white/5 rounded-[4px]">
                    No documents saved
                  </div>
                )}
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <button 
                      onClick={() => loadDocument(doc)}
                      className="flex-1 text-left px-3 py-2 bg-white/5 border border-white/10 rounded-[4px] text-[11px] text-text-main hover:border-neon-lime hover:text-neon-lime transition-all truncate flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: doc.options.accentColor }} />
                      {doc.name}
                    </button>
                    <button 
                      onClick={() => deleteDocument(index)}
                      className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="control-group">
              <label className="block text-[10px] text-text-muted uppercase mb-2 tracking-wider">Document Info</label>
              <div className="space-y-3">
                <div className="relative">
                  <Edit3 size={12} className="absolute left-2 top-2.5 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Title"
                    value={options.title}
                    onChange={(e) => setOptions({...options, title: e.target.value})}
                    className="w-full bg-white/5 border border-glass-border p-2 pl-8 text-[12px] rounded-[4px] focus:outline-none focus:border-neon-cyan"
                  />
                </div>
                <div className="relative">
                  <User size={12} className="absolute left-2 top-2.5 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Footer Name"
                    value={options.footerName}
                    onChange={(e) => setOptions({...options, footerName: e.target.value})}
                    className="w-full bg-white/5 border border-glass-border p-2 pl-8 text-[12px] rounded-[4px] focus:outline-none focus:border-neon-cyan"
                  />
                </div>
                <div className="relative">
                  <Send size={12} className="absolute left-2 top-2.5 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Footer Handle"
                    value={options.footerHandle}
                    onChange={(e) => setOptions({...options, footerHandle: e.target.value})}
                    className="w-full bg-white/5 border border-glass-border p-2 pl-8 text-[12px] rounded-[4px] focus:outline-none focus:border-neon-cyan"
                  />
                </div>
              </div>
            </div>

            <div className="control-group">
              <label className="block text-[10px] text-text-muted uppercase mb-2 tracking-wider">Accent Palette</label>
              <div className="grid grid-cols-4 gap-2">
                {['#00f2ff', '#ff00ea', '#bcff00', '#ffffff', '#9D69A3', '#61707D', '#40F99B', '#E85D75'].map(color => (
                  <button
                    key={color}
                    onClick={() => setOptions({...options, accentColor: color})}
                    className={`h-[30px] rounded-[4px] border border-glass-border transition-transform ${options.accentColor === color ? 'scale-110 border-white' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="control-group">
              <label className="block text-[10px] text-text-muted uppercase mb-2 tracking-wider">Document Background</label>
              <input 
                type="color" 
                value={options.backgroundColor}
                onChange={(e) => setOptions({...options, backgroundColor: e.target.value})}
                className="w-full h-[30px] bg-transparent border border-neon-cyan rounded-[4px] cursor-pointer"
              />
            </div>

            <div className="control-group space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-glass-border">
                <span className="text-[12px] text-text-main">Show Avatar</span>
                <div 
                  onClick={() => setOptions({...options, showAvatar: !options.showAvatar})}
                  className={`w-[30px] h-[16px] rounded-[10px] relative cursor-pointer transition-colors ${options.showAvatar ? 'bg-neon-cyan' : 'bg-[#333]'}`}
                >
                  <div className={`w-[12px] h-[12px] bg-white rounded-full absolute top-[2px] transition-all ${options.showAvatar ? 'right-[2px]' : 'left-[2px]'}`}></div>
                </div>
              </div>
              {options.showAvatar && (
                <div className="py-2 border-b border-glass-border animate-in fade-in slide-in-from-top-1">
                  <div className="relative">
                    <ImageIcon size={12} className="absolute left-2 top-2.5 text-text-muted" />
                    <input 
                      type="text" 
                      placeholder="Avatar Image URL"
                      value={options.avatarUrl}
                      onChange={(e) => setOptions({...options, avatarUrl: e.target.value})}
                      className="w-full bg-white/5 border border-glass-border p-2 pl-8 text-[11px] rounded-[4px] focus:outline-none focus:border-neon-cyan text-white"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-glass-border">
                <span className="text-[12px] text-text-main">Box Gradient Fill</span>
                <div 
                  onClick={() => setOptions({...options, showBoxFill: !options.showBoxFill})}
                  className={`w-[30px] h-[16px] rounded-[10px] relative cursor-pointer transition-colors ${options.showBoxFill ? 'bg-neon-cyan' : 'bg-[#333]'}`}
                >
                  <div className={`w-[12px] h-[12px] bg-white rounded-full absolute top-[2px] transition-all ${options.showBoxFill ? 'right-[2px]' : 'left-[2px]'}`}></div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-glass-border">
                <span className="text-[12px] text-text-main">Document Space BG</span>
                <div 
                  onClick={() => setOptions({...options, showSpaceBg: !options.showSpaceBg})}
                  className={`w-[30px] h-[16px] rounded-[10px] relative cursor-pointer transition-colors ${options.showSpaceBg ? 'bg-neon-cyan' : 'bg-[#333]'}`}
                >
                  <div className={`w-[12px] h-[12px] bg-white rounded-full absolute top-[2px] transition-all ${options.showSpaceBg ? 'right-[2px]' : 'left-[2px]'}`}></div>
                </div>
              </div>
            </div>

            <div className="control-group">
              <label className="block text-[10px] text-text-muted uppercase mb-2 tracking-wider">Container Style</label>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'neon', 'glass', 'brutalist', 'holographic', 'blueprint', 'glitch', 'retro'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => setOptions({...options, boxStyle: style})}
                    className={`px-3 py-2 rounded-[4px] text-[10px] uppercase tracking-wider border transition-all ${
                      options.boxStyle === style 
                        ? 'bg-neon-pink/20 border-neon-pink text-white' 
                        : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              {(options.boxStyle === 'neon' || options.boxStyle === 'glass' || options.boxStyle === 'holographic' || options.boxStyle === 'glitch') && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-text-muted uppercase tracking-wider">Glow Intensity</label>
                    <span className="text-[10px] text-neon-cyan">{Math.round(options.glowIntensity * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.05"
                    value={options.glowIntensity}
                    onChange={(e) => setOptions({...options, glowIntensity: parseFloat(e.target.value)})}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                  />
                </div>
              )}
            </div>

            <div className="control-group">
              <label className="block text-[10px] text-text-muted uppercase mb-2 tracking-wider">Typography & Layout</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select 
                  value={options.fontFamily}
                  onChange={(e) => setOptions({...options, fontFamily: e.target.value as any})}
                  className="bg-white/5 border border-glass-border p-2 text-[12px] rounded-[4px] text-white focus:outline-none focus:border-neon-cyan"
                >
                  <option value="serif" className="bg-bg-dark">Classic Serif</option>
                  <option value="sans" className="bg-bg-dark">Modern Sans</option>
                  <option value="mono" className="bg-bg-dark">Code Mono</option>
                  <option value="tech" className="bg-bg-dark">Space Tech</option>
                </select>
                <select 
                  value={options.paperSize}
                  onChange={(e) => setOptions({...options, paperSize: e.target.value as any})}
                  className="bg-white/5 border border-glass-border p-2 text-[12px] rounded-[4px] text-white focus:outline-none focus:border-neon-cyan"
                >
                  <option value="a4" className="bg-bg-dark">A4 Portrait</option>
                  <option value="square" className="bg-bg-dark">Square Post</option>
                  <option value="wide" className="bg-bg-dark">Wide Canvas</option>
                </select>
              </div>
              <input 
                type="range" min="12" max="48" 
                value={options.fontSize}
                onChange={(e) => setOptions({...options, fontSize: parseInt(e.target.value)})}
                className="w-full accent-neon-cyan"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>Font Size: {options.fontSize}px</span>
              </div>
            </div>

            <div className="control-group pt-4 border-t border-glass-border">
              <label className="block text-[10px] text-text-muted uppercase mb-3 tracking-wider">Presets</label>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="Preset Name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1 bg-white/5 border border-glass-border p-2 text-[11px] rounded-[4px] focus:outline-none focus:border-neon-cyan text-white"
                />
                <button 
                  onClick={savePreset}
                  disabled={!presetName.trim()}
                  className="bg-neon-cyan/20 border border-neon-cyan text-neon-cyan p-2 rounded-[4px] hover:bg-neon-cyan hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Save Preset"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[150px] overflow-y-auto mb-4 custom-scrollbar">
                {presets.length === 0 && (
                  <div className="text-[10px] text-text-muted text-center py-4 italic border border-dashed border-white/5 rounded-[4px]">
                    No presets saved yet
                  </div>
                )}
                {presets.map((preset, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <button 
                      onClick={() => loadPreset(preset.options)}
                      className="flex-1 text-left px-3 py-2 bg-white/5 border border-white/10 rounded-[4px] text-[11px] text-text-main hover:border-neon-cyan hover:text-neon-cyan transition-all truncate"
                    >
                      {preset.name}
                    </button>
                    <button 
                      onClick={() => deletePreset(index)}
                      className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete Preset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={resetDesign}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-glass-border rounded-[4px] text-[10px] uppercase font-bold tracking-widest text-text-muted hover:text-white transition-all shadow-sm"
              >
                <RotateCcw size={14} /> Reset Design Styles
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer / Status Bar (Hidden on Mobile) */}
      {!isFullscreen && (
        <footer className="h-[30px] bg-bg-surface border-top border-glass-border hidden lg:flex items-center px-4 text-[10px] text-text-muted gap-5 shrink-0">
          <div className="flex items-center gap-[6px]">
            <div className="w-[6px] h-[6px] rounded-full bg-neon-lime shadow-[0_0_5px_#bcff00]"></div>
            <span>Compiler Ready</span>
          </div>
          <div className="flex items-center">
            <span>Line {latex.split('\n').length}, Col 1</span>
          </div>
          <div className="flex items-center">
            <span>PDF Engine: v4.2.0-neon</span>
          </div>
          <div className="ml-auto">
            <span>UTF-8</span>
          </div>
        </footer>
      )}
    </div>
  );
}
