
-- Drop broken/restrictive SELECT policies on classes
DROP POLICY IF EXISTS "Students can view classes they belong to" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;

-- Recreate as PERMISSIVE policies (any one passing = access granted)
CREATE POLICY "Teachers can view their own classes"
ON public.classes FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they belong to"
ON public.classes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM class_members
  WHERE class_members.class_id = classes.id
    AND class_members.user_id = auth.uid()
));
