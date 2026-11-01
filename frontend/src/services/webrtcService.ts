// Real-time WebRTC Peer-to-Peer Two-Way Audio Communication Service
// Connects Customer and Agent browser tabs with STUN audio streaming

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private callId: string | null = null;
  private sendSignalCallback: ((data: any) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.remoteAudio = new Audio();
      this.remoteAudio.autoplay = true;
    }
  }

  async startLocalAudio(): Promise<MediaStream | null> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        return this.localStream;
      }
    } catch (err) {
      console.warn('Microphone permission request skipped or rejected:', err);
    }
    return null;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  async initializeConnection(
    callId: string,
    isInitiator: boolean,
    sendSignal: (data: any) => void,
    onRemoteTrack?: (stream: MediaStream) => void
  ): Promise<void> {
    this.close();
    this.callId = callId;
    this.sendSignalCallback = sendSignal;

    try {
      this.pc = new RTCPeerConnection(RTC_CONFIG);

      // Attach local stream tracks if mic was acquired
      if (!this.localStream) {
        await this.startLocalAudio();
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.pc && this.localStream) {
            this.pc.addTrack(track, this.localStream);
          }
        });
      } else {
        // Ensure bidirectional audio transceiver even if mic is muted
        this.pc.addTransceiver('audio', { direction: 'sendrecv' });
      }

      // Handle ICE Candidates
      this.pc.onicecandidate = (event) => {
        if (event.candidate && this.sendSignalCallback && this.callId) {
          this.sendSignalCallback({
            event: 'webrtc_ice',
            call_id: this.callId,
            candidate: event.candidate
          });
        }
      };

      // Handle Remote Audio Track
      this.pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (this.remoteAudio && remoteStream) {
          this.remoteAudio.srcObject = remoteStream;
          this.remoteAudio.play().catch(() => {
            console.log('WebRTC audio autoplay deferred until user interaction');
          });
        }
        if (onRemoteTrack && remoteStream) {
          onRemoteTrack(remoteStream);
        }
      };

      this.pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection State for Call ${callId}:`, this.pc?.connectionState);
      };

      // If Initiator (Caller / Customer), generate and send Offer
      if (isInitiator) {
        const offer = await this.pc.createOffer({
          offerToReceiveAudio: true
        });
        await this.pc.setLocalDescription(offer);

        if (this.sendSignalCallback) {
          this.sendSignalCallback({
            event: 'webrtc_offer',
            call_id: this.callId,
            sdp: offer
          });
        }
      }
    } catch (err) {
      console.error('[WebRTC] Initialization error:', err);
    }
  }

  async handleSignalMessage(data: any): Promise<void> {
    if (!this.pc) return;

    try {
      if (data.event === 'webrtc_offer' && data.sdp) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        if (this.sendSignalCallback && this.callId) {
          this.sendSignalCallback({
            event: 'webrtc_answer',
            call_id: this.callId,
            sdp: answer
          });
        }
      } else if (data.event === 'webrtc_answer' && data.sdp) {
        if (this.pc.signalingState !== 'stable') {
          await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      } else if (data.event === 'webrtc_ice' && data.candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.warn('[WebRTC] Error adding ICE candidate:', e);
        }
      }
    } catch (err) {
      console.warn('[WebRTC] Error processing signaling message:', err);
    }
  }

  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  setSpeaker(enabled: boolean): void {
    if (this.remoteAudio) {
      this.remoteAudio.muted = !enabled;
    }
  }

  close(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
    }
    this.callId = null;
    this.sendSignalCallback = null;
  }
}

export const webrtcService = new WebRTCService();
