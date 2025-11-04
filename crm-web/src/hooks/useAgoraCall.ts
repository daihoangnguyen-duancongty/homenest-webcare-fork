import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, { type IAgoraRTCClient, type ILocalAudioTrack } from 'agora-rtc-sdk-ng';
import axios from 'axios';
import type { CallData } from '../types';
import { BACKEND_URL } from '../config/fetchConfig';
import { getToken } from '../utils/auth';

export const useAgoraCall = (userId: string, role: 'guest' | 'telesale' | 'admin' = 'guest') => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [callData, setCallData] = useState<CallData | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  const localAudioRef = useRef<ILocalAudioTrack | null>(null);

  // 🔹 Dừng và giải phóng track + rời kênh
  const forceStopCall = useCallback(
    async (c?: IAgoraRTCClient) => {
      const usedClient = c || client;
      if (!usedClient) return;

      try {
        if (localAudioRef.current) {
          await localAudioRef.current.stop();
          await localAudioRef.current.close();
          localAudioRef.current = null;
        }

        const localTracks = usedClient.localTracks ?? [];
        await Promise.all(
          localTracks.map(async (t) => {
            if (t.stop) await t.stop();
            if (t.close) await t.close();
          })
        );

        Object.values(usedClient.remoteUsers || {}).forEach((user) => {
          user.audioTrack?.stop();
          user.videoTrack?.stop();
        });

        await usedClient.leave();
        console.log('✅ Force stop call thành công');
      } catch (err) {
        console.warn('❌ Error force stopping call:', err);
      }
    },
    [client]
  );

  // 🔹 Lấy call link + token từ backend
  const fetchCallData = useCallback(async (): Promise<CallData> => {
    const token = getToken();
    if (!token) throw new Error('Token user hiện tại không tồn tại');

    const res = await axios.post(
      `${BACKEND_URL}/api/zalo/call/create`,
      { guestId: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.data.success) throw new Error(res.data.message || 'Không thể tạo link gọi Zalo');
    return res.data as CallData;
  }, [userId]);

  const startCall = useCallback(async () => {
    setIsCalling(true);
    try {
      const data = await fetchCallData();
      setCallData(data);

      if (client && client.connectionState !== 'DISCONNECTED') {
        await forceStopCall(client);
      }

      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'high_quality',
      });
      localAudioRef.current = localAudioTrack;

      const agoraToken =
        role === 'telesale' || role === 'admin' ? data.telesaleToken : data.guestToken;
      const agoraUID =
        role === 'telesale' || role === 'admin' ? data.telesaleAgoraId : data.guestAgoraId;

      console.log('🔹 Join Agora với UID:', agoraUID, 'Token:', agoraToken);
      await agoraClient.join(data.appId, data.channelName, agoraToken, agoraUID);

      await agoraClient.publish([localAudioTrack]);
      console.log('✅ Join call thành công');

      // Lắng nghe remote audio
      agoraClient.on('user-published', async (user, type) => {
        await agoraClient.subscribe(user, type);
        if (type === 'audio' && user.audioTrack) {
          try {
            user.audioTrack.play();
          } catch (err) {
            console.warn('❌ Không thể play audio track:', err);
          }
        }
      });

      agoraClient.on('user-unpublished', (user) => console.log('User left:', user.uid));
    } catch (err) {
      console.error('❌ Lỗi khi startCall:', err);
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
  }, [fetchCallData, client, forceStopCall, role]);

  const stopCall = useCallback(async () => {
    await forceStopCall();
    setClient(null);
    setCallData(null);
  }, [forceStopCall]);

  useEffect(() => {
    return () => {
      if (client) forceStopCall(client);
    };
  }, [client, forceStopCall]);

  return { client, callData, isCalling, startCall, stopCall, forceStopCall };
};
