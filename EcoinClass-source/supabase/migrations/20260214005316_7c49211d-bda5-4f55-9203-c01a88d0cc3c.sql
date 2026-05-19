-- Allow teachers to delete mining records (for reset)
CREATE POLICY "Teachers can delete mining records"
ON public.mining_records FOR DELETE
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow super admins to delete mining records (for reset)
CREATE POLICY "Super admins can delete mining records"
ON public.mining_records FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super admins to update profiles (for reset)
CREATE POLICY "Super admins can update all profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow teachers to update all profiles (for reset)
CREATE POLICY "Teachers can update all profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'teacher'::app_role));