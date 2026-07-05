'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Filter, Users, AlertCircle, Package, ShoppingCart, Search, Bell, User, FileText, Settings, LogOut, BarChart3, Plus, Clock, TrendingUp, DollarSign, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import NotificationCenter from '../components/NotificationCenter';

interface Message {
  id: string;
  sender: { id: string; email: string; full_name?: string };
  recipient?: { id: string; email: string; full_name?: string };
  subject: string;
  content: string;
  tag: string;
  is_read: boolean;
  created_at: string;
  parent_message_id?: string;
  replies?: Message[];
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

const tagColors = {
  general: 'bg-blue-500/20 text-blue-400',
  restock_request: 'bg-orange-500/20 text-orange-400',
  low_stock: 'bg-red-500/20 text-red-400',
  unavailable: 'bg-gray-500/20 text-gray-400',
  urgent: 'bg-red-500/20 text-red-400',
  admin_notice: 'bg-purple-500/20 text-purple-400'
};

const tagIcons = {
  general: MessageSquare,
  restock_request: Package,
  low_stock: AlertCircle,
  unavailable: ShoppingCart,
  urgent: AlertCircle,
  admin_notice: Users
};

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // New message form
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    tag: 'general'
  });

  // Reply form
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchUsers(); // Still need users for the recipient dropdown
        await fetchCurrentUser();
        await fetchMessages(); // Can fetch messages independently now
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    fetchMessages(); // Fetch messages when filters change
  }, [filterTag, filterType]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const allUsers = await response.json();
        // Find current user from session
        const currentUserEmail = session?.user?.email;
        const userData = allUsers.find((u: User) => u.email === currentUserEmail);
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams();
      if (filterTag && filterTag !== 'all_tags') params.append('tag', filterTag);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`/api/messages?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Messages data from API:', data);

        // The API now returns enriched data with sender/recipient info
        setMessages(data);
      } else {
        console.error('Messages API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        console.log('Users API response:', data);
        setUsers(data || []);
      } else {
        console.error('Users API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const sendMessage = async () => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
      });

      if (response.ok) {
        setNewMessage({ recipient_id: '', subject: '', content: '', tag: 'general' });
        setShowNewMessage(false);
        await fetchMessages();
      } else {
        const errorData = await response.json();
        console.error('Error sending message:', errorData);
        alert('Failed to send message: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const sendReply = async (parentMessageId: string) => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: selectedMessage.sender.id,
          subject: `Re: ${selectedMessage.subject}`,
          content: replyContent,
          tag: selectedMessage.tag,
          parent_message_id: parentMessageId
        })
      });

      if (response.ok) {
        setReplyContent('');
        await fetchMessages();
        // Refresh the selected message to show the new reply
        const updatedMessage = messages.find(m => m.id === selectedMessage.id);
        if (updatedMessage) {
          setSelectedMessage(updatedMessage);
        }
      } else {
        const errorData = await response.json();
        console.error('Error sending reply:', errorData);
        alert('Failed to send reply: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, is_read: true })
      });
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTagIcon = (tag: string) => {
    const Icon = tagIcons[tag as keyof typeof tagIcons] || MessageSquare;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading messages...</div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0d12]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a5568]"></div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="bg-[rgba(12,16,21,0.8)] backdrop-blur-sm border-b border-[rgba(255,255,255,0.04)] px-4 py-4 md:px-6 shadow-sm md:mr-6 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6">
            <h2 className="text-white text-xl font-semibold">Messages</h2>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-[rgba(255,255,255,0.6)] text-sm font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })} • {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 md:mr-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-white text-3xl font-bold">Messages</h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewMessage(true)}
            className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white px-4 py-2 rounded-lg flex items-center justify-center transition-all duration-200 w-full md:w-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            New Message
          </motion.button>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="flex items-center gap-2 text-white mb-2 md:mb-0">
              <Filter className="w-4 h-4 text-white" />
              <span className="md:hidden text-sm">Filters</span>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40 bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white focus:ring-blue-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0c1015] border-[rgba(255,255,255,0.04)]">
                <SelectItem value="all" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">All Messages</SelectItem>
                <SelectItem value="sent" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">Sent</SelectItem>
                <SelectItem value="received" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">Received</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-full md:w-40 bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white focus:ring-blue-300">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent className="bg-[#0c1015] border-[rgba(255,255,255,0.04)]">
                <SelectItem value="all_tags" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">All Tags</SelectItem>
                <SelectItem value="general" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">General</SelectItem>
                <SelectItem value="restock_request" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">Restock Request</SelectItem>
                <SelectItem value="low_stock" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">Low Stock</SelectItem>
                <SelectItem value="unavailable" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">Unavailable</SelectItem>
                <SelectItem value="urgent" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">Urgent</SelectItem>
                <SelectItem value="admin_notice" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">Admin Notice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-4 md:p-6 shadow-sm">
            <h3 className="text-white font-semibold text-lg mb-4">Messages</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`p-3 border border-[rgba(255,255,255,0.04)] rounded-lg cursor-pointer transition-all duration-200 ${selectedMessage?.id === message.id ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-[rgba(255,255,255,0.02)]'
                    } ${!message.is_read ? 'border-l-4 border-l-blue-400' : ''}`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.is_read && message.recipient?.id === currentUser?.id) {
                      markAsRead(message.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTagIcon(message.tag)}
                      <Badge className={`${tagColors[message.tag as keyof typeof tagColors]} text-xs`}>
                        {message.tag.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-[rgba(255,255,255,0.4)]">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm mb-1 text-white">{message.subject}</h4>
                  <p className="text-xs text-[rgba(255,255,255,0.6)] mb-2">
                    From: {message.sender.full_name || message.sender.email}
                  </p>
                  <p className="text-sm text-[rgba(255,255,255,0.5)] line-clamp-2">{message.content}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-8 text-[rgba(255,255,255,0.4)]">
                  No messages found
                </div>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-4 md:p-6 shadow-sm">
            <h3 className="text-white font-semibold text-lg mb-4">Message Details</h3>
            {selectedMessage ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`${tagColors[selectedMessage.tag as keyof typeof tagColors]} text-xs`}>
                      {selectedMessage.tag.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-[rgba(255,255,255,0.4)]">
                      {formatDate(selectedMessage.created_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{selectedMessage.subject}</h3>
                  <p className="text-sm text-[rgba(255,255,255,0.6)] mb-3">
                    From: {selectedMessage.sender.full_name || selectedMessage.sender.email}
                  </p>
                  <div className="bg-[rgba(255,255,255,0.02)] p-3 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <p className="whitespace-pre-wrap text-white">{selectedMessage.content}</p>
                  </div>
                </div>

                {/* Replies */}
                {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-white">Replies</h4>
                    {selectedMessage.replies.map(reply => (
                      <div key={reply.id} className="bg-blue-500/5 p-3 rounded-lg ml-2 md:ml-4 border border-blue-500/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-white">
                            {reply.sender.full_name || reply.sender.email}
                          </span>
                          <span className="text-xs text-[rgba(255,255,255,0.4)]">
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap text-[rgba(255,255,255,0.8)]">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {selectedMessage.sender.id !== currentUser?.id && (
                  <div className="space-y-3">
                    <Label className="text-white">Reply</Label>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white placeholder-[rgba(255,255,255,0.4)] focus:border-blue-300 focus:ring-0"
                    />
                    <Button
                      onClick={() => sendReply(selectedMessage.id)}
                      disabled={!replyContent.trim()}
                      size="sm"
                      className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white transition-all duration-200"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[rgba(255,255,255,0.4)]">
                Select a message to view details
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showNewMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[#0c1015] border border-[rgba(255,255,255,0.04)] rounded-xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-[rgba(255,255,255,0.04)] flex justify-between items-center">
                <h2 className="text-white text-lg font-semibold">Send New Message</h2>
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="recipient" className="text-white mb-2 block">Recipient</Label>
                  <Select value={newMessage.recipient_id} onValueChange={(value: string) =>
                    setNewMessage(prev => ({ ...prev, recipient_id: value }))
                  }>
                    <SelectTrigger className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white focus:ring-blue-300 w-full">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c1015] border-[rgba(255,255,255,0.04)] text-white z-[60]">
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id} className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus:bg-[rgba(255,255,255,0.05)] focus:text-white">
                          {user.full_name || user.email} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tag" className="text-white mb-2 block">Tag</Label>
                  <Select value={newMessage.tag} onValueChange={(value: string) =>
                    setNewMessage(prev => ({ ...prev, tag: value }))
                  }>
                    <SelectTrigger className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white focus:ring-blue-300 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c1015] border-[rgba(255,255,255,0.04)] text-white z-[60]">
                      <SelectItem value="general" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus:bg-[rgba(255,255,255,0.05)] focus:text-white">General</SelectItem>
                      <SelectItem value="restock_request" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus:bg-[rgba(255,255,255,0.05)] focus:text-white">Restock Request</SelectItem>
                      <SelectItem value="low_stock" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus:bg-[rgba(255,255,255,0.05)] focus:text-white">Low Stock</SelectItem>
                      <SelectItem value="unavailable" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus:bg-[rgba(255,255,255,0.05)] focus:text-white">Unavailable</SelectItem>
                      <SelectItem value="urgent" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus:bg-[rgba(255,255,255,0.05)] focus:text-white">Urgent</SelectItem>
                      <SelectItem value="admin_notice" className="text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus:bg-[rgba(255,255,255,0.05)] focus:text-white">Admin Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject" className="text-white mb-2 block">Subject</Label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Message subject"
                    className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white placeholder-[rgba(255,255,255,0.4)] focus:border-blue-300 focus:ring-0 w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="content" className="text-white mb-2 block">Message</Label>
                  <Textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Type your message here..."
                    rows={4}
                    className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white placeholder-[rgba(255,255,255,0.4)] focus:border-blue-300 focus:ring-0 w-full resize-none"
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowNewMessage(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendMessage}
                    className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}