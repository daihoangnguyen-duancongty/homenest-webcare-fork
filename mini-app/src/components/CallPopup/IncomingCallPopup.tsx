import { useState, useEffect } from 'react';
import { Box, Button } from 'zmp-ui';
import { useAgoraCall } from './../../hooks';
import AgoraRTC from 'agora-rtc-sdk-ng';

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
  callStatus?: 'calling' | 'connected' | 'ended'; // trạng thái cuộc gọi
}

export default function IncomingCallPopup({
  telesaleName,
  onAccept,
  onReject,
  callData,
  role = 'guest',
  callStatus = 'calling',
}: IncomingCallPopupProps) {
    if (!callData) {
  return null; // hoặc hiển thị loading
}

const uid =
  role === 'telesale'
    ? callData.telesaleAgoraId ?? '0'
    : callData.guestAgoraId;

const { startCall } = useAgoraCall(uid);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [callDuration, setCallDuration] = useState(0);

  // ⏱ Bộ đếm thời gian dựa trên callStatus
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (callStatus === 'connected') {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const log = (message: string) => {
    console.log(message);
    setDebugLog((prev) => [...prev, message]);
  };



  // 🧠 Hiển thị text trạng thái
  const getCallText = () => {
    if (callStatus === 'calling') return 'Thời gian gọi...';
    if (callStatus === 'connected') {
      const m = String(Math.floor(callDuration / 60)).padStart(2, '0');
      const s = String(callDuration % 60).padStart(2, '0');
      return `Thời gian gọi: ${m}:${s}`;
    }
    if (callStatus === 'ended') return 'Cuộc gọi đã kết thúc';
    return 'Thời gian gọi...';
  };

  return (
    <Box className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-60">
      <Box className="p-4 text-center bg-white shadow-lg rounded-2xl">
        <p className="mb-2 text-lg font-semibold">📞 Cuộc gọi đến</p>
        <p className="mb-4 text-base text-gray-700">
          {telesaleName || 'Telesale'} đang gọi bạn...
        </p>

        <Box className="flex justify-center gap-4 mb-2">
          <Button
            type="highlight"
            disabled={callStatus === 'connected' || callStatus === 'ended'}
            onClick={async () => {
              try {
                log(`🎤 Request mic permission...`);
                const permission = await navigator.mediaDevices
                  .getUserMedia({ audio: true })
                  .then(() => true)
                  .catch(() => false);

                if (!permission) {
                  log('❌ Người dùng chưa cấp quyền micro');
                  return;
                }

                await AgoraRTC.createMicrophoneAudioTrack();
                log('🎤 Mic permission granted, joining channel...');

                await startCall(
                 
                );

                log('✅ Joined Agora successfully');
                onAccept(); // Layout sẽ đổi callStatus sang 'connected'
              } catch (err: any) {
                log(`❌ Không bật được micro: ${err.message}`);
              }
            }}
          >
            Nhận
          </Button>

          <Button type="danger" onClick={onReject} disabled={callStatus === 'ended'}>
            Từ chối
          </Button>
        </Box>

        {/* Bộ đếm thời gian */}
        <Box className="text-gray-500 mb-3 text-sm">{getCallText()}</Box>

        {/* Debug log */}
        <Box className="p-2 mt-2 text-left text-xs bg-gray-100 text-gray-800 max-h-40 overflow-y-auto rounded">
          {debugLog.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
