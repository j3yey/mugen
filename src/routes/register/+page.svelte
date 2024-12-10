<script>
    import CryptoJS from 'crypto-js';
    import { goto } from '$app/navigation';

    let username = '';
    let password = '';
    let key = 'JohnAdrian'; // Replace with a secure key
    let message = '';
    
    async function register() {
        if (!username || !password) {
            message = 'Please fill in all fields.';
            return;
        }

        const body = CryptoJS.AES.encrypt(
            JSON.stringify({ username, password }),
            key
        ).toString();

        try {
            const response = await fetch('/api', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body, key }),
            });

            const data = await response.json();

            if (data.success) {
                
                message = 'Registration successful!';
                setTimeout(() => {
                    goto('/'); // Redirect to the login page
                }, 2000);
            } else {
                message = data.message || 'Failed to register.';
            }
        } catch (error) {
            message = 'An error occurred. Please try again.';
        }
    }
</script>

<div class="welcome-container">
    <img src="/mugenlogo.png" alt="mugen logo" class="mugenlogo">
    <div class="description-container">
        <p class="description">
            Dive into the world of anime with Mugen! Our app makes it effortless to search for your favorite anime by title or genre. Plus, get personalized recommendations to discover hidden gems and new adventures tailored just for you.
        </p>
    </div>
    <div class="container">
        <div class="form-container">
            <h1>Register</h1>
            <div class="input-group">
                <label for="username">Username</label>
                <input id="username" type="text" bind:value={username} placeholder="Enter username" />
            </div>
            <div class="input-group">
                <label for="password">Password</label>
                <input id="password" type="password" bind:value={password} placeholder="Enter password" />
            </div>
            <button class="login-button" on:click={register}>Register</button>
            <p class="message">{message}</p>
            <a href="/" class="register-link">Already have an account? Login here</a>
        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&family=Roboto:wght@400;700&display=swap');

    .welcome-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: 'Poppins', sans-serif;
        position: relative;
        transition: background 0.3s ease;
        background-image: url('mugenbg.jpg');
    }


    .container {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        width: 100%;
        height: 100%;
    }

    .form-container {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 3rem;
        width: 500px;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(15px);
    }

    h1 {
        margin-bottom: 1.5rem;
        font-size: 2.5rem;
        color: #fff;
        text-align: center;
    }

    .input-group {
        margin-bottom: 2rem;
    }

    .input-group label {
        display: block;
        margin-bottom: 0.8rem;
        font-size: 1.2rem;
        color: #fff;
    }

    .input-group input {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.9);
        font-size: 1.2rem;
        color: black !important;
    }

    .input-group input:focus {
        outline: none;
        box-shadow: 0 0 6px rgba(102, 178, 255, 0.8);
    }

    .login-button {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 10px;
        background: #2575fc;
        color: #fff;
        font-size: 1.2rem;
        cursor: pointer;
        transition: background 0.3s;
    }

    .login-button:hover {
        background: #1a5bbf;
    }

    .message {
        margin-top: 1.5rem;
        font-size: 1rem;
        color: #ff6b6b;
        text-align: center;
    }

    .register-link {
        display: block;
        margin-top: 1rem;
        font-size: 1rem;
        color: #fff;
        text-align: center;
        text-decoration: underline;
        cursor: pointer;
    }

    .register-link:hover {
        color: #a0c4ff;
    }

    .mugenlogo {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 350px;
        height: auto;
        z-index: 1;
        margin-left: 250px;
        margin-top: 130px;
    }

    .description-container {
        position: absolute;
        top: 200px;
        left: -80px;
        width: 550px;
        height: 300px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(15px);
        z-index: 1;
        margin-left: 250px;
        margin-top: 290px;
    }

    .description {
        color: white;
        font-family: 'Poppins', sans-serif;
        font-size: 1.5rem;
        line-height: 1.5;
        text-align: left;
    }
</style>
