import React, { useState, useRef } from 'react';

interface VideoBackgroundProps {
  children: React.ReactNode;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ children }) => {
  const [, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const vidRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div className="relative min-h-screen">
      {/* Video Background */}
      <video
        ref={vidRef}
        className="fixed top-0 left-0 w-full h-full object-cover -z-20"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadStart={() => setStatus('loading')}
        onLoadedData={() => setStatus('ready')}
        onCanPlay={() => setStatus('ready')}
        onError={(e) => {
          // eslint-disable-next-line no-console
          console.error('Background video error', e);
          setStatus('error');
        }}
      >
        <source src="/videos/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay untuk membuat video lebih gelap dan konten lebih mudah dibaca */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/25 -z-10" />



      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default VideoBackground;