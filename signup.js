let username = document.getElementById('form3Example1c')
let password = document.getElementById('form3Example4c')
let register_btn = document.getElementById('register_btn')

async function Register(username, password) {
    const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username: username.value, password: password.value })
    });

    if (!response.ok) {
        alert('registeration failed!')
        return;
    }

    const data = await response.json()
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    window.location.href = 'login.html'
}

register_btn.addEventListener('click', () => { 
    Register(username, password)
})

