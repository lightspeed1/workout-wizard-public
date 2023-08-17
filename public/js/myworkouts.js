
const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);
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
    }]
};
// allWorkouts = JSON.parse(localStorage.getItem("allWorkouts"));
// allWorkouts = {};
async function getWorkouts()
{
    let result = await fetch("/getuserworkouts", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });
    console.log(result, result.body);
    allWorkouts = await result.json();
    console.log("ALL", allWorkouts);
}

// await getWorkouts();

let workoutNameInput = document.querySelector("#workoutNameInput");
let newWorkoutModal = document.querySelector("#newWorkoutModal");


async function storeAllWorkouts()
{
    // localStorage.setItem("allWorkouts", JSON.stringify(allWorkouts));
    
    //first we create the modified allWorkouts object that only has workout names, exercise names, and weight and reps

    // let modedObj = JSON.parse(JSON.stringify(allWorkouts));
    // for(i in modedObj)
    // {
    //     let currWorkout = modedObj[i];
    //     for(let j = 0; j < currWorkout.length; j++)
    //         currWorkout[j] = {"name": currWorkout[j].name, "lastWorkout": currWorkout[j].lastWorkout};
    // }
    // console.log("MODED: ", modedObj);
    // console.log("ALL", allWorkouts);
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

//creates a new workout object and card to be displayed
function newWorkout(workoutName) {
            
    if(!workoutName || workoutName in allWorkouts)
    {
        return;
    }
    allWorkouts[workoutName] = [];
    // workoutNameInput.value = "";
    let newCardHTML = createWorkoutCard(workoutName);
    let allWorkoutsContainer = document.querySelector("#all-workouts");
    allWorkoutsContainer.insertAdjacentHTML("beforeend", newCardHTML);
    let modalElement = document.querySelector("#newWorkoutModal");
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
    console.log("NEWNEW");
    storeAllWorkouts();
}

//completely deletes a workout including the workout object and the html card
function removeWorkout(workoutName, workoutElementID)
{
    document.querySelector("#removedItemName").innerHTML = workoutName;
    document.querySelector("#removeItemBtn").onclick = () => {
        delete allWorkouts[workoutName];
        document.querySelector(workoutElementID).remove();
        storeAllWorkouts();
    };
}

//
function addExercise(workoutName, exerciseObj, addCard, buttonElement) {
    console.log("STARTING");
    if(buttonElement)
        buttonElement.setAttribute("disabled", "");
    exerciseObj.lastWorkout = {weight:[], reps:[]};
    allWorkouts[workoutName].push(exerciseObj);

    if(addCard)
    {
        console.log("ADDING");
        let workoutContainer = document.querySelector(`#${workoutName}-exercises`);
        console.log(workoutContainer);
        let newCardHTML = createUsedExerciseCard(exerciseObj);
        console.log(newCardHTML);
        workoutContainer.insertAdjacentHTML("beforeend" , newCardHTML);
    }
    storeAllWorkouts();
}
// function removeExercise(workoutName, exerciseName) {
//     allWorkouts[workoutName].splice(allWorkouts[workoutName].findIndex(obj => obj === exerciseName));
// }
const apiKey = "KEY";
//this function calls the exercises api with parameters for name, type, muscle, and difficulty
async function getExercises(name, type, muscle, difficulty, offset)
{
    let url = `https://api.api-ninjas.com/v1/exercises?name=${name}&type=${type}&muscle=${muscle}&difficulty=${difficulty}&offset=${offset}`;
    let response = await fetch(url, {headers:{"X-Api-Key": apiKey}});
    let responseJson = await response.json();
    for(let i = 0; i < responseJson.length; i++)
    {
        responseJson[i].instructions = responseJson[i].instructions.replaceAll("'", "&#39;");
        console.log(responseJson[i].instructions);
    }
    console.log(responseJson);
    return responseJson;
}
//creates the html for an exercise card as it should appear under a workout
function createUsedExerciseCard(exerciseObj)
{
    exerciseObj.instructions = exerciseObj.instructions.replaceAll("'", "&#39;");
    let tableHTML = "";
    let collapseElementID = `${exerciseObj.name.replace(/ /g, "-")}-last-workout-table`;
    if(exerciseObj.lastWorkout.weight.length > 0)
    {
        let tableEntries = "";
        for(let j = 0; j < exerciseObj.lastWorkout.weight.length; j++)
        {
            tableEntries += 
            `<tr>
                <th scope='row'>${j+1}</th>
                <td>${exerciseObj.lastWorkout.weight[j]}</td>
                <td>${exerciseObj.lastWorkout.reps[j]}</td>
            </tr>`;
        }
        tableHTML = 
        `<div class="collapse " id="${collapseElementID}">
            <hr>
            <div class="h5">Last Workout</div>
            <div class="container border-start">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th scope='col'>Set #</th>
                            <th scope='col'>Weight (lbs)</th>
                            <th scope='col'>Reps</th>
                        </tr>
                    </thead>
                    <tbody>${tableEntries}</tbody>
                </table>
            </div>
        </div>`;
    }
    let currHTML = 
    `<div class="card card-body">
        <div class="hstack gap-2">
            <div class="text-primary fw-bold h4 m-0">${exerciseObj.name}</div>
            <div class="border-1 border border-dark-subtle rounded rounded-circle p-1 bg-${badgeMappings[exerciseObj.difficulty]}"></div>
            <button class="ms-auto btn btn-danger bi bi-trash px-2 py-0 fs-4"
            data-bs-toggle="modal" data-bs-target="#removeModal" onclick="deleteExercise(this, '${currWorkout}', '${exerciseObj.name}')"></button>
            <button class="btn btn-primary bi bi-info px-2 py-0 fs-4" data-bs-toggle="modal" data-bs-target="#infoModal" onclick='setInfoModal(${JSON.stringify(exerciseObj)})'></button>
            ${(tableHTML != "") ? `<button class="collapse-btn btn bi-chevron-down btn-light border" data-bs-toggle="collapse" data-bs-target="#${collapseElementID}"> <span class="d-none d-md-inline">Last Workout</span></button>` : ""} 
        </div>
                
        ${tableHTML}
    </div>`;
    return(currHTML);
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
//removes an exercise object and html card associated with it
function deleteExercise(buttonElement, workoutName, exerciseName)
{
    let exerciseCard = buttonElement.parentElement.parentElement;
    document.querySelector("#removeItemBtn").onclick = function(e) {
        exerciseCard.remove();
        // removeExercise(workoutName, exerciseName);
        allWorkouts[workoutName] = allWorkouts[workoutName].filter(obj => obj.name !== exerciseName);
        storeAllWorkouts();
    };
    document.querySelector("#removedItemName").innerHTML = exerciseName;
}

//this function create html for exercises as they should appear under a workout and returns it as a string
function createWorkoutCard(workoutName)
{
    //onclick="removeWorkout('${workoutName}', '#${boxId}')"
    let boxId = `${workoutName}-workout-box`;
    let exerciseList = `
    <div id="${boxId}" >
        <div class="border-2 h3 p-1 rounded bg-black text-white d-flex justify-content-between">
            <div class="d-inline-block">${workoutName}</div>
            <button class="btn bi-trash btn-dark fs-2 px-2 py-0" data-bs-toggle="modal" data-bs-target="#removeModal" onclick="removeWorkout('${workoutName}', '#${boxId}')"></button>
        </div>
        
        <div class="container" id="${workoutName}-exercises"> 
    `;

    for(let i = 0; i < allWorkouts[workoutName].length; i++)
    {
        currWorkout = workoutName;
        exerciseList += createUsedExerciseCard(allWorkouts[workoutName][i]);
    }
    exerciseList += `
    </div> 
    `;
    exerciseList += `
    <button  class="btn btn-outline-dark px-5 mx-auto d-block my-2" data-bs-target="#searchModal" data-bs-toggle="modal" onclick="clickAddExercise('${workoutName}')">Add exercise</button>
    </div>
    `;
    return(exerciseList);
}

let pageNum = 0;

//clears the search results when looking for exercises
function clearSearchResults()
{
    console.log("CLEARING SEARCH RESULTS");
    let resultsContainer = document.querySelector("#js-results-container");
    $("#next").classList.add("disabled");
    $("#previous").classList.add("disabled");
    pageNum = 0;
    $("#page-num").innerHTML = pageNum;
    resultsContainer.innerHTML = "";
}


//sets the global currWorkout variable to the workout which corresponds to whichever "Add exercise" button was just clicked. Also clears the search results in the search modal
function clickAddExercise(workoutName)
{
    clearSearchResults();
    pageNum = 0;
    currWorkout = workoutName;
}
//creates the html for an exercise card as it should appear in the search menu
function createExerciseInfoCard(exerciseObj, addButton, buttonDisabled)
{
    exerciseObj.instructions = exerciseObj.instructions.replaceAll("'", "&#39;");
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
            ${addButton ? `<div class="card-footer"><button class="btn btn-success" onclick='addExercise(currWorkout, ${JSON.stringify(exerciseObj)}, true, this)' ${allWorkouts[currWorkout].find(o => o.name == exerciseObj.name) ? 'disabled' : ''}>Add to List</button></div>` : ''}
            
        </div>
        `);
}

let searchTerms = {};
//this function gets the value in all the input fields and calls getExercises with these values
async function searchClicked(pageChoice)
{
    if(pageChoice == 0)
    {
        pageNum = 1;
        searchTerms.nameValue = document.querySelector("#name-input").value;
        searchTerms.typeValue = document.querySelector("#type-input").value;
        searchTerms.muscleValue = document.querySelector("#muscle-input").value;
        searchTerms.difficultyValue = document.querySelector("#difficulty-input").value;
    }
    else if(pageChoice == -1)
        pageNum -= 1;
    else if(pageChoice == 1)
        pageNum += 1;
    let queryOffset = (pageNum - 1) * 10;
    console.log("SEARCHING");
    let results = await getExercises(searchTerms.nameValue, searchTerms.typeValue, searchTerms.muscleValue, searchTerms.difficultyValue, queryOffset);
    console.log("RESULTS: ", results);
    //now insert the result json into the search result container
    let resultsContainer = document.querySelector("#js-results-container");
    resultsContainer.innerHTML = "";
    for(let i = 0; i < results.length; i++)
    {
        const r = results[i];
        console.log(resultsContainer);
        resultsContainer.insertAdjacentHTML("beforeend", createExerciseInfoCard(r, true));
    }

    $("#page-num").innerHTML = pageNum;

    if(results.length == 0)
        $("#next").classList.add("disabled");
    else
        $("#next").classList.remove("disabled");    
    
    if(pageNum == 1)
        $("#previous").classList.add("disabled");
    else
        $("#previous").classList.remove("disabled");
    }
    
    //Filters the results of a dropdown based on user input
function filterTextBox(myEvent)
{
    const optionsElements = this.parentElement.querySelector(".js-options").children;
    const myRegex = RegExp("^" + this.value.toLowerCase());
    //now search list for things that match regex and unhide then, hide everything else.
    for(let i = 0; i < optionsElements.length; i++)
    {
        let currStr = optionsElements[i].innerText.toLowerCase();
        if(currStr.match(myRegex))
        {
            optionsElements[i].hidden = false;
        }
        else
        {
            optionsElements[i].hidden = true;
        }
    }

}

//fills an input box with the text of dropdown item below it.
function fillInput(thisElement)
{
    let inputBox = thisElement.parentElement.parentElement.parentElement.querySelector(".js-input");
    inputBox.value = thisElement.innerText;
}
//Add event listeners to dropdown text boxes
const muscle = ["abdominals", "abductors", "adductors", "biceps", "calves", "chest", "forearms","glutes", "hamstrings", "lats", "lower_back", "middle_back", "neck", "quadriceps","traps", "triceps"];
const type = ["cardio", "olympic_weightlifting", "plyometrics", "powerlifting", "strength", "stretching", "strongman"];
const difficulty = ["beginner", "intermediate", "expert"];
const allOptions = [muscle, type, difficulty, []];
const allOptionsNames = ["muscle","type", "difficulty", "name"];


let jsTextboxes = document.querySelector("#js-textboxes");


async function initPage()
{
    await getWorkouts();
    console.log("DONE!!!");
    
    let allWorkoutsHTML = "";
    for(workoutName in allWorkouts)
    {
        console.log("E")
        allWorkoutsHTML += createWorkoutCard(workoutName);
    }
    const allWorkoutsContainer = document.querySelector("#all-workouts");
    allWorkoutsContainer.insertAdjacentHTML("beforeend", allWorkoutsHTML);

    console.log(allWorkouts);
    workoutNameInput.addEventListener("input", function(e)
    {
        let elt = e.target;
        if(!elt.value || elt.value in allWorkouts)
            elt.classList.add("is-invalid");
        else
            elt.classList.remove("is-invalid");
    });
    newWorkoutModal.addEventListener("hide.bs.modal", function(e)
    {
        workoutNameInput.value = "";
    });

    for(let i = 0; i < allOptions.length; i++)
    {
        let cName = allOptionsNames[i];
        let hasOptions = allOptionsNames[i] == "name" ? "hidden" : "";
        jsTextboxes.insertAdjacentHTML("afterbegin",
            `<div class="form-floating dropdown">
                <input  id="${cName}-input" class="js-input form-control dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" placeholder="${cName}">
                <label for="${cName}-input">${cName}</label>
                <ul id="${cName}-options" class="dropdown-menu js-options" ${hasOptions}>
                </ul>
            </div>`
        );
        if(hasOptions == "hidden")
        {
            continue;
        }

        const currList = document.querySelector(`#${allOptionsNames[i]}-options`);
        const currInput = document.querySelector(`#${allOptionsNames[i]}-input`);
        console.log(currInput);
        currInput.addEventListener("input", filterTextBox);
        for(let j = 0; j < allOptions[i].length; j++)
        {
            currList.innerHTML += `<li><button onclick='fillInput(this)' class='dropdown-item'>${allOptions[i][j]}</button></li>`;
        }
    }
    const submitButton = document.querySelector("#js-submit");
    // submitButton.addEventListener("click", searchClicked);
}
initPage();