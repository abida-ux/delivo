import './MaintenancePage.css';

const OFFICIAL_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb80B4rC6ZvYtmpbxz2T';

export default function MaintenancePage() {
  return (
    <main className="maintenance-page" aria-labelledby="maintenance-title">
      <div className="maintenance-panel">
        <div className="maintenance-mark" aria-hidden="true">!</div>
        <p className="maintenance-eyebrow">Delivo</p>
        <h1 id="maintenance-title">System Currently Under Maintenance</h1>
        <p className="maintenance-message">
          We will inform you when we are back. Stay updated by joining our official channel.
        </p>
        <a
          className="maintenance-channel-link"
          href={OFFICIAL_CHANNEL_URL}
          target="_blank"
          rel="noreferrer"
        >
          Join Our Official Channel
        </a>
        <p className="maintenance-url">{OFFICIAL_CHANNEL_URL}</p>
      </div>
    </main>
  );
}