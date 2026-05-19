
-- Allow authenticated users to find classes by join_code (needed for joining)
CREATE POLICY "Authenticated users can find classes by join code"
ON public.classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Since teachers already have their own policy and students now have this,
-- we can drop the student-specific one to simplify (the new policy covers both)
DROP POLICY IF EXISTS "Students can view classes they belong to" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
