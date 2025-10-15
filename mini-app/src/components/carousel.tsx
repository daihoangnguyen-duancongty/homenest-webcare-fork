// Polyfills
import ResizeObserver from 'resize-observer-polyfill';
Object.assign(window, { ResizeObserver });

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

type UseDotButtonType = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};

export const useDotButton = (emblaApi: EmblaCarouselType | undefined): UseDotButtonType => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit).on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick,
  };
};

export interface CarouselProps {
  slides: ReactNode[];
  disabled?: boolean;
}

export default function Carousel(props: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center' }, [
    Autoplay({ active: !props.disabled }),
  ]);
  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);

  return (
    <div className="h-[30vh] overflow-hidden " ref={emblaRef}>
      <div className="flex mx-4 mt-4 space-x-2">
        {props.slides.map((slide, i) => (
          <div key={i} className="flex-none basis-full ">
            {slide}
          </div>
        ))}
      </div>

      {/* <div className="absolute flex items-center justify-center h-auto py-0 space-x-2 bottom-6 left-[44%]">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => onDotButtonClick(index)}
            className={`rounded-full w-1.5 h-1.5 bg-black/10 ${
              index === selectedIndex && !props.disabled ? 'bg-primary' : ''
            }`}
          />
        ))}
      </div> */}
    </div>
  );
}
