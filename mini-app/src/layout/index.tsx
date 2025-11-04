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
  const [debugLog, setDebugLog] = useState<string[]>([]);
  // ⚡ Khởi tạo hook ở đây, không trong useEffect
  const { startCall } = useAgoraCall();
const uid = incomingCall.telesaleAgoraId || incomingCall.guestAgoraId || '0';
useEffect(() => {
  let interval: number; 
  const tryJoin = () => {
    const zaloId = window.APP_CONFIG?.zaloUserId || localStorage.getItem('zaloUserId');
    if (zaloId) {
      setDebugLog((prev) => [...prev, `🔹 Joining room with zaloId: ${zaloId}`]);
      socket.emit('join', zaloId);

      socket.on(`incoming_call_${zaloId}`, (data) => {
        setDebugLog((prev) => [...prev, `📞 Incoming call: ${JSON.stringify(data)}`]);
        setIncomingCall(data);
      });
      clearInterval(interval);
    } else {
      setDebugLog((prev) => [...prev, '⚠️ Chưa có zaloUserId, thử lại sau 1s...']);
    }
  };
  interval = window.setInterval(tryJoin, 1000); // đảm bảo TypeScript hiểu là number
  return () => clearInterval(interval);
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
              guestAgoraId: incomingCall.guestAgoraId || '0', // ✅ thêm vào
      telesaleAgoraId: incomingCall.telesaleAgoraId || undefined, // nếu có
      telesaleToken: incomingCall.telesaleToken || undefined, // nếu cần
          }}
          onAccept={async () => {
            await startCall(incomingCall.channelName, incomingCall.guestToken, incomingCall.appId,  uid);
            setIncomingCall(null);
          }}
          onReject={() => setIncomingCall(null)}
        />
      )}
      <div className="fixed bottom-0 left-0 p-2 text-xs bg-gray-200 max-h-40 w-full overflow-y-auto z-50">
  {debugLog.map((msg, idx) => (
    <div key={idx}>{msg}</div>
  ))}
</div>
    </div>
  );
}
