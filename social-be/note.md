Client (Next.js) ←→ REST API (NestJS Controller) ←→ Service ←→ Prisma ←→ PostgreSQL
       ↕                                                ↑
  Socket.IO Client ←→ WebSocket Gateway (NestJS) ———————┘

Client emit 'send-message'  →  Gateway nhận  →  Service tạo DB record  →  Gateway broadcast 'new-message'


Nguyên tắc thiết kế:

Denormalization cho performance: unreadCount lưu trực tiếp trên ConversationParticipant thay vì phải COUNT query mỗi lần
Soft-delete: leftAt trên participant (rời conversation), isDeleted + deletedAt trên message, MessageDeletedFor (xóa riêng cho 1 user)
Cursor-based pagination: Dùng id làm cursor thay vì offset — hiệu quả hơn với dữ liệu lớn và real-time (tránh bị trùng/mất item khi data thay đổi)
Composite unique constraints: @@unique([conversationId, userId]) trên participant, @@unique([messageId, userId, emoji]) trên reaction — đảm bảo data integrity ở DB level
Index strategy: Index theo query patterns thực tế — [conversationId, createdAt(sort: Desc)] cho messages, [userId, leftAt, isPinned] cho participants
Quan hệ đặc biệt:

lastMessage — 1:1 relation riêng: tránh phải JOIN + ORDER BY mỗi lần lấy conversation list
Message self-relation: replyTo / replies cho reply threading
MessageDeletedFor: Cho phép xóa tin nhắn chỉ cho 1 user mà không ảnh hưởng người khác

// Transaction pattern: nhiều operations phải atomic
await this.prisma.$transaction(async (tx) => {
  // 1. Tạo message
  const message = await tx.message.create({ ... });
  // 2. Update lastMessage trên conversation
  await tx.conversation.update({ ... });
  // 3. Increment unreadCount cho participants khác
  await tx.conversationParticipant.updateMany({ ... });
  return message;
});

const conversations = await this.prisma.conversation.findMany({
  where: {
    ...(query.cursor && { id: { lt: query.cursor } }),  // cursor condition
  },
  take: limit + 1,  // Lấy thêm 1 để biết hasMore
});
const hasMore = conversations.length > limit;
if (hasMore) conversations.pop();  // Bỏ item thừa
const nextCursor = hasMore ? conversations[conversations.length - 1].id : null;


// Thêm message mới vào cache ngay lập tức (optimistic-like)
queryClient.setQueryData(["messages", conversationId], (old) => {
  const pages = [...old.pages];
  pages[0] = { ...pages[0], messages: [newMessage, ...pages[0].messages] };
  return { ...old, pages };
});

function useChatSocket(options: {
  onNewMessage?: (data) => void;
  onUserTyping?: (data) => void;
  // ...
}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect + register listeners
    const socket = io(`${SERVER_URL}/chat`, { auth: { token } });
    socket.on('new-message', options.onNewMessage);
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, []);

  // Return emit methods
  const sendMessage = useCallback((data) => {
    socketRef.current?.emit('send-message', data);
  }, []);

  return { sendMessage, markRead, editMessage, ... };
}
Callbacks qua options: Component truyền handlers (update cache, update typing state)
Emit methods qua return: Component gọi khi user action
useRef cho socket instance: tránh re-render khi socket thay đổi
useCallback cho emit methods: stable reference, tránh re-render children

// MessageInput
const typingTimeout = useRef<NodeJS.Timeout>();
const handleChange = () => {
  onTyping();  // Emit 'typing'
  clearTimeout(typingTimeout.current);
  typingTimeout.current = setTimeout(() => onStopTyping(), 3000);  // Auto stop sau 3s
};

Backend: data → TransformInterceptor → { statusCode, message, data, timestamp }
Axios:   response → interceptor (response.data) → { statusCode, message, data, timestamp }
Service: response → .data → actual payload

Backend wrap trong { data }, Axios unwrap 1 lớp → Service phải .data lần nữa

Security & Data Integrity
JWT verify trên mọi WebSocket connection — disconnect nếu invalid
Membership check: getConversation verify user là participant trước khi trả data
Owner check: chỉ sender mới được edit message
Soft-delete: không xóa thật data — isDeleted, leftAt, MessageDeletedFor
Transaction: create message + update counts phải atomic
DTO validation: class-validator validate mọi input ở boundary


Lessons Learned
Vấn đề	Giải pháp
Cannot read properties of undefined khi flatMap pages: Response wrapper { data } — service cần extract .data
Duplicate React keys trong infinite scroll:	Deduplicate by ID sau flatMap
markRead không trigger:	useEffect dependency phải gồm lastMessageId, không chỉ conversation.id
Typing indicator hiện userId thay vì username:	Query username từ DB khi socket connect, lưu vào client.data
Unread badge không mất sau read:	invalidateQueries(["conversations"]) sau khi markRead