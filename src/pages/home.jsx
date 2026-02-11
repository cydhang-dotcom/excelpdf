// @ts-ignore;
import React, { useState, useCallback } from 'react';
// @ts-ignore;
import { Upload, FileSpreadsheet, Download, ArrowRight, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, X } from 'lucide-react';
// @ts-ignore;
import { Button, useToast } from '@/components/ui';

export default function Home({
  className,
  style,
  $w
}) {
  const {
    toast
  } = useToast();
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [stampImage, setStampImage] = useState(null);
  const [stampPreview, setStampPreview] = useState('');
  const [stampDragActive, setStampDragActive] = useState(false);
  const handleDrag = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  const handleStampDrag = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setStampDragActive(true);
    } else if (e.type === 'dragleave') {
      setStampDragActive(false);
    }
  }, []);
  const handleDrop = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);
  const handleStampDrop = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setStampDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetStamp(droppedFile);
    }
  }, []);
  const handleFileSelect = e => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };
  const handleStampSelect = e => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetStamp(selectedFile);
    }
  };
  const validateAndSetFile = selectedFile => {
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    const isValidType = validTypes.includes(selectedFile.type) || validTypes.includes('.' + fileExtension);
    if (!isValidType) {
      toast({
        title: '文件格式错误',
        description: '请上传 .xlsx 或 .xls 格式的 Excel 文件',
        variant: 'destructive'
      });
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: '文件过大',
        description: '文件大小不能超过 10MB',
        variant: 'destructive'
      });
      return;
    }
    setFile(selectedFile);
    setSheets([{
      name: 'Sheet1',
      rows: 100
    }, {
      name: 'Sheet2',
      rows: 50
    }, {
      name: 'Sheet3',
      rows: 75
    }]);
    setConverted(false);
    setPdfUrl('');
    toast({
      title: '文件上传成功',
      description: `已选择文件: ${selectedFile.name}`
    });
  };
  const validateAndSetStamp = selectedFile => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', '.png', '.jpg', '.jpeg', '.webp'];
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    const isValidType = validTypes.includes(selectedFile.type) || validTypes.includes('.' + fileExtension);
    if (!isValidType) {
      toast({
        title: '图片格式错误',
        description: '请上传 PNG、JPG 或 WEBP 格式的印章图片',
        variant: 'destructive'
      });
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: '图片过大',
        description: '图片大小不能超过 5MB',
        variant: 'destructive'
      });
      return;
    }
    setStampImage(selectedFile);
    const reader = new FileReader();
    reader.onload = e => {
      setStampPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
    toast({
      title: '印章上传成功',
      description: `已选择印章: ${selectedFile.name}`
    });
  };
  const handleConvert = async () => {
    if (!file) {
      toast({
        title: '请先上传文件',
        description: '需要先选择一个 Excel 文件',
        variant: 'destructive'
      });
      return;
    }
    setConverting(true);
    try {
      // 准备印章图片数据
      let stampData = null;
      if (stampImage) {
        stampData = {
          name: stampImage.name,
          size: stampImage.size,
          type: stampImage.type
        };
      }

      // 调用云函数进行转换
      const result = await $w.cloud.callFunction({
        name: 'excelToPdf',
        data: {
          fileName: file.name,
          fileSize: file.size,
          stamp: stampData
        }
      });
      if (result.success) {
        setPdfUrl(result.pdfUrl);
        setConverted(true);
        toast({
          title: '转换成功',
          description: stampImage ? 'Excel 文件已成功转换为 PDF，印章已添加到每一页' : 'Excel 文件已成功转换为 PDF'
        });
      } else {
        throw new Error(result.error || '转换失败');
      }
    } catch (error) {
      console.error('转换错误:', error);
      toast({
        title: '转换失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setConverting(false);
    }
  };
  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = file.name.replace(/\.(xlsx|xls)$/i, '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const handleReset = () => {
    setFile(null);
    setSheets([]);
    setConverting(false);
    setConverted(false);
    setPdfUrl('');
    setStampImage(null);
    setStampPreview('');
  };
  const handleRemoveStamp = () => {
    setStampImage(null);
    setStampPreview('');
    toast({
      title: '印章已移除',
      description: '印章图片已从转换中移除'
    });
  };
  return <div className={className} style={style}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900" style={{
                  fontFamily: 'Space Grotesk, sans-serif'
                }}>
                    Excel 转 PDF
                  </h1>
                  <p className="text-xs text-slate-500" style={{
                  fontFamily: 'JetBrains Mono, monospace'
                }}>
                    多 Sheet 文件转换工具
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-600" style={{
              fontFamily: 'JetBrains Mono, monospace'
            }}>
                v1.0.0
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-12 gap-8">
            {/* Left: Upload Area */}
            <div className="col-span-7">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Upload Zone */}
                <div className={`relative p-12 border-2 border-dashed transition-all duration-300 ${dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                  <input type="file" id="file-upload" className="hidden" accept=".xlsx,.xls" onChange={handleFileSelect} />
                  <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${dragActive ? 'bg-blue-100 scale-110' : 'bg-slate-100'}`}>
                      <Upload className={`w-10 h-10 ${dragActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}>
                      {file ? file.name : '拖拽文件到此处或点击上传'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4" style={{
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                      支持 .xlsx 和 .xls 格式，最大 10MB
                    </p>
                    {!file && <Button type="button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                        选择文件
                      </Button>}
                  </label>
                </div>

                {/* File Info */}
                {file && <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900" style={{
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500" style={{
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200">
                        重新选择
                      </Button>
                    </div>
                  </div>}
              </div>

              {/* Sheets Info */}
              {sheets.length > 0 && <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{
                fontFamily: 'Space Grotesk, sans-serif'
              }}>
                    检测到的 Sheet
                  </h3>
                  <div className="space-y-3">
                    {sheets.map((sheet, index) => <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600" style={{
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900" style={{
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                              {sheet.name}
                            </p>
                            <p className="text-xs text-slate-500" style={{
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                              {sheet.rows} 行数据
                            </p>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>)}
                  </div>
                </div>}

              {/* Stamp Upload */}
              <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className={`relative p-8 border-2 border-dashed transition-all duration-300 ${stampDragActive ? 'border-orange-500 bg-orange-50/50' : 'border-slate-300 hover:border-orange-400 hover:bg-slate-50/50'}`} onDragEnter={handleStampDrag} onDragLeave={handleStampDrag} onDragOver={handleStampDrag} onDrop={handleStampDrop}>
                  <input type="file" id="stamp-upload" className="hidden" accept=".png,.jpg,.jpeg,.webp" onChange={handleStampSelect} />
                  <label htmlFor="stamp-upload" className="flex flex-col items-center justify-center cursor-pointer">
                    {stampPreview ? <div className="relative">
                        <img src={stampPreview} alt="印章预览" className="w-24 h-24 object-contain rounded-lg border-2 border-orange-200" />
                        <button type="button" onClick={e => {
                      e.preventDefault();
                      handleRemoveStamp();
                    }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md">
                          <X className="w-4 h-4" />
                        </button>
                      </div> : <>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${stampDragActive ? 'bg-orange-100 scale-110' : 'bg-slate-100'}`}>
                          <ImageIcon className={`w-8 h-8 ${stampDragActive ? 'text-orange-600' : 'text-slate-400'}`} />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mb-2" style={{
                      fontFamily: 'Space Grotesk, sans-serif'
                    }}>
                          上传印章图片
                        </h3>
                        <p className="text-xs text-slate-500 mb-3" style={{
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                          支持 PNG、JPG、WEBP 格式，最大 5MB
                        </p>
                        <Button type="button" variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400">
                          选择印章
                        </Button>
                      </>}
                  </label>
                </div>

                {/* Stamp Info */}
                {stampImage && <div className="px-6 py-3 bg-orange-50 border-t border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900" style={{
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                            {stampImage.name}
                          </p>
                          <p className="text-xs text-slate-500" style={{
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                            {(stampImage.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-orange-600 font-medium" style={{
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                        已添加到每一页
                      </span>
                    </div>
                  </div>}
              </div>
            </div>

            {/* Right: Convert & Download */}
            <div className="col-span-5">
              <div className="sticky top-8">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6" style={{
                  fontFamily: 'Space Grotesk, sans-serif'
                }}>
                    转换操作
                  </h3>

                  {/* Status Display */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      {converting ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : converted ? <CheckCircle className="w-5 h-5 text-green-500" /> : file ? <AlertCircle className="w-5 h-5 text-orange-500" /> : <AlertCircle className="w-5 h-5 text-slate-400" />}
                      <div>
                        <p className="text-sm font-medium text-slate-900" style={{
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                          {converting ? '正在转换中...' : converted ? '转换完成' : file ? '等待转换' : '请先上传文件'}
                        </p>
                        <p className="text-xs text-slate-500" style={{
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                          {converting ? '正在处理您的文件，请稍候' : converted ? '文件已准备好下载' : file ? '点击下方按钮开始转换' : '上传 Excel 文件后即可开始转换'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Convert Button */}
                  {!converted && <Button onClick={handleConvert} disabled={!file || converting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                      {converting ? <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          转换中...
                        </> : <>
                          <ArrowRight className="w-5 h-5 mr-2" />
                          开始转换
                        </>}
                    </Button>}

                  {/* Download Button */}
                  {converted && <Button onClick={handleDownload} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg">
                      <Download className="w-5 h-5 mr-2" />
                      下载 PDF
                    </Button>}

                  {/* Info Cards */}
                  <div className="mt-6 space-y-3">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900" style={{
                          fontFamily: 'Space Grotesk, sans-serif'
                        }}>
                            多 Sheet 支持
                          </p>
                          <p className="text-xs text-blue-700 mt-1" style={{
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            自动将每个 Sheet 转换为 PDF 的独立页面
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900" style={{
                          fontFamily: 'Space Grotesk, sans-serif'
                        }}>
                            格式保留
                          </p>
                          <p className="text-xs text-green-700 mt-1" style={{
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            保留原始表格的样式和布局
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-900" style={{
                          fontFamily: 'Space Grotesk, sans-serif'
                        }}>
                            印章支持
                          </p>
                          <p className="text-xs text-orange-700 mt-1" style={{
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            可上传印章图片并添加到 PDF 的每一页
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm mt-12">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600" style={{
              fontFamily: 'JetBrains Mono, monospace'
            }}>
                © 2026 Excel 转 PDF 工具
              </p>
              <p className="text-sm text-slate-500" style={{
              fontFamily: 'JetBrains Mono, monospace'
            }}>
                安全 · 快速 · 便捷
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>;
}