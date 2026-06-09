import { getApiBaseUrl, getAuthToken } from '../../api';

export default function ImageViewer({ sessionId, path }) {
  const src = `${getApiBaseUrl()}/api/sessions/${sessionId}/files/${path}?token=${encodeURIComponent(getAuthToken() || '')}`;

  return (
    <div className="viewer-image">
      <img src={src} alt={path} className="viewer-image__img" />
    </div>
  );
}
