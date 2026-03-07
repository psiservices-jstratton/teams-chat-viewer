export interface Message {
  sender: string;
  timestamp: string;
  content: string;
  links: string[];
}

export interface Conversation {
  id: string;
  title: string;
  participants: string[];
  date: string;
  messages: Message[];
  importedAt: number;
}
