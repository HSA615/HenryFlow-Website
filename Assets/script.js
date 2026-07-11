/**
 * script.js - HenryFlow shared interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    // Enable animations that require JS
    document.body.classList.add('js-enabled');

    // --- Check login status and update header ---
    const user = JSON.parse(localStorage.getItem('user'));
    const signinLink = document.getElementById('signin-link');
    const profileSection = document.getElementById('profile-section');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const avatarInitials = document.getElementById('avatar-initials');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
        // User is logged in
        if (signinLink) signinLink.style.display = 'none';
        if (profileSection) profileSection.style.display = 'flex';
        if (profileName) profileName.textContent = user.fullname || 'User';
        if (profileEmail) profileEmail.textContent = user.email || 'email@example.com';

        // Generate initials
        const names = (user.fullname || 'U').split(' ');
        const initials = names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
        if (avatarInitials) avatarInitials.textContent = initials;
    } else {
        // User is not logged in
        if (signinLink) signinLink.style.display = 'block';
        if (profileSection) profileSection.style.display = 'none';
    }

    // Profile dropdown toggle
    if (profileAvatar) {
        profileAvatar.addEventListener('click', () => {
            if (profileDropdown) {
                profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '/index.html';
        });
    }

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (profileAvatar && profileDropdown && !e.target.closest('.profile-section')) {
            profileDropdown.style.display = 'none';
        }
    });

    // --- Mobile navigation toggle ---
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    // --- Reveal on scroll ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // --- FAQ accordion ---
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            item.classList.toggle('active');
            const arrow = q.querySelector('.arrow');
            if (arrow) {
                arrow.textContent = item.classList.contains('active') ? '−' : '+';
            }
        });
    });

    // --- Login form submission ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const loginStatus = document.getElementById('login-status');
            loginStatus.textContent = '';
            loginStatus.className = 'form-status';
            loginStatus.style.display = 'none';

            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Signing in...';
            }

            const formData = new FormData(loginForm);
            const data = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                const apiUrl = window.location.origin + '/api/login';
                console.log('Attempting login at:', apiUrl);
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                console.log('Login response:', result);

                if (response.ok) {
                    loginStatus.textContent = 'Sign in successful! Redirecting...';
                    loginStatus.classList.add('success');
                    loginStatus.style.display = 'block';
                    localStorage.setItem('user', JSON.stringify(result.user));
                    setTimeout(() => window.location.href = '../index.html', 1500);
                } else {
                    loginStatus.textContent = result.error || 'Sign in failed. Please try again.';
                    loginStatus.classList.add('error');
                    loginStatus.style.display = 'block';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginStatus.textContent = 'An error occurred. Please try again later. Error: ' + error.message;
                loginStatus.classList.add('error');
                loginStatus.style.display = 'block';
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Sign In';
                }
            }
        });
    }

    // --- Signup form submission ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const signupStatus = document.getElementById('signup-status');
            signupStatus.textContent = '';
            signupStatus.className = 'form-status';
            signupStatus.style.display = 'none';

            const submitButton = signupForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Creating account...';
            }

            const formData = new FormData(signupForm);
            const data = {
                fullname: formData.get('fullname'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirm-password'),
                marketingOptIn: formData.get('marketingOptIn')
            };

            try {
                const apiUrl = window.location.origin + '/api/signup';
                console.log('Attempting signup at:', apiUrl);
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                console.log('Signup response:', result);

                if (response.ok) {
                    signupStatus.textContent = 'Account created successfully! Redirecting to sign in...';
                    signupStatus.classList.add('success');
                    signupStatus.style.display = 'block';
                    setTimeout(() => window.location.href = 'Login.html', 1500);
                } else {
                    signupStatus.textContent = result.error || 'Account creation failed. Please try again.';
                    signupStatus.classList.add('error');
                    signupStatus.style.display = 'block';
                }
            } catch (error) {
                console.error('Signup error:', error);
                signupStatus.textContent = 'An error occurred. Please try again later. Error: ' + error.message;
                signupStatus.classList.add('error');
                signupStatus.style.display = 'block';
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Create Account';
                }
            }
        });
    }

    // --- Contact form submission ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            formStatus.textContent = '';
            formStatus.className = 'form-status';

            const submitButton = contactForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Sending...';
            }

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    formStatus.textContent = 'Message sent successfully. We will get back to you shortly.';
                    formStatus.classList.add('success');
                    contactForm.reset();
                } else {
                    throw new Error('Submission failed.');
                }
            } catch (error) {
                formStatus.textContent = 'Sorry, the message could not be sent. Please try again later.';
                formStatus.classList.add('error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Send Message';
                }
            }
        });
    }

    // --- GitHub push updates feed ---
    const githubUpdatesContainer = document.getElementById('github-updates-container');

    async function fetchGitHubPushEvents() {
        githubUpdatesContainer.innerHTML = '<div class="github-update-empty">Loading latest updates...</div>';

        try {
            const response = await fetch('/api/github-pushes');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.message || `GitHub API error: ${response.status}`;
                throw new Error(message);
            }

            const data = await response.json();
            const pushEvents = data.pushEvents || [];

            if (!pushEvents.length) {
                githubUpdatesContainer.innerHTML = '<div class="github-update-empty">No recent updates found.</div>';
                return;
            }

            githubUpdatesContainer.innerHTML = pushEvents.map(event => {
                const commitMessages = event.commits.map(commit => `<div class="github-update-commit"><p><strong>${commit.message}</strong></p><p>${commit.sha.slice(0, 7)} &middot; ${commit.author}</p></div>`).join('');
                const pushedAt = new Date(event.pushedAt).toLocaleString();

                return `
                    <div class="github-update-card">
                        <h3>${event.commitCount} change${event.commitCount === 1 ? '' : 's'} published</h3>
                        <p><strong>Date:</strong> ${pushedAt}</p>
                        ${commitMessages}
                    </div>
                `;
            }).join('');
        } catch (error) {
            githubUpdatesContainer.innerHTML = `<div class="github-update-empty">Unable to load updates right now. Please check back later.</div>`;
        }
    }

    if (githubUpdatesContainer) {
        fetchGitHubPushEvents();
    }
});
