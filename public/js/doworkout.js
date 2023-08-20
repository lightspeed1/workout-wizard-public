//This JS handles all code on the doworkout page, where a user executes a workout and fills out sets and reps textboxes for each exercise.

let badgeMappings = {"beginner" : "success", "intermediate" : "warning", "expert" : "danger"};
let currWorkout = "";
let allWorkouts = {};

//defining query selector shorthands
const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);
let dropdownElement = $("#chooseWorkoutDropdown");
let startButton = $("#startButton");
let outerDiv = $("#outerDiv");


function checkWorkoutValue()
{
    if(dropdownElement.value == "None")
        startButton.setAttribute("disabled", "");
    else
        startButton.removeAttribute("disabled");
}

//Creates Bootstrap card for workout information and fields (sets and reps for each exercise)
function createWorkoutDropdown()
{
    let currHTML = "";
    for(workout in allWorkouts)
    {
        let disabled = (allWorkouts[workout].length == 0) ? 'disabled' : '';
        currHTML += `<option value="${workout}" ${disabled}>${workout}</option>`;
    }
    dropdownElement.insertAdjacentHTML("beforeend", currHTML);
}

//creates the html for an exercise card as it should appear in the search menu
function createExerciseInfoCard(exerciseObj, addButton, buttonDisabled)
{
    return(`
        <div class="card my-2 mx-1">
            <div class="card-header">
                <div class="hstack gap-3">
                    <h3 class="card-title">${exerciseObj.name}</h3>
                    <div class="badge text-bg-${badgeMappings[exerciseObj.difficulty]}">${exerciseObj.difficulty}</div>
                    <div class="vr"></div>
                </div>
            </div>
            <div class="card-body">
                <div class="hstack">
                    <div class="vstack border border-2 rounded">
                        <div class="text-center">Muscle:</div>
                        <div class="text-center">${exerciseObj.muscle}</div>
                    </div>
                    <div class="vstack border border-2 rounded">
                        <div class="text-center">Equipment:</div>
                        <div class="text-center">${exerciseObj.equipment}</div>
                    </div>
                    <div class="vstack border border-2 rounded">
                        <div class="text-center">Type:</div>
                        <div class="text-center">${exerciseObj.type}</div>
                    </div>
                </div>
                <hr>
                <div class="card-text">${exerciseObj.instructions}</div>
            </div>
            ${addButton ? `<div class="card-footer"><button class="btn btn-success" onclick="addExercise(currWorkout, ${JSON.stringify(exerciseObj)}, true, this)" ${allWorkouts[currWorkout].find(o => o.name == exerciseObj.name) ? 'disabled' : ''}>Add to List</button></div>` : ''}
        </div>
        `);
}


//This writes the data of an exercise object to the info modal, which will soon be displayed to the user
function setInfoModal(exerciseObj)
{
    let exerciseCard = createExerciseInfoCard(exerciseObj, false);
    let infoModalContent = document.querySelector("#info-modal-content");
    infoModalContent.innerHTML = exerciseCard;
    return;
}


//Creates special Bootstrap HTML for exercises in the current workout being done
function createActiveExerciseCard(exerciseObj)
{
    //Create table which then goes inside Bootstrap card
    let tableHTML = `
    <div class="workout-table">
        <hr>
        <div class="container border-start">
        <table class="table table-striped">
        <thead>
        <tr>
        <th scope='col'>Set #</th>
        <th scope='col'>Weight (lbs)</th>
        <th scope='col'>Reps</th>
        </tr>
        </thead>
        <tbody class="table-entries"></tbody>
        </table>
        </div>
    </div>`;
    if(exerciseObj.lastWorkout.weight.length > 0)
    {
        let tableEntries = "";
        //Each set gets an entry in the table
        for(let j = 0; j < exerciseObj.lastWorkout.weight.length; j++)
        {
            tableEntries += 
            `<tr>
            <th scope='row'>${j+1}</th>
            <td><input type="number" class='form-control weight' value='${exerciseObj.lastWorkout.weight[j]}'></td>
            <td><input type="number" class='form-control reps' value='${exerciseObj.lastWorkout.reps[j]}'></td>
            </tr>`;
        }
        tableHTML = 
        `<div class="workout-table">
        <hr>
        <div class="container border-start">
        <table class="table table-striped">
        <thead>
        <tr>
        <th scope='col'>Set #</th>
        <th scope='col'>Weight (lbs)</th>
        <th scope='col'>Reps</th>
        </tr>
        </thead>
        <tbody class="table-entries">${tableEntries}</tbody>
        </table>
        </div>
        </div>`;
    }
    let currHTML = 
    `<div class="card card-body exerciseCard ${exerciseObj.name.replace(/ /g, "-")}-card">
        <div class="hstack gap-2">
            <div class="text-primary fw-bold h4 m-0 exerciseName">${exerciseObj.name}</div>
            <div class="border-1 border border-dark-subtle rounded rounded-circle p-1 bg-${badgeMappings[exerciseObj.difficulty]}"></div>
            <button class="btn btn-primary bi bi-info px-2 py-0 fs-4" data-bs-toggle="modal" data-bs-target="#infoModal" onclick='setInfoModal(${JSON.stringify(exerciseObj)})'></button>
        </div>
    
    ${tableHTML}
        <button class="btn btn-dark mt-3" id="addSet" onclick="addSet('${exerciseObj.name}', this)">Add Set</button>
        <button class="btn btn-outline-danger mt-3" onclick="removeSet('${exerciseObj.name}', this)"> Remove Set</button>
    </div>`;
    return(currHTML);
}


//Saves new sets and reps information for each exercise in the active workout.
async function storeAllWorkouts()
{
    let bodyJson = JSON.stringify(allWorkouts);
    console.log("STORING");
    let response = await fetch("/updateworkouts", {
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: bodyJson
    });

}

function finishWorkout()
{
    let endModal = $("#endModal");
    let yesBtn = endModal.querySelector("#endWorkoutBtn");
    endModal.querySelector(".modal-title").innerHTML = "Complete Workout";
    endModal.querySelector("#actionName").innerHTML = "complete";
    yesBtn.classList.remove("btn-danger");
    yesBtn.classList.add("btn-success");

    //"Yes" button needs extra functionality to save the workout info in the database
    yesBtn.onclick = async () =>
    {
        let names = $$(".exerciseName");
        let tables = $$("tbody");
        for(let i = 0; i < names.length; i++)
        {
            let exerciseObj = allWorkouts[currWorkout].find(x => x.name == names[i].innerHTML);
            let rows = Array.from(tables[i].children);
            exerciseObj.lastWorkout = {weight:[], reps:[]};
            for(let j = 0; j < rows.length; j++)
            {
                let cols = rows[j].children;
                exerciseObj.lastWorkout.weight.push(cols[1].children[0].value);
                exerciseObj.lastWorkout.reps.push(cols[2].children[0].value);
            }
        }
        await storeAllWorkouts();
        window.location.pathname = "/myworkouts";
    } 
}

function cancelWorkout()
{
    let endModal = $("#endModal");
    let yesBtn = endModal.querySelector("#endWorkoutBtn");
    endModal.querySelector(".modal-title").innerHTML = "Cancel Workout";
    endModal.querySelector("#actionName").innerHTML = "cancel";
    yesBtn.classList.add("btn-danger");
    yesBtn.classList.remove("btn-success");

    yesBtn.onclick = () =>
    {
        location.reload();
    }
}

//Add a set to an exercise. Maximum 10 sets allowed per exercise to avoid bloat.
function addSet(exerciseName, addSetBtn)
{
    let exerciseTable = document.querySelector(`.${exerciseName.replace(/ /g, "-")}-card`).querySelector(".table-entries");
    let setNum = 1;
    let numRows = exerciseTable.children.length;
    if(numRows > 0)
    {
        setNum = Number(exerciseTable.children[numRows - 1].children[0].innerHTML) + 1;
    }
    exerciseTable.insertAdjacentHTML("beforeend", `<tr>
    <th scope='row'>${setNum}</th>
    <td><input type="number" class='form-control weight' value='${0}'></td>
    <td><input type="number" class='form-control reps' value='${0}'></td>
    </tr>`);

    //Max 10 sets
    if(setNum >= 10)
    {
        addSetBtn.setAttribute("disabled", "true");
    }
}

function removeSet(exerciseName, removeSetBtn)
{
    let exerciseTable = document.querySelector(`.${exerciseName.replace(/ /g, "-")}-card`).querySelector(".table-entries");
    let numRows = exerciseTable.children.length;
    if(exerciseTable.children.length)
    {
        let row = exerciseTable.children[numRows - 1];
        row.remove();
    }
    if(numRows-1 < 10)
    {
        removeSetBtn.parentElement.querySelector("#addSet").removeAttribute("disabled");
    }
}

//Creates Bootstrap HTML for a whole workout and adds it to the webpage
function startWorkout()
{
    currWorkout = dropdownElement.value;
    outerDiv.innerHTML = "";
    let currHTML = `
        <h1>Workout</h1>
        <div class="exercisesContainer">`;
    for(exercise of allWorkouts[currWorkout])
    {
        currHTML += createActiveExerciseCard(exercise);
    }
    currHTML += `
        </div>
        <button class="btn btn-success my-3 mx-auto d-block fs-5" onclick="finishWorkout();" data-bs-toggle="modal" data-bs-target="#endModal">Finish Workout</button>
        <button class="btn btn-danger mx-auto d-block fs-5" onclick="cancelWorkout();" data-bs-toggle="modal" data-bs-target="#endModal">Cancel Workout</button>`;

    outerDiv.innerHTML = currHTML;
}

//Send request to server to get all workouts the user has saved
async function getWorkouts()
{
    let result = await fetch("/getuserworkouts", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });
    allWorkouts = await result.json();
}
async function initDoWorkoutPage()
{
    await getWorkouts();
    createWorkoutDropdown();
}

initDoWorkoutPage();