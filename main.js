import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Strict; Secure";
}

const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

const eraseCookie = (name) => {
    document.cookie = name+'=; Max-Age=-99999999;';
}

const handleAuthError = (error) => {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.innerText = error.message;
    errorMessage.style.display = 'block';
  } else {
    alert(error.message);
  }
};

const navigateTo = (page) => {
  window.location.href = `/${page}.html`;
};

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
            handleAuthError({ message: 'User ID not found' });
            return;
        }

        const email = profile.email;
        const name = profile.name;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            handleAuthError(error);
        } else {
            setCookie('userName', name, 1);
            navigateTo('dashboard');
        }
    });
}

// Check user session on all pages except login
if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
    const userName = getCookie('userName');
    if (userName) {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerText = userName;
        }
    } else {
        navigateTo('index');
    }
}


// Logout functionality
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            handleAuthError(error);
        } else {
            eraseCookie('userName');
            navigateTo('index');
        }
    });
}

// Avatar dropdown functionality
const avatarTrigger = document.querySelector('.avatar-menu-trigger');
if (avatarTrigger) {
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

// Navigation functionality
const navItems = document.querySelectorAll('nav ul li');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        if (page) {
            navigateTo(page);
        }
    });
});
