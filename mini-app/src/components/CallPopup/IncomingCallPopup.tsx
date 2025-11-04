import { useState } from 'react';
import { Box, Button } from 'zmp-ui';
import { useAgoraCall } from './../../hooks';

interface IncomingCallPopupProps {
  telesaleName?: string;
  callData: {
    channelName: string;
    guestToken: string;
    telesaleToken?: string;
    appId: string;
    guestAgoraId: string;
    telesaleAgoraId?: string;
  };
  role?: 'guest' | 'telesale';
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallPopup({
  telesaleName,
  onAccept,
  onReject,
  callData,
  role = 'guest',
}: IncomingCallPopupProps) {
  const { startCall } = useAgoraCall();
  const [debugLog, setDebugLog] = useState<string[]>([]);

 const log = (message: string) => {
  console.log(message);
  setDebugLog((prev) => [...prev, message]);
};

  const uid = role === 'telesale' ? callData.telesaleAgoraId || '0' : callData.guestAgoraId;

  return (
    <Box
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-60"
      style={{ zIndex: 9999 }}
    >
      <Box className="p-4 text-center bg-white shadow-lg rounded-2xl">
        <p className="mb-2 text-lg font-semibold">📞 Cuộc gọi đến</p>
        <p className="mb-4 text-base text-gray-700">
          {telesaleName || 'Telesale'} đang gọi bạn...
        </p>
        <Box className="flex justify-center gap-4">
         <Button
  type="highlight"
  onClick={async () => {
    log(`🔹 Join Agora channel: ${callData.channelName}, uid: ${uid}`);
    await startCall(
      callData.channelName,
      role === 'telesale' ? callData.telesaleToken || '' : callData.guestToken,
      callData.appId,
      uid
    );
    log('✅ Joined Agora successfully');
    onAccept();
  }}
>
            Nhận
          </Button>
          <Button type="danger" onClick={onReject}>
            Từ chối
          </Button>
        </Box>
            {/* Debug log box */}
        <Box className="p-2 mt-2 text-left text-xs bg-gray-100 text-gray-800 max-h-40 overflow-y-auto rounded">
          {debugLog.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
