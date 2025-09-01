const addTask = document.getElementById('add');
const input = document.getElementById('input');
const logout = document.getElementById('logout');
const summarizer = document.getElementById('summarize')
const loader = document.getElementById("spinner")
const summary_area = document.querySelector('p')
const search_box = document.getElementById('search')
const task_list = document.getElementById('elements')

const BASE_URL = "http://127.0.0.1:8000"

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
    button1.classList.add('btn', 'btn-success','complete','btn-sm', 'me-2');
    const i1 = document.createElement('i');
    i1.classList.add('fa-solid', 'fa-check')
    button1.appendChild(i1);

    const button2 = document.createElement('button');
    button2.classList.add('btn', 'btn-secondary','delete','btn-sm');
    const i2 = document.createElement('i');
    i2.classList.add('fa-solid', 'fa-trash')
    button2.appendChild(i2);

    const nested_div = document.createElement('div')
    nested_div.appendChild(button1);
    nested_div.appendChild(button2);

    newDiv.appendChild(taskText);
    newDiv.appendChild(nested_div);
    
    var parentDiv = document.getElementById("elements")
    parentDiv.appendChild(newDiv);
    input.value = '';
};

const  refresh_token = async () => {
    const response = await fetch(`${BASE_URL}/api/refresh/`, {
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


const fetch_tasks = async (query='') => {

    let token = localStorage.getItem('access');

    if (!token) {
        await refresh_token()
        token = localStorage.getItem('access')
    }


    let response = await fetch(`${BASE_URL}/view-tasks/?search=${query}`, {
        method: "GET",
        headers: {
            "Authorization" : "Bearer " + token
        }
    });

    if (response.status === 401) {
        await refresh_token();
        token = localStorage.getItem('access')
        response = await fetch(`${BASE_URL}/view-tasks/`, {
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

    task_list.innerHTML = ''

    for (let i = 0; i < data['tasks'].length; i++) {
        addingTask(data['tasks'][i].title, data['tasks'][i].completed, data['tasks'][i].id)
    }

    return data
}
    

const summarize_tasks =  async () => {


    loader.classList.remove('spinner')
    loader.style.removeProperty('display')
    loader.classList.add('d-flex')


    const response = await fetch(`${BASE_URL}/summarize-tasks/`, {
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

    let data =  await fetch_tasks();
    document.getElementById('welcome').textContent = "Welcome, " + data['user']['username']
    summarize_tasks();

})

logout.addEventListener('click' , async () => {
    const refresh = localStorage.getItem('refresh')

    await fetch(`${BASE_URL}/api/logout/` , {
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

        let task = event.target.closest(".task-card"); 
        let taskName = task.querySelector("h3");
        let task_id = task.dataset.id;

        if (taskName.classList.contains('completedStyle')) {
            taskName.classList.remove('completedStyle')
        } else {
            taskName.classList.add('completedStyle');
        }
        
        const response = await fetch(`${BASE_URL}/view-tasks/${task_id}/completed/`, {
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
        let task = event.target.closest(".task-card");
        let task_id = task.dataset.id;
        task.remove();

        const response = await fetch(`${BASE_URL}/view-tasks/${task_id}/`, {
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

    const response = await fetch(`${BASE_URL}/create-tasks/`, {
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

        const response = await fetch(`${BASE_URL}/create-tasks/`, {
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


// search for tasks
let timer
search_box.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        fetch_tasks(e.target.value);
    }, 300); // wait 300ms after typing stops
});