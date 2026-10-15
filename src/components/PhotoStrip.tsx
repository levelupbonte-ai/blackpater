import React from 'react';

export const PhotoStrip: React.FC = () => {
  const photos = [
    { src: '/media/3e0be360f5ad.webp', cap: 'Jean-Pierre Lofumbwa' },
    { src: '/media/db4bf6a012c1.webp', cap: 'Salt Lake City, Utah' },
    { src: '/media/fe552333c4cd.webp', cap: 'Ambassadeur Banafro' },
    { src: '/media/50471a19bc72.webp', cap: 'Éducateur & Mentor' },
    { src: '/media/331bab387390.webp', cap: 'Columbia College Honneur' },
    { src: '/media/0e1ee5dff864.webp', cap: 'Diaspora Congolaise' },
    { src: '/media/880bac4f1415.jpg', cap: 'Presse VoyageUtah' },
  ];

  return (
    <section className="strip" aria-label="Galerie Photos">
      <div className="strip__row">
        {[...photos, ...photos].map((p, idx) => (
          <div key={idx} className="strip__set">
            <figure>
              <div
                className="im"
                style={{
                  backgroundImage: `url(${p.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <figcaption>{p.cap}</figcaption>
            </figure>
          </div>
        ))}
      </div>
    </section>
  );
};
