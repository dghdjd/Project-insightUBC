import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {addedData} from "../../src/controller/InsightFacade";
import {TransCheck, ifTrans, validateTrans} from "./ValidQueryTrans";
import {checkWhere} from "./ValidQueryWhere";
export const mfield: string[] = ["avg", "pass", "fail", "audit", "year"];
export const sfield: string[] = ["dept", "id", "instructor", "title", "uuid"];
export const mfieldRooms: string[] = ["lat", "lon", "seats"];
export const sfieldRooms: string[] = ["fullname",
	"shortname",
	"number",
	"name",
	"address",
	"type",
	"furniture",
	"href"];
export const Applykey: string[] = ["MAX", "MIN", "AVG", "SUM","COUNT"];
export let columnsToStrings: string[] = []; //
export let Queryid: string = "";

export function isQueryValid(query: any): void {					// helper function for perform query
	if (query === undefined || typeof query !== "object" || query === null) {			// check if a query is valid
		throw new InsightError("Undefined query");
	}
	if (Object.keys(query).length === 0) {
		throw new InsightError("Empty query");
	}
	TransCheck(query);
	if (ifTrans && Object.keys(query).length !== 3) {
		throw new InsightError("Invalid query key length with Trans");
	}
	if (!ifTrans && Object.keys(query).length !== 2) {
		throw new InsightError("Invalid query key length without Trans");
	}
	Queryid = "";
	validateWhere(query);
	validateOptions(query);
	validateTrans(query);
	return;
}
function validateWhere(query: any): void {                       // Validate WHERE
	if (query.WHERE === undefined || query.WHERE === null) {

		throw new InsightError("invalid WHERE");
	}
	if (!query.WHERE) {
		throw new InsightError("Missing WHERE");
	}
	if (typeof query.WHERE !== "object") {
		throw new InsightError("WHERE is not an object");
	}
	if (Object.keys(query.WHERE).length > 1) {
		throw new InsightError("Key exceeds maximum in WHERE");
	}
	checkWhere(query.WHERE);
	return;
}
function validateOptions(query: any): void {
	if (query.OPTIONS === undefined || query.OPTIONS === null) {
		throw new InsightError("invalid WHERE");
	}
	if (!query.OPTIONS) {
		throw new InsightError("Missing OPTIONS");
	}
	if (typeof query.OPTIONS !== "object") {
		throw new InsightError("OPTIONS is not an object");
	}
	if (!query.OPTIONS.COLUMNS) {
		throw new InsightError("Missing COLUMNS in OPTIONS");
	}
	if (Object.keys(query.OPTIONS).length > 2 || (Object.keys(query.OPTIONS).length === 2 && !query.OPTIONS.ORDER)) {
		throw new InsightError("Keys exceed maximum in OPTIONS");
	}
	validateColumns(query);
	return;
}
function validateColumns(query: any): void {
	// check if COLUMNS is valid
	let ifInGroup;
	let ifInApply;
	if (Object.keys(query.OPTIONS.COLUMNS).length < 1 || !Array.isArray(query.OPTIONS.COLUMNS)) {
		throw new InsightError("Invalid COLUMNS");
	}
	// check if keys in COLUMNS is valid
	columnsToStrings = [];
	for (let c of query.OPTIONS.COLUMNS) {
		columnsToStrings.push(c);
		let splitKey: string[] = c.toString().split("_");
		if (splitKey.length === 2) {
			if (!ifIDMatchKey(splitKey[0],splitKey[1])){
				throw new InsightError("Invalid key in COLUMNS " + c.toString());
			}
		}
	}
	for (let c of columnsToStrings) {
		if (!ifTrans) {
			let splitKey: string[] = c.toString().split("_");
			if (splitKey.length !== 2) {
				throw new InsightError("Invalid key in COLUMNS");
			}
			validateIDString(splitKey[0]);

			if (!ifIDMatchKey(splitKey[0],splitKey[1])) {
				throw new InsightError("Wrong key in COLUMNS");
			}
		} else {
			ifInGroup = false;
			ifInApply = false;
			ifInGroup = query.TRANSFORMATIONS.GROUP.includes(c);
			ifInApply = query.TRANSFORMATIONS.APPLY.filter((apply: any) => {
				if (apply === null || apply === undefined) {
					throw new InsightError("null ApplyRule");
				}
				return Object.keys(apply)[0] === c;
			}).length > 0;

			if (!ifInApply && !ifInGroup) {
				throw new InsightError("Invalid key " + c.toString() + " in COLUMNS");
			}
		}
	}
	if (Object.prototype.hasOwnProperty.call(query.OPTIONS, "ORDER")) {
		validateOrder(query);
	}
}

function validateOrder(query: any): void {
	if (query.OPTIONS.ORDER === undefined || query.OPTIONS.ORDER === null) {
		throw new InsightError("Invalid ORDER");
	}
	columnsToStrings = [];
	for (let c of query.OPTIONS.COLUMNS) {
		columnsToStrings.push(c);

	}
	if (typeof query.OPTIONS.ORDER === "object"){
		if (!Object.prototype.hasOwnProperty.call(query.OPTIONS.ORDER, "dir") ||
			!Object.prototype.hasOwnProperty.call(query.OPTIONS.ORDER, "keys")) {
			throw new InsightError("Order missing keys(dir or keys");
		}
		if (!Array.isArray(query.OPTIONS.ORDER.keys)) {
			throw new InsightError("Order Keys is not an array");
		}
		if (query.OPTIONS.ORDER.dir !== "UP" && query.OPTIONS.ORDER.dir !== "DOWN") {
			throw new InsightError("Invalid ORDER direction");
		}
		if (query.OPTIONS.ORDER.keys.length === 0) {
			throw new InsightError("ORDER keys must be a non-empty array");
		}
		if (Object.keys(query.OPTIONS.ORDER).length !== 2) {
			throw new InsightError("ORDER keys number incorrect");
		}
		if (!query.OPTIONS.ORDER.keys.every((val: string) => columnsToStrings.includes(val))) {
			throw new InsightError("ORDER not in COLUMNS(keys)");
		}
	} else {
		if (!columnsToStrings.includes(query.OPTIONS.ORDER)) {
			throw new InsightError("ORDER not in COLUMNS");
		}
	}

}

export function validateInputString(input: string): void {
	if (input === null) {
		throw new InsightError("Invalid input");
	}
	if (input === "*") {
		return;
	}

	// check if input contains "*" except for wildcards
	if (input.substring(1, input.length - 1).includes("*")) {

		throw new InsightError("Input cannot include asterisk except for wildcards");
	}
	return;
}
export function validateIDString(key: string): void {
	if (key === null) {
		throw new InsightError("Invalid input");
	}
	if (key.trim().length < 1) {
		throw new InsightError("ID should include one or more character");
	}
	if (key.includes("_")) {
		throw new InsightError("ID cannot include underscore");
	}
	if (Queryid === "") {
		Queryid = key;
	} else if (key !== Queryid) {
		throw new InsightError("cannot reference more than 1 dataset");
	}
	return;
}
export function ifIDMatchKey(id: string, key: string) {
	if (!addedData[id]) {
		throw new InsightError("Dataset not added yet");
	}
	if (addedData[id] === InsightDatasetKind.Courses) {
		if (!mfield.includes(key) && !sfield.includes(key)) {
			return false;
		}
	} else {
		if (!mfieldRooms.includes(key) && !sfieldRooms.includes(key)) {
			return false;
		}
	}
	return true;
}
