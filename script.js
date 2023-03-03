import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAdbu_yPlF2HeTijpZ6fvateG1n8-UcOc",
    authDomain: "final-project-f544c.firebaseapp.com",
    projectId: "final-project-f544c",
    storageBucket: "final-project-f544c.appspot.com",
    messagingSenderId: "561607433760",
    appId: "1:561607433760:web:30c3d825235959bea72645"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// =======================================================
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    updateDoc,
    where,
    query,
    orderBy,
} from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';


const db = getFirestore();
const usersRef = collection(db, 'users');

var userMap = "";
var userID = "";

var tasksData = {};
var tasksDataList = [];
var subjectsMap = {};
var invTask = [];

var t; // setInterval
var animate;

var homeStatus = true;

async function getData() {
    tasksData = {};
    tasksDataList = [];
    subjectsMap = {};
    var html = `<li>
                    <a class="link-container" id="due-date-link-container" href="#" onclick="showDueDatePage()">
                        <i class='bx bx-copy-alt'></i>
                        <div class="link_name-container">
                            <span class="link_name">Due Date</span>
                        </div>
                    </a>
                </li>
                `;

    const items = await getDocs(query(collection(db, 'users/'+userID+'/subjects'), orderBy("name")));

    if (items) {
        const subjects = items.docs.map((item) => ({
            docId: item.id,
            ...item.data(),
        }));


        for (var eachItems of subjects) {

            html += `
            <li>
            <div class="iocn-link">
                <a class="link-container" href="#">
                    <i class='bx bx-grid-alt' ></i>
                    <div class="link_name-container">
                        <span class="link_name">${eachItems.name}</span>
                    </div>
                </a> 
                <i class='bx bx-chevron-down arrow'></i>
            </div>
            <ul class="sub-menu">
                <li>
            `;


            subjectsMap[eachItems.name] = eachItems.docId;
            const tasksRef = collection(db, 'users/'+userID+'/subjects/'+eachItems.docId+'/tasks');
            const tasks = await getDocs(query(tasksRef,orderBy("due_date")));

            if (tasks) {
                const tasksMap = tasks.docs.map((item) => ({
                    docId: item.id,
                    ...item.data(),
                }));

                eachItems["tasks"] = tasksMap;

                var eachSubMap = {"name": eachItems.name, "tasks": {}};

                for (const eachTask of tasksMap) {
                    html += `<a href="#">
                                <div class="sub-menu-link" onclick="showData(this,'${eachItems.docId}','${eachTask.docId}')">
                                    <div class="sub-menu-link-name">${eachTask.name}</div>
                                </div>
                            </a>`;
                    eachSubMap["tasks"][eachTask.docId] = eachTask;
                }

                tasksData[eachItems.docId] = eachSubMap;
            }

            html += `
                    </li>
                </ul> 
            </li>
            `;
        }
        tasksDataList = subjects;
    }

    html += `
            <li>         
                    <div class="profile_detail">
                        <div class="profile_content">
                            <img src="https://www.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png" alt="profile">
                        </div>
                        <div class="profile_name">
                            <div class="name">${userMap.display}</div>
                            <div class="lastName">${userMap.username}</div>
                        </div>
                        <i class='bx bx-log-out' onclick="logout()"></i>
                    </div>

                </li>   
            `;

    document.getElementsByClassName("nav-link")[0].innerHTML = html;
    arrowFunction();
    await buildInvTask();
}

async function showData(element ,subjectID, taskID) {
    checkShowHome();
    homeStatus = true;

    console.log("Clicked")
    if (document.getElementsByClassName("active").length > 0){
        document.getElementsByClassName("active")[0].classList.remove("active");
    }
    element.classList.add("active");
    document.getElementById("description-container").style.display = "block";
    const docRef = await getDoc(doc(db, 'users/'+userID+'/subjects/'+subjectID+'/tasks/'+taskID));

    if (docRef) {
        clearInterval(t);
        const docMap = docRef.data();

        console.log(docMap);

        document.getElementsByClassName("text")[0].innerHTML = docMap.name;
        document.getElementById("description").innerHTML = docMap.description;

        
        buildEachTable(subjectID, taskID, docMap);
        t = setInterval( function() { buildEachTable(subjectID, taskID, docMap); }, 1000);

        var fx = `showEdit('${subjectID}', '${taskID}')`;
        document.getElementById("editButton").setAttribute("onclick", fx);
        document.getElementById("deleteButton").setAttribute("onclick", `showDelete('${subjectID}', '${taskID}')`);
        document.getElementById("verifyButton").setAttribute("onclick", `submitCheck('${subjectID}', '${taskID}')`);
        

        if (!(tasksData[subjectID].tasks)[taskID].isDone) {
            document.getElementById("verifyButton").classList.remove("completed");
            document.getElementById("verifyButton").innerText = "Finish";
            document.getElementById("verifyButton").style.backgroundColor = "#2b294b";
        }
        else {
            document.getElementById("verifyButton").classList.add("completed");
            document.getElementById("verifyButton").innerText = "Return"
            document.getElementById("verifyButton").style.backgroundColor = "#094d14";
        }

        document.getElementById("editButton").disabled = false;
        document.getElementById("deleteButton").disabled = false;
        document.getElementById("verifyButton").disabled = false;
        document.getElementById("editButton").style.display = "inline-block";
        document.getElementById("deleteButton").style.display = "inline-block";
        document.getElementById("verifyButton").style.display = "inline-block";
        document.getElementById("verifyButton").classList.remove("button-disable");
        document.getElementById("editButton").classList.remove("button-disable");
        document.getElementById("deleteButton").classList.remove("button-disable");

        document.getElementsByClassName("checkbox-container")[0].style.display = "none";
    }

    
}

async function buildEachTable(subjectID, taskID, docMap) {
    const nowTimestamp = Date.now();
    var html = `
            <tr style="background: ${backgroundTimeDiff(docMap.due_date, nowTimestamp, docMap.isDone)}">
                <td>${await dateFormat(docMap.due_date)}</td>
                <td>${docMap.name}</td>
                <td>${tasksData[subjectID].name}</td>
                <td>${timeDiff(docMap.due_date, nowTimestamp, docMap.isDone)}</td>
            </tr>
            `;
        
        document.getElementById("table-body").innerHTML = html;
}

async function addData() {
    console.log('addData');

    const name = "Valorant";
    const due_date = new Date(2022, 6, 20, 15, 30, 0);
    const description = "Test for adding FIRST tasks of this subject";

    addDoc(collection(db, 'users/'+userID+'/subjects/2G2uP41w8CEaQnzohdXA/tasks'), {
        name,
        due_date,
        description,
    });
}


async function addSubject(name) {
    console.log('addSubject');

    addDoc(collection(db, 'users/'+userID+'/subjects'), {
        name,
    });
}


async function deleteData(subjectID, taskID) {
    console.log('deleteData');

    const docRef = doc(db, 'users/'+userID+'/subjects/'+subjectID+'/tasks/'+taskID);

    await deleteDoc(docRef);
}


async function deleteSubject(subjectID) {
    console.log('deleteSubject');

    const docRef = doc(db, 'users/'+userID+`/subjects/`+subjectID);

    await deleteDoc(docRef);
}

function setCredential(username, password, display) {
    if (window.PasswordCredential) {
        var cred = new PasswordCredential({
            id: username,
            password: password,
            name: display,
            });
        
        navigator.credentials.store(cred);
    }

}

async function login(username, password) {
    if (!username.match("^[A-Za-z0-9!@^&*-_]+$")) {
        return false;
    }
    if (!password.match("^[A-Za-z0-9!@^&*-_]+$")) {
        return false;
    }
    var hashPass = await hashing(password);
    const users = await getDocs(query(query(collection(db, 'users'), where("username", "==", username)), where("password", "==", hashPass)));
    if (users) {
        const usersList = users.docs.map((item) => ({
            docId: item.id,
            ...item.data(),
        }));

        if (usersList.length === 1) {
            userMap = usersList[0];
            userID = usersList[0].docId;
            console.log(userID);
            return true;
        }
    
    }
    console.log("Failed");
    return false;

}

async function submitRegister() {
    const username = document.getElementById("registerUsername").value;
    const display = document.getElementById("registerDisplay").value;
    const password = document.getElementById("registerPassword").value;
    const cpassword = document.getElementById("registerCPassword").value;
    var isValid = true
    if ((username.length < 5)||(!username.match("^[A-Za-z0-9!@^&*-_]+$"))) {
        console.log("Username Failed");
        document.getElementById("regisUsernameWarningText").style.display = "block";
        isValid = false;
    }
    else {
        document.getElementById("regisUsernameWarningText").style.display = "none";
    }
    if ((password.length < 5)||(!password.match("^[A-Za-z0-9!@^&*-_]+$"))) {
        console.log("Password must contain 5 characters or more");
        document.getElementById("regisPasswordWarningText").style.display = "block";
        isValid = false;
    }
    else {
        document.getElementById("regisPasswordWarningText").style.display = "none";
    }
    if(password != cpassword){
        console.log("Password doesn't match")
        document.getElementById("regisCPasswordWarningText").style.display = "block";
        isValid = false;
    }
    else {
        document.getElementById("regisCPasswordWarningText").style.display = "none";
    }
    if (display.length == 0){
        document.getElementById("regisDisplayWarningText").style.display = "block";
        isValid = false;
    }
    else {
        document.getElementById("regisDisplayWarningText").style.display = "none";
    }
    if (!isValid) {
        return false;
    }

    var hashPass = await hashing(password);
    const users = await getDocs(query(usersRef, where("username", "==", username)));
    if (users) {
        const usersList = users.docs.map((item) => ({
            docId: item.id,
            ...item.data(),
        }));

        if (usersList.length === 0) {
            addDoc(usersRef, {
                username: username,
                password: hashPass,
                display
            });
            console.log("Register success");
            await login(username,password);
            document.getElementById("register-modal").style.display = "none";
            document.getElementsByClassName("name")[0].innerHTML = userMap.display;
            document.getElementsByClassName("lastName")[0].innerHTML = userMap.username;
            if (window.PasswordCredential) {
                setCredential(username, password, userMap.display);
            }
            await getData();
            await showDueDatePage();
            return true;
        }
        else {
            document.getElementById("regisUsernameWarningText2").style.display = "block";
        }
    }
    console.log("Register fail");
    return false;
}

// Using Web Crypto API
async function hashing(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);                                              // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);                     // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                           // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');       // convert bytes to hex string
    return hashHex;
}

async function logout() {
    if (window.PasswordCredential) {
        navigator.credentials.preventSilentAccess();
    }
    showLogin();
}



async function submitLogin() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    var isValid = await login(username,password);
    if (!isValid) {
        document.getElementById("loginWarningText").style.display = "block";
        return
    }
    document.getElementById("login-modal").style.display = "none";
    document.getElementsByClassName("name")[0].innerHTML = userMap.display;
    document.getElementsByClassName("lastName")[0].innerHTML = userMap.username;
    if (window.PasswordCredential) {
        setCredential(username, password, userMap.display);
    }
    await getData();
    await showDueDatePage();
}

async function pageLoad() {
    if (window.PasswordCredential) {
        var cred = navigator.credentials.get({
            password: true,
            mediation: 'optional',                
            })
        .then(async credential => {
            console.log(credential);
            if (!credential) {
                await showLogin();
                return;
            }
            console.log(credential.id);
            console.log(credential.password);
            const username = credential.id;
            const password = credential.password;
            var isValid = await login(username, password);
            if (!isValid) {
                await showLogin();
                return;
            }
            document.getElementById("login-modal").style.display = "none";
            document.getElementsByClassName("name")[0].innerHTML = userMap.display;
            document.getElementsByClassName("lastName")[0].innerHTML = userMap.username;
            await getData();
            await showDueDatePage();
            return
        })
        .catch((err) => {
            showLogin();
            return;
        });
        showLogin();
        return;
    }
    showLogin();
    return;
    
}

async function arrowFunction() {
    let arrow = document.querySelectorAll('.arrow');
            for (let i=0 ; i<arrow.length ; i++){
                arrow[i].addEventListener("click",(e)=>{                    
                let arrowParent = e.target.parentElement.parentElement;
                arrowParent.classList.toggle("showMenu");
                })
            }

            let sidebar = document.querySelector('.sidebar');
}

async function showLogin() {
    document.getElementById("login-modal").style.display = "flex";
    document.getElementById("register-modal").style.display = "none";
    document.getElementById("add-modal").style.display = "none";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginWarningText").style.display = "none";
}

async function showRegister() {
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("register-modal").style.display = "flex";
    document.getElementById("add-modal").style.display = "none";
    document.getElementById("edit-modal").style.display = "none";
    document.getElementById("registerUsername").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("registerCPassword").value = "";
    document.getElementById("regisUsernameWarningText").style.display = "none";
    document.getElementById("regisPasswordWarningText").style.display = "none";
    document.getElementById("regisCPasswordWarningText").style.display = "none";
    document.getElementById("regisDisplayWarningText").style.display = "none";
    document.getElementById("regisUsernameWarningText2").style.display = "none";
}

async function showAdd() {
    document.getElementById("newSubjectDiv").style.display = "none";
    document.getElementById("addSubject").innerHTML = "";
    for (const eachMap of tasksDataList) {
        document.getElementById("addSubject").innerHTML += `<option value="${eachMap.docId}">${eachMap.name}</option>`;
    }
    document.getElementById("addSubject").innerHTML += `<option value="add-new-subject">-- Add New Subject --</option>`;
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("register-modal").style.display = "none";
    document.getElementById("add-modal").style.display = "flex";
    document.getElementById("edit-modal").style.display = "none";
    document.getElementById("addSubject").value = "";
    document.getElementById("addNewSubject").value = "";
    document.getElementById("addName").value = "";
    document.getElementById("addDate").value = "";
    document.getElementById("addDescription").value = "";
    document.getElementById("addWarningText").style.display = "none";
}

async function showEdit(subjectID, taskID) {
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("register-modal").style.display = "none";
    document.getElementById("add-modal").style.display = "none";
    document.getElementById("edit-modal").style.display = "flex";

    document.getElementById("editSubject").innerHTML = "";
    document.getElementById("editSubjectDiv").style.display = "none";
    for (const eachMap of tasksDataList) {
        document.getElementById("editSubject").innerHTML += `<option value="${eachMap.docId}">${eachMap.name}</option>`;
    }
    document.getElementById("editSubject").innerHTML += `<option value="add-new-subject">-- Add New Subject --</option>`;
    document.getElementById("editSubject").value = subjectID;
    document.getElementById("editNewSubject").value = "";
    document.getElementById("editName").value = (tasksData[subjectID].tasks)[taskID].name;
    document.getElementById("editDate").value = timestampToStr((tasksData[subjectID].tasks)[taskID].due_date);
    document.getElementById("editDescription").value = (tasksData[subjectID].tasks)[taskID].description;
    document.getElementById("modalEditButton").setAttribute("onclick", `submitEdit('${subjectID}', '${taskID}')`);
    document.getElementById("editWarningText").style.display = "none";
}

function checkNewSubject() {
    if (document.getElementById("addSubject").value == "add-new-subject"){
        document.getElementById("newSubjectDiv").style.display = "block";
        document.getElementById("addNewSubject").value = "";
    }
    else {
        document.getElementById("newSubjectDiv").style.display = "none";
    }
}

function checkEditNewSubject() {
    if (document.getElementById("editSubject").value == "add-new-subject"){
        document.getElementById("editSubjectDiv").style.display = "block";
        document.getElementById("editNewSubject").value = "";
    }
    else {
        document.getElementById("editSubjectDiv").style.display = "none";
    }
}

async function dateFormat(timestamp) {
    //var date = new Date(timestamp*50);
    var date = new Date(timestamp*1000);
    //console.log(date);
    //console.log(timestamp);
    //console.log(date.toLocaleString());
    return date.toLocaleString();
}

async function submitAdd() {
    var subject = document.getElementById("addSubject").value.trim();
    const newSubject = document.getElementById("addNewSubject").value.trim();
    const name = document.getElementById("addName").value.trim();
    const date = document.getElementById("addDate").value;
    const description = document.getElementById("addDescription").value;

    const timestamp = Date.parse(date)/1000;
    
    var isValid = true;
    if (subject == "") {
        isValid = false;
    }
    if ((subject == "add-new-subject")&&(newSubject == "")) {
        isValid = false;
    }
    if (name == ""){
        isValid = false;
    }
    if (date == ""){
        isValid = false;
    }
    if (description == ""){
        isValid = false;
    }
    if (!isValid) {
        document.getElementById("addWarningText").style.display = "block";
        return;
    }

    if (subject == "add-new-subject") {
        await addSubject(newSubject);
        const subDoc = await getDocs(query(collection(db, 'users/'+userID+'/subjects'), where("name", "==", newSubject)));
        const subDocList = subDoc.docs.map((item) => ({
            docId: item.id,
            ...item.data(),
        }));
        subject = subDocList[0].docId;
        console.log("subject success")
    }

    addDoc(collection(db, 'users/'+userID+'/subjects/'+subject+'/tasks'), {
        name: name,
        due_date: timestamp,
        description: description,
        isDone: false
    });

    console.log("add success")

    document.getElementById("add-modal").style.display = "none";

    await getData();

    await showDueDatePage();
    

}

async function buildInvTask() {
    invTask = [];
    for (const eachMap of tasksDataList) {
        for (const eachTask of eachMap.tasks) {
            var newTask = new Map();
            newTask["subjectName"] = eachMap.name;
            newTask["subjectID"] = eachMap.docId;
            newTask["name"] = eachTask.name;
            newTask["docId"] = eachTask.docId;
            newTask["due_date"] = eachTask.due_date;
            newTask["description"] = eachTask.description;
            newTask["isDone"] = eachTask.isDone;
            invTask.push(newTask)
        }
    }
    invTask.sort(mapCompare);
    console.log(invTask);
}

function mapCompare(a, b) {
    if (a.due_date < b.due_date) {
        return -1;
    }
    if (a.due_date > b.due_date) {
        return 1;
    }
    if (a.name < b.name) {
        return -1;
    }
    if (a.name > b.name) {
        return 1;
    }
    return 0;
  }

async function buildTable() {
    const nowTimestamp = Date.now();
    var html = ``;
    for (const eachTask of invTask) {
        html += `
        <tr style="background: ${backgroundTimeDiff(eachTask.due_date, nowTimestamp, eachTask.isDone)}">
            <td>${await dateFormat(eachTask.due_date)}</td>
            <td>${eachTask.name}</td>
            <td>${eachTask.subjectName}</td>
            <td>${timeDiff(eachTask.due_date, nowTimestamp, eachTask.isDone)}</td>
        </tr>
        `;
    }
    document.getElementById("table-body").innerHTML = html;
}

async function buildTableDoneQuery() {
    const nowTimestamp = Date.now();
    var html = ``;
    for (const eachTask of invTask) {
        if (eachTask.isDone == false){
            html += `
            <tr style="background: ${backgroundTimeDiff(eachTask.due_date, nowTimestamp, eachTask.isDone)}">
                <td>${await dateFormat(eachTask.due_date)}</td>
                <td>${eachTask.name}</td>
                <td>${eachTask.subjectName}</td>
                <td>${timeDiff(eachTask.due_date, nowTimestamp, eachTask.isDone)}</td>
            </tr>
            `;
        }
    }
    document.getElementById("table-body").innerHTML = html;
}

function timeDiff(timestamp, nowTimestamp, isDone) {
    if (isDone) {
        return "Completed";
    }
    var difference = timestamp*1000 - nowTimestamp;
    if (difference < 0) {
        difference = -1*difference;
        var daysDifference = Math.floor(difference/1000/60/60/24);
        difference -= daysDifference*1000*60*60*24

        var hoursDifference = Math.floor(difference/1000/60/60);
        difference -= hoursDifference*1000*60*60

        var minutesDifference = Math.floor(difference/1000/60);
        difference -= minutesDifference*1000*60

        var secondsDifference = Math.floor(difference/1000);
        if (daysDifference > 0) {
            return 'Overdue for ' + daysDifference + ' days ' + 
                hoursDifference + ' hours ' + 
                minutesDifference + ' minutes ' + 
                secondsDifference + ' seconds';
        }
        if (hoursDifference > 0) {
            return 'Overdue for ' + hoursDifference + ' hours ' + 
                minutesDifference + ' minutes ' + 
                secondsDifference + ' seconds';
        }
        if (minutesDifference > 0) {
            return 'Overdue for ' + minutesDifference + ' minutes ' + 
                secondsDifference + ' seconds';
        }
        return 'Overdue for ' + secondsDifference + ' seconds';
    }

    var daysDifference = Math.floor(difference/1000/60/60/24);
    difference -= daysDifference*1000*60*60*24

    var hoursDifference = Math.floor(difference/1000/60/60);
    difference -= hoursDifference*1000*60*60

    var minutesDifference = Math.floor(difference/1000/60);
    difference -= minutesDifference*1000*60

    var secondsDifference = Math.floor(difference/1000);
    
    if (daysDifference > 0) {
        return daysDifference + ' days ' + 
            hoursDifference + ' hours ' + 
            minutesDifference + ' minutes ' + 
            secondsDifference + ' seconds';
    }
    if (hoursDifference > 0) {
        return hoursDifference + ' hours ' + 
            minutesDifference + ' minutes ' + 
            secondsDifference + ' seconds';
    }
    if (minutesDifference > 0) {
        return minutesDifference + ' minutes ' + 
            secondsDifference + ' seconds';
    }
    return secondsDifference + ' seconds';
    
}

function backgroundTimeDiff(timestamp, nowTimestamp, isDone) {
    if (isDone) {
        return "#b3cdfe"
    }

    var difference = timestamp*1000 - nowTimestamp;

    if (difference < 0) {
        return "#b0b0b0"
    }
    
    var daysDifference = Math.floor(difference/1000/60/60/24);

    if (daysDifference < 1) {
        return "#fdaeae"
    }
    if (daysDifference < 3) {
        return "#ffd7aa"
    }
    if (daysDifference < 5) {
        return "#fefab3"
    }
    if (daysDifference < 7) {
        return "#d1feb3"
    }
    return "#b3feb4"
}

async function showDueDatePage() {
    checkShowHome();
    homeStatus = true;
    clearInterval(t);
    console.log("Clicked Due Date")
    if (document.getElementsByClassName("active").length > 0){
        document.getElementsByClassName("active")[0].classList.remove("active");
    }
    document.getElementById("text")
    document.getElementById("due-date-link-container").classList.add("active");
    document.getElementsByClassName("checkbox-container")[0].style.display = "block";
    document.getElementById("doneQuery").checked = true;
    await buildTableDoneQuery();
    t = setInterval(buildTableDoneQuery, 1000);
    document.getElementsByClassName("text")[0].innerHTML = "Due Date";
    document.getElementById("description-container").style.display = "none";
    document.getElementById("verifyButton").classList.remove("completed");
    document.getElementById("verifyButton").classList.add("button-disable");
    document.getElementById("editButton").classList.add("button-disable");
    document.getElementById("deleteButton").classList.add("button-disable");
    document.getElementById("editButton").disabled = true;
    document.getElementById("deleteButton").disabled = true;
    document.getElementById("verifyButton").disabled = true;
    document.getElementById("editButton").style.display = "none";
    document.getElementById("deleteButton").style.display = "none";
    document.getElementById("verifyButton").style.display = "none";
}

function timestampToStr(timestamp) {
    var date = new Date(timestamp * 1000);
    var years = date.getFullYear();
    var months = "0" + (date.getMonth() + 1);
    var days = "0" + date.getDate();
    var hours = "0" + date.getHours();
    var minutes = "0" + date.getMinutes();
    console.log(years + '-' + months.substring(months.length-2) + '-' + days.substring(days.length-2)  + 'T' + hours.substring(hours.length-2) + ':' + minutes.substring(minutes.length-2))
    return years + '-' + months.substring(months.length-2) + '-' + days.substring(days.length-2)  + 'T' + hours.substring(hours.length-2) + ':' + minutes.substring(minutes.length-2);
}

async function showDelete(subjectID, taskID) {
    document.getElementById("delete-modal").style.display = "flex";
    document.getElementById("modalDeleteButton").setAttribute("onclick", `submitDelete('${subjectID}', '${taskID}')`);
}

async function submitEdit(subjectID, taskID) {
    var subject = document.getElementById("editSubject").value.trim();
    const newSubject = document.getElementById("editNewSubject").value.trim();
    const name = document.getElementById("editName").value.trim();
    const date = document.getElementById("editDate").value;
    const description = document.getElementById("editDescription").value;

    const timestamp = Date.parse(date)/1000;
    
    var isValid = true;
    if (subject == "") {
        isValid = false;
    }
    if ((subject == "add-new-subject")&&(newSubject == "")) {
        isValid = false;
    }
    if (name == ""){
        isValid = false;
    }
    if (date == ""){
        isValid = false;
    }
    if (description == ""){
        isValid = false;
    }
    if (!isValid) {
        document.getElementById("editWarningText").style.display = "block";
        return;
    }

    if (subject == "add-new-subject") {
        await addSubject(newSubject);
        const subDoc = await getDocs(query(collection(db, 'users/'+userID+'/subjects'), where("name", "==", newSubject)));
        const subDocList = subDoc.docs.map((item) => ({
            docId: item.id,
            ...item.data(),
        }));
        subject = subDocList[0].docId;
        console.log("subject success")
    }
    console.log(subjectID)
    console.log(subject)
    console.log(subjectID == subject)
    if (subjectID == subject) { // Update
        console.log("a")
        const updateData = {
            name: name,
            due_date: timestamp,
            description: description,
            isDone: (tasksData[subjectID].tasks)[taskID].isDone
        };
        updateDoc(await doc(db, 'users/'+userID+'/subjects/'+subjectID+'/tasks/'+taskID), updateData)
            .then(function () {
                console.log('success');
            })
            .catch(function (error) {
                console.log('failed', error);
            });
        await getData();
        document.getElementById("edit-modal").style.display = "none";

        var fx = `showData(this,'${subjectID}','${taskID}')`;
        console.log(fx);
        var allList = document.getElementsByClassName("sub-menu-link")
        for (const eachElement of allList) {
            console.log(eachElement.getAttribute('onclick'));
            if (eachElement.getAttribute('onclick') == fx) {
                await showData(eachElement, subjectID, taskID);
                break;
            }
        }
    }
    else {  // Delete and add new one
        console.log("b")
        await deleteData(subjectID, taskID);
        const items = await getDocs(collection(db, 'users/'+userID+'/subjects/'+subjectID+'/tasks'));
        if (items) {
            const itemsList = items.docs.map((item) => ({
                docId: item.id,
                ...item.data(),
            }));

            if (itemsList.length === 0) {
                await deleteSubject(subjectID);
            }
        }
        else {
            await deleteSubject(subjectID);
        }

        addDoc(collection(db, 'users/'+userID+'/subjects/'+subject+'/tasks'), {
            name: name,
            due_date: timestamp,
            description: description,
            isDone: (tasksData[subjectID].tasks)[taskID].isDone
        });
    
        console.log("add success")

        await getData();
        document.getElementById("edit-modal").style.display = "none";
        await showDueDatePage();
    }
}

async function submitDelete(subjectID, taskID) {
    await deleteData(subjectID, taskID);
    const items = await getDocs(collection(db, 'users/'+userID+'/subjects/'+subjectID+'/tasks'));
    if (items) {
        const itemsList = items.docs.map((item) => ({
            docId: item.id,
            ...item.data(),
        }));

        if (itemsList.length === 0) {
            await deleteSubject(subjectID);
        }
    }
    else {
        await deleteSubject(subjectID);
    }
    await getData();
    document.getElementById("delete-modal").style.display = "none";
    await showDueDatePage();
}

async function submitCheck(subjectID, taskID) {
    if ((tasksData[subjectID].tasks)[taskID].isDone) {
        updateDoc(await doc(db, 'users/'+userID+'/subjects/'+subjectID+'/tasks/'+taskID), "isDone", false);
        (tasksData[subjectID].tasks)[taskID].isDone = false;
    }
    else {
        updateDoc(await doc(db, 'users/'+userID+'/subjects/'+subjectID+'/tasks/'+taskID), "isDone", true);
        (tasksData[subjectID].tasks)[taskID].isDone = true;
    }
    await buildInvTask();
    await showData(document.getElementsByClassName("active")[0], subjectID, taskID);
}

async function changeDoneQuery() {
    clearInterval(t);
    if (document.getElementById("doneQuery").checked == true) {
        await buildTableDoneQuery();
        t = setInterval(buildTableDoneQuery, 1000);
    }
    else {
        await buildTable();
        t = setInterval(buildTable, 1000);
    }
}

function checkShowHome() {
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (width <= 770) {
        console.log("True");
        var val2 = 1;
        animate = setInterval(function() {
            val2 -= 0.1;
            console.log(val2 >= 1)
            document.getElementById("sidebar").style.opacity = val2;
            if (val2 <= 0) {
                document.getElementById("sidebar").style.opacity = 0;
                document.getElementById("sidebar").style.display = "none";
                clearInterval(animate);
            }
        }, 20)
    }
    else{
        console.log("False")
        document.getElementById("sidebar").style.display = "block";
    }
    console.log(width)
    homeStatus = true;
}

function homeAppear() {
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (width <= 770) {
        if (homeStatus) {
            document.getElementById("sidebar").style.opacity = 0;
            document.getElementById("sidebar").style.display = "none";
        }
        else {
            document.getElementById("sidebar").style.opacity = 1;
            document.getElementById("sidebar").style.display = "block";
        }
    }
    else {
        document.getElementById("sidebar").style.opacity = 1;
        document.getElementById("sidebar").style.display = "block";
    }
}

function checkHideHome() {
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (width <= 770) {
        var val = 0;
        animate = setInterval(function() {
            val += 0.1;
            document.getElementById("sidebar").style.opacity = val;
            console.log(val >= 1)
            if (val >= 1) {
                document.getElementById("sidebar").style.opacity = 1;
                clearInterval(animate);
            }
        }, 20)
    }
    document.getElementById("sidebar").style.display = "block";
    homeStatus = false;
}


window.getData = getData;
window.addData = addData;
window.addSubject = addSubject;
window.deleteData = deleteData;
window.deleteSubject = deleteSubject;
window.setCredential = setCredential;
window.login = login;
window.logout = logout;
window.submitLogin = submitLogin;
window.pageLoad = pageLoad;
window.showData = showData;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.submitRegister = submitRegister;
window.showAdd = showAdd;
window.checkNewSubject = checkNewSubject;
window.submitAdd = submitAdd;
window.buildInvTask = buildInvTask;
window.buildTable = buildTable;
window.showDueDatePage = showDueDatePage;
window.showEdit = showEdit;
window.checkEditNewSubject = checkEditNewSubject;
window.showDelete = showDelete;
window.submitDelete = submitDelete;
window.submitEdit = submitEdit;
window.submitCheck = submitCheck;
window.changeDoneQuery = changeDoneQuery;
window.homeAppear = homeAppear;
window.checkHideHome = checkHideHome;
window.checkShowHome = checkShowHome;