import React, { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Hash, MessageSquare, Send } from 'lucide-react';
import { brgApi, type CommunicationRoom } from '../services/brgApi';
import { useAppStore } from '../store/appStore';

const LEVEL_STYLES: Record<string, string> = {
  national: 'text-red-300 border-red-500/20 bg-red-500/10',
  state: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
  district: 'text-blue-300 border-blue-500/20 bg-blue-500/10',
};

export const CommunicationsPage: React.FC = () => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionStatus = useAppStore((store) => store.connectionStatus);
  const { data: roomEnvelope, isLoading: roomsLoading } = useSWR('brg-communication-rooms', brgApi.communicationRooms, { revalidateOnFocus: true, shouldRetryOnError: false });
  const rooms = roomEnvelope?.data ?? [];
  const selectedRoom: CommunicationRoom | null = rooms.find((room) => room.id === activeRoomId) ?? rooms[0] ?? null;
  const messageKey = selectedRoom ? `brg-messages-${selectedRoom.id}` : null;
  const { data: messageEnvelope, isLoading: messagesLoading, mutate: refreshMessages } = useSWR(messageKey, () => selectedRoom ? brgApi.communicationMessages(selectedRoom.id) : null, { revalidateOnFocus: true, shouldRetryOnError: false });
  const messages = messageEnvelope?.data ?? [];

  useEffect(() => {
    if (selectedRoom && selectedRoom.id !== activeRoomId) setActiveRoomId(selectedRoom.id);
  }, [selectedRoom?.id, activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string; data?: { roomId?: string } }>).detail;
      if (detail?.type === 'communication:message' && detail.data?.roomId === selectedRoom?.id) void refreshMessages();
    };
    window.addEventListener('brg:realtime', handleRealtime);
    return () => window.removeEventListener('brg:realtime', handleRealtime);
  }, [refreshMessages, selectedRoom?.id]);

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRoom || !input.trim() || sending) return;
    setSending(true);
    setSendError('');
    try {
      await brgApi.sendCommunicationMessage(selectedRoom.id, input.trim());
      setInput('');
      await refreshMessages();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Message could not be saved.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300"><MessageSquare size={14} /> Command communications</div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Scoped response channels</h1>
          <p className="mt-1 text-sm text-slate-400">Messages are stored in BRG PostgreSQL and delivered to connected officers in the same command scope.</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider ${connectionStatus === 'connected' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>REALTIME {connectionStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}</span>
      </header>

      <div className="grid min-h-[520px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-slate-800 bg-slate-900/60 md:border-b-0 md:border-r" aria-label="Communication rooms">
          <div className="border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Your channels</div>
          <div className="space-y-1 p-2">
            {rooms.map((room) => (
              <button key={room.id} type="button" onClick={() => setActiveRoomId(room.id)} aria-pressed={selectedRoom?.id === room.id} className={`flex w-full items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm ${selectedRoom?.id === room.id ? 'border-sky-500/20 bg-sky-500/10 text-white' : 'border-transparent text-slate-400 hover:bg-white/5'}`}>
                <Hash size={13} /><span className="min-w-0 flex-1 truncate">{room.name}</span><span className={`rounded border px-1.5 py-0.5 text-[9px] uppercase ${LEVEL_STYLES[room.commandLevel] ?? 'border-slate-700 text-slate-400'}`}>{room.commandLevel}</span>
              </button>
            ))}
            {!rooms.length && <p className="px-3 py-5 text-xs leading-5 text-slate-500">{roomsLoading ? 'Loading channels…' : 'No channels are available for this role or scope.'}</p>}
          </div>
        </aside>

        <section className="flex min-h-[520px] min-w-0 flex-col" aria-label="Messages">
          {selectedRoom ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                <div><h2 className="text-sm font-semibold text-slate-100">{selectedRoom.name}</h2><p className="mt-0.5 text-xs text-slate-500">{selectedRoom.stateScope ?? 'National scope'}{selectedRoom.districtScope ? ` · ${selectedRoom.districtScope}` : ''}</p></div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Stored messages</span>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                {messages.map((message) => <article key={message.id} className="max-w-3xl rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-sm font-semibold text-slate-200">{message.senderName}</span><span className="text-[10px] uppercase tracking-wide text-sky-300">{message.senderRole.replaceAll('_', ' ')}</span><time className="ml-auto text-[10px] text-slate-500" dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{message.content}</p>
                </article>)}
                {!messages.length && <div className="grid h-full min-h-48 place-items-center text-center text-sm text-slate-500">{messagesLoading ? 'Loading saved messages…' : 'No messages have been recorded in this channel.'}</div>}
                <div ref={messagesEndRef} />
              </div>
              {sendError && <p className="mx-4 mb-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-200" role="alert">{sendError}</p>}
              <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-800 p-3">
                <label htmlFor="command-message" className="sr-only">Message</label>
                <input id="command-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} required placeholder="Write a scoped operational message…" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400" />
                <button type="submit" disabled={sending || !input.trim()} aria-label="Send message" className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"><Send size={15} /><span className="hidden sm:inline">{sending ? 'Saving…' : 'Send'}</span></button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center text-sm text-slate-500">{roomsLoading ? 'Loading command channels…' : 'No communication channels are available. Ask an administrator to assign your response scope.'}</div>
          )}
        </section>
      </div>
    </div>
  );
};
