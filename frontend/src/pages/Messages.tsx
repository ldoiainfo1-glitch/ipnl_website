import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useConversations, useConversation } from '@/hooks/useConversations';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BadgeInfo, Building2, Send, MessageSquare } from 'lucide-react';
import { getInitials, formatRelativeTime, formatIndianNumber } from '@/utils/formatters';

const PROFILE_CARD_MESSAGE_TYPE = 'IPNL_PROFILE_CARD_V1';

interface SharedProfileDetails {
  companyName?: string;
  role?: string;
  tier?: string;
  kycStatus?: string;
  companyDescription?: string;
  website?: string;
  linkedin?: string;
  city?: string;
  state?: string;
  assetPreferences?: string[];
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  reputationScore?: number;
  totalMandatesPosted?: number;
}

function parseSharedProfile(content: string): SharedProfileDetails | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.type !== PROFILE_CARD_MESSAGE_TYPE || !parsed.profile) return null;
    return parsed.profile as SharedProfileDetails;
  } catch {
    return null;
  }
}

function SharedProfileCard({ profile }: { profile: SharedProfileDetails }) {
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const ticketRange = profile.ticketSizeMin || profile.ticketSizeMax
    ? `${profile.ticketSizeMin ? formatIndianNumber(profile.ticketSizeMin) : 'Any'} - ${profile.ticketSizeMax ? formatIndianNumber(profile.ticketSizeMax) : 'Any'}`
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        <p className="font-semibold">{profile.companyName || 'Company profile'}</p>
      </div>
      {profile.companyDescription && <p className="text-sm opacity-90">{profile.companyDescription}</p>}
      <div className="grid gap-1 text-xs opacity-90">
        {profile.role && <span>Role: {profile.role.replace(/_/g, ' ')}</span>}
        {profile.tier && <span>Tier: {profile.tier}</span>}
        {profile.kycStatus && <span>KYC: {profile.kycStatus.replace(/_/g, ' ')}</span>}
        {location && <span>Location: {location}</span>}
        {ticketRange && <span>Ticket size: {ticketRange}</span>}
        {typeof profile.reputationScore === 'number' && <span>Reputation: {profile.reputationScore}</span>}
        {typeof profile.totalMandatesPosted === 'number' && <span>Mandates posted: {profile.totalMandatesPosted}</span>}
      </div>
      {profile.assetPreferences && profile.assetPreferences.length > 0 && (
        <p className="text-xs opacity-90">Asset preferences: {profile.assetPreferences.join(', ')}</p>
      )}
      <div className="flex gap-3 text-xs">
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="underline">
            Website
          </a>
        )}
        {profile.linkedin && (
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="underline">
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

export default function Messages() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { conversations, isLoading, createConversation } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const handledRecipientIdRef = useRef<string | null>(null);

  const { 
    conversation, 
    messages, 
    sendMessage, 
    sendProfileDetails,
    markAsRead,
    isSending,
    isSendingProfileDetails,
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

  const handleSendProfileDetails = async () => {
    if (!selectedConversationId) return;

    try {
      await sendProfileDetails();
    } catch (error: any) {
      alert(error.detail || 'Failed to send profile details');
    }
  };

  const getOtherParticipant = (conv: any) => {
    return conv.participants?.find((p: any) => p.id !== user?.id);
  };

  useEffect(() => {
    const recipientId = (location.state as { recipientId?: string } | null)?.recipientId;
    if (!recipientId || !user) return;
    if (handledRecipientIdRef.current === recipientId) return;

    const existingConversation = conversations.find((conv) => conv.participantIds.includes(recipientId));
    if (existingConversation) {
      handledRecipientIdRef.current = recipientId;
      setSelectedConversationId(existingConversation.id);
      return;
    }

    handledRecipientIdRef.current = recipientId;
    createConversation([recipientId])
      .then((conversation) => setSelectedConversationId(conversation.data.id))
      .catch((error: any) => {
        handledRecipientIdRef.current = null;
        alert(error.detail || 'Unable to start conversation');
      });
  }, [location.state, user, conversations, createConversation]);

  useEffect(() => {
    if (!selectedConversationId || isLoadingMessages) return;
    if (!messages.some((message) => message.senderId !== user?.id && !message.seenAt)) return;
    markAsRead();
  }, [selectedConversationId, isLoadingMessages, messages, markAsRead, user?.id]);

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
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={handleSendProfileDetails}
                  disabled={isSendingProfileDetails}
                >
                  <BadgeInfo className="w-4 h-4 mr-1" />
                  Send Profile Details
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <p className="text-center text-muted-foreground">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => {
                    const sharedProfile = parseSharedProfile(msg.content);
                    return (
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
                          {sharedProfile ? <SharedProfileCard profile={sharedProfile} /> : <p>{msg.content}</p>}
                          <p className="text-xs opacity-70 mt-1">
                            {formatRelativeTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
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
