import { useEffect, useState, useCallback, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, ILocalAudioTrack } from 'agora-rtc-sdk-ng';
import { fetchCallLink } from '../api/zaloApi';
import type { CallData } from '../types';

export function useAgoraCall(userId: string, role: 'guest' | 'telesale' | 'admin' = 'guest') {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [callData, setCallData] = useState<CallData | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  // Local track ref để giải phóng khi cần
  const localAudioRef = useRef<ILocalAudioTrack | null>(null);

  // ✅ Dừng và giải phóng track local + remote, rời kênh
  const forceStopCall = useCallback(
    async (c?: IAgoraRTCClient) => {
      const usedClient = c || client;
      if (!usedClient) return;

      try {
        // Dừng & giải phóng local track
        if (localAudioRef.current) {
          await localAudioRef.current.stop();
          await localAudioRef.current.close();
          localAudioRef.current = null;
        }

        const localTracks = usedClient.localTracks ?? [];
        await Promise.all(
          localTracks.map((t) => {
            t.stop?.();
            t.close?.();
          })
        );

        // Dừng remote track
        Object.values(usedClient.remoteUsers || {}).forEach((user) => {
          user.audioTrack?.stop();
          user.videoTrack?.stop();
        });

        // Rời kênh
        await usedClient.leave();
      } catch (err) {
        console.warn('Error force stopping call:', err);
      }
    },
    [client]
  );

  const startCall = useCallback(async () => {
    setIsCalling(true);

    try {
      // 1️⃣ Lấy token mới
      const data = await fetchCallLink(userId);
      setCallData(data);

      // 2️⃣ Nếu client cũ còn, rời kênh
      if (client) await forceStopCall(client);

      // 3️⃣ Tạo client mới
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      const token = role === 'telesale' || role === 'admin' ? data.telesaleToken : data.guestToken;

      // 4️⃣ Xin quyền mic
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'high_quality',
      });
      localAudioRef.current = localAudioTrack;

      // 5️⃣ Join Agora
      await agoraClient.join(data.appId, data.channelName, token, null);

      // 6️⃣ Publish track
      await agoraClient.publish([localAudioTrack]);

      // 7️⃣ Lắng nghe remote
      agoraClient.on('user-published', async (user, type) => {
        await agoraClient.subscribe(user, type);
        if (type === 'audio' && user.audioTrack) user.audioTrack.play();
      });
      agoraClient.on('user-unpublished', (user) => console.log('User left:', user.uid));
    } catch (err) {
      console.error('❌ Lỗi khi join call:', err);

      // 🔹 Giải phóng mic nếu đã tạo
      if (localAudioRef.current) {
        await localAudioRef.current.stop();
        await localAudioRef.current.close();
        localAudioRef.current = null;
      }

      await forceStopCall();
      throw err;
    } finally {
      setIsCalling(false);
    }
  }, [userId, role, client, forceStopCall]);

  const stopCall = useCallback(async () => {
    await forceStopCall();
    setClient(null);
    setCallData(null);
  }, [forceStopCall]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (client) forceStopCall(client);
    };
  }, [client, forceStopCall]);

  return { client, callData, isCalling, startCall, stopCall, forceStopCall };
}
