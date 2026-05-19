
-- Drop ALL existing SELECT policies on classes
DROP POLICY IF EXISTS "Students can view classes they belong to" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete their own classes" ON public.classes;

-- Recreate all as PERMISSIVE with explicit TO authenticated
CREATE POLICY "Teachers can view their own classes"
ON public.classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they belong to"
ON public.classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.class_members
  WHERE class_members.class_id = classes.id
    AND class_members.user_id = auth.uid()
));

CREATE POLICY "Teachers can create classes"
ON public.classes
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id AND has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers can update their own classes"
ON public.classes
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own classes"
ON public.classes
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id);
