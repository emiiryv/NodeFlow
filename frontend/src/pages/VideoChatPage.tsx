import React from 'react';
import { useVideoCall } from '../hooks/videoCall';
import { shareScreen as shareScreenFn, stopScreenShare as stopScreenShareFn } from '../hooks/videoCall';

const VideoChatPage: React.FC = () => {
  const {
    startCall,
    endCall,
    localStream,
    remoteStream,
    incomingCall,
    answerCall
  } = useVideoCall();

  const [targetId, setTargetId] = React.useState('');
  const [sharing, setSharing] = React.useState(false);
  const callerInfo = incomingCall?.from ?? '';

  const handleShareToggle = () => {
    const pc = (window as any).peerConnection; // you might consider a better way to access the peerConnection
    if (sharing) {
      stopScreenShareFn(pc, localStream);
    } else {
      shareScreenFn(pc, localStream);
    }
    setSharing(!sharing);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Görüntülü Konuşma</h2>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h4>Sen</h4>
          <video
            ref={(video) => {
              if (video && localStream) {
                video.srcObject = localStream;
              }
            }}
            autoPlay
            muted
            style={{ width: '300px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <h4>Karşı Taraf</h4>
          <video
            ref={(video) => {
              if (video && remoteStream) {
                video.srcObject = remoteStream;
              }
            }}
            autoPlay
            style={{ width: '300px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>
          Karşı taraf ID'si:
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => startCall(targetId)} style={{ marginRight: '10px' }}>
          Başlat
        </button>
        <button onClick={endCall} style={{ marginRight: '10px' }}>
          Bitir
        </button>
        <button onClick={handleShareToggle}>
          {sharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş'}
        </button>
      </div>

      {incomingCall && (
        <div style={{ marginTop: '30px', border: '1px solid red', padding: '10px', backgroundColor: '#ffe6e6' }}>
          <p><strong>{callerInfo}</strong> adlı kullanıcıdan gelen çağrı var.</p>
          <button onClick={answerCall} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white' }}>
            Cevapla
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoChatPage;