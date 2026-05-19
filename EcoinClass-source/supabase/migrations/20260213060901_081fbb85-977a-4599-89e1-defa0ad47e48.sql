
-- Fix infinite recursion: classes SELECT policy references class_members,
-- and class_members SELECT policy references class_members itself.

-- Fix class_members: use security definer function instead of self-referencing
DROP POLICY IF EXISTS "Students can view members of their classes" ON public.class_members;

-- Create a security definer function to check class membership
CREATE OR REPLACE FUNCTION public.is_class_member(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members
    WHERE user_id = _user_id
      AND class_id = _class_id
  )
$$;

-- Recreate class_members student SELECT policy using the function
CREATE POLICY "Students can view members of their classes"
ON public.class_members
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.is_class_member(auth.uid(), class_id));

-- Also fix classes student SELECT policy to use the function
DROP POLICY IF EXISTS "Students can view classes they belong to" ON public.classes;

CREATE POLICY "Students can view classes they belong to"
ON public.classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.is_class_member(auth.uid(), id));
