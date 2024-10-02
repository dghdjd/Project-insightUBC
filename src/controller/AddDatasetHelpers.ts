import JSZip from "jszip";
import {parse} from "parse5";
import {InsightError} from "./IInsightFacade";
import * as http from "http";
export function findValidCourseSections(files: any[]) {
	let validSections: any[] = [];
	// check if there is at least one valid section
	for (let file of files) {
		let jsonObject = validateJSON(file);
		if (jsonObject) {
			let sections: any[] = jsonObject.result;
			if (sections.length !== 0) {
				for (let i in sections) {
					let keys: string[] = Object.keys(sections[i]);
					let course: any = {};
					if (
						keys.includes("Subject") &&
						keys.includes("id") &&
						keys.includes("Avg") &&
						keys.includes("Professor") &&
						keys.includes("Title") &&
						keys.includes("Pass") &&
						keys.includes("Fail") &&
						keys.includes("Audit") &&
						keys.includes("Course") &&
						keys.includes("Year")
					) {
						course["Subject"] = sections[i]["Subject"];
						course["id"] = sections[i]["id"].toString();
						course["Avg"] = sections[i]["Avg"];
						course["Professor"] = sections[i]["Professor"];
						course["Title"] = sections[i]["Title"];
						course["Pass"] = sections[i]["Pass"];
						course["Fail"] = sections[i]["Fail"];
						course["Audit"] = sections[i]["Audit"];
						course["Course"] = sections[i]["Course"].toString();
						course["Year"] = parseInt(sections[i]["Year"], 10);
						if (sections[i]["Section"] === "overall") {
							course["Year"] = 1900;
						}
						validSections.push(course);
					}
				}
			}
		}
	}
	return validSections;
}

export function openBuildingFilesExtractRoom(
	allBuildingPaths: string[],
	shortnameList: string[],
	fullNameList: string[],
	addrList: string[],
	zipContent: JSZip): Promise<any[]> {
	return new Promise<any[]>((resolve, reject) => {
		let buildingFiles: any[] = [];
		for (let path of allBuildingPaths) {
			let file = zipContent.file("rooms" + path);
			if (file === null) {
				continue;
			}
			buildingFiles.push(file.async("string"));
		}
		Promise.all(buildingFiles).then((allBuildingFiles: any[]) => {
			let allRoomSections: any[] = [];
			for (let i in allBuildingFiles) {
				let buildingTrArray: any[] = findAllTrs(parse(allBuildingFiles[i]));
				if (buildingTrArray.length !== 0) {
					allRoomSections = allRoomSections.concat(collectRoomInfo(buildingTrArray, shortnameList[i],
						fullNameList[i], addrList[i]));
				}
			}
			let allGeoObjects: any[] = [];
			for (let room of allRoomSections) {
				allGeoObjects.push(getLatLon(room["address"]));
			}
			Promise.all(allGeoObjects).then((geoObjs: any) => {
				for (let index in allRoomSections) {
					if (geoObjs[index].error === undefined) {
						allRoomSections[index]["lat"] = geoObjs[index].lat;
						allRoomSections[index]["lon"] = geoObjs[index].lon;
					} else {
						allRoomSections.splice(Number(index),1);
					}
				}
				return resolve(allRoomSections);
			}).catch((error0) => {
				return reject(new InsightError(error0));
			});
		}).catch((error1) => {
			return reject(new InsightError(error1));
		});
	});
}

export function extractAllRoomSections(
	id: string, zipContent: JSZip,
	indexFile: JSZip.JSZipObject | null): Promise<any[]> {
	return new Promise((resolve, reject) => {
		if (indexFile !== null) {
			indexFile.async("string").then((idxFile) => {
				let trArray: any[] = findAllTrs(parse(idxFile));
				if (trArray.length === 0) {
					return reject(new InsightError("no buildings in the index file"));
				}
				let shortnameList: string[] = [];
				let fullNameList: string[] = [];
				let addrList: string[] = [];
				let allValidBuildingPaths: string[] = [];
				extractBuildingInfo(trArray, shortnameList, fullNameList, addrList, allValidBuildingPaths);
				openBuildingFilesExtractRoom(allValidBuildingPaths, shortnameList, fullNameList, addrList, zipContent)
					.then((allRoomSections) => {
						return resolve(allRoomSections);
					})
					.catch((error1) => {
						return reject(error1);
					});
			}).catch((error2) => {
				return reject(new InsightError(error2));
			});
		} else {
			return reject(new InsightError("Could not find/open index file"));
		}
	});
}

export function findAllTrs(node: any): any[] {
	let trArray: any[] = [];
	if (Object.prototype.hasOwnProperty.call(node, "nodeName") && node.nodeName === "tr") {
		trArray.push(node);
		return trArray;
	} else if (Object.prototype.hasOwnProperty.call(node, "childNodes")) {
		for (let child of node.childNodes) {
			let tempTrArray = findAllTrs(child);
			if (tempTrArray.length !== 0) {
				trArray = trArray.concat(tempTrArray);
			}
		}
	}
	return trArray;
}

export function findNode(node: any, nodeName: string, classValue: string): any {
	if (Object.prototype.hasOwnProperty.call(node, "nodeName") && node.nodeName === nodeName
	&& node.attrs[0].value.trim() === classValue) {
		return node;
	} else if (Object.prototype.hasOwnProperty.call(node, "childNodes")) {
		for (let child of node.childNodes) {
			let tempNode = findNode(child, nodeName, classValue);
			if (tempNode !== false) {
				return tempNode;
			}
		}
	}
	return false;
}

export function extractBuildingInfo(
	trArray: any,
	shortNameList: string[],
	fullNameList: string[],
	addrList: string[],
	allValidBuildingPaths: string[]) {
	for (let tr of trArray) {
		let shortnameTd = findNode(tr, "td", "views-field views-field-field-building-code");
		let addressTd = findNode(tr, "td", "views-field views-field-field-building-address");
		let fullNameTd = findNode(tr, "td", "views-field views-field-title");
		let pathTd = findNode(tr, "td", "views-field views-field-nothing");
		if (shortnameTd !== false && fullNameTd !== false && addressTd !== false && pathTd !== false) {
			if (shortnameTd.childNodes.length === 0) {
				shortNameList.push("");
			} else {
				shortNameList.push(shortnameTd.childNodes[0].value.trim());
			}
			if (addressTd.childNodes.length === 0) {
				addrList.push("");
			} else {
				addrList.push(addressTd.childNodes[0].value.trim());
			}
			if (fullNameTd.childNodes.length === 0) {
				fullNameList.push("");
			} else {
				fullNameList.push(fullNameTd.childNodes[1].childNodes[0].value.trim());
			}
			if (pathTd.childNodes.length === 0) {
				allValidBuildingPaths.push("");
			} else {
				allValidBuildingPaths.push(pathTd.childNodes[1].attrs[0].value.trim().substring(1));
			}
		}
	}
}
export function collectRoomInfo(buildingTrArray: any[], shortName: string, fullName: string, addr: string) {
	let result: any[] = [];
	for (let tr of buildingTrArray) {
		let room: any = {};
		let seatTd = findNode(tr, "td", "views-field views-field-field-room-capacity");
		let numberTd = findNode(tr, "td", "views-field views-field-field-room-number");
		let furnitureTd = findNode(tr, "td", "views-field views-field-field-room-furniture");
		let typeTd = findNode(tr, "td", "views-field views-field-field-room-type");
		let hrefTd = findNode(tr, "td", "views-field views-field-nothing");
		if (seatTd !== false && numberTd !== false && furnitureTd !== false && typeTd !== false && hrefTd !== false) {
			if (seatTd.childNodes.length === 0) {
				room["seats"] = 0;
			} else {
				room["seats"] = (+seatTd.childNodes[0].value.trim());
			}
			if (numberTd.childNodes.length === 0) {
				room["number"] = "";
			} else {
				room["number"] = numberTd.childNodes[1].childNodes[0].value.trim();
			}
			if (furnitureTd.childNodes.length === 0) {
				room["furniture"] = "";
			} else {
				room["furniture"] = furnitureTd.childNodes[0].value.trim();
			}
			if (typeTd.childNodes.length === 0) {
				room["type"] = "";
			} else {
				room["type"] = typeTd.childNodes[0].value.trim();
			}
			if (hrefTd.childNodes.length === 0) {
				room["href"] = "";
			} else {
				room["href"] = hrefTd.childNodes[1].attrs[0].value.trim();
			}
			room["name"] = shortName + "_" + room["number"];
			room["fullname"] = fullName;
			room["shortname"] = shortName;
			room["address"] = addr;
			result.push(room);
			room = {};
		}
	}
	return result;
}
export function extractAllJsonFiles(zipContent: JSZip, zip: JSZip, jsonFileLists: Array<Promise<string>>) {
	let coursesFolder = zipContent.folder("courses");
	if (coursesFolder != null) {
		coursesFolder.forEach(function (path: string) {
			// Add every JSON file inside courses folder
			let file = zip.file("courses/" + path);
			if (file != null) {
				jsonFileLists.push(file.async("string"));
			}
		});
	}
}
export function getLatLon(address: string): Promise<any> {
	return new Promise((resolve, reject) => {
		http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team582/" +
			address.replace(/ /g, "%20"), (res) => {
			const {statusCode} = res;
			const contentType = res.headers["content-type"];
			let error;
			// Any 2xx status code signals a successful response but
			// here we're only checking for 200.
			if (statusCode !== 200) {
				error = new Error("Request Failed.\n" + "Status Code: ${statusCode}");
			} else if (!/^application\/json/.test(contentType as string)) {
				error = new Error(
					"Invalid content-type.\n" + "Expected application/json but received ${contentType}"
				);
			}
			if (error) {
				console.error(error.message);
				// Consume response data to free up memory
				res.resume();
				return reject(error);
			}
			res.setEncoding("utf8");
			let rawData = "";
			res.on("data", (chunk) => {
				rawData += chunk;
			});
			res.on("end", () => {
				try {
					const parsedData: any = JSON.parse(rawData);
					return resolve(parsedData);
				} catch (e) {
					console.log(e);
				}
			});
		}).on("error", (e) => {
			return reject(e);
		});
	});
}
function validateJSON(body: string) {
	try {
		let data = JSON.parse(body);
		// if came to here, then valid
		return data;
	} catch(e) {
		return null;
	}
}
