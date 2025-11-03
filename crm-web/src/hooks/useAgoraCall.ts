import { useEffect, useState, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { fetchCallLink } from '../api/zaloApi';
import type { CallData } from '../types';

export function useAgoraCall(userId: string, role: 'guest' | 'telesale' | 'admin' = 'guest') {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [callData, setCallData] = useState<CallData | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  const createClient = useCallback(() => {
    if (client) return client;
    const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setClient(agoraClient);
    return agoraClient;
  }, [client]);

  // 👉 Bắt đầu call (cho cả telesale, admin, guest)
  const startCall = useCallback(async () => {
    setIsCalling(true);
    try {
      const data = await fetchCallLink(userId);
      setCallData(data);

      const agoraClient = createClient();
      const token = role === 'telesale' || role === 'admin' ? data.telesaleToken : data.guestToken;

      console.group(`🎧 Agora ${role.toUpperCase()} Debug`);
      console.log('App ID:', data.appId);
      console.log('Channel:', data.channelName);
      console.log('Token:', token);
      console.groupEnd();

      // 🔊 xin quyền mic (để 2 chiều)
      await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .catch(() => console.warn('⚠️ Không có quyền mic'));

      await agoraClient.join(data.appId, data.channelName, token, null);
      console.log(`✅ ${role} joined channel:`, data.channelName);

      // 🔉 nếu có mic → publish âm thanh
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'high_quality',
      });
      await agoraClient.publish([localAudioTrack]);
      console.log(`🎙️ ${role} đã publish mic`);

      // 🎧 lắng nghe người khác
      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === 'audio' && user.audioTrack) {
          user.audioTrack.play();
          console.log('📡 Subscribed & playing user:', user.uid);
        }
      });

      agoraClient.on('user-unpublished', (user) => {
        console.log('🚫 User rời khỏi kênh:', user.uid);
      });

      setClient(agoraClient);
    } catch (err) {
      console.error('❌ Lỗi khi join call:', err);
    } finally {
      setIsCalling(false);
    }
  }, [userId, role, createClient]);

  const stopCall = useCallback(async () => {
    if (client) {
      try {
        // 🔹 hủy tất cả track local (không cần gán lại mảng)
        const localTracks = client.localTracks ?? [];
        await Promise.all(localTracks.map((track) => track.close?.()));

        // 🔹 unsubscribe tất cả remote user
        const remoteUsers = client.remoteUsers || {};
        Object.values(remoteUsers).forEach((user) => {
          if (user.audioTrack) user.audioTrack.stop();
          if (user.videoTrack) user.videoTrack.stop();
        });

        // 🔹 rời kênh
        await client.leave();
        console.log('📞 Đã rời kênh và tắt mic/audio');
      } catch (e) {
        console.warn('⚠️ Lỗi khi stopCall:', e);
      }
    }

    // reset state
    setClient(null);
    setCallData(null);
  }, [client]);

  // cleanup khi unmount
  useEffect(() => {
    return () => {
      if (client && client.connectionState !== 'DISCONNECTED') {
        (async () => {
          try {
            await client.leave();
            console.log('📞 Cleanup: rời khỏi kênh khi unmount');
          } catch (e) {
            console.warn('⚠️ Cleanup lỗi:', e);
          }
        })();
      }
    };
  }, [client]);

  return {
    client,
    callData,
    isCalling,
    startCall,
    stopCall,
  };
}
