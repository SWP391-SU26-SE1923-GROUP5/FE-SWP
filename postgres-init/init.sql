-- postgres-init/init.sql

-- Enable UUID extension just in case it's not active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    bucket_file_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    extension TEXT NOT NULL,
    size BIGINT NOT NULL,
    users TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any other tables here (e.g., users, folders)