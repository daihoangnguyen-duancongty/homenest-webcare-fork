import { useState } from 'react';
import ProductGrid from '@/components/product-grid';
import Section from '@/components/section';
import { useAtomValue } from 'jotai';
import { flashSaleProductsState } from '@/state';
import CategorySlider from '@/components/category-slider';

export default function FlashSales() {
  const products = useAtomValue(flashSaleProductsState);
  const [showAll, setShowAll] = useState(false);

  const displayedProducts = showAll ? products : products.slice(0, 6);

  return (
    <Section
      title="Dịch vụ của chúng tôi"
      className="text-center bg-slate-100 !text-xl font-semibold"
    >
      {/* CategorySlider đặt bên dưới title */}
      <div className="mt-2 mb-4">
        <CategorySlider />
      </div>

      <ProductGrid products={displayedProducts} className="grid grid-cols-1 gap-4 px-4 pt-2 pb-8" />

      {/* Hiển thị nút nếu còn nhiều hơn 6 sản phẩm */}
      {!showAll && products.length > 6 && (
        <div className="flex justify-center pb-8">
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2 font-bold text-black transition rounded hover:text-black-700"
          >
            Xem thêm
          </button>
        </div>
      )}
    </Section>
  );
}
