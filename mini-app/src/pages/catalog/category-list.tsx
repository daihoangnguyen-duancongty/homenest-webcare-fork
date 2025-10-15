import TransitionLink from '@/components/transition-link';
import { useAtomValue } from 'jotai';
import { categoriesState } from '@/state';

export default function CategoryListPage() {
  const categories = useAtomValue(categoriesState);

  return (
    <div className="grid grid-cols-4 p-4 gap-x-2 gap-y-8 bg-section">
      {categories.map((category) => (
        <TransitionLink
          key={category.id}
          className="flex flex-col items-center space-y-1 overflow-hidden cursor-pointer"
          to={`/category/${category.id}`}
        >
          <div className="px-1">
            <img
              src={category.imgList}
              className="object-cover rounded-full aspect-square bg-skeleton"
              alt={category.name}
            />
          </div>
          <div className="w-full text-sm text-center line-clamp-2 text-subtitle">
            {category.name}
          </div>
        </TransitionLink>
      ))}
    </div>
  );
}
