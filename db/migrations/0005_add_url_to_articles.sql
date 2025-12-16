-- 0005_add_url_to_articles.sql
-- Adds URL column to articles table for linking to external articles

ALTER TABLE public.articles
ADD COLUMN url text;

-- Create index on url for searching
CREATE INDEX IF NOT EXISTS articles_url_idx ON public.articles (url);
