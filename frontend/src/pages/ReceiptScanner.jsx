import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Camera, CheckCircle2, AlertCircle, Loader, BarChart, Sparkles, Plus, Receipt } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import Tesseract from 'tesseract.js'

// Mock receipt files for demonstration
const SAMPLE_RECEIPTS = [
  {
    name: 'imtiaz-retail-pk.jpg',
    store: 'Imtiaz Super Market (Pakistan)',
    desc: 'Monthly staff cafeteria groceries in Karachi, Pakistan.',
    mockFile: new File([''], 'imtiaz_supermarket_groceries.jpg', { type: 'image/jpeg' })
  },
  {
    name: 'walmart-office-supplies.jpg',
    store: 'Walmart Stores Inc (USA)',
    desc: 'Stationery and printer cartridges for management office.',
    mockFile: new File([''], 'walmart_stationery_supplies.jpg', { type: 'image/jpeg' })
  },
  {
    name: 'metro-electronics.png',
    store: 'Metro Cash & Carry (Pakistan)',
    desc: 'Purchased 2 office monitors and computer mice in Lahore.',
    mockFile: new File([''], 'metro_electronics_it.png', { type: 'image/png' })
  }
]

export default function ReceiptScanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('')
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setResult(null)
    }
  }

  const handleSelectSample = (sample) => {
    setFile(sample.mockFile)
    // Create a mock graphical placeholder for preview
    setPreview('sample_loaded')
    setResult(null)
    toast.success(`Loaded sample: ${sample.name}`)
  }

  const triggerUpload = () => {
    fileInputRef.current.click()
  }

  const handleScan = async () => {
    if (!file) {
      toast.error('Please upload or select a receipt file first.')
      return
    }
    
    setScanning(true)
    setResult(null)
    setScanStatus('Initializing scanner...')
    
    let ocrText = ''
    
    // Check if it's a real file upload and a readable image
    if (preview !== 'sample_loaded' && file.type?.startsWith('image/')) {
      try {
        setScanStatus('Reading image characters (OCR)...')
        const ocrResult = await Tesseract.recognize(file, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              setScanStatus(`Extracting text: ${Math.round(m.progress * 100)}%`)
            }
          }
        })
        ocrText = ocrResult.data.text
        console.log('OCR Raw Text Extracted:', ocrText)
      } catch (ocrErr) {
        console.error('Client-side OCR extraction failed:', ocrErr)
        toast.error('Local text extraction failed. Uploading raw image to AI...')
      }
    }
    
    setScanStatus('Processing structured items with Groq Llama...')
    const formData = new FormData()
    formData.append('receipt', file)
    if (ocrText) {
      formData.append('ocrText', ocrText)
    }

    try {
      const { data } = await api.post('/ai/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(data.summary)
      toast.success('Receipt scanned successfully!')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to scan receipt. Please try again.')
    } finally {
      setScanning(false)
      setScanStatus('')
    }
  }

  const getCurrencySymbol = (curr) => {
    if (curr === 'PKR' || curr?.toLowerCase().includes('pkr') || curr?.includes('Rs')) return 'Rs. '
    if (curr === 'GBP') return '£'
    if (curr === 'EUR') return '€'
    return '$'
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Receipt size={24} className="text-primary-600" />
          AI Paylist & Receipt Scanner
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload any organization paylist, voucher, or receipt. Our Groq AI will instantly extract a structured itemized summary.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Upload Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card space-y-4">
            <h3 className="text-slate-900 font-bold text-sm">Upload Receipt</h3>
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,application/pdf"
              className="hidden" 
            />

            {/* Drop / Drag Area */}
            <div 
              onClick={triggerUpload}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                preview 
                  ? 'border-primary-500 bg-primary-50/5' 
                  : 'border-slate-300 hover:border-primary-400 bg-slate-50'
              }`}
            >
              {preview ? (
                <div className="space-y-3">
                  {preview === 'sample_loaded' ? (
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                      <FileText size={32} />
                    </div>
                  ) : (
                    <img src={preview} alt="Receipt Preview" className="max-h-40 mx-auto rounded-lg shadow-sm" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate">{file?.name}</p>
                    <p className="text-[10px] text-slate-400">Click to change file</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto text-slate-400" size={32} />
                  <p className="text-xs font-bold text-slate-700">Drag & drop receipt here</p>
                  <p className="text-[10px] text-slate-400">Supports PNG, JPG, JPEG, and PDF (max 10MB)</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={handleScan}
                disabled={!file || scanning}
                className="btn-primary flex-1 justify-center text-xs py-2.5 font-bold disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Scanning File...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Scan Receipt
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Demo Samples */}
          <div className="card space-y-3">
            <h3 className="text-slate-900 font-bold text-xs">Quick Demo Samples</h3>
            <div className="space-y-2">
              {SAMPLE_RECEIPTS.map((s, i) => (
                <div 
                  key={i}
                  onClick={() => handleSelectSample(s)}
                  className="flex items-start gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-primary-500/40 hover:bg-primary-50/5 cursor-pointer transition-all duration-200"
                >
                  <FileText size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Scan results (7 cols) */}
        <div className="lg:col-span-7">
          <div className="card h-full min-h-[400px] flex flex-col relative overflow-hidden">
            
            {/* Scanner Laser effect */}
            {scanning && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent shadow-[0_0_10px_#6366f1] animate-bounce z-10" style={{ animationDuration: '2.5s' }} />
            )}

            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-slate-900 font-bold text-sm">Scanning Analysis Output</h3>
              {result && (
                <span className="badge bg-green-50 border border-green-200 text-green-700 text-[10px] py-1 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={10} />
                  AI Processed
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center py-6">
              <AnimatePresence mode="wait">
                {scanning ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="text-center space-y-4"
                  >
                    <Loader size={36} className="animate-spin text-primary-500 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{scanStatus}</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Running client-side OCR and structuring results using Groq Llama model.</p>
                    </div>
                  </motion.div>
                ) : result ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Header info */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                      <div>
                        <p className="text-slate-400 text-[10px]">Merchant / Shop Name</p>
                        <p className="font-bold text-slate-800">{result.merchant}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px]">Date of Purchase</p>
                        <p className="font-bold text-slate-800">{result.date || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200/50">
                        <p className="text-slate-400 text-[10px]">AI Brief Summary</p>
                        <p className="text-slate-600 italic font-medium">{result.summary || 'Items scanned successfully.'}</p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                            <th className="p-2.5">Item Name</th>
                            <th className="p-2.5 text-center w-12">Qty</th>
                            <th className="p-2.5 text-right w-24">Price</th>
                            <th className="p-2.5 text-right w-24">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {result.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-medium truncate max-w-[120px] md:max-w-none">{item.name}</td>
                              <td className="p-2.5 text-center">{item.quantity}</td>
                              <td className="p-2.5 text-right">{getCurrencySymbol(result.currency)}{item.price.toLocaleString()}</td>
                              <td className="p-2.5 text-right font-semibold text-slate-900">{getCurrencySymbol(result.currency)}{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Breakdown Calc */}
                    <div className="flex flex-col items-end gap-1.5 pt-2 text-xs">
                      <div className="flex justify-between w-48 text-slate-500">
                        <span>Subtotal:</span>
                        <span>{getCurrencySymbol(result.currency)}{result.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between w-48 text-slate-500">
                        <span>Tax / VAT:</span>
                        <span>{getCurrencySymbol(result.currency)}{result.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between w-48 font-bold text-sm text-primary-600 border-t border-slate-200 pt-2">
                        <span>Total:</span>
                        <span>{getCurrencySymbol(result.currency)}{result.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* ERP Integration Option */}
                    <button 
                      onClick={() => {
                        toast.success(`Successfully logged ${getCurrencySymbol(result.currency)}${result.total.toLocaleString()} expense to organization records!`)
                        setResult(null)
                        setFile(null)
                        setPreview(null)
                      }}
                      className="btn-secondary w-full justify-center text-xs font-bold mt-2 py-2"
                    >
                      <Plus size={14} />
                      Log as Corporate Expense
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-center text-slate-400 space-y-2 py-10"
                  >
                    <FileText size={40} className="mx-auto opacity-30" />
                    <div>
                      <p className="text-xs font-semibold">No Receipt Scanned Yet</p>
                      <p className="text-[10px] max-w-xs mx-auto mt-1">Upload a receipt or pick a quick demo sample on the left, then click Scan to run the analysis.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
