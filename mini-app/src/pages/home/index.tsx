import Banners from './banners';
import BrandPartnersZalo from './brand-partner';
import Category from './category';
import FlashSales from './flash-sales';
import UserReviews from './user-reviews';

const HomePage: React.FunctionComponent = () => {
  return (
    <div className="min-h-full py-2 space-y-2">
      <div className="bg-section">
        <Banners />
      </div>
      <Category />
      <FlashSales />
      <UserReviews />
      <BrandPartnersZalo />
    </div>
  );
};

export default HomePage;
