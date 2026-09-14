import { ImageResponse } from 'next/og';
import { voiceprintHeights } from '@/lib/waveform';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const heights = voiceprintHeights('xiansheng', 5);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '2px',
          background: '#16171b',
          padding: '5px',
        }}
      >
        {heights.map((h, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: `${Math.round(6 + h * 16)}px`,
              background: '#ce7c3e',
              borderRadius: '2px',
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
