import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { isAdminEmail } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  debug: true, // Enable debug mode to see more detailed logs
  callbacks: {
    async signIn({ user, account }) {
      console.log('🔐 SignIn callback triggered:', { 
        provider: account?.provider, 
        email: user.email,
        name: user.name 
      });

      if (account?.provider === 'google') {
        try {
          // Check if user exists in Supabase by email
          console.log('🔍 Checking if user exists:', user.email);
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          console.log('📊 User lookup result:', { existingUser: !!existingUser, fetchError });

          // If user doesn't exist (PGRST116 is "not found" error)
          if (fetchError && fetchError.code === 'PGRST116') {
            console.log('👤 User not found, creating new user');
            
            // Check if user should be admin
            const isAdmin = isAdminEmail(user.email!);
            const role = isAdmin ? 'Manager' : 'User';
            
            console.log('🔑 User permissions:', { isAdmin, role });
            
            // User doesn't exist, create them
            const newUser = {
              id: randomUUID(), // Generate a proper UUID
              email: user.email!,
              full_name: user.name,
              avatar_url: user.image,
              provider: 'google',
              provider_id: account.providerAccountId, // Store Google's ID separately
              role: role,
              is_admin: isAdmin
            };

            console.log('📝 Creating user with data:', newUser);

            const { data: insertedUser, error: insertError } = await supabase
              .from('users')
              .insert(newUser)
              .select()
              .single();

            if (insertError) {
              console.error('❌ Error creating user:', insertError);
              // If it's a duplicate key error, that's actually OK - user was created by another request
              if (insertError.code !== '23505') {
                return false;
              }
              console.log('✅ Duplicate key error ignored (user already exists)');
            } else {
              console.log('✅ User created successfully:', insertedUser);
            }
          } else if (fetchError) {
            // Some other error occurred
            console.error('❌ Error fetching user:', fetchError);
            return false;
          } else if (existingUser) {
            console.log('👤 User exists, updating info');
            // User exists, update their info
            const { error: updateError } = await supabase
              .from('users')
              .update({
                full_name: user.name,
                avatar_url: user.image,
                provider_id: account.providerAccountId,
                updated_at: new Date().toISOString(),
              })
              .eq('email', user.email);

            if (updateError) {
              console.error('⚠️ Error updating user:', updateError);
              // Don't fail login for update errors
            } else {
              console.log('✅ User updated successfully');
            }
          }

          console.log('✅ SignIn callback completed successfully');
          return true;
        } catch (error) {
          console.error('💥 Sign in error:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        // Fetch user data from Supabase
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (userData) {
          // Extend the session user object with our custom properties
          (session.user as any).id = userData.id;
          (session.user as any).full_name = userData.full_name;
          (session.user as any).provider = userData.provider;
          (session.user as any).role = userData.role;
          (session.user as any).is_admin = userData.is_admin;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };