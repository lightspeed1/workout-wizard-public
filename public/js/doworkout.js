console.log("ASDASDASDASD");

let badgeMappings = {"beginner" : "success", "intermediate" : "warning", "expert" : "danger"};
let currWorkout = "";
let allWorkouts = {
    "Full-body":[],
    "Push":[{
        "lastWorkout":{weight:[100], reps:[10]},
        "name": "Dumbbell Bench Press",
        "type": "strength",
        "muscle": "chest",
        "equipment": "dumbbell",
        "difficulty": "intermediate",
        "instructions": "Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs. The palms of your hands will be facing each other. Then, using your thighs to help raise the dumbbells up, lift the dumbbells one at a time so that you can hold them in front of you at shoulder width. Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. The dumbbells should be just to the sides of your chest, with your upper arm and forearm creating a 90 degree angle. Be sure to maintain full control of the dumbbells at all times. This will be your starting position. Then, as you breathe out, use your chest to push the dumbbells up. Lock your arms at the top of the lift and squeeze your chest, hold for a second and then begin coming down slowly. Tip: Ideally, lowering the weight should take about twice as long as raising it. Repeat the movement for the prescribed amount of repetitions of your training program.  Caution: When you are done, do not drop the dumbbells next to you as this is dangerous to your rotator cuff in your shoulders and others working out around you. Just lift your legs from the floor bending at the knees, twist your wrists so that the palms of your hands are facing each other and place the dumbbells on top of your thighs. When both dumbbells are touching your thighs simultaneously push your upper torso up (while pressing the dumbbells on your thighs) and also perform a slight kick forward with your legs (keeping the dumbbells on top of the thighs). By doing this combined movement, momentum will help you get back to a sitting position with both dumbbells still on top of your thighs. At this moment you can place the dumbbells on the floor. Variations: Another variation of this exercise is to perform it with the palms of the hands facing each other. Also, you can perform the exercise with the palms facing each other and then twisting the wrist as you lift the dumbbells so that at the top of the movement the palms are facing away from the body. I personally do not use this variation very often as it seems to be hard on my shoulders."
    },
    {
        "name": "Incline Hammer Curls",
        "type": "strength",
        "muscle": "biceps",
        "equipment": "dumbbell",
        "difficulty": "beginner",
        "instructions": "Seat yourself on an incline bench with a dumbbell in each hand. You should pressed firmly against he back with your feet together. Allow the dumbbells to hang straight down at your side, holding them with a neutral grip. This will be your starting position. Initiate the movement by flexing at the elbow, attempting to keep the upper arm stationary. Continue to the top of the movement and pause, then slowly return to the start position."
      }]
};

// allWorkouts = JSON.parse(localStorage.getItem("allWorkouts"));
const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);
let dropdownElement = $("#chooseWorkoutDropdown");
let startButton = $("#startButton");
// let dropdownButton = document.querySelector("#workoutChoice");
let outerDiv = $("#outerDiv");

function checkWorkoutValue()
{
    if(dropdownElement.value == "None")
        startButton.setAttribute("disabled", "");
    else
        startButton.removeAttribute("disabled");
}

function createWorkoutDropdown()
{
    let currHTML = "";
    console.log(allWorkouts);
    for(workout in allWorkouts)
    {
        let disabled = (allWorkouts[workout].length == 0) ? 'disabled' : '';
        currHTML += `<option value="${workout}" ${disabled}>${workout}</option>`;
        //`<li><a class="dropdown-item ${disabled} " onclick="dropdownButton.innerHTML = '${workout}'" >${workout}</a></li>`;
    }
    console.log(dropdownElement, currHTML);
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
    console.log(document.querySelector("#info-modal-content"));
    infoModalContent.innerHTML = exerciseCard;
    return;
}

function createActiveExerciseCard(exerciseObj)
{
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

    yesBtn.onclick = async () =>
    {
        let names = $$(".exerciseName");
        let tables = $$("tbody");
        for(let i = 0; i < names.length; i++)
        {
            let exerciseObj = allWorkouts[currWorkout].find(x => x.name == names[i].innerHTML);
            let rows = Array.from(tables[i].children);
            exerciseObj.lastWorkout = {weight:[], reps:[]};
            console.log("ROWS", rows);
            for(let j = 0; j < rows.length; j++)
            {
                let cols = rows[j].children;
                exerciseObj.lastWorkout.weight.push(cols[1].children[0].value);
                exerciseObj.lastWorkout.reps.push(cols[2].children[0].value);
            }
            // exerciseObj.lastWorkout = rows.map((row) => {
            //     return {
            //         set: cols[0].innerHTML, 
            //         weight: cols[1].children[0].value,
            //         reps: cols[2].children[0].value
            //     }
            // });
            console.log(exerciseObj.lastWorkout);
        }
        console.log(allWorkouts);
        // localStorage.setItem("allWorkouts", JSON.stringify(allWorkouts));
        await storeAllWorkouts();
        window.location.pathname = "/myworkouts";
    } 
    // console.log(JSON.parse(localStorage.getItem("hello")));
    // localStorage.setItem("hello", JSON.stringify([1,2,3]));
    
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

function addSet(exerciseName, addSetBtn)
{
    let exerciseTable = document.querySelector(`.${exerciseName.replace(/ /g, "-")}-card`).querySelector(".table-entries");
    let setNum = 1;
    let numRows = exerciseTable.children.length;
    console.log(numRows);
    if(numRows > 0)
    {
        setNum = Number(exerciseTable.children[numRows - 1].children[0].innerHTML) + 1;
    }
    exerciseTable.insertAdjacentHTML("beforeend", `<tr>
    <th scope='row'>${setNum}</th>
    <td><input type="number" class='form-control weight' value='${0}'></td>
    <td><input type="number" class='form-control reps' value='${0}'></td>
    </tr>`);
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
async function getWorkouts()
{
    let result = await fetch("/getuserworkouts", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });
    allWorkouts = await result.json();
    console.log("ALL", allWorkouts);
}
async function initDoWorkoutPage()
{
    await getWorkouts();
    createWorkoutDropdown();
}

initDoWorkoutPage();