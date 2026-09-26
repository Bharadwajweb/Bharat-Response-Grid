import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Users, Hash } from 'lucide-react';
import { MOCK_ROOMS, MOCK_MESSAGES, MOCK_USERS } from '../data/mockData';
import { UserAvatar } from '../components/ui/Overlay';
import type { CommandRoom, ChatMessage } from '../types';

const LEVEL_STYLES: Record<string, string> = {
  national: 'text-red-400 bg-red-500/10 border-red-500/20',
  central: 'text-red-400 bg-red-500/10 border-red-500/20',
  state: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  district: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export const CommunicationsPage: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState<CommandRoom>(MOCK_ROOMS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomMessages = messages.filter((m) => m.roomId === activeRoom.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      roomId: activeRoom.id,
      senderId: 'USR-001',
      senderName: 'Adv. Priya Menon',
      senderRole: 'National Admin',
      content: input.trim(),
      sentAt: new Date().toISOString(),
      readBy: ['USR-001'],
    };
    setMessages((m) => [...m, newMsg]);
    setInput('');
  };

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Left: Room list */}
      <div className="w-60 flex-shrink-0 bg-[#07111F] border-r border-white/8 flex flex-col">
        <div className="px-4 py-4 border-b border-white/6">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <MessageSquare size={15} className="text-blue-400" />
            Command Rooms
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {MOCK_ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all ${activeRoom.id === room.id ? 'bg-blue-500/12 border border-blue-500/20' : 'hover:bg-white/4 border border-transparent'}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <Hash size={12} className="text-slate-600 flex-shrink-0" />
                  <span className={`text-xs font-bold truncate ${activeRoom.id === room.id ? 'text-blue-300' : 'text-slate-300'}`}>
                    {room.name}
                  </span>
                </div>
                {room.unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {room.unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold uppercase ${LEVEL_STYLES[room.level]}`}>
                {room.level}
              </span>
              {room.lastMessage && (
                <p className="text-xs text-slate-600 mt-1 line-clamp-1">{room.lastMessage}</p>
              )}
            </button>
          ))}
        </div>

        {/* Participants online */}
        <div className="px-4 py-3 border-t border-white/6">
          <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Online Users</p>
          <div className="space-y-1.5">
            {MOCK_USERS.filter((u) => u.onlineAt).slice(0, 4).map((user) => (
              <div key={user.id} className="flex items-center gap-2">
                <UserAvatar initials={user.avatarInitials} size="xs" online={!!user.onlineAt} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400 truncate">{user.name.split(' ')[0]} {user.name.split(' ').slice(-1)[0]}</p>
                </div>
                <span className="live-dot flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Room header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Hash size={18} className="text-slate-500" />
            <div>
              <p className="text-sm font-bold text-slate-100">{activeRoom.name}</p>
              <p className="text-xs text-slate-500">{activeRoom.participants.length} participants · {activeRoom.level} command</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded border font-bold uppercase ${LEVEL_STYLES[activeRoom.level]}`}>
              {activeRoom.level}
            </span>
            <div className="flex items-center gap-1">
              <span className="live-dot" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {roomMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare size={32} className="text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No messages in this room yet</p>
              </div>
            </div>
          ) : (
            roomMessages.map((msg) => {
              const isOwn = msg.senderId === 'USR-001';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <UserAvatar
                    initials={msg.senderName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    size="sm"
                    online
                  />
                  <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwn && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-slate-300">{msg.senderName}</span>
                        <span className="text-xs text-slate-600">{msg.senderRole}</span>
                      </div>
                    )}
                    <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-[#132238] text-slate-200 border border-white/8 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 px-1">
                      {new Date(msg.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="px-4 py-3 border-t border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message #${activeRoom.name}...`}
              className="flex-1 bg-[#132238] border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-4 py-2.5 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-700 mt-1.5 px-1">All messages are logged and monitored for operational record-keeping.</p>
        </form>
      </div>

      {/* Right: Participants panel */}
      <div className="w-52 flex-shrink-0 bg-[#07111F] border-l border-white/8 hidden xl:flex flex-col">
        <div className="px-4 py-4 border-b border-white/6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Users size={13} />
            Participants ({activeRoom.participants.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {MOCK_USERS.slice(0, activeRoom.participants.length + 1).map((user) => (
            <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/4 transition-colors">
              <UserAvatar initials={user.avatarInitials} size="xs" online={!!user.onlineAt} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-300 truncate">{user.name.split(' ')[0]} {user.name.split(' ').slice(-1)[0]}</p>
                <p className="text-xs text-slate-600 truncate capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
