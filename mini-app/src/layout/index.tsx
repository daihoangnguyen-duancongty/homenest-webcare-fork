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

export default function Layout() {
  const [incomingCall, setIncomingCall] = useState<any>(null);
  // ⚡ Khởi tạo hook ở đây, không trong useEffect
  const { startCall } = useAgoraCall();

  useEffect(() => {
    const zaloId = window.APP_CONFIG?.zaloUserId || localStorage.getItem('zaloUserId');

    if (!zaloId) {
      console.warn('⚠️ Không có zaloUserId, không join socket được.');
      return;
    }

    // Tham gia phòng socket riêng của user
    socket.emit('join', zaloId);

    // Lắng nghe cuộc gọi đến
    socket.on(`incoming_call_${zaloId}`, (data) => {
      console.log('📞 Có cuộc gọi đến:', data);
      setIncomingCall(data);
    });

    // Dọn dẹp khi unmount
    return () => {
      socket.off(`incoming_call_${zaloId}`);
    };
  }, []);

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
      {incomingCall && (
        <IncomingCallPopup
          telesaleName={incomingCall.telesaleName}
          callData={{
            channelName: incomingCall.channelName,
            guestToken: incomingCall.guestToken,
            appId: incomingCall.appId,
          }}
          onAccept={async () => {
            await startCall(incomingCall.channelName, incomingCall.guestToken, incomingCall.appId);
            setIncomingCall(null);
          }}
          onReject={() => setIncomingCall(null)}
        />
      )}
    </div>
  );
}
