import React, { useState, useEffect } from 'react';
import { Avatar } from '../ui/Avatar';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Monitor,
} from 'lucide-react';

export const CallModal = ({
  isOpen,
  onClose,
  contact,
  callType = 'voice', // 'voice' | 'video'
}) => {
  const [callState, setCallState] = useState('ringing'); // 'ringing' | 'connected'
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);

  // Simulate ringing then connecting
  useEffect(() => {
    if (!isOpen) {
      setCallState('ringing');
      setDuration(0);
      return;
    }

    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 2200);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  // Duration counter when connected
  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen) return null;

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const contactName = contact?.title || contact?.user?.name || contact?.project?.title || 'Devquox Member';
  const contactAvatar = contact?.user?.avatar || contact?.user?.avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center p-8 text-white select-none">
        
        {/* Subtle glowing background orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Tag */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-rose-400 mb-6 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          <span>{callType === 'video' ? 'Encrypted Video Call' : 'Encrypted Voice Call'}</span>
        </div>

        {/* Avatar with Soundwave Rings */}
        <div className="relative my-6 flex items-center justify-center">
          {callState === 'ringing' && (
            <>
              <div className="absolute w-36 h-36 rounded-full border border-primary-500/30 animate-ping opacity-60" />
              <div className="absolute w-44 h-44 rounded-full border border-primary-500/20 animate-pulse" />
            </>
          )}

          <div className="relative z-10 ring-4 ring-primary-500/30 rounded-full shadow-2xl">
            <Avatar
              src={contactAvatar}
              name={contactName}
              size="xl"
              className="w-24 h-24 text-2xl font-bold rounded-full"
            />
          </div>
        </div>

        {/* Contact Name & Status */}
        <div className="text-center space-y-1 z-10">
          <h3 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
            {contactName}
          </h3>
          <p className="text-xs font-semibold text-primary-400">
            {callState === 'ringing' ? (
              <span className="animate-pulse">Ringing...</span>
            ) : (
              <span>Connected • {formatDuration(duration)}</span>
            )}
          </p>
        </div>

        {/* Interactive Simulated Video Viewport if Video is active */}
        {isVideoOn && callState === 'connected' && (
          <div className="w-full h-32 mt-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 overflow-hidden flex items-center justify-center relative">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-primary-400 animate-pulse" />
              <span>Camera Feed Active (720p HD)</span>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-mono text-primary-400">
              Live
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="w-full flex items-center justify-center gap-3 mt-8 pt-4 border-t border-slate-800/80 z-10">
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            type="button"
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              !isVideoOn
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
            }`}
            title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isScreenSharing
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Speaker / Volume */}
          <button
            type="button"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              !isSpeakerOn
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
            }`}
            title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Hang Up Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition-transform active:scale-95 ml-2"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;

