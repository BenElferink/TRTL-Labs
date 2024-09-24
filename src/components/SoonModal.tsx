import { XMarkIcon } from '@heroicons/react/24/solid';

interface SoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SoonModal = ({ isOpen, onClose }: SoonModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} w-screen h-screen flex items-center justify-center fixed top-0 left-0 z-50 bg-black bg-opacity-50 backdrop-blur-lg`}>
      {isOpen && (
        <section className='relative bg-gradient-to-b from-purple-500 via-blue-500 to-green-500 p-0.5 rounded-xl'>
          <div className='flex flex-col items-center justify-center overflow-y-auto w-screen h-screen sm:min-w-[42vw] sm:max-w-[90vw] sm:min-h-[36vh] sm:max-h-[90vh] sm:w-fit sm:h-fit p-8 sm:rounded-xl bg-zinc-800'>
            
            {/* Close button */}
            <button className='w-6 h-6 rounded-full absolute top-2 right-4 z-10' onClick={onClose}>
              <XMarkIcon className='w-8 h-8 animate-pulse hover:animate-spin' />
            </button>

            {/* Scrolling text */}
            <div className="overflow-hidden h-16 w-full mt-4 mb-4">
              <div className="animate-scroll whitespace-nowrap text-6xl font-bold text-blue-500">
                Coming Soon
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SoonModal;
