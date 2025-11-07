import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { MutableRefObject, useLayoutEffect, useMemo, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { UIMatch, useMatches, useNavigate } from 'react-router-dom';
import { cartState, cartTotalState, ordersState, userInfoKeyState, userInfoState } from '@/state';
import { Product } from '@/types';
import { getConfig } from '@/utils/template';
import { authorize, createOrder, openChat } from 'zmp-sdk/apis';
import { useAtomCallback } from 'jotai/utils';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import { BACKEND_URL } from '@/config/fetchConfig';

// Hàm tham gia cuộc gọi video qua Agora
// 👉 Tạo type mô phỏng cho Agora client
type IAgoraRTCClient = ReturnType<typeof AgoraRTC.createClient>;
type IRemoteUser = { uid: string | number; audioTrack?: any; videoTrack?: any };

let agoraClient: any = null;

export function useAgoraCall(userId: string) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [localTrack, setLocalTrack] = useState<any>(null);

  const log = (...args: any[]) => console.log("[AGORA]", ...args);

  // 🔹 Lấy thông tin channel + token từ backend
const fetchCallInfo = async (): Promise<{
  appId: string;
  channelName: string;
  uid: string | number;
  token: string;
}> => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/api/zalo/guest-id-for-mini-app`,
      { guestId: userId }
    );

    console.log("🔍 fetchCallInfo response:", res.data);

    if (!res.data.success) {
      throw new Error(res.data.message || 'Không lấy được call info');
    }

    return {
      appId: res.data.appId,
      channelName: res.data.channelName,
      uid: res.data.guestAgoraId,
      token: res.data.guestToken,
    };
  } catch (error) {
    console.error("🚨 fetchCallInfo error:", error);
    throw error;
  }
};


  const startCall = async () => {
    try {
      const { appId, channelName, uid, token } = await fetchCallInfo();

      log("🧩 [MINI APP JOIN INFO]", { AppId: appId, Channel: channelName, UID: uid, Token: token });

      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      }
      const client = clientRef.current;

      // Kiểm tra quyền mic
      const hasMicPermission = await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => true)
        .catch((err) => {
          log("❌ Không lấy được quyền micro:", err);
          return false;
        });
      if (!hasMicPermission) return;

      // Tạo local mic track
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalTrack(micTrack);

      // Join channel chính xác từ backend
      await client.join(appId, channelName, token, uid);
      log(`✅ Joined channel ${channelName} as uid=${uid}`);

      // Publish local track
      await client.publish([micTrack]);
      setIsCalling(true);
      log("📡 Mic published successfully");

      // Lắng nghe remote users
      client.on('user-published', async (user, type) => {
        await client.subscribe(user, type);
        log("📥 Remote user published:", user.uid, type);
        if (type === 'audio' && user.audioTrack) user.audioTrack.play();
      });

      client.on('user-unpublished', (user) => log("❌ Remote user unpublished:", user.uid));

    } catch (err) {
      log("🚨 startCall error:", err);
    }
  };

  const stopCall = async () => {
    try {
      if (localTrack) {
        localTrack.stop();
        localTrack.close();
        setLocalTrack(null);
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
      setIsCalling(false);
      log("👋 Left the call");
    } catch (err) {
      log("🚨 stopCall error:", err);
    }
  };

  return { startCall, stopCall, isCalling };
}
//
export function useRealHeight(
  element: MutableRefObject<HTMLDivElement | null>,
  defaultValue?: number
) {
  const [height, setHeight] = useState(defaultValue ?? 0);
  useLayoutEffect(() => {
    if (element.current && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
        const [{ contentRect }] = entries;
        setHeight(contentRect.height);
      });
      ro.observe(element.current);
      return () => ro.disconnect();
    }
    return () => {};
  }, [element.current]);

  if (typeof ResizeObserver === 'undefined') {
    return -1;
  }
  return height;
}

export function useRequestInformation() {
  const getStoredUserInfo = useAtomCallback(async (get) => {
    const userInfo = await get(userInfoState);
    return userInfo;
  });
  const setInfoKey = useSetAtom(userInfoKeyState);
  const refreshPermissions = () => setInfoKey((key) => key + 1);

  return async () => {
    const userInfo = await getStoredUserInfo();
    if (!userInfo) {
      await authorize({
        scopes: ['scope.userInfo', 'scope.userPhonenumber'],
      }).then(refreshPermissions);
      return await getStoredUserInfo();
    }
    return userInfo;
  };
}

export function useAddToCart(product: Product) {
  const [cart, setCart] = useAtom(cartState);

  const currentCartItem = useMemo(
    () => cart.find((item) => item.product.id === product.id),
    [cart, product.id]
  );

  const addToCart = (
    quantity: number | ((oldQuantity: number) => number),
    options?: { toast: boolean }
  ) => {
    setCart((cart) => {
      const newQuantity =
        typeof quantity === 'function' ? quantity(currentCartItem?.quantity ?? 0) : quantity;
      if (newQuantity <= 0) {
        cart.splice(cart.indexOf(currentCartItem!), 1);
      } else {
        if (currentCartItem) {
          currentCartItem.quantity = newQuantity;
        } else {
          cart.push({
            product,
            quantity: newQuantity,
          });
        }
      }
      return [...cart];
    });
    if (options?.toast) {
      toast.success('Đã thêm vào giỏ hàng');
    }
  };

  return { addToCart, cartQuantity: currentCartItem?.quantity ?? 0 };
}

export function useCustomerSupport() {
  return () =>
    openChat({
      type: 'oa',
      id: getConfig((config) => config.template.oaIDtoOpenChat),
    });
}

export function useToBeImplemented() {
  return () =>
    toast('Chức năng dành cho các bên tích hợp phát triển...', {
      icon: '🛠️',
    });
}

export function useCheckout() {
  const { totalAmount } = useAtomValue(cartTotalState);
  const [cart, setCart] = useAtom(cartState);
  const requestInfo = useRequestInformation();
  const navigate = useNavigate();
  const refreshNewOrders = useSetAtom(ordersState('pending'));

  return async () => {
    try {
      await requestInfo();
      await createOrder({
        amount: totalAmount,
        desc: 'Thanh toán đơn hàng',
        item: cart.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
      });
      setCart([]);
      refreshNewOrders();
      navigate('/orders', {
        viewTransition: true,
      });
      toast.success('Thanh toán thành công. Cảm ơn bạn đã mua hàng!', {
        icon: '🎉',
        duration: 5000,
      });
    } catch (error) {
      console.warn(error);
      toast.error('Thanh toán thất bại. Vui lòng kiểm tra nội dung lỗi bên trong Console.');
    }
  };
}

export function useRouteHandle() {
  const matches = useMatches() as UIMatch<
    undefined,
    | {
        title?: string | Function;
        logo?: boolean;
        search?: boolean;
        noFooter?: boolean;
        noBack?: boolean;
        noFloatingCart?: boolean;
        scrollRestoration?: number;
      }
    | undefined
  >[];
  const lastMatch = matches[matches.length - 1];

  return [lastMatch.handle, lastMatch, matches] as const;
}
