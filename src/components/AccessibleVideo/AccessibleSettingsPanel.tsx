import React from 'react';

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

interface AccessibleSettingsPanelProps {
  onClose: () => void;
}

const AccessibleSettingsPanel: React.FC<AccessibleSettingsPanelProps> = ({ onClose }) => {
  // Mock devices for now - Stream SDK implementation will be updated when device selection is needed
  const cameras: MediaDeviceInfo[] = [{ deviceId: '1', label: 'Default Camera' }];
  const microphones: MediaDeviceInfo[] = [{ deviceId: '1', label: 'Default Microphone' }];
  const speakers: MediaDeviceInfo[] = [{ deviceId: '1', label: 'Default Speaker' }];

  return (
    <div 
      className="settings-panel"
      role="dialog"
      aria-label="Call settings"
      aria-modal="true"
    >
      <div className="settings-content">
        <button
          onClick={onClose}
          className="close-button"
          aria-label="Close settings"
        >
          ✕
        </button>

        <h2>Device Settings</h2>
        
        <div className="device-section">
          <label htmlFor="camera-select">Camera</label>
          <select id="camera-select">
            {cameras.map(camera => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId.slice(0, 4)}`}
              </option>
            ))}
          </select>
        </div>

        <div className="device-section">
          <label htmlFor="microphone-select">Microphone</label>
          <select id="microphone-select">
            {microphones.map(mic => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mic.deviceId.slice(0, 4)}`}
              </option>
            ))}
          </select>
        </div>

        <div className="device-section">
          <label htmlFor="speaker-select">Speaker</label>
          <select id="speaker-select">
            {speakers.map(speaker => (
              <option key={speaker.deviceId} value={speaker.deviceId}>
                {speaker.label || `Speaker ${speaker.deviceId.slice(0, 4)}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AccessibleSettingsPanel;