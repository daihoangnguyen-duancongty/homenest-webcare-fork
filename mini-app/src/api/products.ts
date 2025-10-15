import products from '@/mock/products.json';

export function getProductsByCategoryId(categoryId: number): Promise<typeof products> {
  return new Promise((resolve) => {
    const filtered = products.filter((p) => p.categoryId === categoryId);
    setTimeout(() => resolve(filtered), 500); // mô phỏng delay fetch
  });
}
