import { Product } from '@/types';
import { useState, useEffect } from 'react';
import TransitionLink from './transition-link';
import { Button, Icon } from 'zmp-ui';
import { useAddToCart } from '@/hooks';
import QuantityInput from './quantity-input';
import { sendMessageAPI } from '@/api/chatZaloApi';
import { fetchZaloUserId } from '@/utils/zaloUser';
import zmp from 'zmp-sdk';

export interface ProductItemProps {
  product: Product;
  replace?: boolean;
  variant?: 'default' | 'compact';
}

export default function ProductItem(props: ProductItemProps) {
  const [selected, setSelected] = useState(false);
  const { addToCart, cartQuantity } = useAddToCart(props.product);
  const isCompact = props.variant === 'compact';
  const [userId, setUserId] = useState<string>('');
  const [uiLog, setUiLog] = useState('');

  useEffect(() => {
    (async () => {
      const id = await fetchZaloUserId();
      if (id) setUserId(id);
    })();
  }, []);

  const handleOpenZaloChat = async () => {
    try {
      zmp.openChat({
        type: 'oa',
        id: props.product.userId || '2405262870078293027',
      });
      await sendMessageAPI(
        props.product.userId || 'unknown',
        `Xin tư vấn về sản phẩm ${props.product.name}`
      );
    } catch (err: any) {
      setUiLog('Lỗi mở chat: ' + err.message);
    }
  };

  const handleZaloCall = async () => {
    if (!userId) {
      setUiLog('Chưa lấy được Zalo userId');
      return;
    }
    try {
      const res = await fetch(
        'https://homenest-webcare-fork-backend.onrender.com/api/zalo/call/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json();
      if (data.success && data.callLink) {
        zmp.openLink({ url: data.callLink });
      } else {
        setUiLog('Gọi thất bại: ' + (data.message || 'Không tạo được call link'));
      }
    } catch (err: any) {
      setUiLog('Lỗi khi gọi: ' + err.message);
    }
  };

  return (
    <div
      className={
        `cursor-pointer group rounded-xl shadow-[0_10px_24px_#0D0D0D17]` +
        (isCompact ? 'flex flex-col w-[40vw] flex-shrink-0 mr-1 h-[60%] -mt-4' : 'w-full ')
      }
      onClick={() => setSelected(true)}
    >
      <div className="flex p-2 bg-transparent h-[17vh]">
        <TransitionLink
          to={`/product/${props.product.id}`}
          replace={props.replace}
          className="flex-shrink-0 w-1/3 overflow-hidden rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {({ isTransitioning }) => (
            <img
              src={props.product.image}
              className="object-cover w-full h-full rounded-lg"
              style={{
                viewTransitionName:
                  isTransitioning && selected ? `product-image-${props.product.id}` : undefined,
              }}
              alt={props.product.name}
            />
          )}
        </TransitionLink>

        <div className="flex flex-col flex-1 w-10 gap-2 px-5 py-2 ml-4 rounded-md bg-gradient-to-br from-[#dbeafe] via-white to-[#bfdbfe]">
          <TransitionLink
            to={`/product/${props.product.id}`}
            replace={props.replace}
            className="flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2 pb-1.5">
              <div className="pt-1 pb-0">
                <div className="text-xs font-semibold truncate h-7">{props.product.name}</div>
              </div>
              {props.product.detail && (
                <div className="text-3xs space-x-0.5 truncate">
                  <span className="text-subtitle">{props.product.detail}</span>
                </div>
              )}
            </div>
          </TransitionLink>

          <div className="flex gap-2 p-2 pt-0 mt-auto">
            {cartQuantity === 0 ? (
              <>
                <Button
                  variant="secondary"
                  size="small"
                  className="flex-1 text-white bg-gradient-to-r from-[#2563eb] to-[#7c3aed] rounded-full shadow-xl hover:opacity-90 transition-all duration-200 ease-in-out"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleOpenZaloChat();
                  }}
                >
                  <Icon icon="zi-chat-solid" className="w-4 h-4 mb-0 mr-2 text-white" />
                  Tư vấn
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  className="flex-1 text-white bg-gradient-to-r from-[#10b981] to-[#3b82f6] rounded-full shadow-xl hover:opacity-90 transition-all duration-200 ease-in-out"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleZaloCall();
                  }}
                >
                  <Icon icon="zi-phone-solid" className="w-4 h-4 mb-0 mr-2 text-white" />
                  Gọi
                </Button>
              </>
            ) : (
              <QuantityInput value={cartQuantity} onChange={addToCart} />
            )}
          </div>

          {uiLog && (
            <pre className="p-2 mt-2 text-xs text-red-600 bg-gray-100 rounded">{uiLog}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
