import { useRef, useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { categoriesState } from '@/state';
import CategoryItem from '@/components/category-item';
import FullscreenCategoryTransition from '@/components/fullscreen-category-transition';

export default function Category() {
  const baseCategories = useAtomValue(categoriesState);
  const loopCount = 3;
  const categories = Array(loopCount)
    .fill(baseCategories)
    .reduce((acc, curr) => acc.concat(curr), []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [centerIndex, setCenterIndex] = useState<number | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const isAutoScrolling = useRef(false); // biến cờ: scroll tự động
  const scrollAmount = 300;

  const handleScroll = (direction: 'left' | 'right') => {
    const scrollContainer = scrollRef.current;
    const items = itemRefs.current;

    if (!scrollContainer || !items.length) return;

    const itemWidth = items[0]?.offsetWidth || 0;
    const itemGap = 8; // giả sử gap-x-2 = 0.5rem = 8px
    const fullItemWidth = itemWidth + itemGap;

    const currentScrollLeft = scrollContainer.scrollLeft;
    const containerCenter = currentScrollLeft + scrollContainer.offsetWidth / 2;

    // Tìm item gần center nhất
    let closestIndex = 0;
    let closestDistance = Infinity;
    items.forEach((item, index) => {
      if (!item) return;
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distance = Math.abs(itemCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Tính index mới
    const nextIndex = direction === 'right' ? closestIndex + 1 : closestIndex - 1;

    const clampedIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
    const targetItem = items[clampedIndex];
    if (!targetItem) return;

    isAutoScrolling.current = true;

    scrollContainer.scrollTo({
      left: targetItem.offsetLeft - scrollContainer.offsetWidth / 2 + targetItem.offsetWidth / 2,
      behavior: 'smooth',
    });

    // Reset flag sau 300ms
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 300);
  };

  // Scroll về giữa khi mount
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const timeout = setTimeout(() => {
      const oneThirdWidth = scrollContainer.scrollWidth / loopCount;
      isAutoScrolling.current = true; // bắt đầu scroll tự động
      scrollContainer.scrollLeft = oneThirdWidth;

      //  sau một thời gian ngắn, reset lại cờ auto scroll
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 100);
    }, 50);

    return () => clearTimeout(timeout);
  }, [baseCategories]);

  // Detect center item + xử lý loop
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !itemRefs.current.length) return;

    const updateCenterItem = () => {
      const containerCenterX = scrollContainer.scrollLeft + scrollContainer.offsetWidth / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        const rect = item.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;

        const distance = Math.abs(itemCenterX - window.innerWidth / 2);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCenterIndex(closestIndex % baseCategories.length);
    };

    const handleUserScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const totalWidth = scrollContainer.scrollWidth;
      const oneThirdWidth = totalWidth / loopCount;

      // Nếu scroll đến gần đầu hoặc cuối → nhảy về giữa
      if (scrollLeft < oneThirdWidth * 0.5) {
        isAutoScrolling.current = true;
        scrollContainer.scrollLeft += oneThirdWidth;
        setTimeout(() => (isAutoScrolling.current = false), 100);
        return;
      }

      if (scrollLeft > oneThirdWidth * 2.5) {
        isAutoScrolling.current = true;
        scrollContainer.scrollLeft -= oneThirdWidth;
        setTimeout(() => (isAutoScrolling.current = false), 100);
        return;
      }

      //  Chỉ set hasScrolled nếu KHÔNG phải scroll tự động
      if (!hasScrolled && !isAutoScrolling.current) {
        setHasScrolled(true);
      }

      updateCenterItem();
    };

    updateCenterItem();
    scrollContainer.addEventListener('scroll', handleUserScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleUserScroll);
    };
  }, [categories, hasScrolled, baseCategories]);

  return (
    <div className="relative w-full">
      {selectedCategory && (
        <FullscreenCategoryTransition
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      <div
        ref={scrollRef}
        className={`flex px-6 py-6 overflow-x-auto flex-nowrap bg-section gap-x-2 gap-y-4 ${
          selectedCategory ? 'pointer-events-none opacity-20' : ''
        }`}
      >
        // Trong map categories:
        {categories.map((category, index) => {
          const item = itemRefs.current[index];
          let distanceToCenter = 0;

          if (item) {
            const rect = item.getBoundingClientRect();
            const itemCenterX = rect.left + rect.width / 2;
            const screenCenterX = window.innerWidth / 2;
            distanceToCenter = Math.abs(itemCenterX - screenCenterX);
          }

          return (
            <div
              key={`${category.id}-${index}`}
              ref={(el) => (itemRefs.current[index] = el)}
              onClick={() => setSelectedCategory(category)}
              className="flex flex-col items-center flex-none mt-2 mb-6 space-y-1 overflow-visible rounded-md cursor-pointer"
            >
              <CategoryItem
                bgImage={category.image}
                iconImage={category.icon}
                text={category.name}
                isCenter={index % baseCategories.length === centerIndex}
                hasScrolled={hasScrolled}
              />
            </div>
          );
        })}
      </div>

      <button
        className="absolute bottom-[1%] left-[63%] z-10 p-2 "
        onClick={() => handleScroll('left')}
      >
        ◀ Prev
      </button>
      <button
        className="absolute bottom-[1%] right-4 z-10 p-2"
        onClick={() => handleScroll('right')}
      >
        Next ▶
      </button>
    </div>
  );
}
