'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, MoreVertical, Check, CheckCheck, X,
  Camera, Pencil, LogOut, Send, Smile, Paperclip,
  ArrowLeft, Settings, Phone, Video, MessageSquare,
  Users, Globe, Bell, Plus, Mic, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useRouter } from 'next/navigation';
import { fetchApi, removeAuthToken } from '@/lib/api';

// ─── Utility: generate stable DM room ID ────────────────────────────────────
function getDmRoomId(idA: string, idB: string): string {
  return 'dm_' + [idA, idB].sort().join('_');
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  customStatus?: string;
  status: 'online' | 'away' | 'offline' | 'invisible';
}

interface AppMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string | null;
  type: 'text' | 'image' | 'file';
  content?: string;
  imageUrl?: string;
  caption?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
  pending?: boolean;
}

const CHAT_STORAGE_PREFIX = 'mconnect_chat_backup_';

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: '😀 😃 😄 😁 😆 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 🙂‍↕️ 🙂‍↔️ 😏 😒 🙂‍↕️ 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😮‍💨 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😶‍🌫️ 😱 😨 😰 😥 😓 🫣 🤗 🫡 🤔 🫢 🤭 🤫 🤥 😶 😐 😑 😬 🫨 🫠 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 😵‍💫 🫥 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾' },
  { name: 'Hands', emojis: '👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 🫷 🫸 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 𦿿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 🫦' },
  { name: 'Nature', emojis: '🐵 🐒 🦍 🦧 🐶 🐕 🦮 🐕‍ 🐩 🐺 🦊 🦝 🐱 🐈 🐈‍⬛ 🦁 🐯 🐅 🐆 🐴 🫎 🫏 🐎 🦄 🦓 🦌 🦬 🐮 🐂 🐃 🐄 🐷 🐖 🐗 🐽 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏 🦛 🐭 🐁 🐀 🐹 🐰 🐇 🐿️ 🦫 🦔 🦇 🐻 🐻‍❄️ 🐨 🐼 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🕊️ 🦅 🦆 🦢 🦉 🦤 🪶 🦩 🦚 🦜 🪽 🐦‍⬛ 🪿 🐸 🐊 🐢 🦎 🐍 🐲 🐉 🦕 🦖 🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🐚 🪸 🪼 🦀 🦞 🦐 🦑 🦪 🐌 🦋 🐛 🐜 🐝 🪲 🐞 🦗 🪳 🕷️ 🕸️ 🦂 🦟 🪰 🪱 🦠 💐 🌸 💮 🪷 🏵️ 🌹 🥀 🌺 🌻 🌼 🌷 🪻 🌱 🪴 🌲 🌳 🌴 🌵 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃 🪹 🪺 🍄 🪨 🪵' },
].map(category => ({ ...category, emojis: category.emojis.split(' ') }));

function restoreMessages(raw: string | null): Record<string, AppMessage[]> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([roomId, messages]) => [
        roomId,
        Array.isArray(messages)
          ? messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp), pending: false }))
          : [],
      ])
    );
  } catch {
    return {};
  }
}

function mergeMessages(existing: AppMessage[], incoming: AppMessage[]) {
  const byId = new Map<string, AppMessage>();
  [...existing, ...incoming].forEach(message => {
    const key = message.id || `${message.senderId}_${message.timestamp}_${message.content || message.imageUrl || message.fileName}`;
    byId.set(key, { ...message, pending: false });
  });
  return Array.from(byId.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7',
  '#C7CEEA', '#FF9AA2', '#F3B0C3', '#9EB9D4',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function Avatar({ user, size = 46 }: { user: Partial<AppUser>; size?: number }) {
  const name = user.displayName || user.username || '?';
  const initials = name.slice(0, 2).toUpperCase();
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        className="rounded-full object-cover flex-shrink-0 border-2 border-[#FAF3E6]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-[#554E44] font-bold flex-shrink-0 select-none border-2 border-[#FAF3E6]"
      style={{ width: size, height: size, background: avatarColor(user.username || 'x'), fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

function OnlineDot({ status, borderColor = '#FAF3E6' }: { status: string; borderColor?: string }) {
  const c = status === 'online' ? '#5DB075' : status === 'away' ? '#FFC107' : '#BDBDBD';
  return (
    <span
      className="absolute bottom-0 right-0 rounded-full"
      style={{ width: 12, height: 12, background: c, border: `2px solid ${borderColor}` }}
    />
  );
}

// ─── Profile / Settings Modal ─────────────────────────────────────────────────
function SettingsModal({ user, onClose, onUpdate, socket }: {
  user: AppUser;
  onClose: () => void;
  onUpdate: (u: Partial<AppUser>) => void;
  socket: any;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName || user.username);
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');
  const [status, setStatus] = useState(user.status);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchApi('/profile/update', {
        method: 'POST',
        body: JSON.stringify({ displayName, customStatus, avatarUrl: avatarPreview || null, status }),
      });
      if (res.ok) {
        onUpdate({ displayName, customStatus, avatarUrl: avatarPreview || undefined, status });
        if (socket && status !== user.status) socket.emit('updateStatus', status);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 1200);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    removeAuthToken();
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#FAF3E6] rounded-[2rem] w-full max-w-md mx-4 overflow-hidden shadow-2xl border border-white/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 flex items-center justify-between border-b border-[#EAE3D9]">
          <h2 className="text-[#3A352F] font-bold text-lg">Profile & Settings</h2>
          <button onClick={onClose} className="text-[#968E85] hover:text-[#3A352F] transition-colors p-1.5 rounded-full hover:bg-black/5">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md" />
                : <div className="w-24 h-24 rounded-full flex items-center justify-center text-[#554E44] text-3xl font-bold ring-4 ring-white shadow-md"
                  style={{ background: avatarColor(user.username) }}>
                  {(displayName || user.username).slice(0, 2).toUpperCase()}
                </div>
              }
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-white text-[#3A352F] rounded-full p-2.5 shadow-lg hover:scale-105 transition-transform"
              >
                <Camera size={14} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#968E85] text-xs font-bold uppercase tracking-wider pl-1">Display Name</label>
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-black/5 focus-within:ring-2 ring-black/10 transition-all">
              <Pencil size={16} className="text-[#968E85] flex-shrink-0" />
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={32}
                className="flex-1 bg-transparent text-[#3A352F] font-medium focus:outline-none"
                placeholder="Your display name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#968E85] text-xs font-bold uppercase tracking-wider pl-1">About</label>
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-black/5 focus-within:ring-2 ring-black/10 transition-all">
              <Pencil size={16} className="text-[#968E85] flex-shrink-0" />
              <input
                value={customStatus}
                onChange={e => setCustomStatus(e.target.value)}
                maxLength={80}
                className="flex-1 bg-transparent text-[#3A352F] font-medium focus:outline-none"
                placeholder="Hey there! I am using MConnect."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#968E85] text-xs font-bold uppercase tracking-wider pl-1">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(['online', 'away', 'invisible', 'offline'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-3 rounded-2xl text-sm font-semibold capitalize transition-all border ${status === s
                    ? 'bg-white text-[#3A352F] border-transparent shadow-sm'
                    : 'bg-transparent text-[#968E85] border-[#EAE3D9] hover:bg-white/50'
                    }`}
                >
                  <span className="mr-2 text-base">
                    {s === 'online' ? '🟢' : s === 'away' ? '🟡' : s === 'invisible' ? '👻' : '⚫'}
                  </span>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#3A352F] hover:bg-[#2A2520] text-white disabled:opacity-50 font-bold py-3.5 rounded-2xl transition-all shadow-md active:scale-[0.98]"
            >
              {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center bg-[#FFEAE6] text-[#FF5B5B] px-5 py-3.5 rounded-2xl font-bold transition-all hover:bg-[#FFDCD6] active:scale-[0.98]"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, isOwn, showTail }: { msg: AppMessage; isOwn: boolean; showTail: boolean }) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          relative max-w-[75%] md:max-w-[65%] px-5 py-3.5 shadow-sm
          ${isOwn
            ? `bg-white text-[#3A352F] rounded-3xl ${showTail ? 'rounded-tr-md' : ''}`
            : `bg-[#E3DCD1] text-[#3A352F] rounded-3xl ${showTail ? 'rounded-tl-md' : ''}`
          }
          ${msg.pending ? 'opacity-50' : ''}
        `}
      >
        {msg.type === 'text' && (
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap font-medium">{msg.content}</p>
        )}
        {msg.type === 'image' && msg.imageUrl && (
          <div className="overflow-hidden rounded-2xl -mx-2 -mt-2 mb-1">
            <img src={msg.imageUrl} alt={msg.caption || 'image'} className="max-w-full max-h-64 object-cover w-full" />
            {msg.caption && <p className="px-3 pt-2 pb-1 text-sm font-medium">{msg.caption}</p>}
          </div>
        )}
        {msg.type === 'file' && (
          <a
            href={msg.content}
            download={msg.fileName || 'attachment'}
            className="flex items-center gap-3 min-w-[200px] rounded-2xl bg-black/5 px-4 py-3 hover:bg-black/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Paperclip size={18} className="text-[#3A352F]" />
            </div>
            <span className="min-w-0">
              <span className="block text-sm font-bold truncate text-[#3A352F]">{msg.fileName || 'Attachment'}</span>
              {typeof msg.fileSize === 'number' && (
                <span className="block text-xs font-semibold text-[#968E85]">{(msg.fileSize / 1024).toFixed(1)} KB</span>
              )}
            </span>
          </a>
        )}

        <div className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] font-bold text-[#968E85] select-none">{time}</span>
          {isOwn && (
            msg.pending
              ? <Check size={12} className="text-[#968E85]" />
              : <CheckCheck size={12} className="text-[#5DB075]" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ChatLayout() {
  const socket = useSocket();
  const router = useRouter();

  const [me, setMe] = useState<AppUser | null>(null);
  const [contacts, setContacts] = useState<AppUser[]>([]);
  const [activeContact, setActiveContact] = useState<AppUser | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, AppMessage[]>>({});
  const [input, setInput] = useState('');
  const [typers, setTypers] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);

  // UI Tabs State
  const [activeLeftTab, setActiveLeftTab] = useState<'contacts' | 'groups' | 'globe'>('contacts');
  const [activeHeaderTab, setActiveHeaderTab] = useState<'chats' | 'calls' | 'notifications'>('chats');

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, usersRes] = await Promise.all([fetchApi('/auth/me'), fetchApi('/users')]);
        const meData = await meRes.json();
        const usersData = await usersRes.json();

        const currentUser: AppUser = {
          id: meData.user._id,
          username: meData.user.username,
          displayName: meData.user.displayName || meData.user.username,
          avatarUrl: meData.user.avatarUrl || null,
          customStatus: meData.user.customStatus || '',
          status: meData.user.status || 'online',
        };
        setMe(currentUser);
        setMessagesMap(restoreMessages(localStorage.getItem(`${CHAT_STORAGE_PREFIX}${currentUser.id}`)));

        if (Array.isArray(usersData)) {
          setContacts(usersData.map((u: any) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName || u.username,
            avatarUrl: u.avatarUrl || null,
            customStatus: u.customStatus || '',
            status: u.status || 'offline',
          })));
        }
      } catch {
        router.push('/login');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!me) return;
    try {
      localStorage.setItem(`${CHAT_STORAGE_PREFIX}${me.id}`, JSON.stringify(messagesMap));
    } catch {}
  }, [messagesMap, me]);

  useEffect(() => {
    if (!me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);

    setLoadingMsg(!messagesMap[roomId]);
    fetchApi(`/messages/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const serverMessages = data.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp), pending: false }));
          setMessagesMap(prev => ({
            ...prev,
            [roomId]: mergeMessages(prev[roomId] || [], serverMessages),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMsg(false));
  }, [me, activeContact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesMap, activeContact, typers]);

  useEffect(() => {
    if (!socket || !me) return;

    const handleMessage = (msg: any) => {
      const roomId = msg.roomId as string;
      const incoming: AppMessage = { ...msg, timestamp: new Date(msg.timestamp), pending: false };

      setMessagesMap(prev => {
        const existing = prev[roomId] || [];
        const optIdx = existing.findIndex(
          m => m.pending &&
            m.senderId === me.id &&
            m.roomId === roomId &&
            m.type === msg.type &&
            (m.content === msg.content || m.imageUrl === msg.imageUrl || m.fileName === msg.fileName)
        );
        if (optIdx !== -1) {
          const updated = [...existing];
          updated[optIdx] = incoming;
          return { ...prev, [roomId]: updated };
        }
        if (existing.some(m => m.id === msg.id)) return prev;
        return { ...prev, [roomId]: [...existing, incoming] };
      });
    };

    const handleTyping = (roomId: string, userId: string, isTyping: boolean) => {
      const currentRoomId = me && activeContact ? getDmRoomId(me.id, activeContact.id) : '';
      if (roomId !== currentRoomId) return;
      setTypers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(userId); else next.delete(userId);
        return next;
      });
    };

    const handleStatusUpdate = (userId: string, newStatus: string) => {
      setContacts(prev => prev.map(c => c.id === userId ? { ...c, status: newStatus as any } : c));
    };

    socket.on('message', handleMessage);
    socket.on('typingIndicator', handleTyping);
    socket.on('userStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('message', handleMessage);
      socket.off('typingIndicator', handleTyping);
      socket.off('userStatusUpdate', handleStatusUpdate);
    };
  }, [socket, me, activeContact]);

  useEffect(() => {
    if (!socket || !me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);
    socket.emit('joinRoom', roomId);
    return () => { socket.emit('leaveRoom', roomId); };
  }, [socket, me, activeContact]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !socket || !me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);
    const text = input.trim();

    const optimistic: AppMessage = {
      id: `opt_${Date.now()}_${Math.random()}`,
      roomId,
      senderId: me.id,
      senderName: me.displayName,
      senderAvatar: me.avatarUrl,
      type: 'text',
      content: text,
      timestamp: new Date(),
      pending: true,
    };

    setMessagesMap(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []), optimistic] }));
    socket.emit('sendMessage', roomId, { type: 'text', content: text } as any);
    setInput('');
    socket.emit('typing', roomId, false);
    if (typingRef.current) clearTimeout(typingRef.current);
    inputRef.current?.focus();
  }, [input, socket, me, activeContact]);

  const sendAttachment = useCallback((file: File, dataUrl: string) => {
    if (!socket || !me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);
    const isImage = file.type.startsWith('image/');
    const optimistic: AppMessage = {
      id: `opt_file_${Date.now()}_${Math.random()}`,
      roomId,
      senderId: me.id,
      senderName: me.displayName,
      senderAvatar: me.avatarUrl,
      type: isImage ? 'image' : 'file',
      content: isImage ? undefined : dataUrl,
      imageUrl: isImage ? dataUrl : undefined,
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date(),
      pending: true,
    };

    setMessagesMap(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []), optimistic] }));
    socket.emit('sendMessage', roomId, {
      type: optimistic.type,
      content: optimistic.content,
      imageUrl: optimistic.imageUrl,
      fileName: file.name,
      fileSize: file.size,
    } as any);
    setShowEmojiPicker(false);
  }, [socket, me, activeContact]);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Please choose a file under 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => sendAttachment(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => `${prev}${emoji}`);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socket || !me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);
    socket.emit('typing', roomId, true);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => socket.emit('typing', roomId, false), 2500);
  };

  const openChat = (contact: AppUser) => {
    setActiveContact(contact);
    setTypers(new Set());
    setInput('');
    setShowEmojiPicker(false);
    if (isMobile) setShowChat(true);
  };

  const goBack = () => { setShowChat(false); setActiveContact(null); };

  const handleProfileUpdate = (updated: Partial<AppUser>) => {
    setMe(prev => prev ? { ...prev, ...updated } : prev);
  };

  const filteredContacts = contacts.filter(c =>
    (c.displayName || c.username).toLowerCase().includes(search.toLowerCase())
  );

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const order = { online: 0, away: 1, invisible: 2, offline: 3 };
    const oa = order[a.status] ?? 3, ob = order[b.status] ?? 3;
    if (oa !== ob) return oa - ob;
    return (a.displayName || a.username).localeCompare(b.displayName || b.username);
  });

  const activeRoomId = me && activeContact ? getDmRoomId(me.id, activeContact.id) : '';
  const activeMessages = messagesMap[activeRoomId] || [];

  const getLastMsg = (contact: AppUser): AppMessage | null => {
    if (!me) return null;
    const roomId = getDmRoomId(me.id, contact.id);
    const msgs = messagesMap[roomId];
    return msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  const isTyping = typers.size > 0;

  if (!me) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#E0F7FA] to-[#FFCCBC]">
        <div className="flex flex-col items-center gap-6 bg-white/50 p-8 rounded-[2rem] backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-[#3A352F] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#3A352F] font-bold tracking-widest uppercase">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#E8F3F1] via-[#F4EBE3] to-[#FCDED4] p-0 md:p-6 lg:p-10 font-sans antialiased selection:bg-[#3A352F]/10 text-[#3A352F]">
      {showSettings && (
        <SettingsModal
          user={me}
          onClose={() => setShowSettings(false)}
          onUpdate={handleProfileUpdate}
          socket={socket}
        />
      )}

      {/* Main Glassmorphic Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full h-screen md:h-full max-w-[1400px] md:max-h-[850px] bg-[#FAF3E6]/90 backdrop-blur-2xl md:rounded-[3rem] shadow-2xl overflow-hidden border border-white/60 relative"
      >
        
        {/* ── LEFT SIDEBAR (CONTACTS) ────────────────────────────────────────────────── */}
        {(!isMobile || !showChat) && (
          <div
            className="flex flex-col border-r border-[#EAE3D9]/60 flex-shrink-0 relative z-10"
            style={{ width: isMobile ? '100%' : '360px' }}
          >
            {/* User Profile Header (Top Left) */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
               <button onClick={() => setShowSettings(true)} className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none">
                 <div className="relative">
                   <Avatar user={me} size={48} />
                   <OnlineDot status={me.status} />
                 </div>
                 <div className="text-left hidden sm:block md:hidden lg:block">
                   <p className="font-bold text-[#3A352F] text-sm leading-tight">{me.displayName}</p>
                   <p className="text-xs font-semibold text-[#968E85]">My Account</p>
                 </div>
               </button>
               <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3A352F] shadow-sm hover:scale-105 transition-transform">
                 <Settings size={18} />
               </button>
            </div>

            {/* Sub-Tabs (Person, Group, Globe) */}
            <div className="px-6 py-2 flex items-center gap-2">
              <button 
                onClick={() => setActiveLeftTab('contacts')}
                className={`flex-1 py-2 rounded-xl flex justify-center items-center transition-all ${activeLeftTab === 'contacts' ? 'bg-[#E3DCD1] text-[#3A352F] shadow-inner' : 'text-[#968E85] hover:bg-[#EAE3D9]'}`}
              >
                <Users size={18} />
              </button>
              <button 
                onClick={() => setActiveLeftTab('groups')}
                className={`flex-1 py-2 rounded-xl flex justify-center items-center transition-all ${activeLeftTab === 'groups' ? 'bg-[#E3DCD1] text-[#3A352F] shadow-inner' : 'text-[#968E85] hover:bg-[#EAE3D9]'}`}
              >
                <Users size={18} />
              </button>
              <button 
                onClick={() => setActiveLeftTab('globe')}
                className={`flex-1 py-2 rounded-xl flex justify-center items-center transition-all ${activeLeftTab === 'globe' ? 'bg-[#E3DCD1] text-[#3A352F] shadow-inner' : 'text-[#968E85] hover:bg-[#EAE3D9]'}`}
              >
                <Globe size={18} />
              </button>
            </div>

            {/* Search Box */}
            <div className="px-6 py-4">
              <div className="bg-white rounded-full flex items-center px-4 py-3 shadow-sm border border-black/5 focus-within:ring-2 ring-black/10 transition-all">
                <Search size={16} className="text-[#968E85]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none ml-3 text-sm font-semibold text-[#3A352F] placeholder-[#B5B0AA] w-full"
                />
                {search && <X size={16} className="text-[#968E85] cursor-pointer hover:text-[#3A352F]" onClick={() => setSearch('')} />}
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
              <AnimatePresence>
                {sortedContacts.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-center px-6">
                    <p className="text-[#968E85] text-sm font-semibold">No contacts found</p>
                  </motion.div>
                ) : (
                  sortedContacts.map((c, i) => {
                    const lastMsg = getLastMsg(c);
                    const isActive = activeContact?.id === c.id;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        key={c.id}
                        onClick={() => openChat(c)}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-all rounded-2xl ${isActive ? 'bg-[#E3DCD1] shadow-inner scale-[0.98]' : 'hover:bg-[#EAE3D9] hover:scale-[0.99]'}`}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar user={c} size={48} />
                          <OnlineDot status={c.status} borderColor={isActive ? '#E3DCD1' : '#FAF3E6'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[#3A352F] font-bold text-[15px] truncate">{c.displayName}</h3>
                            {lastMsg && (
                              <span className="text-[11px] font-bold text-[#968E85]">
                                {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#7C746B] truncate">
                            {lastMsg ? (
                              <span className="flex items-center gap-1">
                                {lastMsg.senderId === me.id && <span className="text-[#5DB075]"><CheckCheck size={14}/></span>}
                                {lastMsg.type === 'text' && lastMsg.content}
                                {lastMsg.type === 'image' && '📷 Photo'}
                                {lastMsg.type === 'file' && '📁 Document'}
                              </span>
                            ) : (
                              c.customStatus || 'Hey there! I am using MConnect.'
                            )}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── RIGHT CHAT PANEL ────────────────────────────────────────────── */}
        {(!isMobile || showChat) && (
          <div className="flex-1 flex flex-col relative z-10 bg-white/40">
            {activeContact ? (
              <>
                {/* Chat Top Header */}
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE3D9]/60">
                  
                  {/* Left Tabs (Chats, Calls, Notifications) */}
                  <div className="flex items-center gap-1 bg-[#EAE3D9] p-1 rounded-full self-start">
                    {(['chats', 'calls', 'notifications'] as const).map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveHeaderTab(tab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${activeHeaderTab === tab ? 'bg-white shadow-sm text-[#3A352F]' : 'text-[#968E85] hover:text-[#3A352F]'}`}
                      >
                        {tab === 'chats' && <MessageSquare size={16} />}
                        {tab === 'calls' && <Phone size={16} />}
                        {tab === 'notifications' && <Bell size={16} />}
                        <span className="hidden lg:block">{tab}</span>
                      </button>
                    ))}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#3A352F] hover:scale-105 transition-transform"><Settings size={18} /></button>
                    <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#3A352F] hover:scale-105 transition-transform"><MoreVertical size={18} /></button>
                  </div>
                </div>

                {/* Active Chat Info Bar */}
                <div className="px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isMobile && (
                      <button onClick={goBack} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#3A352F] hover:scale-105 transition-transform mr-2">
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div className="relative">
                      <Avatar user={activeContact} size={52} />
                      <OnlineDot status={activeContact.status} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#3A352F]">{activeContact.displayName}</h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${activeContact.status === 'online' ? 'bg-[#5DB075]' : 'bg-[#BDBDBD]'}`} />
                        <span className="text-sm font-bold text-[#968E85] capitalize">{isTyping ? 'Typing...' : activeContact.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="w-11 h-11 rounded-full bg-[#EAE3D9] flex items-center justify-center text-[#3A352F] hover:bg-[#E3DCD1] transition-colors"><Phone size={18} /></button>
                    <button className="w-11 h-11 rounded-full bg-[#EAE3D9] flex items-center justify-center text-[#3A352F] hover:bg-[#E3DCD1] transition-colors"><Video size={18} /></button>
                    <button className="w-11 h-11 rounded-full bg-transparent flex items-center justify-center text-[#968E85] hover:bg-[#EAE3D9] transition-colors"><MoreVertical size={20} /></button>
                  </div>
                </div>

                {/* Message History Feed Stream */}
                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-2 space-y-1">
                  {loadingMsg ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-[#3A352F] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    activeMessages.map((msg, idx) => {
                      const isOwn = msg.senderId === me.id;
                      const prevMsg = activeMessages[idx - 1];
                      const showTail = !prevMsg || prevMsg.senderId !== msg.senderId;
                      return <Bubble key={msg.id} msg={msg} isOwn={isOwn} showTail={showTail} />;
                    })
                  )}
                  {isTyping && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-2">
                      <div className="bg-[#E3DCD1] px-4 py-3 rounded-3xl rounded-tl-md flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#968E85] animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-[#968E85] animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-2 h-2 rounded-full bg-[#968E85] animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </motion.div>
                  )}
                  <div ref={bottomRef} className="h-4" />
                </div>

                {/* Emoji Picker Overlay */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-24 left-10 right-10 md:left-20 md:right-20 bg-white rounded-[2rem] shadow-2xl border border-black/5 z-20 flex flex-col h-64 overflow-hidden"
                    >
                      <div className="flex overflow-x-auto bg-[#FAF3E6] border-b border-[#EAE3D9] scrollbar-none flex-shrink-0 p-2 gap-2">
                        {EMOJI_CATEGORIES.map((cat, i) => (
                          <button
                            key={cat.name}
                            onClick={() => setEmojiCategory(i)}
                            className={`px-4 py-2 text-xs font-bold whitespace-nowrap rounded-full transition-colors ${emojiCategory === i ? 'bg-white text-[#3A352F] shadow-sm' : 'bg-transparent text-[#968E85] hover:bg-black/5'}`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-8 sm:grid-cols-10 gap-3 text-2xl justify-items-center cursor-pointer">
                        {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, idx) => (
                          <span key={idx} onClick={() => addEmoji(emoji)} className="hover:scale-125 active:scale-95 transition-transform duration-100">{emoji}</span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Input Area */}
                <div className="px-6 md:px-10 pb-6 pt-2 z-10">
                  <div className="bg-white rounded-full flex items-center p-2 shadow-lg shadow-black/5 border border-black/5">
                    {/* Add Attachment Button */}
                    <button
                      onClick={() => attachRef.current?.click()}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-[#968E85] hover:bg-[#FAF3E6] hover:text-[#3A352F] transition-colors flex-shrink-0"
                    >
                      <Plus size={22} />
                    </button>
                    <input
                      ref={attachRef}
                      type="file"
                      onChange={handleAttachmentChange}
                      className="hidden"
                      accept="image/*,application/pdf,text/plain,application/zip"
                    />

                    {/* Text Input */}
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder="Type message here..."
                      className="flex-1 bg-transparent px-4 text-[15px] font-medium text-[#3A352F] placeholder-[#B5B0AA] focus:outline-none"
                    />

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 pr-1 flex-shrink-0">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showEmojiPicker ? 'bg-[#EAE3D9] text-[#3A352F]' : 'text-[#968E85] hover:bg-[#FAF3E6] hover:text-[#3A352F]'}`}
                      >
                        <Smile size={20} />
                      </button>
                      <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#968E85] hover:bg-[#FAF3E6] hover:text-[#3A352F] transition-colors">
                        <Mic size={20} />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-12 h-12 rounded-full bg-[#3A352F] text-white flex items-center justify-center shadow-md disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 transition-all ml-1"
                      >
                        <Send size={18} className={input.trim() ? "translate-x-[2px] -translate-y-[1px]" : ""} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Splash / Welcome Screen Content State */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10 select-none">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl border border-black/5"
                >
                  <MessageSquare size={48} className="text-[#3A352F]" />
                </motion.div>
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-[#3A352F] font-extrabold text-3xl md:text-4xl mb-4 tracking-tight"
                >
                  Welcome to MConnect
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-[#7C746B] text-lg max-w-md font-medium leading-relaxed mb-10"
                >
                  Send and receive messages in real time with our beautiful new interface.
                </motion.p>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-center gap-2 text-sm font-bold text-[#5DB075] bg-white px-5 py-2.5 rounded-full shadow-sm"
                >
                  <span>🔐 End-to-end encrypted connection</span>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}