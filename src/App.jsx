import { useState, useEffect } from 'react'
import './App-light.css'
import heroBg from './assets/20241104_K12125_005.jpg'
import { db, storage } from './firebase'
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [memories, setMemories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [lightboxItem, setLightboxItem] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    memory: '',
    isPublic: true,
    media: null,
    mediaPreview: null
  })

  useEffect(() => {
    const q = query(collection(db, 'memories'), orderBy('timestamp', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveMemories = []
      snapshot.forEach((doc) => {
        liveMemories.push({ id: doc.id, ...doc.data() })
      })
      setMemories(liveMemories)
    })
    return () => unsubscribe()
  }, [])

  const handleMediaUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, media: file, mediaPreview: URL.createObjectURL(file) })
    }
  }

  const withTimeout = (promise, ms = 15000) => {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), ms)
    )
    return Promise.race([promise, timeout])
  }

  const handleSubmitMemory = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let mediaUrl = null
      let mediaType = null

      if (formData.media) {
        const fileRef = ref(storage, `memories/${Date.now()}_${formData.media.name}`)
        await withTimeout(uploadBytes(fileRef, formData.media))
        mediaUrl = await withTimeout(getDownloadURL(fileRef))
        mediaType = formData.media.type.startsWith('image') ? 'image' : 'video'
      }

      addDoc(collection(db, 'memories'), {
        name: formData.name,
        memory: formData.memory,
        isPublic: formData.isPublic,
        media: mediaUrl,
        mediaType: mediaType,
        timestamp: new Date().toISOString()
      }).catch(err => console.error("Firebase write failed:", err))

      setFormData({ name: '', memory: '', isPublic: true, media: null, mediaPreview: null })
      setIsSubmitting(false)
      setSubmitStatus({ type: 'success', message: 'Thank you for sharing your memory!' })
      setTimeout(() => { setSubmitStatus(null); setCurrentView('home') }, 2000)

    } catch (error) {
      console.error("Error saving to Firebase: ", error)
      setIsSubmitting(false)
      setSubmitStatus({ type: 'error', message: 'Something went wrong saving your memory. Please try again.' })
    }
  }

  const publicMemories = memories.filter(m => m.isPublic)
  const mediaMemories = publicMemories.filter(m => m.media)
  const textMemories = publicMemories.filter(m => m.memory && !m.media)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  return (
    <div className="App">

      {/* Lightbox */}
      {lightboxItem && (
        <div className="lightbox" onClick={() => setLightboxItem(null)}>
          <button className="lightbox-close" onClick={() => setLightboxItem(null)}>✕</button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            {lightboxItem.mediaType === 'image' ? (
              <img src={lightboxItem.media} alt={lightboxItem.memory || 'Memory'} />
            ) : (
              <video src={lightboxItem.media} controls autoPlay />
            )}
            <div className="lightbox-caption">
              <strong>{lightboxItem.name}</strong>
              {lightboxItem.memory && <p>{lightboxItem.memory}</p>}
            </div>
          </div>
        </div>
      )}

      {currentView === 'home' && (
        <div className="home-view">
          <div className="hero-banner">
            <img src={heroBg} alt="Catherine's Retirement" className="hero-img" />
            <div className="hero-content">
              <h1>Welcome to Catherine's Retirement Tribute</h1>
              <p className="subtitle">
                Please help us celebrate Catherine by sharing your memories, photos, videos,
                or by inviting others to contribute. Use the sections below to participate!
              </p>
            </div>
          </div>

          <div className="sections">
            <div className="section-card" onClick={() => setCurrentView('share')}>
              <h2>Share a Memory</h2>
              <p>Write your story or tribute. Keep it private for Catherine or share it publicly.</p>
              <button className="section-btn">Share Your Memory →</button>
            </div>

            <div className="section-card" onClick={() => setCurrentView('upload')}>
              <h2>Upload Photos or Video</h2>
              <p>Upload images or videos to add to the tribute gallery.</p>
              <button className="section-btn">Upload Media →</button>
            </div>

            <div className="section-card" onClick={() => setCurrentView('outreach')}>
              <h2>View Tributes</h2>
              <p>Browse the photo gallery, read shared memories, and invite others to contribute.</p>
              <button className="section-btn">View Tributes →</button>
            </div>
          </div>

          {publicMemories.length > 0 && (
            <div className="home-feed">
              <h3>Recent Memories</h3>
              <div className="home-feed-grid">
                {publicMemories.slice(0, 5).map(memory => (
                  <div key={memory.id} className="home-feed-card">
                    {memory.media && memory.mediaType === 'image' && (
                      <img src={memory.media} alt={memory.memory || 'Memory'} loading="lazy" />
                    )}
                    <div className="home-feed-body">
                      <strong>{memory.name}</strong>
                      {memory.memory && <p>{memory.memory}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <button className="see-all-btn" onClick={() => setCurrentView('outreach')}>
                See all tributes →
              </button>
            </div>
          )}
        </div>
      )}

      {currentView === 'share' && (
        <div className="form-view">
          <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>
          <h2>Share Your Memory of Catherine</h2>

          <form onSubmit={handleSubmitMemory}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Your Memory</label>
              <textarea
                value={formData.memory}
                onChange={(e) => setFormData({...formData, memory: e.target.value})}
                required
                placeholder="Share your favorite memory, story, or tribute to Catherine..."
                rows="8"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                />
                <span>Share publicly (uncheck to keep private for Catherine only)</span>
              </label>
            </div>

            {submitStatus && (
              <div className={`submit-status ${submitStatus.type}`}>{submitStatus.message}</div>
            )}

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Submit Memory'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => { setIsSubmitting(false); setSubmitStatus(null); setCurrentView('home') }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {currentView === 'upload' && (
        <div className="form-view">
          <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>
          <h2>Upload Photos or Videos</h2>

          <form onSubmit={handleSubmitMemory}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Upload Media</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="file-input"
                required
              />
              {formData.mediaPreview && (
                <div className="media-preview">
                  {formData.media?.type.startsWith('image') ? (
                    <img src={formData.mediaPreview} alt="Preview" />
                  ) : (
                    <video src={formData.mediaPreview} controls />
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Caption (Optional)</label>
              <textarea
                value={formData.memory}
                onChange={(e) => setFormData({...formData, memory: e.target.value})}
                placeholder="Add a caption or context for this photo/video..."
                rows="4"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                />
                <span>Share publicly</span>
              </label>
            </div>

            {submitStatus && (
              <div className={`submit-status ${submitStatus.type}`}>{submitStatus.message}</div>
            )}

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={!formData.media || isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload Media'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => { setIsSubmitting(false); setSubmitStatus(null); setCurrentView('home') }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

{currentView === 'outreach' && (
        <div className="outreach-view">
          <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>

          <div className="outreach-header-image">
            <img src={heroBg} alt="Autumn Leaves" />
          </div>

          <h2>View Tributes</h2>

          <div className="share-section">
            <h3>Invite Others</h3>
            <p>Share this link to invite others to contribute to the tribute:</p>
            <div className="share-link">
              <input
                type="text"
                value={window.location.href}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button onClick={handleCopyLink} className="copy-btn">
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {mediaMemories.length > 0 && (
            <div className="memories-stream">
              <h3>Photos & Videos ({mediaMemories.length})</h3>
              <div className="gallery-grid">
                {mediaMemories.map(memory => (
                  <div key={memory.id} className="gallery-item" onClick={() => setLightboxItem(memory)}>
                    {memory.mediaType === 'image' ? (
                      <img src={memory.media} alt={memory.memory || 'Memory'} loading="lazy" />
                    ) : (
                      <video src={memory.media} />
                    )}
                    <div className="gallery-caption">
                      <strong>{memory.name}</strong>
                      {memory.memory && <p>{memory.memory}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="memories-stream">
            <h3>Written Memories ({textMemories.length})</h3>

            {textMemories.length === 0 ? (
              <p className="no-memories">No written memories shared yet. Be the first!</p>
            ) : (
              <div className="memories-grid">
                {textMemories.map(memory => (
                  <div key={memory.id} className="memory-card">
                    <div className="memory-header">
                      <strong>{memory.name}</strong>
                      <span className="memory-date">
                        {new Date(memory.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="memory-text">{memory.memory}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
