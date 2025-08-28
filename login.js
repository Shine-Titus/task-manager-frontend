let username = document.getElementById('form3Example1c')
let password = document.getElementById('form3Example4c')
let login_btn = document.getElementById('login_btn')

async function Login(username, password) {

    loader.classList.remove('spinner')
    loader.style.removeProperty('display')
    loader.classList.add('d-flex')



    const response = await fetch("https://task-manager-backend-3kaw.onrender.com/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username: username.value, password: password.value })
    });

    if (!response.ok) {
        alert('login failed!')
        return;
    }

    const data = await response.json()
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    window.location.href = 'index.html'
}


login_btn.addEventListener('click', () => { 
    Login(username, password)
})
