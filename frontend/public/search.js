// Source:  1. Code from Postman
// 			2.https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
document.getElementById("addDatasetButton").addEventListener("click", handlePUT);
document.getElementById("searchButton").addEventListener("click", handlePOST);
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
			alert("Congrats! You can now start using the search function below :)");
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

function handlePOST(){
	if(document.getElementById("courses").checked === true) {
		let myHeaders = new Headers();
		myHeaders.append("Content-Type", "application/json");
		let dept = document.getElementById("searchInput").value;
		if (dept === "math310" || dept === "math 310") {
			let raw = JSON.stringify({
				"WHERE": {
					"AND": [
						{
							"IS": {
								"courses_id": "310"
							}
						},
						{
							"IS": {
								"courses_dept": "math"
							}
						}
					]
				},
				"OPTIONS": {
					"COLUMNS": [
						"courses_dept",
						"courses_id",
						"courses_title",
						"courses_instructor"
					]
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
				.then(result => alert(result))
				.catch(error => alert('error' +  error));
		} else {
			alert("Oh no please make sure you enter a valid keyword!");
		}
	} else {
		alert("Oh no you haven't selected a dataset yet!");
	}
}
