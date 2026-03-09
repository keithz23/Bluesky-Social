┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                                                                  │
│  SocketProvider ──► chatSocket (namespace: /chat)                │
│       │                                                          │
│  ┌────┴──────────────────────────────────────────────┐           │
│  │  Chat Page                                        │           │
│  │  ├─ ConversationList (sidebar) ← REST GET         │           │
│  │  ├─ ChatWindow                                    │           │
│  │  │   ├─ MessageList ← REST GET (paginated)        │           │
│  │  │   ├─ TypingIndicator ← Socket event            │           │
│  │  │   └─ MessageInput  → Socket emit               │           │
│  │  └─ NewChatDialog → REST POST                     │           │
│  └───────────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
                            │ Socket.IO
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                       BACKEND (NestJS)                           │
│                                                                  │
│  ChatGateway (namespace: /chat)                                  │
│  ├─ handleConnection  → join room `user:{userId}`                │
│  ├─ join-conversation → join room `conversation:{id}`            │
│  ├─ leave-conversation→ leave room                               │
│  ├─ send-message      → save DB → emit to room                  │
│  ├─ typing            → broadcast to room                        │
│  ├─ stop-typing       → broadcast to room                        │
│  ├─ mark-read         → update DB → emit receipt                 │
│  ├─ edit-message      → update DB → emit to room                 │
│  ├─ delete-message    → soft delete → emit to room               │
│  └─ react-message     → save DB → emit to room                  │
│                                                                  │
│  ChatController (REST)                                           │
│  ├─ GET    /conversations          → danh sách hội thoại        │
│  ├─ POST   /conversations          → tạo hội thoại mới          │
│  ├─ GET    /conversations/:id       → chi tiết hội thoại        │
│  ├─ GET    /conversations/:id/messages → lấy tin nhắn (cursor)  │
│  ├─ POST   /conversations/:id/messages → gửi tin (fallback)     │
│  ├─ DELETE /conversations/:id       → xóa/rời hội thoại        │
│  ├─ PATCH  /conversations/:id       → đổi tên, avatar nhóm     │
│  └─ POST   /conversations/:id/pin   → ghim tin nhắn            │
│                                                                  │
│  ChatService → PrismaService (DB operations)                     │
└──────────────────────────────────────────────────────────────────┘




User mở trang Chat
  │
  ├─ 1. Frontend connect socket namespace `/chat` (với JWT token)
  │
  ├─ 2. Backend ChatGateway.handleConnection()
  │     ├─ Verify JWT → lấy userId
  │     ├─ client.join(`user:{userId}`)
  │     └─ Query tất cả conversation của user → join từng room `conversation:{id}`
  │
  └─ 3. User click vào 1 conversation cụ thể
        ├─ emit('join-conversation', { conversationId })
        ├─ REST GET /conversations/:id/messages?cursor=...&limit=30
        └─ emit('mark-read', { conversationId }) → cập nhật lastReadMessageId




User nhấn Send
  │
  ├─ 1. Frontend emit('send-message', {
  │       conversationId, content, type, replyToId?, attachments?
  │     })
  │     └─ Optimistic UI: hiển thị message với status SENDING
  │
  ├─ 2. Backend ChatGateway @SubscribeMessage('send-message')
  │     ├─ Validate: user là participant? conversation còn active?
  │     ├─ ChatService.createMessage()
  │     │   ├─ prisma.message.create({ data: { ... } })
  │     │   ├─ prisma.conversation.update({ lastMessageId, lastMessageAt, messageCount++ })
  │     │   ├─ prisma.conversationParticipant.updateMany({
  │     │   │     unreadCount++ cho tất cả participant NGOẠI TRỪ sender
  │     │   │   })
  │     │   └─ Nếu có @mention → prisma.messageMention.createMany()
  │     │
  │     ├─ Emit to room `conversation:{id}` → event 'new-message'
  │     │   {
  │     │     message: { id, content, sender: { id, username, avatarUrl }, ... },
  │     │     conversationId
  │     │   }
  │     │
  │     └─ Emit to từng `user:{participantId}` (offline users)
  │           → event 'conversation-updated' (cập nhật sidebar)
  │
  └─ 3. Frontend nhận 'new-message'
        ├─ Nếu đang ở conversation đó → append message, auto scroll
        ├─ Nếu ở conversation khác → tăng badge unread trên sidebar
        └─ Cập nhật optimistic message status → SENT



User bắt đầu gõ
  │
  ├─ Frontend debounce 300ms → emit('typing', { conversationId })
  │
  ├─ Backend broadcast to room (trừ sender)
  │   → event 'user-typing' { userId, username, conversationId }
  │
  ├─ Frontend hiển thị "username đang nhập..."
  │
  └─ Sau 3s không gõ → emit('stop-typing', { conversationId })
      → Backend broadcast 'user-stop-typing'


User mở conversation / scroll đến tin mới nhất
  │
  ├─ Frontend emit('mark-read', { conversationId, messageId })
  │
  ├─ Backend:
  │   ├─ prisma.conversationParticipant.update({
  │   │     lastReadMessageId: messageId,
  │   │     lastReadAt: now(),
  │   │     unreadCount: 0
  │   │   })
  │   ├─ prisma.messageReadReceipt.upsert({ messageId, userId })
  │   └─ Broadcast to room → 'message-read' { userId, messageId, conversationId }
  │
  └─ Frontend: hiển thị tick xanh (✓✓) cho sender


User click "New chat" → chọn người dùng
  │
  ├─ REST POST /conversations
  │   body: { type: 'DIRECT', participantIds: [targetUserId] }
  │
  ├─ Backend ChatService.createConversation():
  │   ├─ Check: đã tồn tại DIRECT conversation giữa 2 user?
  │   │   └─ Nếu có → trả về conversation cũ
  │   ├─ prisma.conversation.create({
  │   │     type: 'DIRECT',
  │   │     participants: { create: [
  │   │       { userId: currentUser, role: 'MEMBER' },
  │   │       { userId: targetUser, role: 'MEMBER' }
  │   │     ]}
  │   │   })
  │   └─ Emit to `user:{targetUserId}` → 'new-conversation'
  │
  └─ Frontend navigate đến conversation mới


Edit:
  emit('edit-message', { messageId, content })
  → Backend: update message, set isEdited=true, editedAt=now()
  → Broadcast 'message-edited' { messageId, content, editedAt }

Delete (cho mình):
  emit('delete-message-for-me', { messageId })
  → Backend: prisma.messageDeletedFor.create({ messageId, userId })
  → Chỉ emit cho sender

Delete (cho tất cả - chỉ sender được phép):
  emit('delete-message', { messageId })
  → Backend: update message isDeleted=true, deletedAt=now()
  → Broadcast 'message-deleted' { messageId, conversationId }


User click emoji trên message
  │
  ├─ emit('react-message', { messageId, emoji: '👍' })
  │
  ├─ Backend:
  │   ├─ prisma.messageReaction.upsert (toggle)
  │   └─ Broadcast 'message-reaction-updated' { messageId, reactions[] }
  │
  └─ Frontend: cập nhật UI reaction

src/modules/chat/
  ├─ chat.module.ts
  ├─ chat.controller.ts      ← REST endpoints
  ├─ chat.service.ts          ← Business logic + DB
  ├─ chat.gateway.ts          ← Socket.IO gateway (namespace /chat)
  └─ dto/
      ├─ create-conversation.dto.ts
      ├─ send-message.dto.ts
      ├─ update-conversation.dto.ts
      └─ message-query.dto.ts

app/(main)/chat/
  ├─ page.tsx                      ← Layout 2 cột
  ├─ [conversationId]/
  │   └─ page.tsx                  ← Chat window
  └─ components/
      ├─ conversation-list.tsx     ← Sidebar danh sách
      ├─ conversation-item.tsx     ← 1 item trong list
      ├─ chat-window.tsx           ← Khung chat chính
      ├─ message-list.tsx          ← Danh sách tin nhắn (infinite scroll)
      ├─ message-bubble.tsx        ← 1 tin nhắn
      ├─ message-input.tsx         ← Ô nhập + gửi file
      ├─ typing-indicator.tsx
      ├─ new-chat-dialog.tsx       ← Dialog tạo chat mới
      └─ message-reactions.tsx

hooks/
  ├─ use-chat-socket.ts           ← Quản lý socket chat events
  ├─ use-conversations.ts         ← React Query cho conversations
  └─ use-messages.ts              ← React Query + infinite scroll

services/
  └─ chat.service.ts              ← API calls (REST)


