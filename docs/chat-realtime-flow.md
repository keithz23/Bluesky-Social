# Chat realtime flow

Ghi chu nay mo ta flow tong the cua phan chat realtime trong project. Muc tieu
la khi can viet lai hoac debug lai, chi can bam theo cac nguon du lieu chinh:
REST de nap du lieu ban dau, Socket.IO de dong bo thay doi realtime, React Query
cache de UI doc mot nguon state thong nhat.

## 1. Cac thanh phan chinh

Backend:

- `social-be/src/modules/chat/chat.gateway.ts`: Socket.IO gateway namespace `/chat`.
- `social-be/src/modules/chat/chat.controller.ts`: REST API cho conversations/messages.
- `social-be/src/modules/chat/chat.service.ts`: business logic, Prisma transaction, unread count.

Frontend:

- `social-fe/providers/socket.provider.tsx`: tao socket namespaces va expose `chatSocket`.
- `social-fe/app/hooks/use-chat-realtime.ts`: global realtime listener, cap nhat React Query cache.
- `social-fe/app/hooks/use-chat-socket.ts`: wrapper emit/listen socket cho UI chat.
- `social-fe/app/hooks/use-conversations.ts`: query danh sach conversations.
- `social-fe/app/hooks/use-messages.ts`: query messages theo conversation.
- `social-fe/app/hooks/use-unread-messages.ts`: tinh badge chat tu `participants[].unreadCount`.
- `social-fe/app/(main)/chat/components/chat-window.tsx`: UI conversation dang mo.
- `social-fe/app/(main)/chat/components/message-list.tsx`: render messages, auto scroll, mark seen.
- `social-fe/app/(main)/chat/components/message-input.tsx`: input, send, typing.

## 2. Ket noi socket

1. User login, frontend co access token.
2. `SocketProvider` tao `chatSocket = io(SERVER_URL + "/chat", { auth: { token } })`.
3. Backend `ChatGateway.handleConnection` verify JWT.
4. Backend gan `client.data.userId` va `client.data.username`.
5. Socket join room rieng cua user: `user:{userId}`.
6. Socket auto join tat ca room conversation cua user: `conversation:{conversationId}`.

Ly do co 2 loai room:

- `conversation:{id}` dung de broadcast message/read/typing cho tat ca participant.
- `user:{id}` dung de bao rieng cho mot user, vi du new conversation hoac sidebar update.

## 3. Load du lieu ban dau

Danh sach hoi thoai:

1. UI goi `useConversations`.
2. Frontend REST `GET /chat/conversations`.
3. Backend tra ve conversations kem:
   - `participants`
   - `participants[].unreadCount`
   - `lastMessage`
   - `lastMessageAt`
4. React Query luu vao cache key `["conversations"]`.
5. Sidebar va badge doc tu cache nay.

Messages trong mot conversation:

1. User mo `/chat/{conversationId}`.
2. UI goi `useMessages(conversationId)`.
3. Frontend REST `GET /chat/conversations/:id/messages`.
4. Backend tra ve messages theo cursor, thu tu moi nhat truoc.
5. React Query luu vao cache key `["messages", conversationId]`.
6. UI flatten pages, dedupe theo `message.id`, reverse de render cu -> moi.

## 4. Gui tin nhan text

Frontend:

1. User bam send trong `MessageInput`.
2. `ChatWindow.handleSend` tao optimistic message:
   - `id = "optimistic-{conversationId}-{Date.now()}"`
   - `status = "SENDING"`
   - content/type/sender la data hien tai
3. Optimistic message duoc them vao `["messages", conversationId]`.
4. Frontend emit socket:

```ts
chatSocket.emit("send-message", {
  conversationId,
  content,
  type,
});
```

Backend:

1. `ChatGateway.handleSendMessage` nhan event `send-message`.
2. `ChatService.createMessage` verify user la participant.
3. Backend chay transaction:
   - create `Message`
   - update conversation `lastMessageId`, `lastMessageAt`, `messageCount`
   - increment `unreadCount` cho participants khac sender
4. Gateway emit `new-message` vao room `conversation:{id}`.
5. Gateway emit `conversation-updated` vao `user:{participantId}` cho participants khac sender.

Frontend realtime:

1. `useChatRealtime` nhan `new-message`.
2. Neu message that khop optimistic message, replace optimistic bang message that.
3. Neu message that da ton tai trong cache, update message do.
4. Neu message moi va chua co trong cache, append vao page moi nhat.
5. `useChatRealtime` cap nhat `["conversations"]`:
   - set `lastMessage`
   - set `lastMessageAt`
   - neu message den tu nguoi khac va user khong dang mo conversation do, tang `unreadCount`

Nguyen tac quan trong: chi nen co mot noi chinh cap nhat cache message tu
`new-message`. Neu `ChatWindow` va global realtime handler cung append message,
optimistic message rat de bi duplicate.

## 5. Gui anh/media

Flow media gan giong text, nhung duong gui ban dau di qua REST vi can upload file:

1. `ChatWindow.handleSendImage` tao optimistic image message voi local preview URL.
2. Frontend goi REST `POST /chat/conversations/:id/messages/media`.
3. Backend upload anh, tao message, sau do gateway emit `new-message`.
4. Frontend nhan `new-message` va replace optimistic image message bang message that.

Dieu can nho: media cung co `new-message`, nen logic replace optimistic phai dung
cho ca text va image.

## 6. Nhan tin nhan moi

Neu user dang mo conversation do:

1. `useChatRealtime` upsert message vao `["messages", conversationId]`.
2. `MessageList` thay latest message doi.
3. Neu user dang o gan cuoi list, UI auto scroll xuong.
4. `MessageList` goi `onSeenLatest(latestMessage.id)`.
5. `ChatWindow` emit `mark-read`.

Neu user dang o conversation khac:

1. `useChatRealtime` khong auto mark read.
2. Cache `["conversations"]` duoc tang unread cho conversation nhan message.
3. `useUnreadMessages` cong unread tu conversations cache.
4. Badge o layout hien so moi.

## 7. Mark read va badge

Frontend:

1. Khi message latest duoc nhin thay, `MessageList` goi `onSeenLatest(messageId)`.
2. `ChatWindow` emit:

```ts
chatSocket.emit("mark-read", {
  conversationId,
  messageId,
});
```

Backend:

1. `ChatGateway.handleMarkRead` nhan event `mark-read`.
2. `ChatService.markRead` update participant hien tai:
   - `lastReadMessageId = messageId`
   - `lastReadAt = now`
   - `unreadCount = 0`
3. Backend upsert `MessageReadReceipt`.
4. Gateway broadcast `message-read` vao room `conversation:{id}`.

Frontend realtime:

1. `useChatRealtime` nhan `message-read`.
2. Patch `["messages", conversationId]`: message do co `status = "READ"`.
3. Patch `["conversations"]`: participant co `userId` trong payload duoc set:
   - `unreadCount = 0`
   - `lastReadMessageId = messageId`
4. Badge chat mat ngay vi `useUnreadMessages` doc tu conversations cache.

Nguyen tac quan trong: invalidate query sau `mark-read` la chua du. Refetch co the
chay truoc khi backend update xong. Nen khi nhan `message-read`, frontend nen patch
cache conversations truc tiep.

## 8. Typing indicator

Frontend:

1. User go trong `MessageInput`.
2. Input emit `typing`.
3. Sau mot khoang timeout khong go nua, input emit `stop-typing`.

Backend:

1. Nhan `typing`, broadcast `user-typing` den room conversation, tru sender.
2. Nhan `stop-typing`, broadcast `user-stop-typing`.

Frontend:

1. `ChatWindow` lang nghe `user-typing`.
2. Bo qua event cua current user.
3. Them user vao `typingUsers`.
4. Moi typing event refresh expiry time.
5. Timer local tu dong xoa typing user neu qua expiry.

## 9. Edit, delete, reaction

Edit message:

1. Frontend emit `edit-message`.
2. Backend verify sender moi duoc edit.
3. Backend update message va emit `message-edited`.
4. Frontend invalidate hoac patch `["messages", conversationId]`.

Delete message:

1. Frontend emit `delete-message`.
2. Backend verify sender moi duoc delete for all.
3. Backend soft delete message va emit `message-deleted`.
4. Frontend invalidate hoac patch messages cache.

Reaction:

1. Frontend emit `react-message`.
2. Backend toggle reaction.
3. Backend emit `message-reaction-updated`.
4. Frontend invalidate hoac patch reactions cua message.

## 10. Cache strategy nen giu

Nguon cache chinh:

- `["conversations"]`: sidebar, unread badge, last message, participants.
- `["messages", conversationId]`: noi dung cua mot chat window.

Nguyen tac:

- REST load du lieu ban dau.
- Socket update delta realtime.
- UI doc tu React Query cache.
- Mot event socket chi nen co mot handler chinh mutate cung mot vung cache.
- Khi co optimistic message, event `new-message` phai replace optimistic truoc khi append.
- Dedupe theo `message.id` chi xu ly duoc duplicate message that, khong xu ly duoc optimistic vi optimistic co id khac.
- Badge phai theo `participants[].unreadCount` trong `["conversations"]`.
- Khi read thanh cong, patch unread count ve 0 trong conversations cache.

## 11. Cac loi de gap

Duplicate message khi gui:

- Nguyen nhan thuong gap: global realtime handler va chat window handler cung append `new-message`.
- Cach fix: gom update message cache tu `new-message` ve mot noi, va replace optimistic bang message that.

Badge khong mat sau khi doc:

- Nguyen nhan thuong gap: backend da set unread = 0, nhung frontend conversations cache chua duoc patch.
- Cach fix: khi nhan `message-read`, patch participant trong `["conversations"]` ve `unreadCount = 0`.

Unread tang hai lan:

- Nguyen nhan thuong gap: user da auto-join conversation room, nhung backend van emit them `conversation-updated` ve user room cho cung message.
- Cach fix: frontend can guard bang message id da dem unread, vi du `countedUnreadMessageIdsRef`.

Mark read qua som:

- Nguyen nhan thuong gap: emit `mark-read` ngay khi data load, nhung UI chua that su scroll/seen.
- Cach fix: chi mark read khi latest message duoc render va user o gan bottom, hoac conversation dang active.

Socket listener bi leak:

- Nguyen nhan thuong gap: register listener trong effect nhung cleanup khong dung handler reference.
- Cach fix: tao function handler stable trong effect va cleanup bang `socket.off(event, handler)`.

## 12. Flow tom tat

Send text:

```txt
MessageInput
  -> ChatWindow tao optimistic message
  -> emit send-message
  -> Gateway
  -> Service transaction create message + unread
  -> emit new-message
  -> useChatRealtime replace optimistic + update conversations
  -> MessageList render message that
```

Receive message:

```txt
Gateway emit new-message
  -> useChatRealtime upsert messages cache
  -> update conversations cache
  -> if active conversation: MessageList auto seen -> mark-read
  -> if inactive conversation: unread badge tang
```

Read message:

```txt
MessageList seen latest
  -> ChatWindow emit mark-read
  -> Gateway
  -> Service set unreadCount = 0
  -> emit message-read
  -> useChatRealtime patch messages status + conversations unread
  -> badge mat
```

