-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.learning_todos (
  id integer NOT NULL DEFAULT nextval('learning_todos_id_seq'::regclass),
  note_id integer,
  user_id integer NOT NULL,
  content text NOT NULL,
  due_date timestamp without time zone,
  status character varying DEFAULT 'PENDING'::character varying CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'COMPLETED'::character varying]::text[])),
  reason text,
  created_at timestamp without time zone DEFAULT now(),
  deadline_type USER-DEFINED,
  is_checked BOOLEAN DEFAULT FALSE,
  CONSTRAINT learning_todos_pkey PRIMARY KEY (id),
  CONSTRAINT learning_todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT learning_todos_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.notes (
  id integer NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  user_id integer NOT NULL,
  title character varying,
  raw_content text NOT NULL,
  refined_content text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notes_analysis (
  id integer NOT NULL DEFAULT nextval('review_analysis_id_seq'::regclass),
  note_id integer NOT NULL,
  summary_json jsonb,
  skill_proposal_json jsonb,
  feedback_json jsonb,
  analyzed_at timestamp without time zone DEFAULT now(),
  suggested_todos_json jsonb,
  fact_checks_json jsonb,
  CONSTRAINT notes_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT notes_analysis_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.skill_nodes (
  id integer NOT NULL DEFAULT nextval('skill_nodes_id_seq'::regclass),
  user_id integer NOT NULL,
  parent_id integer,
  name character varying NOT NULL,
  level integer DEFAULT 1,
  source_note_id integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT skill_nodes_pkey PRIMARY KEY (id),
  CONSTRAINT skill_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.skill_nodes(id),
  CONSTRAINT skill_nodes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT skill_nodes_source_note_id_fkey FOREIGN KEY (source_note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.users (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  password text NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);