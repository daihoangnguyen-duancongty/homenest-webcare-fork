import Carousel from '@/components/carousel';
import { useAtomValue } from 'jotai';
import { bannersState } from '@/state';

export default function Banners() {
  const banners = useAtomValue(bannersState);

  return (
    <Carousel
      slides={banners.map((banner) => (
        <div key={banner} className="relative w-full h-[70%] overflow-hidden rounded-[16px]">
          {/* Bo tròn 2 góc trên cho img */}
          <img
            src={banner}
            alt="banner"
            className="object-cover w-full h-full rounded-t-[16px] rounded-tr-[16px]"
          />
        </div>
      ))}
    />
  );
}
