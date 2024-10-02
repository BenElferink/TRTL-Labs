// components/ImageCarousel.tsx
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ImageCarouselProps {
  images: string[];
  interval?: number; // Optional prop to control the auto-cycle interval (default: 5000ms)
}

const ImageCarousel = ({ images, interval = 5000 }: ImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Function to go to the previous image
  const goToPreviousImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Function to go to the next image
  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Calculate the previous and next image indices
  const prevImageIndex =
    currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
  const nextImageIndex =
    currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;

  return (
    <div className="relative w-full max-w-lg h-64 flex items-center justify-center overflow-hidden">
      {/* Left Arrow */}
      <button
        className="absolute left-12 top-1/2 transform -translate-y-1/2 z-10 text-2xl px-4 py-1 bg-black bg-opacity-50 rounded-full hover:bg-opacity-80"
        onClick={goToPreviousImage}
      >
        &#10094;
      </button>

      {/* Images Wrapper */}
      <section className='bg-gradient-to-b from-purple-500 via-blue-500 to-green-500 p-0.5 rounded-xl'>
      <div className="relative w-full h-full flex items-center justify-center">

        {/* Current Image */}
        
        <div
          className="relative w-48 h-48 aspect-w-1 aspect-h-1 transition-transform duration-500"
          style={{
            transform: 'rotateY(0deg)',
            zIndex: 10,
          }}
        >
          <Image
            src={images[currentImageIndex]}
            alt={`Sidekick ${currentImageIndex + 1}`}
            layout="fill"
            objectFit="cover"
            className="rounded-xl"
          />
        </div>
      </div>
      </section>

      {/* Right Arrow */}
      <button
        className="absolute right-12 top-1/2 transform -translate-y-1/2 z-10 text-2xl px-4 py-1 bg-black bg-opacity-50 rounded-full hover:bg-opacity-80"
        onClick={goToNextImage}
      >
        &#10095;
      </button>
    </div>
  );
};

export default ImageCarousel;
