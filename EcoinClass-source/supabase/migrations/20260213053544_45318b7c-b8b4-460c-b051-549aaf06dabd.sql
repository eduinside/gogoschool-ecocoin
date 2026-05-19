
-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  join_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 6),
  teacher_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_members table (students in a class)
CREATE TABLE public.class_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Classes RLS policies
CREATE POLICY "Teachers can create classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update their own classes"
ON public.classes FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own classes"
ON public.classes FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view their own classes"
ON public.classes FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they belong to"
ON public.classes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_members.class_id = id
    AND class_members.user_id = auth.uid()
  )
);

-- Class members RLS policies
CREATE POLICY "Teachers can manage members of their classes"
ON public.class_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = class_members.class_id
    AND classes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view members of their classes"
ON public.class_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.class_id = class_members.class_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Students can join classes with code"
ON public.class_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
