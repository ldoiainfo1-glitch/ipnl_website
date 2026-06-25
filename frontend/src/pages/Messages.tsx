import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConversations, useConversation } from '@/hooks/useConversations';
import { useAuthStore } from '@/store/authStore';
import { useMyProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BadgeInfo, Building2, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { getInitials, formatRelativeTime, formatIndianNumber } from '@/utils/formatters';
import type { User } from '@/types';

const PROFILE_CARD_MESSAGE_TYPE = 'IPNL_PROFILE_CARD_V1';

interface SharedProfileDetails {
  companyName?: string;
  role?: string;
  tier?: string;
  kycStatus?: string;
  companyDescription?: string;
  website?: string;
  linkedin?: string;
  logo?: string | null;
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

function userToSharedProfile(u: User): SharedProfileDetails {
  return {
    companyName: u.companyName,
    role: u.role,
    tier: u.tier,
    kycStatus: u.kycStatus,
    companyDescription: u.companyDescription,
    website: u.website,
    linkedin: u.linkedin,
    logo: u.logo,
    city: u.city,
    state: u.state,
    assetPreferences: u.assetPreferences as string[],
    ticketSizeMin: u.ticketSizeMin,
    ticketSizeMax: u.ticketSizeMax,
    reputationScore: u.reputationScore,
    totalMandatesPosted: u.totalMandatesPosted,
  };
}

function SharedProfileCard({ profile, senderId, currentUserId }: {
  profile: SharedProfileDetails;
  senderId: string;
  currentUserId?: string;
}) {
  const navigate = useNavigate();
  const loc = [profile.city, profile.state].filter(Boolean).join(', ');
  const ticketRange =
    profile.ticketSizeMin || profile.ticketSizeMax
      ? `₹${profile.ticketSizeMin ? formatIndianNumber(profile.ticketSizeMin) : '—'} – ₹${profile.ticketSizeMax ? formatIndianNumber(profile.ticketSizeMax) : '—'}`
      : null;

  return (
    <div
      className="min-w-[220px] space-y-2.5 cursor-pointer"
      onClick={() => {
        if (senderId !== currentUserId) navigate(`/members/${senderId}`);
        else navigate('/profile');
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2.5 border-b border-current/20">
        <div className="w-9 h-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0 overflow-hidden">
          {profile.logo
            ? <img src={profile.logo} alt={profile.companyName} className="w-full h-full object-cover" />
            : <Building2 className="w-[18px] h-[18px]" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight">{profile.companyName || 'Company'}</p>
          {profile.role && (
            <p className="text-xs opacity-70 leading-tight capitalize">
              {profile.role.replace(/_/g, ' ')}
            </p>
          )}
        </div>

      </div>

      {/* Description */}
      {profile.companyDescription && (
        <p className="text-xs leading-relaxed opacity-90 line-clamp-3">{profile.companyDescription}</p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-80">
        {profile.kycStatus && <span>KYC: {profile.kycStatus.replace(/_/g, ' ')}</span>}
        {loc && <span>📍 {loc}</span>}
        {ticketRange && <span className="col-span-2">💰 {ticketRange}</span>}
        {typeof profile.reputationScore === 'number' && <span>⭐ {profile.reputationScore} rep</span>}
        {typeof profile.totalMandatesPosted === 'number' && (
          <span>📋 {profile.totalMandatesPosted} mandates</span>
        )}
      </div>

      {/* Asset preferences */}
      {profile.assetPreferences && profile.assetPreferences.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {profile.assetPreferences.map((pref) => (
            <span key={pref} className="text-[10px] px-1.5 py-0.5 rounded-full bg-current/15 font-medium">
              {pref}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      {(profile.website || profile.linkedin) && (
        <div className="flex gap-4 text-xs pt-2 border-t border-current/20">
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2 opacity-80 hover:opacity-100">
              Website ↗
            </a>
          )}
          {profile.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2 opacity-80 hover:opacity-100">
              LinkedIn ↗
            </a>
          )}
        </div>
      )}
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
  const profileCardRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { profile } = useMyProfile();
  const liveProfile = (profile ?? user) as User | null;

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

  const existingProfileCardMsg = messages.find(
    (m) => m.senderId === user?.id && parseSharedProfile(m.content) !== null,
  );

  // Scroll to bottom whenever messages load or a new message arrives
  useEffect(() => {
    if (!isLoadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, isLoadingMessages]);

  const handleSendProfileDetails = async () => {
    if (!selectedConversationId) return;

    if (existingProfileCardMsg) {
      profileCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

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
                      <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {otherUser?.logo && (
                          <img
                            src={otherUser.logo}
                            alt={otherUser.companyName}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        {getInitials(otherUser?.companyName || 'U')}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{otherUser?.companyName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage
                            ? parseSharedProfile(conv.lastMessage.content)
                              ? '🪪 Shared a profile card'
                              : conv.lastMessage.content
                            : 'No messages'}
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
                <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {getOtherParticipant(conversation)?.logo && (
                    <img
                      src={getOtherParticipant(conversation).logo}
                      alt={getOtherParticipant(conversation)?.companyName}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  {getInitials(getOtherParticipant(conversation)?.companyName || 'U')}
                </div>
                <div>
                  <p className="font-medium">{getOtherParticipant(conversation)?.companyName}</p>
                  <p className="text-sm text-muted-foreground">
                    {getOtherParticipant(conversation)?.role}
                  </p>
                </div>
                {existingProfileCardMsg ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="ml-auto flex items-center gap-1.5"
                    onClick={() =>
                      profileCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  >
                    <BadgeInfo className="w-4 h-4" />
                    Profile Shared
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={handleSendProfileDetails}
                    disabled={isSendingProfileDetails}
                  >
                    <BadgeInfo className="w-4 h-4 mr-1.5" />
                    {isSendingProfileDetails ? 'Sharing…' : 'Share Profile'}
                  </Button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <p className="text-center text-muted-foreground">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                ) : (
                  (() => {
                    // Find the most-recent profile card message per sender so we only
                    // show the full card once and collapse older duplicates.
                    const latestCardId = new Map<string, string>();
                    messages.forEach((m) => {
                      if (parseSharedProfile(m.content) !== null) {
                        latestCardId.set(m.senderId, m.id);
                      }
                    });

                    return messages.map((msg) => {
                    const sharedProfile = parseSharedProfile(msg.content);
                    const isOwnCard = sharedProfile !== null && msg.senderId === user?.id;
                    const isLatestCard = sharedProfile !== null && latestCardId.get(msg.senderId) === msg.id;

                    // Always use the sender's current participant data to keep the card up to date.
                    // For own cards use the full live profile; for others overlay the participant fields.
                    const cardSender = sharedProfile
                      ? conversation?.participants?.find((p: any) => p.id === msg.senderId)
                      : null;
                    const displayProfile = sharedProfile
                      ? isOwnCard && liveProfile
                        ? userToSharedProfile(liveProfile)
                        : cardSender
                        ? { ...sharedProfile, ...userToSharedProfile(cardSender as User) }
                        : sharedProfile
                      : null;
                    return (
                      <div
                        key={msg.id}
                        ref={isOwnCard && isLatestCard ? profileCardRef : undefined}
                        className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Older duplicate cards — show as a collapsed line */}
                        {displayProfile && !isLatestCard ? (
                          <p className="text-xs text-muted-foreground italic px-1">
                            🪪 Shared a profile card · {formatRelativeTime(msg.createdAt)}
                          </p>
                        ) : (
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-3 ${
                            msg.senderId === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          }`}
                        >
                          {displayProfile ? (
                            <SharedProfileCard
                              profile={displayProfile}
                              senderId={msg.senderId}
                              currentUserId={user?.id}
                            />
                          ) : (
                            <p>{msg.content}</p>
                          )}
                          <p className="text-xs opacity-60 mt-2 text-right">
                            {formatRelativeTime(msg.createdAt)}
                          </p>
                        </div>
                        )}
                      </div>
                    );
                  })})()
                )}
                <div ref={messagesEndRef} />
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
