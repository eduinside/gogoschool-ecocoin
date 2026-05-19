
-- Mini admin RLS policies
CREATE POLICY "Mini admins can view class mining records"
ON public.mining_records FOR SELECT
USING (has_role(auth.uid(), 'mini_admin'::app_role));

CREATE POLICY "Mini admins can update reward requests"
ON public.reward_requests FOR UPDATE
USING (has_role(auth.uid(), 'mini_admin'::app_role));

CREATE POLICY "Mini admins can view reward requests"
ON public.reward_requests FOR SELECT
USING (has_role(auth.uid(), 'mini_admin'::app_role));

CREATE POLICY "Mini admins can update class missions"
ON public.class_missions FOR UPDATE
USING (has_role(auth.uid(), 'mini_admin'::app_role));

CREATE POLICY "Mini admins can view profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'mini_admin'::app_role));

-- Super admin RLS policies
CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update roles"
ON public.user_roles FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can view all mining records"
ON public.mining_records FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can view all reward requests"
ON public.reward_requests FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update reward requests"
ON public.reward_requests FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage classes"
ON public.classes FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage class members"
ON public.class_members FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage class missions"
ON public.class_missions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage eco actions"
ON public.eco_actions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage rewards"
ON public.rewards FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage badges"
ON public.badges FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));
