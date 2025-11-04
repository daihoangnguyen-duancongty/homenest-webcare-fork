import { Outlet } from 'react-router-dom';
import Header from './../components/header';
import Footer from './../components/footer';
import { Suspense, useEffect, useState } from 'react';
import { PageSkeleton } from './../components/skeleton';
import { Toaster } from 'react-hot-toast';
import { ScrollRestoration } from './../components/scroll-restoration';
import FloatingCartPreview from './../components/floating-cart-preview';
import IncomingCallPopup from './../components/CallPopup/IncomingCallPopup';
import { useAgoraCall } from '@/hooks';
import { socket } from '@/utils/socket';
import {getGuestIdAPI} from '@/api/chatZaloApi'


export default function Layout() {
    const [incomingCall, setIncomingCall] = useState<any>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const { startCall } = useAgoraCall();
  const [guestId, setGuestId] = useState<string | null>(null);

  const pushLog = (msg: string) => {
    setDebugLog((prev) => [...prev.slice(-49), msg]);
  };



  // 🔹 Lấy guestId thực tế từ backend
  useEffect(() => {
    const fetchGuestId = async () => {
      pushLog('🔹 Bắt đầu gọi API lấy guestId mini app...');
      const { success, guestId: id, error } = await getGuestIdAPI();
      console.log('⚡ GuestId mini app result:', { success, id, error });

      if (!success || !id) {
        pushLog(`⚠️ Không lấy được guestId: ${error}`);
        return;
      }

      setGuestId(id);
      pushLog(`🔹 Sử dụng guestId mini app: ${id}`);
    };

    fetchGuestId();
  }, []);

  // 🔹 Lắng nghe socket cuộc gọi đến
  useEffect(() => {
    if (!guestId) return;

    pushLog(`🔹 Join socket với guestId: ${guestId}`);
    socket.emit('join', guestId);

    const handleIncomingCall = (data: any) => {
      pushLog(`📞 Incoming call: ${JSON.stringify(data)}`);
      setIncomingCall(data);
    };

    socket.on(`incoming_call_${guestId}`, handleIncomingCall);

    return () => {
      socket.off(`incoming_call_${guestId}`, handleIncomingCall);
    };
  }, [guestId]);



  return (
    <div className="flex flex-col w-screen h-screen bg-section text-foreground">
      <Header />
      <div className="flex-1 overflow-y-auto bg-background">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
      <Toaster
        containerClassName="toast-container"
        containerStyle={{
          top: 'calc(50% - 24px)',
        }}
      />
      <FloatingCartPreview />
      <ScrollRestoration />
       {/* Popup cuộc gọi đến */}
      {incomingCall && guestId && (
        <IncomingCallPopup
          telesaleName={incomingCall.telesaleName}
          callData={{
            channelName: incomingCall.channelName,
            guestToken: incomingCall.guestToken,
            appId: incomingCall.appId,
            guestAgoraId: incomingCall.guestAgoraId || '0',
            telesaleAgoraId: incomingCall.telesaleAgoraId || undefined,
            telesaleToken: incomingCall.telesaleToken || undefined,
          }}
          onAccept={async () => {
            if (!incomingCall) return;
            const uid = incomingCall.telesaleAgoraId || incomingCall.guestAgoraId || '0';
            await startCall(
              incomingCall.channelName,
              incomingCall.guestToken,
              incomingCall.appId,
              uid
            );
            setIncomingCall(null);
          }}
          onReject={() => setIncomingCall(null)}
        />
      )}

      {/* Debug log */}
      <div className="fixed bottom-0 left-0 p-2 text-xs bg-gray-200 max-h-40 w-full overflow-y-auto z-50">
        {debugLog.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
    </div>
  );
}
