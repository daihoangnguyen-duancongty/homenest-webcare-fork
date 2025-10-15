import { motion } from 'framer-motion';

const reviews = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    role: 'Doanh nhân',
    avatar: 'https://i.pravatar.cc/150?img=1',
    comment: 'Thiết kế hiện đại, đúng yêu cầu, đội ngũ support rất tốt.',
  },
  {
    id: 2,
    name: 'Trần Thị B',
    role: 'Chuyên viên Marketing',
    avatar: 'https://i.pravatar.cc/150?img=2',
    comment: 'App mượt, giao diện đẹp, chuẩn UI/UX. Khách hàng phản hồi rất tốt.',
  },
  {
    id: 3,
    name: 'Lê Văn C',
    role: 'Founder Startup',
    avatar: 'https://i.pravatar.cc/150?img=3',
    comment: 'Website tối ưu SEO, tốc độ tải nhanh. Giao diện cực kỳ chuyên nghiệp.',
  },
  {
    id: 4,
    name: 'Phạm Thị D',
    role: 'Nhà thiết kế',
    avatar: 'https://i.pravatar.cc/150?img=4',
    comment: 'Sản phẩm tinh tế, phù hợp với thị hiếu hiện đại.',
  },
  {
    id: 5,
    name: 'Hoàng Văn E',
    role: 'Developer',
    avatar: 'https://i.pravatar.cc/150?img=5',
    comment: 'Code sạch, dễ bảo trì, tốc độ xử lý tốt.',
  },
  {
    id: 6,
    name: 'Lý Thị F',
    role: 'Quản lý dự án',
    avatar: 'https://i.pravatar.cc/150?img=6',
    comment: 'Quản lý hiệu quả, tiến độ đúng kế hoạch.',
  },
];

function CarouselRow({
  items,
  itemWidth,
  itemHeight,
  duration,
  reverse = false,
}: {
  items: typeof reviews;
  itemWidth: number;
  itemHeight: number;
  duration: number;
  reverse?: boolean;
}) {
  const avatarSize = Math.min(itemWidth * 0.3, itemHeight);
  const direction = reverse ? 1 : -1;

  return (
    <div className="w-full overflow-hidden">
      <motion.div
        className={`flex gap-4 whitespace-nowrap ${reverse ? 'flex-row-reverse' : ''}`}
        animate={{ x: [`0%`, `${direction * 50}%`] }} // 50% thôi vì phần tử đã gấp đôi
        transition={{
          duration,
          ease: 'linear',
          repeat: Infinity,
        }}
        style={{ width: '200%' }} // nhân đôi để seamless
      >
        {[...items, ...items].map((review, idx) => (
          <div
            key={idx}
            className="flex items-center p-4 text-white border rounded-lg bg-white/10 border-cyan-400 backdrop-blur-md"
            style={{
              width: `${itemWidth}vw`,
              minWidth: `${itemWidth}vw`,
              height: `${itemHeight}vh`,
            }}
          >
            {/* Avatar hình tròn */}
            <div
              className="flex-shrink-0 mr-2"
              style={{
                width: `${avatarSize}vw`,
                height: `${avatarSize}vw`,
              }}
            >
              <img
                src={review.avatar}
                alt={review.name}
                className="object-cover w-full h-full border-2 rounded-full border-cyan-300"
              />
            </div>
            <div className="flex flex-col justify-center overflow-hidden text-xs text-left">
              <p className="font-semibold truncate">{review.name}</p>
              <p className="text-gray-300 truncate">{review.role}</p>
              <p className="italic text-gray-100 truncate" title={review.comment}>
                {review.comment}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function UserReviewSection() {
  return (
    <section className="relative py-6 overflow-hidden bg-gradient-to-tr from-blue-300 via-indigo-300 to-blue-400">
      <h2 className="mb-6 text-lg font-semibold tracking-wider text-center text-white">
        Đánh giá từ khách hàng
      </h2>
      <div className="flex flex-col gap-4 px-4 py-4 mx-auto max-w-7xl">
        <CarouselRow items={reviews} itemWidth={60} itemHeight={8} duration={30} reverse />
        <CarouselRow items={reviews} itemWidth={80} itemHeight={8} duration={40} />
        <CarouselRow items={reviews} itemWidth={70} itemHeight={8} duration={50} reverse />
      </div>
    </section>
  );
}
