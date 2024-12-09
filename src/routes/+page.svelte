<script>
    import { goto } from '$app/navigation'; // Import goto function

    let username = '';
    let password = '';
    let message = '';

    async function login() {
        if (!username || !password) {
            message = 'Please fill in all fields.';
            return;
        }

        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                message = 'Login successful! Redirecting to /home...';
                setTimeout(() => {
                    goto('/home'); // Redirect to /home
                }, 2000); // Delay to allow user to see the success message
            } else {
                message = data.message || 'Failed to login.';
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
            <h1>Login</h1>
            <div class="input-group">
                <label for="username">Username</label>
                <input id="username" type="text" bind:value={username} placeholder="Enter username" />
            </div>
            <div class="input-group">
                <label for="password">Password</label>
                <input id="password" type="password" bind:value={password} placeholder="Enter password" />
            </div>
            <button class="login-button" on:click={login}>Login</button>
            <p class="message">{message}</p>
            <a href="/register" class="register-link">Don't have an account? Register here</a>
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
        justify-content: flex-end; /* Align the form to the right */
        align-items: center;
        width: 100%;
        height: 100%;
    }

    .form-container {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 3rem;
        width: 500px; /* Increased width */
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(15px);
    }

    h1 {
        margin-bottom: 1.5rem; /* Increased margin */
        font-size: 2.5rem; /* Increased font size */
        color: #fff;
        text-align: center;
    }

    .input-group {
        margin-bottom: 2rem; /* Increased spacing between inputs */
    }

    .input-group label {
        display: block;
        margin-bottom: 0.8rem; /* Increased label margin */
        font-size: 1.2rem; /* Larger font size for labels */
        color: #fff;
    }

    .input-group input {
        width: 100%;
        padding: 1rem; /* Increased padding */
        border: none;
        border-radius: 10px; /* Slightly rounded corners */
        background: rgba(255, 255, 255, 0.9); /* Slightly brighter input background */
        font-size: 1.2rem; /* Larger input text */
        color: black !important;
    }

    .input-group input:focus {
        outline: none;
        box-shadow: 0 0 6px rgba(102, 178, 255, 0.8); /* Enhanced focus effect */
    }

    .login-button {
        width: 100%;
        padding: 1rem; /* Increased button size */
        border: none;
        border-radius: 10px;
        background: #2575fc;
        color: #fff;
        font-size: 1.2rem; /* Larger button text */
        cursor: pointer;
        transition: background 0.3s;
    }

    .login-button:hover {
        background: #1a5bbf;
    }

    .message {
        margin-top: 1.5rem; /* Increased spacing for messages */
        font-size: 1rem; /* Slightly larger message text */
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
        position: absolute; /* Position it independently of the form container */
        top: 20px; /* Adjust the vertical position */
        left: 20px; /* Adjust the horizontal position */
        width: 350px; /* Maintain the logo's size */
        height: auto; /* Keep aspect ratio */
        z-index: 1; /* Ensure it stays above the video background */
        margin-left: 250px;
        margin-top: 130px;
    }

    .description-container {
    position: absolute;
    top: 200px; /* Keep the positioning below the logo */
    left: -80px; /* Align with the logo */
    width: 550px; /* Increased width for landscape */
    height: 300px; /* Set a fixed height for the landscape container */
    background: rgba(255, 255, 255, 0.1); /* Glass effect background */
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(15px);
    z-index: 1; /* Ensure it's above the video */
    margin-left: 250px; /* Align with the logo */
    margin-top: 290px; /* Add spacing from the logo */
}

.description {
    color: #000; /* Black text */
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    line-height: 1.5;
    text-align: left;
}

</style>
