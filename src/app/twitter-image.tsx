import { ImageResponse } from 'next/og';

export const alt = 'KontentHub — LinkedIn content that sounds like you';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
        }}
      >
        <div style={{ marginBottom: 24, fontSize: 80 }}>KontentHub</div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          LinkedIn content that sounds like you
        </div>
      </div>
    ),
    size
  );
}
