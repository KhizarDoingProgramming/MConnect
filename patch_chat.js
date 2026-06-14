const fs = require('fs');
const path = './apps/web/components/ChatLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `import { useSocket } from '../hooks/useSocket';`,
  `import { useSocket } from '../hooks/useSocket';\nimport { useRouter } from 'next/navigation';`
);

content = content.replace(
  `type UserStatus = 'online' | 'invisible' | 'away' | 'offline';\n\nconst USER_MAP: Record<string, string> = {\n  'me': 'MAYBE',\n  'u1': 'User 1',\n  'u2': 'User 2',\n  'u3': 'User 3',\n};\n\nconst DUMMY_ROSTER = [\n  { id: 'u1', name: 'User 1', status: 'online' as UserStatus },\n  { id: 'u2', name: 'User 2', status: 'online' as UserStatus },\n  { id: 'u3', name: 'User 3', status: 'online' as UserStatus },\n  { id: 'u4', name: 'User 4', status: 'offline' as UserStatus },\n  { id: 'u5', name: 'User 5', status: 'offline' as UserStatus },\n];\n\nexport default function ChatLayout() {\n  const socket = useSocket('dummy-token-123');`,
  `type UserStatus = 'online' | 'invisible' | 'away' | 'offline';\n\ninterface AppUser {\n  id: string;\n  name: string;\n  status: UserStatus;\n}\n\nexport default function ChatLayout() {\n  const socket = useSocket();\n  const router = useRouter();\n  const [currentUser, setCurrentUser] = useState<{id: string, username: string, status: UserStatus} | null>(null);\n  const [roster, setRoster] = useState<AppUser[]>([]);`
);

content = content.replace(
  `const [userStatus, setUserStatus] = useState<UserStatus>('online');\n  const [isMicMuted, setIsMicMuted] = useState(false);`,
  `const [isMicMuted, setIsMicMuted] = useState(false);`
);

const fetchEffect = `  useEffect(() => {\n    Promise.all([\n      fetch('/api/auth/me').then(res => res.json()),\n      fetch('/api/users').then(res => res.json())\n    ]).then(([meData, usersData]) => {\n      if (meData.error) {\n        router.push('/login');\n      } else {\n        setCurrentUser({ id: meData.user._id, username: meData.user.username, status: meData.user.status });\n      }\n      if (!usersData.error) {\n        setRoster(usersData);\n      }\n    });\n  }, [router]);\n\n  const scrollToBottom`;
content = content.replace(`const scrollToBottom`, fetchEffect);

content = content.replace(`if (!socket) return;`, `if (!socket || !currentUser) return;`);

content = content.replace(`if (msg.senderId !== 'me' && prev.some(m => m.senderId === 'me' && m.content === msg.content && m.roomId === msg.roomId)) {\n          return prev.map(m => (m.senderId === 'me' && m.content === msg.content) ? msg : m);\n        }`, `if (msg.senderId !== currentUser.id && prev.some(m => m.senderId === currentUser.id && m.content === msg.content && m.roomId === msg.roomId)) {\n          return prev.map(m => (m.senderId === currentUser.id && m.content === msg.content) ? msg : m);\n        }`);

content = content.replace(`    socket.on('message', handleMessage);\n    socket.on('globalEventTicker', handleGlobalEvent);\n    socket.on('typingIndicator', handleTyping);`, `    const handleStatusUpdate = (userId: string, newStatus: UserStatus) => {\n      setRoster(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));\n      if (currentUser?.id === userId) {\n        setCurrentUser(prev => prev ? { ...prev, status: newStatus } : prev);\n      }\n    };\n\n    socket.on('message', handleMessage);\n    socket.on('globalEventTicker', handleGlobalEvent);\n    socket.on('typingIndicator', handleTyping);\n    socket.on('userStatusUpdate', handleStatusUpdate);`);

content = content.replace(`      socket.off('message', handleMessage);\n      socket.off('globalEventTicker', handleGlobalEvent);\n      socket.off('typingIndicator', handleTyping);\n      socket.emit('leaveRoom', activeRoom);`, `      socket.off('message', handleMessage);\n      socket.off('globalEventTicker', handleGlobalEvent);\n      socket.off('typingIndicator', handleTyping);\n      socket.off('userStatusUpdate', handleStatusUpdate);\n      socket.emit('leaveRoom', activeRoom);`);

content = content.replace(`}, [socket, activeRoom]);`, `}, [socket, activeRoom, currentUser]);`);

content = content.replace(`senderId: 'me',`, `senderId: currentUser.id,`);
content = content.replace(`senderId: 'me',`, `senderId: currentUser.id,`);
content = content.replace(`senderId: 'me',`, `senderId: currentUser.id,`);
content = content.replace(`if (!inputText.trim() || !socket) return;`, `if (!inputText.trim() || !socket || !currentUser) return;`);

const derivedStates = `  const onlineUsers = DUMMY_ROSTER.filter(u => u.status !== 'offline');\n  const offlineUsers = DUMMY_ROSTER.filter(u => u.status === 'offline');\n\n  const typersDisplayNames = Array.from(activeTypers)\n    .map(id => USER_MAP[id] || id)\n    .filter(name => name !== 'Me');\n\n  return (`;

const newDerived = `  const onlineUsers = roster.filter(u => u.status !== 'offline');\n  const offlineUsers = roster.filter(u => u.status === 'offline');\n\n  const userMap = roster.reduce((acc, u) => {\n    acc[u.id] = u.name;\n    return acc;\n  }, {} as Record<string, string>);\n\n  const typersDisplayNames = Array.from(activeTypers)\n    .map(id => userMap[id] || id)\n    .filter(name => name !== currentUser?.username);\n\n  if (!currentUser) return null;\n\n  return (`;

content = content.replace(derivedStates, newDerived);

content = content.replace(`MAYBE`, `{currentUser.username}`);
content = content.replace(`khizarwantsmangoes • se/x.er 🥭`, `User • ID: {currentUser.id.substring(0,8)}`);

content = content.replace(`setUserStatus(userStatus === 'invisible' ? 'online' : 'invisible');`, `const newStatus = currentUser.status === 'invisible' ? 'online' : 'invisible';\n                      socket?.emit('updateStatus', newStatus);`);

content = content.replace(`{userStatus}`, `{currentUser.status}`);

content = content.replace(`MY`, `{currentUser.username.substring(0, 2)}`);
content = content.replace(`MAYBE`, `{currentUser.username}`);
content = content.replace(`khizarwantsmangoes`, `Status: {currentUser.status}`);
content = content.replace(`userStatus === 'invisible'`, `currentUser.status === 'invisible'`);

content = content.replace(`USER_MAP[msg.senderId] || msg.senderId`, `userMap[msg.senderId] || msg.senderId`);

fs.writeFileSync(path, content);
console.log('Patch complete.');
