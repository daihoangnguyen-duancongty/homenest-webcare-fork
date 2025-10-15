import React, { useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion, useInView } from 'framer-motion';

const brands = [
  {
    name: 'Paint & More',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5zQ2Tq6h0kJfcCyS9NtHqjwx5GQ2HxczY4w&s',
  },
  {
    name: 'Song Quân Land',
    logo: 'data:image/png;base64,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',
  },
  {
    name: 'Gia Khang Home',
    logo: 'data:image/png;base64,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',
  },
  {
    name: 'Khánh Phong Plastic',
    logo: 'data:image/png;base64,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',
  },
];

export default function BrandCarousel() {
  const [emblaRef] = useEmblaCarousel(
    {
      axis: 'x',
      loop: true,
      dragFree: true,
      speed: 4,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  const styles = {
    timelineCarousel: {
      width: '100%',
      overflow: 'hidden',
      padding: '1rem 0 0.4rem',
      position: 'relative',
    },
    embla: {
      overflow: 'hidden',
      width: '100%',
      transform: 'scale(0.7)',
    },
    emblaContainer: {
      display: 'flex',
      flexDirection: 'row',
      position: 'relative',
      width: '100px',
    },
    emblaSlide: {
      flex: '0 0 78%',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      position: 'relative',
      marginRight: '1rem',
    },
    timelineNode: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
    },
    timelineDot: {
      width: '18px',
      height: '18px',
      backgroundColor: 'red',
      borderRadius: '50%',
      position: 'relative',
      zIndex: 2,
    },
    timelineLineHorizontal: {
      position: 'absolute',
      top: '9px',
      left: '18px',
      height: '2px',
      width: '350px', // tăng chiều dài
      backgroundColor: '#ccc',
      zIndex: 1,
    },
    timelineLineVertical: {
      position: 'absolute',
      top: '19px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '6px',
      height: '4.4vh',
      backgroundColor: '#ccc',
      zIndex: 1,
    },
    brandCard: {
      background: '#fff',
      borderRadius: '12px',
      padding: '1rem 1.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.1rem',
      marginTop: '2.4rem',
      transition: 'transform 0.3s ease',
      width: '34vw',
      height: '12vh',
    },
    brandLogo: {
      width: '13vw',
      height: '6vh',
      objectFit: 'contain',
      borderRadius: '50%',
      border: '2px solid #ddd',
      transition: 'transform 0.3s ease',
    },
    brandName: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.timelineCarousel}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 tracking-wider !text-xl font-semibold"
        style={{
          position: 'absolute',
          bottom: '14vh',
          left: '24%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          margin: 0,
        }}
      >
        Thương hiệu của chúng tôi
      </motion.h2>
      <div className="embla" style={styles.embla} ref={emblaRef}>
        <div style={styles.emblaContainer}>
          {brands.map((brand, index) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true, margin: '-50px' });

            return (
              <div style={styles.emblaSlide} key={index}>
                <div style={styles.timelineNode}>
                  {/* Thẻ thương hiệu */}
                  <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={styles.brandCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.querySelector('img').style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.querySelector('img').style.transform = 'scale(1)';
                    }}
                  >
                    <img src={brand.logo} alt={brand.name} style={styles.brandLogo} />
                    <h4 style={styles.brandName} className="w-full truncate">
                      {brand.name}
                    </h4>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
