import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Message } from '../types';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface StoredMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  sequence_number: number;
}

export interface StoredDocument {
  id: string;
  conversation_id: string;
  file_name: string;
  content: string;
  content_preview: string;
  metadata: Record<string, any>;
  chunks: any[];
  uploaded_at: string;
}

class ConversationService {
  async createConversation(title?: string): Promise<string | null> {
    if (!isSupabaseEnabled || !supabase) {
      console.warn('Supabase not enabled, using in-memory storage');
      return `local-${Date.now()}`;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          title: title || 'New Conversation',
          metadata: {}
        })
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    if (!isSupabaseEnabled || !supabase || conversationId.startsWith('local-')) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      return null;
    }
  }

  async listConversations(limit = 50): Promise<Conversation[]> {
    if (!isSupabaseEnabled || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error listing conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to list conversations:', error);
      return [];
    }
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    if (!isSupabaseEnabled || !supabase || conversationId.startsWith('local-')) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      return false;
    }
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    if (!isSupabaseEnabled || !supabase || conversationId.startsWith('local-')) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  async saveMessage(
    conversationId: string,
    message: Message,
    sequenceNumber: number
  ): Promise<boolean> {
    if (!isSupabaseEnabled || !supabase || conversationId.startsWith('local-')) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: message.type === 'user' ? 'user' : 'assistant',
          content: message.content,
          metadata: {
            analysisMetadata: message.analysisMetadata,
            diagram: message.diagram,
            thinkingProcess: message.thinkingProcess
          },
          sequence_number: sequenceNumber
        });

      if (error) {
        console.error('Error saving message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to save message:', error);
      return false;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    if (!isSupabaseEnabled || !supabase || conversationId.startsWith('local-')) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sequence_number', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []).map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        analysisMetadata: msg.metadata?.analysisMetadata,
        diagram: msg.metadata?.diagram,
        thinkingProcess: msg.metadata?.thinkingProcess
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  async saveDocument(conversationId: string, document: any): Promise<boolean> {
    if (!isSupabaseEnabled || !supabase || conversationId.startsWith('local-')) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          conversation_id: conversationId,
          file_name: document.file_name,
          content: document.content,
          content_preview: document.content_preview,
          metadata: document.metadata,
          chunks: document.chunks || []
        });

      if (error) {
        console.error('Error saving document:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to save document:', error);
      return false;
    }
  }

  async getDocuments(conversationId: string): Promise<StoredDocument[]> {
    if (!isSupabaseEnabled || !supabase || conversationId.startsWith('local-')) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('uploaded_at', { ascending: true });

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      return [];
    }
  }

  async generateConversationTitle(firstMessage: string): Promise<string> {
    const cleaned = firstMessage.trim().toLowerCase();

    if (cleaned.includes('chart') || cleaned.includes('graph') || cleaned.includes('visualiz')) {
      return '📊 Data Visualization';
    } else if (cleaned.includes('document') || cleaned.includes('pdf') || cleaned.includes('file')) {
      return '📄 Document Analysis';
    } else if (cleaned.includes('explain') || cleaned.includes('what')) {
      return '❓ Document Q&A';
    } else if (cleaned.includes('summary') || cleaned.includes('summarize')) {
      return '📝 Summary Request';
    } else if (cleaned.includes('compare') || cleaned.includes('difference')) {
      return '⚖️ Comparison Analysis';
    } else {
      return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
    }
  }
}

export const conversationService = new ConversationService();
