import { Product } from '@/types';
import ProductItem from './product-item';
import { HTMLAttributes } from 'react';

export interface ProductGridProps extends HTMLAttributes<HTMLDivElement> {
  products: Product[];
  replace?: boolean;
  variant?: 'default' | 'compact';
}

export default function ProductGrid({
  products,
  className,
  replace,
  variant,
  ...props
}: ProductGridProps) {
  return (
    <div className={' px-4 pt-2 pb-8 gap-1 '.concat(className ?? '')} {...props}>
      {products.map((product) => (
        <ProductItem key={product.id} product={product} replace={replace} variant={variant} />
      ))}
    </div>
  );
}
