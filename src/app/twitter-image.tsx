import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'App Store Position - Track crypto app rankings';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Icon/Logo area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 30,
            }}
          >
            <span style={{ fontSize: 80 }}>📈</span>
          </div>
          
          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              background: 'linear-gradient(90deg, #ffffff 0%, #a5b4fc 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            App Store Position
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              fontSize: 32,
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: 800,
              marginBottom: 40,
            }}
          >
            Daily crypto app ranking notifications
          </div>
          
          {/* App badges */}
          <div
            style={{
              display: 'flex',
              gap: 20,
            }}
          >
            {['Coinbase', 'Polymarket', 'Phantom'].map((app) => (
              <div
                key={app}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 24,
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {app}
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#64748b',
            fontSize: 20,
          }}
        >
          <span>Free • Daily Updates • appstoreposition.com</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

