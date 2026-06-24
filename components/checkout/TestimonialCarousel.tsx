'use client';

import React, { useState, useEffect } from 'react';

const testimonials = [
  '/imagens/Screenshot_2026-06-24-11-53-07-674_com.whatsapp-edit.jpg.jpeg',
  '/imagens/Screenshot_2026-06-24-11-53-46-529_com.whatsapp-edit.jpg.jpeg',
  '/imagens/Screenshot_2026-06-24-20-25-04-118_com.google.android.youtube-edit.jpg.jpeg',
  '/imagens/Screenshot_2026-06-24-20-28-55-109_com.google.android.youtube-edit.jpg.jpeg',
];

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 8000); // Muda a cada 8 segundos para facilitar a leitura

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-500 hover:shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-pipa-orange uppercase tracking-wider">O que a comunidade acha</h3>
        <div className="flex gap-1">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-4 bg-pipa-blue' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden shadow-inner flex justify-center items-center">
        {testimonials.map((src, idx) => (
          <div
            key={idx}
            className={`transition-opacity duration-1000 ${
              idx === currentIndex ? 'opacity-100 relative z-10 w-full' : 'opacity-0 absolute inset-0 z-0'
            }`}
          >
            <img
              src={src}
              alt="Depoimento de apoiador"
              className="w-full h-auto object-contain rounded-xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
