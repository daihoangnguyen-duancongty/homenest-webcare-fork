import { useState, useRef, useEffect } from 'react';
import { Icon } from 'zmp-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessageAPI } from '../api/chatZaloApi'; // import API helper

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string; // ID user Zalo hoặc định danh người dùng
}

export default function ChatPopup({ isOpen, onClose, userId }: ChatPopupProps) {
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { from: 'user', text: input }]);
    setLoading(true);

    const response = await sendMessageAPI(userId, input);

    const botText = response.result?.replyText ?? response.error ?? 'Tin nhắn đã được gửi!';

    setMessages((prev) => [...prev, { from: 'bot', text: botText }]);

    setInput('');
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-end p-6 bg-black bg-opacity-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-[90vw] max-w-md h-[70vh] bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-700 to-purple-800">
              <h2 className="text-lg font-extrabold tracking-wide text-white">
                💬 Tư vấn khách hàng
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng chat"
                className="p-2 transition-colors rounded-full hover:bg-indigo-500"
              >
                <Icon icon="zi-close" className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-white/90 backdrop-blur-sm">
              {messages.length === 0 && (
                <p className="mt-10 italic text-center text-gray-400 select-none">
                  Bắt đầu trò chuyện với chúng tôi!
                </p>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`max-w-[75%] px-4 py-2 mb-2 rounded-2xl text-sm shadow-sm ${
                    msg.from === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white self-end ml-auto'
                      : 'bg-gray-100 text-gray-800 self-start mr-auto'
                  }`}
                >
                  {msg.text}
                </motion.div>
              ))}
              {loading && (
                <div className="max-w-[75%] px-4 py-2 mb-2 rounded-2xl text-sm shadow-sm bg-gray-100 text-gray-500 self-start mr-auto italic">
                  Đang gửi...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-indigo-400 bg-white/90 backdrop-blur-sm rounded-b-3xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 text-gray-800 placeholder-indigo-400 transition border border-indigo-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                className="inline-flex items-center justify-center px-5 py-2 font-semibold text-white transition bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700"
              >
                <Icon icon={'zi-admin' as any} className="w-5 h-5 mr-2" />
                Gửi
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
