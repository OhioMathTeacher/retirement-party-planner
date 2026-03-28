import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Top Pane: Welcome */}
      <div className="top-pane">
        <h1>Welcome to Catherine's Retirement Tribute</h1>
        <p>
          Please help us celebrate Catherine by sharing your memories, photos, videos, or by inviting others to contribute. Use the sections below to participate!
        </p>
      </div>

      {/* Three Columns */}
      <div className="columns">
        {/* Memories Column */}
        <div className="column memories-column">
          <h2>Share a Memory</h2>
          <p>Type your story or tribute here. You can choose to keep it private for Catherine or share it publicly in the Outreach stream.</p>
          {/* (Form will go here) */}
        </div>

        {/* Media Upload Column */}
        <div className="column media-column">
          <h2>Upload Photos or Video</h2>
          <p>Upload images or videos, or record a video message right here in the app.</p>
          {/* (Upload/record UI will go here) */}
        </div>

        {/* Outreach/Contact Column */}
        <div className="column outreach-column">
          <h2>Outreach & Contacts</h2>
          <p>Invite others to contribute, or view the stream of shared memories if made public.</p>
          {/* (Contact form and shared memories stream will go here) */}
        </div>
      </div>
    </div>
  );
}

export default App;
