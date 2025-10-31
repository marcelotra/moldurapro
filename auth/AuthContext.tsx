import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get user profile from our public table
const getUserProfile = async (userId: string): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
    return data as User;
}


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If Supabase is not configured, run in mock mode with a default admin user
        if (!isSupabaseConfigured) {
            setUser({ id: 'mock-admin-user', username: 'admin@moldurasoft.com', role: 'admin' });
            setLoading(false);
            return;
        }

        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const profile = await getUserProfile(session.user.id);
                    setUser(profile);
                }
            } catch (error) {
                console.error("Error getting initial session:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                 const profile = await getUserProfile(session.user.id);
                 setUser(profile);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);
    
    const logout = async () => {
        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        } else {
            // In mock mode, "logging out" might mean reloading the page to reset the state
            window.location.reload();
        }
    };

    const value = {
        user,
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
