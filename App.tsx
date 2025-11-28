
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Code2, 
  Image as ImageIcon, 
  Columns, 
  Sparkles, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Maximize2,
  X,
  Copy,
  Check,
  ChevronDown,
  FileCode,
  FileImage,
  Sun,
  Moon,
  Printer,
  Languages
} from 'lucide-react';
import { renderDiagram, INITIAL_CODE } from './utils/encoding';
import { generatePlantUML } from './services/geminiService';
import { Button } from './components/Button';
import { ViewMode } from './types';
import { translations, Language } from './utils/translations';

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Language State
  const [lang, setLang] = useState<Language>('zh');
  const t = translations[lang];

  // App State
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  // Resizing State
  const [editorWidth, setEditorWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  // Download Menu State
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Refs
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Theme Effect
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
  };

  // Click outside to close download menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update image URL when code changes (debounced)
  useEffect(() => {
    let isCancelled = false;

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(async () => {
      if (!code.trim()) {
         if (!isCancelled) setImageUrl('');
         return;
      }

      const url = await renderDiagram(code, 'svg');
      
      if (!isCancelled) {
        setImageUrl((prevUrl) => {
          // Revoke the previous blob URL to prevent memory leaks
          if (prevUrl && prevUrl.startsWith('blob:')) {
            URL.revokeObjectURL(prevUrl);
          }
          return url;
        });
      } else {
        // If cancelled (e.g. unmounted or new request), revoke the new url immediately
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }
    }, 800); // 800ms debounce to avoid flashing

    return () => {
      isCancelled = true;
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [code]);

  // Resizing Logic
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate percentage
      const newWidth = (e.clientX / window.innerWidth) * 100;
      
      // Constrain between 20% and 80%
      if (newWidth >= 20 && newWidth <= 80) {
        setEditorWidth(newWidth);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, stopResizing]);

  // --- Pan & Zoom Logic ---
  
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default browser zoom if ctrl is pressed, though here we want direct zoom
    // Note: We can't strictly preventDefault on a React passive event, 
    // but since the container has overflow-hidden, scroll shouldn't happen anyway.
    
    // Zoom factor: 10% per tick
    const scaleFactor = 1.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    
    setZoomLevel(prev => {
      let newZoom = direction > 0 ? prev * scaleFactor : prev / scaleFactor;
      // Clamp zoom
      newZoom = Math.min(5, Math.max(0.1, newZoom));
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default text selection
    setIsPanning(true);
    // Store the initial mouse position relative to the current pan offset
    dragStartRef.current = { 
      x: e.clientX - pan.x, 
      y: e.clientY - pan.y 
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };


  // Handle AI Generation
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiGenerating(true);
    try {
      const generatedCode = await generatePlantUML(aiPrompt, code);
      setCode(generatedCode);
      setIsAiModalOpen(false);
      setAiPrompt('');
    } catch (error) {
      alert(t.errorGenerate);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Download Handler
  const handleDownload = async (format: 'png' | 'svg' | 'pdf' | 'txt') => {
    if (!code.trim()) return;
    setIsDownloading(true);
    setIsDownloadMenuOpen(false);

    try {
      // Special handling for PDF to fix Chinese character rendering
      if (format === 'pdf') {
        const svgUrl = await renderDiagram(code, 'svg');
        if (!svgUrl) throw new Error("Failed to render SVG for PDF conversion");
        
        // Fetch the blob content to get raw SVG string
        const response = await fetch(svgUrl);
        const svgText = await response.text();
        
        // Open a new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Print to PDF - PlantUML Studio</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                  svg { max-width: 100%; height: auto; }
                  @media print { @page { size: auto; margin: 0mm; } }
                </style>
              </head>
              <body>
                ${svgText}
                <script>
                  // Wait for resources then print
                  window.onload = () => {
                    setTimeout(() => {
                      window.print();
                      window.close();
                    }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        } else {
            alert(t.popupBlocked);
        }
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(svgUrl), 1000);
        setIsDownloading(false);
        return;
      }

      // Standard Download Logic for PNG, SVG, TXT
      let downloadUrl = '';
      const filename = `diagram.${format}`;

      if (format === 'txt') {
        const blob = new Blob([code], { type: 'text/plain' });
        downloadUrl = URL.createObjectURL(blob);
      } else {
        // Fetch specific format from Kroki
        downloadUrl = await renderDiagram(code, format);
      }

      if (downloadUrl) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Cleanup blob
        if (downloadUrl.startsWith('blob:')) {
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        }
      } else {
        alert(t.errorDownload);
      }
    } catch (e) {
      console.error("Download failed", e);
      alert(t.errorDownload);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const toggleLanguage = () => {
    setLang(current => current === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200 overflow-hidden transition-colors duration-200">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shrink-0 transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg transition-colors">
            <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">PlantUML <span className="text-indigo-600 dark:text-indigo-400">AI Studio</span></h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
           {/* Language Toggle */}
           <button 
            onClick={toggleLanguage}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all font-medium text-sm flex items-center"
            title="Switch Language"
          >
            <Languages className="w-4 h-4 mr-1" />
            {lang === 'en' ? 'EN' : '中'}
          </button>

           {/* Theme Toggle */}
           <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 mr-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
            title={t.switchTheme}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* View Mode Toggles */}
          <div className="hidden md:flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1 mr-4 border border-gray-200 dark:border-slate-700 transition-colors">
            <button 
              onClick={() => setViewMode(ViewMode.Editor)}
              className={`p-2 rounded-md transition-all ${viewMode === ViewMode.Editor ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
              title={t.editorOnly}
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode(ViewMode.Split)}
              className={`p-2 rounded-md transition-all ${viewMode === ViewMode.Split ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
              title={t.splitView}
            >
              <Columns className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode(ViewMode.Preview)}
              className={`p-2 rounded-md transition-all ${viewMode === ViewMode.Preview ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
              title={t.previewOnly}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>

          <Button 
            variant="primary" 
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => setIsAiModalOpen(true)}
          >
            {t.askAi}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Editor Pane */}
        <div 
          className={`flex flex-col border-r border-gray-200 dark:border-slate-800 transition-none ease-linear relative bg-white dark:bg-slate-950
            ${viewMode === ViewMode.Editor ? 'w-full' : viewMode === ViewMode.Split ? '' : 'hidden'}
          `}
          style={viewMode === ViewMode.Split ? { width: `${editorWidth}%` } : {}}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400 transition-colors">
            <span>{t.sourceCode}</span>
            <button 
              onClick={handleCopyCode} 
              className="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {copySuccess ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              <span>{copySuccess ? t.copied : t.copy}</span>
            </button>
          </div>
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="flex-1 w-full p-4 font-mono text-sm leading-6 resize-none focus:outline-none 
              bg-white dark:bg-slate-950 
              text-gray-900 dark:text-slate-300 
              selection:bg-indigo-100 dark:selection:bg-indigo-500/30
              placeholder-gray-400 dark:placeholder-slate-600
              transition-colors duration-200"
            spellCheck={false}
            placeholder="@startuml..."
          />
        </div>

        {/* Resizer Handle (Only in Split Mode) */}
        {viewMode === ViewMode.Split && (
          <div 
            className="w-1.5 cursor-col-resize flex-shrink-0 z-20 transition-colors flex items-center justify-center group 
              bg-gray-100 dark:bg-slate-900 
              hover:bg-indigo-400 dark:hover:bg-indigo-500 
              border-l border-r border-gray-200 dark:border-slate-800 dark:hover:border-indigo-500 hover:border-indigo-400"
            onMouseDown={startResizing}
          >
             <div className="h-8 w-0.5 rounded-full transition-colors bg-gray-300 dark:bg-slate-700 group-hover:bg-white" />
          </div>
        )}

        {/* Preview Pane */}
        <div 
          className={`flex flex-col transition-none ease-linear relative bg-gray-100 dark:bg-slate-900
            ${viewMode === ViewMode.Preview ? 'w-full' : 'flex-1'}
            ${viewMode === ViewMode.Editor ? 'hidden' : ''}
          `}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400 shrink-0 z-10 transition-colors">
            <span>{t.previewLabel}</span>
            <div className="flex items-center space-x-2">
              <button onClick={() => setZoomLevel(z => Math.max(0.1, z / 1.1))} className="p-1 hover:text-gray-900 dark:hover:text-white transition-colors"><ZoomOut className="w-3 h-3" /></button>
              <span className="w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(z => Math.min(5, z * 1.1))} className="p-1 hover:text-gray-900 dark:hover:text-white transition-colors"><ZoomIn className="w-3 h-3" /></button>
              <button onClick={resetView} className="p-1 hover:text-gray-900 dark:hover:text-white ml-2 transition-colors" title={t.resetView}><RotateCcw className="w-3 h-3" /></button>
              
              <div className="h-4 w-px bg-gray-300 dark:bg-slate-700 mx-2 transition-colors" />

              {/* Download Dropdown */}
              <div className="relative" ref={downloadMenuRef}>
                <button 
                  onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                  className={`flex items-center space-x-1 p-1 pr-2 rounded transition-colors
                    ${isDownloading ? 'opacity-50 cursor-wait' : 'hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                  disabled={isDownloading}
                >
                  <Download className="w-3 h-3" />
                  <span>{t.download}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isDownloadMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-xl py-1 z-50 text-gray-700 dark:text-slate-200 animate-in fade-in zoom-in duration-100">
                    <button onClick={() => handleDownload('png')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center transition-colors">
                      <FileImage className="w-4 h-4 mr-2 text-green-500 dark:text-green-400" /> {t.downloadPng}
                    </button>
                    <button onClick={() => handleDownload('svg')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center transition-colors">
                      <Code2 className="w-4 h-4 mr-2 text-orange-500 dark:text-orange-400" /> {t.downloadSvg}
                    </button>
                     <button onClick={() => handleDownload('pdf')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center transition-colors group">
                      <div className="flex flex-1 items-center">
                        <Printer className="w-4 h-4 mr-2 text-red-500 dark:text-red-400" /> 
                        <div className="flex flex-col">
                          <span>{t.downloadPdf}</span>
                          <span className="text-[10px] text-gray-400 group-hover:text-gray-500 dark:text-slate-500 dark:group-hover:text-slate-400">{t.pdfHint}</span>
                        </div>
                      </div>
                    </button>
                    <div className="h-px bg-gray-200 dark:bg-slate-700 my-1" />
                    <button onClick={() => handleDownload('txt')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center transition-colors">
                      <FileCode className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" /> {t.downloadTxt}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div 
            className={`flex-1 overflow-hidden flex items-center justify-center p-0 transition-colors duration-200
              ${isDarkMode ? "bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" : "bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"}
              ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}
            `}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
             {imageUrl ? (
               <div 
                style={{ 
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` 
                }}
                className="transition-transform duration-75 ease-out origin-center will-change-transform"
               >
                 <img 
                   src={imageUrl} 
                   alt="PlantUML Diagram" 
                   className="shadow-2xl rounded-sm bg-white pointer-events-none select-none" // prevent browser drag on img
                   onError={(e) => {
                     (e.target as HTMLImageElement).style.opacity = '0.5';
                   }}
                 />
               </div>
             ) : (
               <div className="text-gray-400 dark:text-slate-600 flex flex-col items-center transition-colors pointer-events-none select-none">
                 <Maximize2 className="w-12 h-12 mb-4 opacity-20" />
                 <p>{t.emptyState}</p>
               </div>
             )}
          </div>
        </div>
      </main>

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 transition-colors">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{t.aiModalTitle}</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                {t.aiModalLabel}
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full h-32 rounded-lg p-3 outline-none resize-none transition-colors border focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  bg-white dark:bg-slate-950 
                  border-gray-300 dark:border-slate-700 
                  text-gray-900 dark:text-slate-200 
                  placeholder-gray-400 dark:placeholder-slate-600"
                placeholder={t.aiModalPlaceholder}
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">
                {t.aiModalFooter}
              </p>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 flex justify-end space-x-3 transition-colors">
              <Button variant="ghost" onClick={() => setIsAiModalOpen(false)}>{t.cancel}</Button>
              <Button 
                variant="primary" 
                onClick={handleAiGenerate} 
                isLoading={isAiGenerating}
                disabled={!aiPrompt.trim()}
              >
                {isAiGenerating ? t.generating : t.generate}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
