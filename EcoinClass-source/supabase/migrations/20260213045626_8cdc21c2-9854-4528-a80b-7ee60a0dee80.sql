
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
BEGIN
  -- Get role from user metadata, default to 'student'
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'student'
  );

  -- Create profile for new user
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  -- Assign selected role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;
