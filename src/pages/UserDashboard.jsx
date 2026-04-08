import { useContext, useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import { AuthContext } from '../context/AuthContext'
import { notesAPI, resolveBackendFileUrl } from '../services/api'

function UserDashboard() {
  const { user, token, logout } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('home')
  const [allNotes, setAllNotes] = useState([])
  const [myNotes, setMyNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [message, setMessage] = useState('')
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: '',
    description: '',
    directFile: null,
    imageFiles: [],
    convertedPdfFile: null,
  })

  useEffect(() => {
    if (!user || user.role !== 'user') {
      window.location.href = '/login'
    }

    loadNotes()

    // Auto-refresh: poll notes every 4 seconds for live updates
    const refreshInterval = setInterval(() => {
      loadNotes()
    }, 4000)

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval)
  }, [user, token])

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

  const loadNotes = async () => {
    try {
      const allNotesData = await notesAPI.getAllNotes()
      setAllNotes(allNotesData.notes || [])

      if (token) {
        const myNotesData = await notesAPI.getUserNotes(token)
        setMyNotes(myNotesData.notes || [])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    }
  }

  const getFileTypeLabel = (note) => {
    const fileName = String(note?.pdfFileName || note?.pdfUrl || '').toLowerCase()
    const extension = fileName.includes('.') ? fileName.split('.').pop() : ''

    if (extension === 'pdf') return 'PDF'
    if (['doc', 'docx', 'docm', 'dot', 'dotx'].includes(extension)) return 'Word'
    if (extension === 'rtf') return 'RTF'
    if (extension === 'odt') return 'ODT'

    return extension ? extension.toUpperCase() : 'File'
  }

  const readImageAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
      reader.readAsDataURL(file)
    })

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load selected image'))
      img.src = src
    })

  const imageToJpegDataUrl = (img) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Image conversion context not available')
    }

    // White background avoids black/transparent artifacts in generated PDFs.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL('image/jpeg', 0.92)
  }

  const handleConvertToPdf = async () => {
    if (!uploadForm.imageFiles.length) {
      setMessage('Please select at least one image')
      return
    }

    setConverting(true)
    setMessage('')

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10

      for (let i = 0; i < uploadForm.imageFiles.length; i += 1) {
        const file = uploadForm.imageFiles[i]
        const dataUrl = await readImageAsDataUrl(file)
        const img = await loadImage(dataUrl)
        const jpegDataUrl = imageToJpegDataUrl(img)

        const availableWidth = pageWidth - margin * 2
        const availableHeight = pageHeight - margin * 2
        const scale = Math.min(availableWidth / img.width, availableHeight / img.height)
        const renderWidth = img.width * scale
        const renderHeight = img.height * scale
        const x = (pageWidth - renderWidth) / 2
        const y = (pageHeight - renderHeight) / 2

        if (i > 0) {
          doc.addPage()
        }

        doc.addImage(jpegDataUrl, 'JPEG', x, y, renderWidth, renderHeight)
      }

      const pdfBlob = doc.output('blob')
      const safeTitle = (uploadForm.title || 'shared-note').trim().replace(/\s+/g, '-').toLowerCase()
      const pdfFile = new File([pdfBlob], `${safeTitle || 'shared-note'}-${Date.now()}.pdf`, {
        type: 'application/pdf',
      })
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
      const nextPreviewUrl = URL.createObjectURL(pdfBlob)

      setUploadForm((prev) => ({
        ...prev,
        convertedPdfFile: pdfFile,
      }))
      setPdfPreviewUrl(nextPreviewUrl)
      setMessage(`PDF ready (${uploadForm.imageFiles.length} page${uploadForm.imageFiles.length > 1 ? 's' : ''})`)
    } catch (error) {
      setMessage('Error: ' + (error.message || 'Failed to convert images to PDF'))
    } finally {
      setConverting(false)
    }
  }

  const handleUploadNote = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('title', uploadForm.title)
      formData.append('subject', uploadForm.subject)
      formData.append('description', uploadForm.description)
      const selectedFile = uploadForm.directFile || uploadForm.convertedPdfFile
      const pageCount = uploadForm.convertedPdfFile ? uploadForm.imageFiles.length || 1 : 1
      formData.append('pageCount', String(pageCount))

      if (!selectedFile) {
        throw new Error('Please select a PDF/Word file or convert images to PDF first')
      }
      formData.append('pdfFile', selectedFile)

      await notesAPI.uploadNote(formData, token)
      setMessage('Note uploaded successfully!')
      setUploadForm({
        title: '',
        subject: '',
        description: '',
        directFile: null,
        imageFiles: [],
        convertedPdfFile: null,
      })
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
      setPdfPreviewUrl('')
      loadNotes()
    } catch (error) {
      setMessage('Error: ' + (error.message || 'Failed to upload note'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (confirm('Delete this note?')) {
      try {
        await notesAPI.deleteNote(noteId, token)
        loadNotes()
        setMessage('Note deleted successfully')
      } catch (error) {
        setMessage('Error: ' + (error.message || 'Failed to delete note'))
      }
    }
  }

  return (
    <main className="user-dashboard">
      <div className="user-container">
        {/* Sidebar */}
        <aside className="user-sidebar">
          <div className="sidebar-header">
            <h2>GPA Saver</h2>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              Home - All Notes
            </button>
            <button
              className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Share New Notes
            </button>
            <button
              className={`nav-item ${activeTab === 'mynotes' ? 'active' : ''}`}
              onClick={() => setActiveTab('mynotes')}
            >
              My Uploads
            </button>
          </nav>

          <div className="sidebar-footer">
            <p>
              <strong>{user?.name}</strong>
            </p>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="user-content">
          {/* Home Tab */}
          {activeTab === 'home' && (
            <section className="tab-content">
              <h1>Welcome, {user?.name}</h1>
              <p className="home-copy">
                Explore, download, and manage notes shared by your classmates.
              </p>
              <div className="home-card">
                <h3>Your Workspace</h3>
                <p>Manage your uploaded notes, convert images to PDF, and turn them in from the Share New Notes tab.</p>
              </div>
              <div className="home-notes-panel">
                <h3>All Shared Notes</h3>
                <div className="notes-grid">
                  {allNotes.map((note) => (
                    <div key={note._id} className="note-card">
                      <h3>{note.title}</h3>
                      <span className="file-type-badge">{getFileTypeLabel(note)}</span>
                      <p className="note-subject">Subject: {note.subject}</p>
                      <p className="note-desc">{note.description}</p>
                      <p className="note-meta">
                        Uploaded by <strong>{note.uploadedByName || note.uploadedBy?.name || note.uploadedByUsername}</strong>
                      </p>
                      <p className="note-date">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                      <div className="note-actions">
                        <a
                          href={resolveBackendFileUrl(note.pdfUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="view-btn"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                {allNotes.length === 0 && <p>No notes available yet</p>}
              </div>
            </section>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <section className="tab-content">
              <h1>Share New Notes</h1>
              {message && <div className="message">{message}</div>}
              <form onSubmit={handleUploadNote} className="upload-form">
                <div className="form-group">
                  <label>Note Title (Optional)</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="e.g., Chemistry 101 Notes"
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, description: e.target.value })
                    }
                    placeholder="Brief description of your notes"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Select PDF or Word File (Direct Upload)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.docm,.dot,.dotx,.rtf,.odt"
                    onChange={(e) => {
                      const file = (e.target.files || [])[0] || null
                      if (pdfPreviewUrl) {
                        URL.revokeObjectURL(pdfPreviewUrl)
                      }
                      setPdfPreviewUrl('')
                      setUploadForm({
                        ...uploadForm,
                        directFile: file,
                        imageFiles: [],
                        convertedPdfFile: null,
                      })
                    }}
                  />
                  <small className="field-helper">You can directly upload PDF or Word files.</small>
                </div>
                <div className="form-group">
                  <label>Select Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (pdfPreviewUrl) {
                        URL.revokeObjectURL(pdfPreviewUrl)
                      }
                      setPdfPreviewUrl('')
                      setUploadForm({
                        ...uploadForm,
                        directFile: null,
                        imageFiles: files,
                        convertedPdfFile: null,
                      })
                    }}
                  />
                  <small className="field-helper">
                    Optional: pick images, click Convert to PDF, then Turn In.
                  </small>
                </div>
                <button
                  type="button"
                  className="submit-btn secondary-btn"
                  disabled={
                    converting ||
                    loading ||
                    uploadForm.directFile !== null ||
                    uploadForm.imageFiles.length === 0
                  }
                  onClick={handleConvertToPdf}
                >
                  {converting ? 'Converting...' : 'Convert to PDF'}
                </button>
                {pdfPreviewUrl && (
                  <a href={pdfPreviewUrl} download="converted-note.pdf" className="view-btn">
                    Download Converted PDF
                  </a>
                )}
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Uploading...' : 'Turn In'}
                </button>
              </form>
            </section>
          )}

          {/* My Notes Tab */}
          {activeTab === 'mynotes' && (
            <section className="tab-content">
              <h1>My Uploaded Notes</h1>
              {message && <div className="message">{message}</div>}
              <div className="notes-grid">
                {myNotes.map((note) => (
                  <div key={note._id} className="note-card my-note">
                    <h3>{note.title}</h3>
                      <span className="file-type-badge">{getFileTypeLabel(note)}</span>
                    <p className="note-subject">Subject: {note.subject}</p>
                    <p className="note-desc">{note.description}</p>
                    <p className="note-meta">
                      Uploaded by <strong>{note.uploadedByName || user?.name}</strong>
                    </p>
                    <p className="note-date">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                    <div className="note-actions">
                      <a
                        href={resolveBackendFileUrl(note.pdfUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="view-btn"
                      >
                        View
                      </a>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteNote(note._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {myNotes.length === 0 && <p>No notes uploaded yet</p>}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

export default UserDashboard
