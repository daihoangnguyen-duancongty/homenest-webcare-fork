import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import ProductGrid from './product-grid';
import { getProductsByCategoryId } from '@/api/products'; // giả sử bạn có API giả lập
import { Product } from '@/types';

interface FullscreenCategoryTransitionProps {
  category: {
    id: string;
    name: string;
    detail: string;
    image: string;
    icon: string;
 imgList?: string[];
  };
  onClose: () => void;
}

export default function FullscreenCategoryTransition({
  category,
  onClose,
}: FullscreenCategoryTransitionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      getProductsByCategoryId(Number(category.id)).then((data) => {
        const updatedProducts: Product[] = data.map((product) => ({
          ...product,
          category: {
            id: Number(category.id),
            name: category.name,
            detail: category.detail,
            image: category.image,
            icon: category.icon,
          imgList: category.imgList || [],
          },
        }));
        setProducts(updatedProducts);
        setShowGrid(true);
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [category]);

  return (
    <>
      {/* Overlay phủ toàn màn hình bên dưới component */}
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-78"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        style={{ zIndex: 40 }}
      />
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ top: '38vh', height: '70vh' }}
        >
          {/* Nút Back */}
          <button
            onClick={onClose}
            className="absolute z-50 px-3 py-1 text-sm text-white bg-black bg-opacity-50 rounded top-[-6vh] left-[87vw] hover:bg-opacity-70"
            aria-label="Close"
          >
            Close
          </button>
          {/* Ảnh nền */}
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${category.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopLeftRadius: '200px',
              marginLeft: '3rem',
              marginTop: '3rem',
            }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />

          {/* Icon bay lên góc trái */}
          <motion.img
            src={category.icon}
            alt="icon"
            className="absolute w-30 h-30"
            initial={{
              top: '10%',
              left: '50%',
              x: '-50%',
              y: '-50%',
            }}
            animate={{
              top: '-30%',
              left: '-26%',
              x: 0,
              y: 0,
              scale: 1.1,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Tên category bay lên góc phải */}
          <motion.div
            className="absolute text-xl font-bold text-white"
            initial={{
              top: '10%',
              left: '30%',
              x: '-50%',
              y: '-50%',
            }}
            animate={{
              top: '10%',
              right: '1rem',
              left: '50%',
              x: 0,
              y: 0,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {category.name}
          </motion.div>
          {/* Thông tin sản phẩm bay lên góc phải */}
          <motion.div
            className="absolute text-sm text-white"
            initial={{
              top: '20%',
              left: '60%',
              x: '-50%',
              y: '-50%',
            }}
            animate={{
              top: '16%',
              right: '1rem',
              left: '50%',
              x: 0,
              y: 0,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {category.detail}
            <div style={{ marginTop: '24%', fontWeight: 'bold', marginLeft: '-74%' }}>
              Dịch vụ của chúng tôi
            </div>
          </motion.div>
          {/* Grid sản phẩm */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0, top: '46%' }}
            transition={{ delay: 1, duration: 0.5 }}
            style={{ top: '20vh', left: '10%', height: '70vh' }}
          >
            {showGrid && (
              <ProductGrid
                products={products}
                variant="compact"
                className="flex gap-[2px] px-2 pt-2 pb-8 overflow-x-auto flex-nowrap"
              />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
