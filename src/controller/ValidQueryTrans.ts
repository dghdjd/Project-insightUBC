import {
	mfield,
	Applykey,
	validateIDString,
	sfieldRooms,
	mfieldRooms,
	sfield,
	ifIDMatchKey
} from "./ValidQuery";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {addedData} from "./InsightFacade";

export let ifTrans: boolean = false; //
// export let Queryid: string;
export function validateTrans(query: any): void {
	if (!ifTrans) {
		return;
	}
	if (Object.keys(query.TRANSFORMATIONS).length > 2) {
		throw new InsightError("Extra keys in TRANSFORMATIONS");
	}
	let checkedRule: any[] = [];
	for (let ApplyRule of query.TRANSFORMATIONS.APPLY) {

		if (checkedRule.includes(Object.keys(ApplyRule)[0])) {
			throw new InsightError("Duplicate APPLY key " + Object.keys(ApplyRule)[0]);
		}
		if (Object.keys(ApplyRule).length !== 1) {
			throw new InsightError("Apply Rule should only have 1 key, has 2");
		}
		if (Object.keys(ApplyRule).includes("_")) {
			throw new InsightError("Cannot have underscore in applyKey");
		}
		for (let key in ApplyRule) {

			let ifCount = false;
			if (!Applykey.includes(Object.keys(ApplyRule[key])[0])) {
				throw new InsightError("Invalid transformation operator");
			}
			if (Object.keys(ApplyRule[key]).length !== 1) {
				throw new InsightError("Apply body should only have 1 key, has 2");
			}
			if (Object.keys(ApplyRule[key])[0] === "COUNT") {
				ifCount = true;
			}
			let ApplyKey = ApplyRule[key];
			let ApplyToken = Object.keys(ApplyKey)[0];
			let keyVal = ApplyKey[ApplyToken];
			if (keyVal === null || keyVal === undefined) {
				throw new InsightError("Invalid null key ");
			}
			let splitKey: string[] = keyVal.toString().split("_");
			if (splitKey.length !== 2) {
				throw new InsightError("Invalid apply rule target key");
			}
			ifIDMatchKeyApply(splitKey[0],splitKey[1],ifCount);
			validateIDString(splitKey[0]);
			checkedRule.push(Object.keys(ApplyRule)[0]);
		}
	}
}

export function TransCheck(query: any): void {
	ifTrans = false;
	if (Object.prototype.hasOwnProperty.call(query, "TRANSFORMATIONS")) {
		ifTrans = true;
		if (query.TRANSFORMATIONS === null || query.TRANSFORMATIONS === undefined) {
			throw new InsightError("Invalid Transformation");
		}
		if (
			!Object.prototype.hasOwnProperty.call(query.TRANSFORMATIONS, "GROUP") ||
			!Object.prototype.hasOwnProperty.call(query.TRANSFORMATIONS, "APPLY")
		) {
			throw new InsightError("Missing GROUP or APPLY");
		}

		if (!Array.isArray(query.TRANSFORMATIONS.GROUP) || !Array.isArray(query.TRANSFORMATIONS.APPLY)) {
			throw new InsightError("GROUP and APPLY must be an array");
		}
		if (query.TRANSFORMATIONS.GROUP.length === 0) {
			throw new InsightError("GROUP must be non empty");
		}
		for (let g of query.TRANSFORMATIONS.GROUP) {
			let splitKey: string[] = g.toString().split("_");
			if (splitKey.length !== 2) {
				throw new InsightError("Invalid key in GROUP " + g.toString());
			}
			if (!ifIDMatchKey(splitKey[0],splitKey[1])){
				throw new InsightError("Invalid key in GROUP " + g.toString());
			}
		}

	}
}
function ifIDMatchKeyApply(id: string, key: string, ifCount: boolean) {
	if (!addedData[id]) {
		throw new InsightError("Dataset not added yet");
	}
	if (ifCount) {
		if (addedData[id] === InsightDatasetKind.Rooms) {
			if (!sfieldRooms.includes(key) && !mfieldRooms.includes(key)) {
				throw new InsightError("invalid key " + id + "_" + key);
			}
		} else {
			if (!mfield.includes(key) && !sfield.includes(key)) {
				throw new InsightError("invalid key " + id + "_" + key);
			}
		}
	} else {
		if (addedData[id] === InsightDatasetKind.Rooms) {
			if (!mfieldRooms.includes(key)){
				throw new InsightError("Must be mkey in Apply except COUNT, invalid key " + id + "_" + key);
			}
		} else {
			if (!mfield.includes(key)) {
				throw new InsightError("Must be mkey in Apply except COUNT, invalid key " + id + "_" + key);
			}
		}
	}
}
