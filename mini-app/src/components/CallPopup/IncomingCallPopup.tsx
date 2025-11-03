import { Box, Button } from 'zmp-ui';
import { useAgoraCall } from './../../hooks';

export default function IncomingCallPopup({ telesaleName, onAccept, onReject, callData }) {
  const { startCall } = useAgoraCall();

  return (
    <Box
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-60"
      style={{ zIndex: 9999 }}
    >
      <Box className="p-4 text-center bg-white shadow-lg rounded-2xl">
        <p className="mb-2 text-lg font-semibold">📞 Cuộc gọi đến</p>
        <p className="mb-4 text-base text-gray-700">{telesaleName || 'Telesale'} đang gọi bạn...</p>
        <Box className="flex justify-center gap-4">
          <Button
            type="highlight"
            onClick={async () => {
              await startCall(callData.channelName, callData.guestToken, callData.appId);
              onAccept();
            }}
          >
            Nhận
          </Button>
          <Button type="danger" onClick={onReject}>
            Từ chối
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
