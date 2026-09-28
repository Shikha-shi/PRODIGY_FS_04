export interface User {
  id: number;
  username: string;
  email?: string;
  online?: boolean;
}

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  username: string;
  room_id?: number | null;
  conversation_id?: number | null;
  message_type: string;
  attachment_url?: string | null;
  created_at: string;
}

export interface Room {
  id: number;
  name: string;
  description: string | null;
}

export interface Conversation {
  id: number;
  other_user: User;
  last_message: string | null;
  last_message_at: string | null;
}