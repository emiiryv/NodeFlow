import { useEffect, useRef, useState } from 'react';

export const shareScreen = async (
  peerConnection: RTCPeerConnection | null,
  localStream: MediaStream | null
): Promise<void> => {
  try {
    const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];
    if (peerConnection && localStream) {
      const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(screenTrack);
      }
      screenTrack.onended = () => {
        if (sender) {
          const originalVideoTrack = localStream.getVideoTracks()[0];
          sender.replaceTrack(originalVideoTrack);
        }
      };
    }
  } catch (err) {
    console.error('Error sharing screen:', err);
  }
};

export const stopScreenShare = (
  peerConnection: RTCPeerConnection | null,
  localStream: MediaStream | null
): void => {
  if (peerConnection && localStream) {
    const originalVideoTrack = localStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      sender.replaceTrack(originalVideoTrack);
    }
  }
};

interface UseVideoCallResult {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (targetId: string) => Promise<void>;
  endCall: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

interface UseVideoCallExtended extends UseVideoCallResult {
  incomingCall: { from: string; offer: RTCSessionDescriptionInit } | null;
  setIncomingCall: React.Dispatch<React.SetStateAction<{ from: string; offer: RTCSessionDescriptionInit } | null>>;
  answerCall: () => Promise<void>;
}

export function useVideoCall(): UseVideoCallExtended {
  const localVideoRef = useRef<HTMLVideoElement>(null!);
  const remoteVideoRef = useRef<HTMLVideoElement>(null!);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  // WebSocket and PeerConnection state
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  // New incoming call state
  const [incomingCall, setIncomingCall] = useState<{ from: string; offer: RTCSessionDescriptionInit } | null>(null);

  // Helper: handle receiving offer - only set incoming call, do not process immediately
  const handleReceiveOffer = (offer: RTCSessionDescriptionInit, from: string) => {
    setIncomingCall({ from, offer });
  };
  // Answer the call when user accepts
  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const { from, offer } = incomingCall;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'ice-candidate',
              target: from,
              payload: event.candidate
            }));
          } else {
            console.warn('WebSocket not ready to send answer ICE.');
          }
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = new MediaStream();
        remoteStream.addTrack(event.track);
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'answer', target: from, payload: answer }));
      } else {
        console.warn('WebSocket not ready to send answer.');
      }

      setIncomingCall(null);
    } catch (error) {
      console.error('Error answering call:', error);
    }
  };

  // Helper: handle receiving answer
  const handleReceiveAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  // WebSocket setup and message handling
  useEffect(() => {
    const ws = new WebSocket('wss://localhost:3000');
    setSocket(ws);
    ws.onopen = () => {
      console.log('[WS] Connected');
      const userId = localStorage.getItem('userId');
      console.log('[WS] userId from localStorage:', userId);
      if (userId) {
        ws.send(JSON.stringify({ type: 'join', payload: { id: userId } }));
      }
    };

    ws.onmessage = async (event) => {
      const { type, payload, from } = JSON.parse(event.data);
      switch (type) {
        case 'offer':
          await handleReceiveOffer(payload, from);
          break;
        case 'answer':
          await handleReceiveAnswer(payload);
          break;
        case 'ice-candidate':
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload));
          }
          break;
      }
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start a call: create offer, send via WebSocket
  const startCall = async (targetId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'ice-candidate',
              target: targetId,
              payload: event.candidate
            }));
          } else {
            console.warn('WebSocket not ready to send offer ICE.');
          }
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = new MediaStream();
        remoteStream.addTrack(event.track);
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'offer', target: targetId, payload: offer }));
      } else {
        console.warn('WebSocket not ready to send offer.');
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  // End call: clean up PeerConnection and streams
  const endCall = () => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
  };

  useEffect(() => {
    return () => endCall(); // Clean up on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localStream,
    remoteStream,
    startCall,
    endCall,
    localVideoRef,
    remoteVideoRef,
    incomingCall,
    setIncomingCall,
    answerCall
  };
}