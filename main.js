import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Login functionality
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const userId = document.getElementById('user-id').value;
        const password = document.getElementById('password').value;

        // Get email from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('user_id', userId)
            .single();

        if (profileError || !profile) {
            alert('User ID not found');
            return;
        }

        const email = profile.email;
        const name = profile.name;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            alert(error.message);
        } else {
            localStorage.setItem('userName', name);
            window.location.href = '/dashboard.html';
        }
    });
}

// Check user session on dashboard page
if (window.location.pathname === '/dashboard.html') {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('user-info').innerText = userName;
    } else {
        window.location.href = '/';
    }

    const avatarTrigger = document.querySelector('.avatar-menu-trigger');
    const avatarDropdown = document.querySelector('.avatar-dropdown');

    avatarTrigger.addEventListener('click', () => {
        avatarDropdown.classList.toggle('show');
    });

    window.addEventListener('click', (event) => {
        if (!avatarTrigger.contains(event.target)) {
            avatarDropdown.classList.remove('show');
        }
    });
}

// Logout functionality
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(error.message);
        } else {
            localStorage.removeItem('userName');
            window.location.href = '/';
        }
    });
}
