import { useState } from 'react';
import { useConversations, useConversation } from '@/hooks/useConversations';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageSquare } from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/utils/formatters';

export default function Messages() {
  const { user } = useAuthStore();
  const { conversations, isLoading } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const { 
    conversation, 
    messages, 
    sendMessage, 
    isSending,
    isLoadingMessages 
  } = useConversation(selectedConversationId || '');

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversationId) return;

    try {
      await sendMessage({
        conversationId: selectedConversationId,
        content: messageText,
      });
      setMessageText('');
    } catch (error: any) {
      alert(error.detail || 'Failed to send message');
    }
  };

  const getOtherParticipant = (conv: any) => {
    return conv.participants?.find((p: any) => p.id !== user?.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="grid md:grid-cols-3 gap-4 h-full">
        {/* Conversations List */}
        <Card className="md:col-span-1 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherUser = getOtherParticipant(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full p-4 flex items-center space-x-3 hover:bg-secondary transition-colors ${
                        selectedConversationId === conv.id ? 'bg-secondary' : ''
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(otherUser?.companyName || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{otherUser?.companyName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.content || 'No messages'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 overflow-hidden">
          {selectedConversationId && conversation ? (
            <CardContent className="p-0 h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(getOtherParticipant(conversation)?.companyName || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getOtherParticipant(conversation)?.companyName}</p>
                  <p className="text-sm text-muted-foreground">
                    {getOtherParticipant(conversation)?.role}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <p className="text-center text-muted-foreground">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatRelativeTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                  />
                  <Button onClick={handleSendMessage} disabled={!messageText.trim() || isSending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-muted-foreground">Choose a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
