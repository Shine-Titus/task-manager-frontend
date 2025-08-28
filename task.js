const addTask = document.getElementById('add');
const input = document.getElementById('input');
const logout = document.getElementById('logout');
const summarizer = document.getElementById('summarize')
const loader = document.getElementById("spinner")
const summary_area = document.querySelector('p')

if (!localStorage.getItem("refresh")) {
    window.location.href = "login.html";
}

let loadingFlag = false;


function addingTask(text, task_complete, current_task_id) {
    const newDiv = document.createElement("div");
    newDiv.classList.add('task-card');
    newDiv.setAttribute('data-id', current_task_id);

    const taskText = document.createElement('h3');
    taskText.innerText = text;

    if (task_complete === true) {
        taskText.classList.add('completedStyle')
    }

    const button1 = document.createElement('button');
    button1.classList.add('btn', 'btn-success','complete','btn-sm');
    const i1 = document.createElement('i');
    i1.classList.add('fa-solid', 'fa-check')
    button1.appendChild(i1);

    const button2 = document.createElement('button');
    button2.classList.add('btn', 'btn-secondary','delete','btn-sm');
    const i2 = document.createElement('i');
    i2.classList.add('fa-solid', 'fa-trash')
    button2.appendChild(i2);

    newDiv.appendChild(taskText);
    newDiv.appendChild(button1);
    newDiv.appendChild(button2);
    
    var parentDiv = document.getElementById("elements")
    parentDiv.appendChild(newDiv);
    input.value = '';
};

const  refresh_token = async () => {
    const response = await fetch("https://task-manager-backend-3kaw.onrender.com/api/refresh/", {
        method: "POST",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: localStorage.getItem("refresh") })
    })

    if (!response.ok) {
        // refresh token expired → user needs to log in again
        alert("Session expired, please log in again");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login.html";
        return;
    }

    const data = await response.json()
    localStorage.setItem("access", data.access);
}


const summarize_tasks =  async () => {


    loader.classList.remove('spinner')
    loader.style.removeProperty('display')
    loader.classList.add('d-flex')


    const response = await fetch("https://task-manager-backend-3kaw.onrender.com/summarize-tasks/", {
        method: "GET",
        headers: {
            "Authorization" : "Bearer " + localStorage.getItem('access')
        }
    })

    if (!response.ok) {
        alert('cannot summarize tasks')
        return
    }

    const data = await response.json()

    summary_area.textContent = data.summary

    loader.classList.remove('d-flex')
    loader.style.display = 'none'

}

document.addEventListener('DOMContentLoaded', async () => {
    let token = localStorage.getItem('access');

    if (!token) {
        await refresh_token()
        token = localStorage.getItem('access')
    }

    let response = await fetch("https://task-manager-backend-3kaw.onrender.com/view-tasks/", {
        method: "GET",
        headers: {
            "Authorization" : "Bearer " + token
        }
    });

    if (response.status === 401) {
        await refresh_token();
        token = localStorage.getItem('access')
        response = await fetch("https://task-manager-backend-3kaw.onrender.com/view-tasks/", {
            method: "GET",
            headers: {
                "Authorization" : "Bearer " + token
            }
        });
    }

    if (!response.ok) {
        alert('cannot fetch tasks')
        return
    }

    const data = await response.json()
    
    document.getElementById('welcome').textContent = "Welcome, " + data['user']['username']

    summarize_tasks();

    for (let i = 0; i < data['tasks'].length; i++) {
        addingTask(data['tasks'][i].title, data['tasks'][i].completed, data['tasks'][i].id)
    }

})

logout.addEventListener('click' , async () => {
    const refresh = localStorage.getItem('refresh')

    const response = await fetch("https://task-manager-backend-3kaw.onrender.com/api/logout/" , {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh 
        })
    })

    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = 'login.html'

})

document.getElementById("elements").addEventListener("click", async function(event) {
    if (event.target.closest(".complete")) { 

        let task = event.target.closest(".task"); 
        let taskName = task.querySelector("h3");
        let task_id = task.dataset.id;

        if (taskName.classList.contains('completedStyle')) {
            taskName.classList.remove('completedStyle')
        } else {
            taskName.classList.add('completedStyle');
        }
        
        const response = await fetch(`https://task-manager-backend-3kaw.onrender.com/view-tasks/${task_id}/completed/`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('access')}`,
                "Content-Type": "application/json",
            }   
        })

        if (!response.ok) {
            alert('task cannot be marked completed')
            return;
        }
    }
});

document.getElementById("elements").addEventListener("click",  async function(event) {
    if (event.target.closest(".delete")) { 
        let task = event.target.closest(".task");
        let task_id = task.dataset.id;
        task.remove();

        const response = await fetch(`https://task-manager-backend-3kaw.onrender.com/view-tasks/${task_id}/`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('access')}`,
                "Content-Type": "application/json",
            }   
        })

        if (!response.ok) {
            alert('task cannot be deleted')
            return;
        }

    }
});


addTask.addEventListener('click', async () => {

    const response = await fetch("https://task-manager-backend-3kaw.onrender.com/create-tasks/", {
        method: "POST",
        headers: {
            "Authorization" : "Bearer " + localStorage.getItem('access'),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title : input.value,
        })
    })

    if (!response.ok) {
        alert('could not add task')
        return
    }

    const data = await response.json()
    addingTask(input.value, data.completed, data.id);

});

input.addEventListener('keyup', async (event) => {
    if (event.key === 'Enter') {

        const response = await fetch("https://task-manager-backend-3kaw.onrender.com/create-tasks/", {
            method: "POST",
            headers: {
                "Authorization" : "Bearer " + localStorage.getItem('access'),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title : input.value,
            })
        })

    if (!response.ok) {
        alert('could not add task')
        return
    }

    const data = await response.json()
    event.preventDefault();
    addingTask(input.value,data.completed, data.id);
    
    }

});

// summarize tasks
summarizer.addEventListener('click' , () => {

    summary_area.textContent = ''
    summarize_tasks();

})