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

// Hàm tham gia cuộc gọi video qua Agora
// 👉 Tạo type mô phỏng cho Agora client
type IAgoraRTCClient = ReturnType<typeof AgoraRTC.createClient>;
type IRemoteUser = { uid: string | number; audioTrack?: any; videoTrack?: any };

let agoraClient: any = null;

export function useAgoraCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [localTrack, setLocalTrack] = useState<any>(null);

  const log = (...args: any[]) => console.log("[AGORA]", ...args);

  const startCall = async (channelName: string, token: string, appId: string, uid: string | number) => {
    try {
      log("🎯 Joining Agora:", { channelName, uid });

      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      }
      const client = clientRef.current;

      // --- Kiểm tra quyền mic trước khi tạo track ---
      const hasMicPermission = await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => true)
        .catch((err) => {
          log("❌ Không lấy được quyền micro:", err);
          return false;
        });

      if (!hasMicPermission) {
        log("🚫 Không có quyền micro, dừng call");
        return;
      }

      // --- Tạo mic track ---
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      log("🎤 Mic track created:", micTrack.getTrackId(), micTrack.getMediaStreamTrack()?.readyState);

      // --- Kiểm tra thiết bị audio khả dụng ---
      const devices = await AgoraRTC.getDevices();
      const mics = devices.filter((d) => d.kind === "audioinput");
      const speakers = devices.filter((d) => d.kind === "audiooutput");
      log("🎧 Danh sách thiết bị:", {
        micCount: mics.length,
        speakerCount: speakers.length,
        mics,
        speakers,
      });

 // --- Join channel ---
log("🧩 [MINI APP JOIN INFO]", {
  AppId: appId,
  Channel: channelName,
  UID: uid,
  Token: token?.substring(0, 40) + "...", // chỉ log 40 ký tự đầu cho gọn
});

await client.join(appId, channelName, token || null, uid);
log(`✅ Joined channel ${channelName} as uid=${uid}`);


      // --- Publish local track ---
      await client.publish([micTrack]);
      setLocalTrack(micTrack);
      setIsCalling(true);
      log("📡 Mic published successfully");

      // --- Lắng nghe remote user ---
      client.on("user-published", async (user, mediaType) => {
        log("📥 Remote user published:", user.uid, mediaType);
        await client.subscribe(user, mediaType);
        log("✅ Subscribed to remote user:", user.uid, mediaType);

        if (mediaType === "audio" && user.audioTrack) {
          log("🔊 Đang phát remote audio...");
          user.audioTrack.play();
        }
      });

      client.on("user-unpublished", (user) => {
        log("❌ Remote user unpublished:", user.uid);
      });

    // --- Theo dõi trạng thái mic ---
const mediaStreamTrack = micTrack.getMediaStreamTrack();

// Sự kiện khi mic bị ngắt (ví dụ đóng quyền hoặc mất device)
mediaStreamTrack.addEventListener("ended", () => {
  log("⚠️ Mic track ended (bị mất kết nối hoặc thu hồi quyền)");
});

// Kiểm tra thủ công mute/unmute (vì WebRTC không phát event mute/unmute)
setInterval(() => {
  if (mediaStreamTrack.enabled === false) {
    log("🔇 Mic đang bị disable (mute)");
  } else {
    log("🔈 Mic đang hoạt động (unmuted)");
  }
}, 3000);


    } catch (err) {
      log("🚨 startCall error:", err);
    }
  };

  const stopCall = async () => {
    try {
      if (localTrack) {
        localTrack.stop();
        localTrack.close();
        log("🛑 Mic track stopped & closed");
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        log("👋 Left the call");
      }
      setIsCalling(false);
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
