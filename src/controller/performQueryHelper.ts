import {InsightError} from "./IInsightFacade";
import {Queryid} from "./ValidQuery";
let maps: {[key: string]: string} = {
	dept: "Subject", 			fullname: "fullname",
	id: "Course",				shortname: "shortname",
	avg: "Avg",					number: "number",
	instructor: "Professor",	name: "name",
	title: "Title",				address: "address",
	pass: "Pass",				lat: "lat",
	fail: "Fail",				lon: "lon",
	audit: "Audit",				seats: "seats",
	uuid: "id",					type: "type",
	year: "Year",				furniture: "furniture",
	href: "href"
};


export function sComparison(where: any, dataset: any[]): any[] {
	// let maps: {[key: string]: string} = {
	let filterOperator = Object.keys(where)[0]; // "GT", "LT" ....
	let filterValue = where[filterOperator]; // ex: "course_avg" : 97
	let filterValueKey = Object.keys(filterValue)[0]; // ex: "course_avg"
	let filterValueSearchID = filterValueKey.substring(filterValueKey.indexOf("_") + 1); // ex: "avg"
	let filterValueValue = filterValue[filterValueKey]; // ex: 97
	let searchIDInData = maps[filterValueSearchID];
	return filterDataset(searchIDInData, filterValueValue, filterOperator, dataset);
}

export function filterDataset(searchID: string, filterValue: any, filterOperator: string, dataset: any[]) {
	let result: any[] = [];
	switch (filterOperator) {
		case "GT":
			result = dataset.filter((item) => item[searchID] > filterValue);
			break;
		case "LT":
			result = dataset.filter((item) => item[searchID] < filterValue);
			break;
		case "EQ":
			result = dataset.filter((item) => item[searchID] === filterValue);
			break;
		default:
			return filterIS(dataset, searchID, filterValue);
	}
	return result;
}

export function filterIS(dataset: any[], filterKey: string, filterValue: string): any[] {
	let result: any[] = [];
	if (filterValue === "*") {
		return dataset;
	} else if (filterValue[0] === "*" && filterValue[filterValue.length - 1] !== "*") {
		result = dataset.filter((item) => item[filterKey].endsWith(filterValue.substring(1)));
	} else if (filterValue[0] !== "*" && filterValue[filterValue.length - 1] === "*") {
		let start = filterValue.substring(0, filterValue.length - 1);
		result = dataset.filter((item) => item[filterKey].startsWith(start));
	} else if (filterValue[0] === "*" && filterValue[filterValue.length - 1] === "*") {
		let middle = filterValue.substring(1, filterValue.length - 1);
		result = dataset.filter((item) => item[filterKey].includes(middle));
	} else {
		result = dataset.filter((item) => item[filterKey] === filterValue);
	}
	return result;
}

export function  orOperation(where: any, dataset: any[]): any[] {
	let result: any[] = [];
	for (let member of where["OR"]) {
		let key = Object.keys(member)[0];
		switch (key) {
			case "OR": {
				let tempOr = orOperation(member, dataset);
				result = result.concat(tempOr.filter((item) => !result.includes(item)));
				break;
			}
			case "AND": {
				let tempAnd = andOperation(member, dataset);
				result = result.concat(tempAnd.filter((item) => !result.includes(item)));
				break;
			}
			case "NOT": {
				let tempNot = negation(member, dataset);
				result = result.concat(tempNot.filter((item) => !result.includes(item)));
				break;
			}
			default: {
				let temp = sComparison(member, dataset);
				result = result.concat(temp.filter((item) => !result.includes(item)));
			}
		}
	}
	return result;
}

export function andOperation(where: any, dataset: any[]): any[] {
	let result: any[] = dataset;
	for (let member of where["AND"]) {
		let key = Object.keys(member)[0];
		switch (key) {
			case "OR": {
				let tempOr = orOperation(member, result);
				result = result.filter((item) => tempOr.includes(item));
				break;
			}
			case "AND": {
				let tempAnd = andOperation(member, result);
				result = result.filter((item) => tempAnd.includes(item));
				break;
			}
			case "NOT": {
				let tempNot = negation(member, result);
				result = result.filter((item) => tempNot.includes(item));
				break;
			}
			default: {
				let temp = sComparison(member, result);
				result = result.filter((item) => temp.includes(item));
			}
		}
	}
	return result;
}

export function negation(where: any, dataset: any[]): any[] {
	let result: any[];
	let key = Object.keys(where["NOT"])[0];
	switch (key) {
		case "OR": {
			let sectionsOr = orOperation(where["NOT"], dataset);
			result = dataset.filter((item) => sectionsOr.indexOf(item) === -1);
			break;
		}
		case "AND": {
			let sectionsAnd = andOperation(where["NOT"], dataset);
			result = dataset.filter((item) => sectionsAnd.indexOf(item) === -1);
			break;
		}
		case "NOT": {
			let sectionsNot = negation(where["NOT"], dataset);
			result = dataset.filter((item) => sectionsNot.indexOf(item) === -1);
			break;
		}
		default: {
			let sections = sComparison(where["NOT"], dataset);
			result = dataset.filter((item) => sections.indexOf(item) === -1);
		}
	}
	return result;
}

// helper functions for performQuery
export function doesDatasetExist(addedDatasetId: string[]): void {
	if (!addedDatasetId.includes(Queryid)) {
		throw new InsightError("Dataset is not added");
	}
}
