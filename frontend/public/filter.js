// Source:  1. Code from Postman
// 			2.https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

document.getElementById("addDatasetButton").addEventListener("click", handlePUT);
document.getElementById("submitCButtonForCourse").addEventListener("click", handlePOST2);
document.getElementById("removeDataset").addEventListener("click", handleDELETE);

async function handlePUT() {
	let url = "http://localhost:4321/dataset/courses/courses";
	await fetch(url, {
		method: "PUT",
		body: document.getElementById("fileToAdd").files[0]
	}).then(
		response => response.json()
	).then((response) => {
		if (response.result) {
			alert("Congrats! You can now select the filters below :)");
		} else {
			alert("Oh no! You have: " + response.error);
		}
	});
}

async function handleDELETE() {
	let url = "http://localhost:4321/dataset/courses";
	await fetch(url, {
		method: "DELETE",
	}).then(response => response.json()).then((result) => {
		if (result.result) {
			alert("Congrats! Dataset has been removed successfully :)");
		} else {
			alert("Oh no! You have: " + result.error);
		}
	});
}


function handlePOST2(){
	if(document.getElementById("courses").checked === true) {
		let myHeaders = new Headers();
		myHeaders.append("Content-Type", "application/json");
		dept =  getDept();
		let raw = JSON.stringify({
			"WHERE": {
				"AND":[
					{
						"LT":{
							"courses_avg":65
						}
					},
					{
						"IS":{
							"courses_dept": dept
						}
					}
				]
			},
			"OPTIONS": {
				"COLUMNS": [
					"courses_dept",
					"courses_id",
					"courses_avg"
				],
				"ORDER": "courses_avg"
			}
		});

		let requestOptions = {
			method: 'POST',
			headers: myHeaders,
			body: raw,
			redirect: 'follow'
		};

		fetch("http://localhost:4321/query", requestOptions)
			.then(response => response.text())
			.then(result => alert("Here is your filter result: " + result))
			.catch(error => alert('error' +  error));
	} else {
		alert("Oh no you haven't selected a dataset yet!");
	}
}

// function appendData(data) {
// 	const output = document.getElementById("myData");
// 	output.innerHTML = data;
// }

let dept = "";

function getDept() {
	if (document.getElementById("COGS").checked === true) {
		return "cogs";
	}
	if (document.getElementById("CPSC").checked === true) {
		return "cpsc";
	}
	if (document.getElementById("MATH").checked === true) {
		return "math";
	}
	if (document.getElementById("PHYS").checked === true) {
		return "phys";
	}
	if (document.getElementById("STAT").checked === true) {
		return "stat";
	}
}

