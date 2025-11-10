import React from 'react';

// Read all investor logos from public/investors (filenames only, for demo use static list)
const investorLogos = [
  '/investors/investor1.png',
  '/investors/investor2.png',
  '/investors/investor3.png',
  '/investors/investor4.png',
  '/investors/investor5.png',
];

export default function InvestorsBar() {
  // Duplicate the logos for seamless looping
  const allLogos = [...investorLogos, ...investorLogos];
  return (
    <div className="investor-carousel-outer">
      <div className="investor-carousel-track">
        {allLogos.map((src, i) => (
          <img
            key={src + '-' + i}
            src={src}
            alt="Investor Logo"
            className="h-14 w-auto object-contain drop-shadow-lg opacity-90 hover:scale-110 transition-transform duration-300"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}