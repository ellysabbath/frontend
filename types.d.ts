 interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  bio?: string;
  profile_picture?: string;
  is_newsletter_subscribed: boolean;
  website_url?: string;
  github_url?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
  profile_completion_percentage: number;
  is_profile_complete: boolean;
}

 interface AuthTokens {
  access: string;
  refresh: string;
}

 interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

 interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password2: string;
}

interface RegisterResponse {
    email:string,
    user_id:string,
    message:string
}

interface VerifyEmailResponse {
  message: string;
  refresh:string;
  access:string;
  user:User;
}