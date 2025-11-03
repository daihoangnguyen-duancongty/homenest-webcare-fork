import { useEffect } from 'react';
import AgoraRTC, { type IAgoraRTCClient, type ILocalAudioTrack } from 'agora-rtc-sdk-ng';

interface CallData {
  appId: string;
  channelName: string;
  guestToken: string;
  telesaleToken: string;
  guestAgoraId: string;
  telesaleAgoraId: string;
}

export const useAgoraCall = (callData: CallData | null, role: 'telesale' | 'guest') => {
  useEffect(() => {
    if (!callData) return;

    const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    let localAudioTrack: ILocalAudioTrack;

    const joinCall = async () => {
      const { appId, channelName, guestToken, telesaleToken, guestAgoraId, telesaleAgoraId } =
        callData;

      const token = role === 'telesale' ? telesaleToken : guestToken;
      const uid = role === 'telesale' ? telesaleAgoraId : guestAgoraId;

      console.log('Joining Agora with uid:', uid);

      await client.join(appId, channelName, token, uid);

      localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([localAudioTrack]);

      console.log('✅ Joined Agora channel:', channelName);
    };

    joinCall();

    return () => {
      if (localAudioTrack) localAudioTrack.close();
      client.leave();
    };
  }, [callData, role]);
};
