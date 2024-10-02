import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {mfield, mfieldRooms, sfield, sfieldRooms, validateIDString, validateInputString} from "./ValidQuery";
import {addedData} from "./InsightFacade";

export function checkWhere(input: any): void {
	if (input.LT !== undefined) {
		validateLT(input);
	} else if (input.GT !== undefined) {
		validateGT(input);
	} else if (input.EQ !== undefined) {
		validateEQ(input);
	} else if (input.IS !== undefined) {
		validateIS(input);
	} else if (input.NOT !== undefined) {
		validateNot(input);
	} else if (input.AND !== undefined) {
		validateAnd(input);
	} else if (input.OR !== undefined) {
		validateOr(input);
	} else if (!Object.keys(input)[0]) {
		return;
	} else {
		throw new InsightError("Invalid filter key");  // new line added
	}
}
function validateAnd(input: any): void {
	if (input.AND === null) {
		throw new InsightError("NULL AND");
	}
	if (typeof input.AND[0] !== "object") {
		throw new InsightError("AND must be object");
	}
	if (!Array.isArray(input.AND)) {
		throw new InsightError("AND is not an array");
	}
	if (input.AND.length < 1) {               // <
		throw new InsightError("empty AND");
	}
	for (let a of input.AND) {
		if (Object.keys(a).length !== 1) {
			throw new InsightError("AND should only have 1 key");
		}
		checkWhere(a);
	}
}
function validateOr(input: any): void {
	if (input.OR === null) {
		throw new InsightError("NULL AND");
	}
	if (typeof input.OR[0] !== "object") {
		throw new InsightError("OR must be object");
	}
	if (!Array.isArray(input.OR)) {
		throw new InsightError("AND is not an array");
	}
	if (input.OR.length < 1) {
		throw new InsightError("empty OR");
	}
	for (let o of input.OR) {
		if (Object.keys(o).length !== 1) {
			throw new InsightError("OR should only have 1 key");
		}
		checkWhere(o);
	}
}
function validateNot(input: any): void {
	if (input.NOT === null) {
		throw new InsightError("NULL NOT");
	}
	if (Object.keys(input.NOT).length !== 1) {
		throw new InsightError("NOT should only have 1 key, has 0");
	}
	if (typeof input.NOT !== "object") {
		throw new InsightError("NOT is not an object");
	}
	if (input.NOT.length < 1) {
		throw new InsightError("empty NOT");
	}
	checkWhere(input.NOT);
}
function validateLT(input: any): void {
	if (input.LT === null) {
		throw new InsightError("NULL LT");
	}
	if (Object.keys(input.LT).length !== 1) {
		throw new InsightError("Invalid Length of LT");
	}
	let LTKey = Object.keys(input.LT).toString();
	if (!LTKey.includes("_")) {
		throw new InsightError("Incorrect key name in LT");
	}
	let splitKey: string[] = LTKey.toString().split("_");
	if (splitKey.length !== 2) {
		throw new InsightError("Invalid key in LT");
	}
	if (!ifIDMatchKeyMfield(splitKey[0],splitKey[1])) {
		throw new InsightError("Invalid mfield in LT");
	}
	if (typeof input.LT[Object.keys(input.LT)[0]] !== "number") {
		throw new InsightError("mkey is not a number");
	}
	validateIDString(splitKey[0]);
	return;
}
function validateGT(input: any): void {
	if (input.GT === null) {
		throw new InsightError("NULL GT");
	}
	if (Object.keys(input.GT).length !== 1) {
		throw new InsightError("Invalid Length of GT");
	}
	let GTKey = Object.keys(input.GT).toString();
	if (!GTKey.includes("_")) {
		throw new InsightError("Incorrect key in GT");
	}
	let splitKey: string[] = GTKey.toString().split("_");
	if (splitKey.length !== 2) {
		throw new InsightError("Invalid key in GT");
	}
	if (!ifIDMatchKeyMfield(splitKey[0],splitKey[1])) {
		throw new InsightError("Invalid mfield in GT");
	}
	if (typeof input.GT[Object.keys(input.GT)[0]] !== "number") {
		throw new InsightError("mkey is not a number");
	}
	validateIDString(splitKey[0]);
	return;
}
function validateEQ(input: any): void {
	if (input.EQ === null) {
		throw new InsightError("NULL EQ");
	}
	if (Object.keys(input.EQ).length !== 1) {
		throw new InsightError("Invalid Length of EQ");
	}
	let EQKey = Object.keys(input.EQ).toString();
	if (!EQKey.includes("_")) {
		throw new InsightError("Incorrect key in EQ");
	}
	let splitKey: string[] = EQKey.toString().split("_");
	if (splitKey.length !== 2) {
		throw new InsightError("Invalid key in EQ");
	}
	if (!ifIDMatchKeyMfield(splitKey[0],splitKey[1])) {
		throw new InsightError("Invalid mfield in EQ");
	}
	if (typeof input.EQ[Object.keys(input.EQ)[0]] !== "number") {
		throw new InsightError("mkey is not a number");
	}
	validateIDString(splitKey[0]);
	return;
}
function validateIS(input: any): void {
	if (input.IS === null) {
		throw new InsightError("IS should not be NULL");
	}
	if (Object.keys(input.IS).length !== 1) {
		throw new InsightError("Invalid Length of IS");
	}
	let ISKey = Object.keys(input.IS).toString();
	if (!ISKey.includes("_")) {
		throw new InsightError("Incorrect key in IS");
	}
	let splitKey: string[] = ISKey.toString().split("_");
	if (splitKey.length !== 2) {
		throw new InsightError("Invalid key in IS");
	}
	if (!ifIDMatchKeySfield(splitKey[0],splitKey[1])) {
		throw new InsightError("Invalid Sfield in IS");
	}
	if (typeof input.IS[Object.keys(input.IS)[0]] !== "string") {           // new line added
		throw new InsightError("skey is not a string");
	}
	validateIDString(splitKey[0]);
	let inputString = input.IS[Object.keys(input.IS)[0]];
	validateInputString(inputString);
	return;
}
function ifIDMatchKeySfield(id: string, key: string) {
	if (!addedData[id]) {
		throw new InsightError("Dataset not added yet");
	}
	if (addedData[id] === InsightDatasetKind.Courses) {
		if (!sfield.includes(key)) {
			return false;
		}
	} else {
		if (!sfieldRooms.includes(key)) {
			return false;
		}
	}
	return true;
}
function ifIDMatchKeyMfield(id: string, key: string) {
	if (!addedData[id]) {
		throw new InsightError("Dataset not added yet");
	}
	if (addedData[id] === InsightDatasetKind.Courses) {
		if (!mfield.includes(key)) {
			return false;
		}
	} else {
		if (!mfieldRooms.includes(key)) {
			return false;
		}
	}
	return true;
}
