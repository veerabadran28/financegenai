import { supabase } from '../lib/supabase';

export interface UserPreferences {
  id: string;
  user_id: string;
  mode: 'web' | 'work';
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  mode: 'web' | 'work';
  tools_used: string[];
  sources: Array<{ title: string; url: string }>;
  response_preview: string;
  created_at: string;
}

export class PreferencesService {
  private userId: string;

  constructor() {
    this.userId = this.getOrCreateUserId();
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('insights_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('insights_user_id', userId);
    }
    return userId;
  }

  async getMode(): Promise<'web' | 'work'> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('mode')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching preferences:', error);
        return 'work';
      }

      return data?.mode || 'work';
    } catch (error) {
      console.error('Error in getMode:', error);
      return 'work';
    }
  }

  async setMode(mode: 'web' | 'work'): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: this.userId,
            mode,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id'
          }
        );

      if (error) {
        console.error('Error setting mode:', error);
      }
    } catch (error) {
      console.error('Error in setMode:', error);
    }
  }

  async saveSearchHistory(
    query: string,
    mode: 'web' | 'work',
    toolsUsed: string[],
    sources: Array<{ title: string; url: string }>,
    responsePreview: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: this.userId,
          query,
          mode,
          tools_used: toolsUsed,
          sources,
          response_preview: responsePreview.substring(0, 500)
        });

      if (error) {
        console.error('Error saving search history:', error);
      }
    } catch (error) {
      console.error('Error in saveSearchHistory:', error);
    }
  }

  async getSearchHistory(limit: number = 50): Promise<SearchHistory[]> {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching search history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSearchHistory:', error);
      return [];
    }
  }

  async clearSearchHistory(): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error clearing search history:', error);
      }
    } catch (error) {
      console.error('Error in clearSearchHistory:', error);
    }
  }
}

export const preferencesService = new PreferencesService();
