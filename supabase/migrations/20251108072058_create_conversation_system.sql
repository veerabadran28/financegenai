/*
  # Enterprise Conversation Memory System

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key) - Unique conversation session ID
      - `title` (text) - Auto-generated conversation title
      - `created_at` (timestamptz) - When conversation started
      - `updated_at` (timestamptz) - Last message timestamp
      - `metadata` (jsonb) - Additional conversation metadata
    
    - `messages`
      - `id` (uuid, primary key) - Unique message ID
      - `conversation_id` (uuid, foreign key) - Links to conversation
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - Message content
      - `metadata` (jsonb) - Message metadata (confidence, sources, etc.)
      - `created_at` (timestamptz) - Message timestamp
      - `sequence_number` (integer) - Message order in conversation
    
    - `documents`
      - `id` (uuid, primary key) - Unique document ID
      - `conversation_id` (uuid, foreign key) - Links to conversation
      - `file_name` (text) - Original file name
      - `content` (text) - Full document content
      - `content_preview` (text) - Short preview (500 chars)
      - `metadata` (jsonb) - Document metadata (word count, pages, etc.)
      - `chunks` (jsonb) - Document chunks for RAG
      - `uploaded_at` (timestamptz) - Upload timestamp
    
  2. Indexes
    - Conversation lookup by date
    - Message lookup by conversation
    - Document lookup by conversation
  
  3. Security
    - Enable RLS on all tables
    - Public access for demo (no auth required)
    - In production, would restrict to authenticated users
  
  4. Important Notes
    - This implements a stateless conversation system
    - Each conversation is independent with full history
    - Documents are stored per conversation for context
    - Optimized for RAG (Retrieval Augmented Generation)
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  sequence_number integer NOT NULL
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  content text NOT NULL,
  content_preview text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  chunks jsonb DEFAULT '[]'::jsonb,
  uploaded_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_documents_conversation ON documents(conversation_id);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo mode)
-- In production, these would check auth.uid()

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view conversations"
  ON conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update conversations"
  ON conversations FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create documents"
  ON documents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view documents"
  ON documents FOR SELECT
  TO anon, authenticated
  USING (true);

-- Function to auto-update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message added
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();