-- Allow teachers to delete user roles (needed for mini_admin removal)
CREATE POLICY "Teachers can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role));