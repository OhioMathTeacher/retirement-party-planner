import { useState, useEffect } from 'react'
import './App-light.css'
import { db, storage } from './firebase'
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [memories, setMemories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      setFormData({
        ...formData,
        media: file,
        mediaPreview: URL.createObjectURL(file)
      })
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

      await withTimeout(addDoc(collection(db, 'memories'), {
        name: formData.name,
        memory: formData.memory,
        isPublic: formData.isPublic,
        media: mediaUrl,
        mediaType: mediaType,
        timestamp: new Date().toISOString()
      }))

      setFormData({
        name: '',
        memory: '',
        isPublic: true,
        media: null,
        mediaPreview: null
      })

      alert('Thank you for sharing your memory!')
      setCurrentView('home')

    } catch (error) {
      console.error("Error saving to Firebase: ", error)
      alert("Uh oh, something went wrong saving your memory. Please try again!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const publicMemories = memories.filter(m => m.isPublic)

  return (
    <div className="App">
      {currentView === 'home' && (
        <div className="home-view">
          <div className="hero-banner">
            <img src="/photos/20151020_K04116_344.jpg" alt="Campus in Autumn" className="hero-img" />
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
              <p>Type your story or tribute here. You can choose to keep it private for Catherine or share it publicly.</p>
              <button className="section-btn">Share Your Memory →</button>
            </div>

            <div className="section-card" onClick={() => setCurrentView('upload')}>
              <h2>Upload Photos or Video</h2>
              <p>Upload images or videos, or record a video message right here in the app.</p>
              <button className="section-btn">Upload Media →</button>
            </div>

            <div className="section-card" onClick={() => setCurrentView('outreach')}>
              <h2>Outreach & Contacts</h2>
              <p>Invite others to contribute, or view the stream of shared memories if made public.</p>
              <button className="section-btn">View & Share →</button>
            </div>
          </div>
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

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Submit Memory'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => { setIsSubmitting(false); setCurrentView('home') }}>
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

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={!formData.media || isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload Media'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => { setIsSubmitting(false); setCurrentView('home') }}>
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
             <img src="/photos/20241104_K12125_005.jpg" alt="Autumn Leaves" />
          </div>

          <h2>Outreach & Public Memories</h2>
          
          <div className="share-section">
            <h3>Invite Others</h3>
            <p>Share this link to invite others to contribute to the tribute:</p>
            <div className="share-link">
              <input 
                type="text" 
                value={window.location.href} 
                readOnly 
                onClick={(e) => e.target.select()}
                title="This is the direct link to this website"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied to clipboard!')
                }}
                className="copy-btn"
                title="Click to copy the website address to your clipboard"
              >
                Copy Link
              </button>
            </div>
          </div>

          <div className="memories-stream">
            <h3>Public Memories ({publicMemories.length})</h3>
            
            {publicMemories.length === 0 ? (
              <p className="no-memories">No public memories shared yet. Be the first!</p>
            ) : (
              <div className="memories-grid">
                {publicMemories.map(memory => (
                  <div key={memory.id} className="memory-card">
                    <div className="memory-header">
                      <strong>{memory.name}</strong>
                      <span className="memory-date">
                        {new Date(memory.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {memory.media && (
                      <div className="memory-media">
                        {memory.mediaType === 'image' ? (
                          <img src={memory.media} alt="Memory" loading="lazy" />
                        ) : (
                          <video src={memory.media} controls />
                        )}
                      </div>
                    )}
                    
                    {memory.memory && (
                      <p className="memory-text">{memory.memory}</p>
                    )}
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
