import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ItemCardProps {
  bgImage: string;
  iconImage: string;
  text: string;
  isCenter?: boolean;
  hasScrolled?: boolean;
}

export default function CategoryItem({
  bgImage,
  iconImage,
  text,
  isCenter = false,
  hasScrolled = false,
}: ItemCardProps) {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false); // Chiều rộng và chiều cao ban đầu (ngẫu nhiên, cố định)

  const { widthPercent, baseHeightPercent } = useMemo(() => {
    const width = Math.floor(Math.random() * 10) + 80; // 80% - 100%
    const height = Math.floor(Math.random() * 10) + 57; // 50% - 70%
    return { widthPercent: width, baseHeightPercent: height };
  }, []); // Tính toán chiều cao dựa vào isCenter và hasScrolled

  const targetHeight = useMemo(() => {
    if (!hasScrolled) return baseHeightPercent;
    if (isCenter) return baseHeightPercent + 30;
    return baseHeightPercent - 10;
  }, [hasScrolled, isCenter, baseHeightPercent]);

  const handleClick = () => {
    setIsClicked(true);
  };

  return (
    <div className="relative w-[46vw] h-[24vh] mt-16">
      {/* Icon */}{' '}
      <motion.img
        src={iconImage}
        alt="Icon"
        className="absolute left-4/4 -top-[29%] w-[100%] h-[100%] z-30 transition-all duration-200 group-hover:scale-110"
        animate={
          hasScrolled
            ? {
                y: isCenter ? '-1%' : '10%',
                scale: isCenter ? 1.2 : 0.84,
              }
            : {}
        }
        transition={{ duration: 0.3 }}
      />
      {/* Box nền chính */}{' '}
      <motion.div
        layout
        className="absolute bottom-0 z-0 overflow-hidden -translate-x-1/2 rounded-lg cursor-pointer left-1/2 group"
        style={{
          width: `${widthPercent}%`,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '10%',
        }}
        animate={{
          height: `${targetHeight}%`,
        }}
        transition={{ layout: { duration: 0.5, type: 'spring', damping: 22, stiffness: 180 } }}
        whileHover={{ scale: 1.05 }}
        onClick={handleClick}
      >
        {/* Overlay */}{' '}
        <motion.div className="absolute inset-0 z-10 transition-all duration-300 opacity-0 bg-black/10 group-hover:opacity-100" />
        {/* Hiệu ứng zoom khi click */}{' '}
        <AnimatePresence>
          {' '}
          {isClicked && (
            <motion.div
              className="absolute inset-0 z-10"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '0.5rem',
              }}
            />
          )}{' '}
        </AnimatePresence>{' '}
      </motion.div>
      {/* Text */}{' '}
      <div
        className="absolute z-20 px-0 text-sm text-lg font-semibold text-center text-white transform -translate-x-[20%] left-1/4"
        style={{ bottom: '6%' }}
      >
        {text}{' '}
      </div>{' '}
    </div>
  );
}
