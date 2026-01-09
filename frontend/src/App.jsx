import { useState, useRef, useEffect } from 'react'

function App() {
  const [image, setImage] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Canvas refs
  const canvasRef = useRef(null)
  const maskCanvasRef = useRef(null) // Offscreen canvas for the actual mask
  const imageRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(20)

  // Handle File Upload
  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setOriginalFile(file)
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        setImage(url)
        setProcessedImage(null)
      }
      img.src = url
      imageRef.current = img
    }
  }

  // Initialize Canvases
  useEffect(() => {
    if (image && canvasRef.current && maskCanvasRef.current && imageRef.current) {
      const img = imageRef.current
      // Visual Canvas
      const canvas = canvasRef.current
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      // Mask Canvas
      const maskCanvas = maskCanvasRef.current
      maskCanvas.width = img.width
      maskCanvas.height = img.height
      const maskCtx = maskCanvas.getContext('2d')
      maskCtx.fillStyle = 'black'
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    }
  }, [image])

  const startDrawing = (e) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = canvasRef.current?.getContext('2d')
    const maskCtx = maskCanvasRef.current?.getContext('2d')
    ctx?.beginPath()
    maskCtx?.beginPath()
  }

  const draw = (e) => {
    if (!isDrawing) return

    // Draw on Visual Canvas (Red)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)

    // Draw on Mask Canvas (White)
    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')

    maskCtx.lineWidth = brushSize
    maskCtx.lineCap = 'round'
    maskCtx.lineJoin = 'round'
    maskCtx.strokeStyle = 'white'

    maskCtx.lineTo(x, y)
    maskCtx.stroke()
    maskCtx.beginPath()
    maskCtx.moveTo(x, y)
  }

  // Submit for Processing
  const handleRemoveLogo = async () => {
    if (!maskCanvasRef.current || !originalFile) return

    setIsProcessing(true)

    // Convert mask canvas to blob
    maskCanvasRef.current.toBlob(async (maskBlob) => {
      const formData = new FormData()
      formData.append('image', originalFile)
      formData.append('mask', maskBlob, 'mask.png')

      try {
        const response = await fetch('http://localhost:5000/inpaint', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Processing failed')

        const blob = await response.blob()
        setProcessedImage(URL.createObjectURL(blob))
      } catch (error) {
        console.error(error)
        alert('Failed to remove logo. Check backend connection.')
      } finally {
        setIsProcessing(false)
      }
    }, 'image/png')
  }

  return (
    <div className="app-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <img src="/logo.png" alt="Invisio Logo" style={{ height: '80px', filter: 'drop-shadow(0 0 10px rgba(100, 100, 255, 0.5))' }} />
        <h1>Invisio</h1>
      </div>
      <canvas ref={maskCanvasRef} style={{ display: 'none' }} />

      {!image ? (
        <div className="glass-panel upload-container">
          <label className="upload-zone">
            <span style={{ fontSize: '3rem' }}>📂</span>
            <p>Click or Drag to Upload Image</p>
            <input type="file" accept="image/*" onChange={handleUpload} hidden />
          </label>
        </div>
      ) : (
        <div className="glass-panel workspace">
          <div className="toolbar flex-row">
            <button className="secondary" onClick={() => setImage(null)}>Analysis</button>
            <div className="flex-row">
              <label>Brush Size:</label>
              <input
                type="range"
                min="5"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
            </div>
            <button onClick={handleRemoveLogo} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : '✨ Remove Logo'}
            </button>
          </div>

          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onMouseMove={draw}
            />
          </div>
        </div>
      )}

      {processedImage && (
        <div className="glass-panel result">
          <h2>Result</h2>
          <img src={processedImage} alt="Cleaned" />
          <br />
          <a href={processedImage} download="clean_image.png">
            <button>Download Image</button>
          </a>
        </div>
      )}
    </div>
  )
}

export default App
